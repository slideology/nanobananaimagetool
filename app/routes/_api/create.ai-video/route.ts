import type { Route } from "./+types/route";
import { env } from "cloudflare:workers";

import { getSessionHandler } from "~/.server/libs/session";
import {
    consumptionsCredits,
    getUserCredits,
    rollbackCredits
} from "~/.server/services/credits";
import {
    ApiMartVideo,
    ApiMartVideoApiError,
    isApiMartHappyHorseModel,
    isApiMartSeedanceModel,
    KieAI,
    supportsApiMartSeedance1080p,
    type ApiMartHappyHorseModel,
    type ApiMartHappyHorseResolution,
    type ApiMartHappyHorseSize,
    type ApiMartSeedanceModel,
} from "~/.server/aisdk";
import { calculateVideoCredits, type VideoCreditModel } from "~/.server/utils/video-credits";
import { insertAiTask } from "~/.server/model/ai_tasks";
import type {
    CreateSeedanceTaskOptions,
} from "~/.server/aisdk/kie-ai";
import type {
    SeedanceAspectRatio,
    SeedanceResolution,
    SeedanceDuration
} from "~/.server/aisdk/kie-ai/type";

type VideoModel = "seedance-1.5-pro" | ApiMartSeedanceModel | ApiMartHappyHorseModel;
type VideoMode =
    | "text-to-video"
    | "image-to-video"
    | "reference-image-to-video"
    | "video-edit";

const DEFAULT_VIDEO_MODEL: VideoModel = "doubao-seedance-2.0";
const KIE_SEEDANCE_MODEL: VideoModel = "seedance-1.5-pro";
const KIE_DURATIONS: SeedanceDuration[] = ["4", "8", "12"];
const HAPPYHORSE_DURATIONS = Array.from({ length: 13 }, (_, index) => String(index + 3));
const HAPPYHORSE_RESOLUTIONS = ["720p", "1080p"] as const;
const HAPPYHORSE_ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;

// 请求参数接口
interface CreateVideoRequest {
    model?: VideoModel;
    mode?: VideoMode;
    prompt: string;
    input_urls?: string[];
    image_urls?: string[];
    first_frame_image?: string;
    video_url?: string;
    audio_setting?: "origin" | "mute" | "generate";
    aspect_ratio: SeedanceAspectRatio;
    resolution?: SeedanceResolution;
    duration: SeedanceDuration | string;
    fixed_lens?: boolean;
    generate_audio?: boolean;
}

// 响应接口
interface CreateVideoResponse {
    tasks: Array<{
        task_no: string;
        status: string;
        estimated_start_at: Date;
    }>;
    consumptionCredits: {
        consumed: number;
        remainingBalance: number;
    };
}

/**
 * 创建 AI 视频生成任务
 * POST /api/create/ai-video
 */
export async function action({ request, context }: Route.ActionArgs) {
    try {
        // 1. 验证用户登录
        const [session] = await getSessionHandler(request);
        const user = session.get("user");

        if (!user) {
            return Response.json(
                {
                    error: {
                        code: "UNAUTHORIZED",
                        message: "请先登录",
                        title: "未登录"
                    }
                },
                { status: 401 }
            );
        }

        // 2. 解析请求参数
        const body = await request.json() as CreateVideoRequest;
        const {
            model = DEFAULT_VIDEO_MODEL,
            mode = "text-to-video",
            prompt,
            input_urls = [],
            image_urls = [],
            first_frame_image,
            video_url,
            audio_setting,
            aspect_ratio,
            resolution = "720p",
            duration,
            fixed_lens = false,
            generate_audio = false,
        } = body;

        const isApiMartModel = isApiMartSeedanceModel(model);
        const isHappyHorseModel = isApiMartHappyHorseModel(model);
        const isKieModel = model === KIE_SEEDANCE_MODEL;
        const promptMaxLength = isApiMartModel ? 4000 : 2500;
        const uploadedImageUrls = image_urls.length > 0 ? image_urls : input_urls;
        const happyHorseReferenceImages =
            isHappyHorseModel && mode === "image-to-video" ? [] : uploadedImageUrls;
        const happyHorseFirstFrame =
            first_frame_image ||
            (isHappyHorseModel && mode === "image-to-video" ? input_urls[0] : undefined);

        // 3. 参数验证
        if (!isApiMartModel && !isHappyHorseModel && !isKieModel) {
            return Response.json(
                {
                    error: {
                        code: "INVALID_MODEL",
                        message: "不支持的视频模型",
                        title: "参数错误"
                    }
                },
                { status: 400 }
            );
        }

        if (!prompt || prompt.length < 3 || prompt.length > promptMaxLength) {
            return Response.json(
                {
                    error: {
                        code: "INVALID_PROMPT",
                        message: `提示词长度必须在 3-${promptMaxLength} 字符之间`,
                        title: "参数错误"
                    }
                },
                { status: 400 }
            );
        }

        const maxInputImages = isHappyHorseModel ? 9 : isApiMartModel ? 9 : 2;
        if (uploadedImageUrls.length > maxInputImages) {
            return Response.json(
                {
                    error: {
                        code: "TOO_MANY_IMAGES",
                        message: `最多只能上传 ${maxInputImages} 张参考图片`,
                        title: "参数错误"
                    }
                },
                { status: 400 }
            );
        }

        if (!isHappyHorseModel && !KIE_DURATIONS.includes(duration as SeedanceDuration)) {
            return Response.json(
                {
                    error: {
                        code: "INVALID_DURATION",
                        message: "视频时长必须为 4、8 或 12 秒",
                        title: "参数错误"
                    }
                },
                { status: 400 }
            );
        }

        if (isHappyHorseModel) {
            if (!HAPPYHORSE_DURATIONS.includes(duration)) {
                return Response.json(
                    {
                        error: {
                            code: "INVALID_DURATION",
                            message: "HappyHorse 视频时长必须为 3-15 秒整数",
                            title: "参数错误"
                        }
                    },
                    { status: 400 }
                );
            }

            if (!HAPPYHORSE_RESOLUTIONS.includes(resolution as any)) {
                return Response.json(
                    {
                        error: {
                            code: "INVALID_RESOLUTION",
                            message: "HappyHorse 仅支持 720p 或 1080p",
                            title: "参数错误"
                        }
                    },
                    { status: 400 }
                );
            }

            if (!HAPPYHORSE_ASPECT_RATIOS.includes(aspect_ratio as any)) {
                return Response.json(
                    {
                        error: {
                            code: "INVALID_ASPECT_RATIO",
                            message: "HappyHorse 仅支持 16:9、9:16、1:1、4:3、3:4",
                            title: "参数错误"
                        }
                    },
                    { status: 400 }
                );
            }

            const hasFirstFrame = Boolean(happyHorseFirstFrame);
            const hasSourceVideo = Boolean(video_url);
            const referenceImageCount = happyHorseReferenceImages.length;

            if (mode === "text-to-video" && (hasFirstFrame || hasSourceVideo || referenceImageCount > 0)) {
                return Response.json(
                    {
                        error: {
                            code: "MIXED_MEDIA_NOT_ALLOWED",
                            message: "HappyHorse Text-to-Video 只支持 prompt，不支持图片或视频输入",
                            title: "参数错误"
                        }
                    },
                    { status: 400 }
                );
            }

            if (mode === "image-to-video" && !hasFirstFrame) {
                return Response.json(
                    {
                        error: {
                            code: "MISSING_FIRST_FRAME",
                            message: "HappyHorse Image-to-Video 需要上传 1 张首帧图",
                            title: "参数错误"
                        }
                    },
                    { status: 400 }
                );
            }

            if (mode === "reference-image-to-video" && referenceImageCount === 0) {
                return Response.json(
                    {
                        error: {
                            code: "MISSING_REFERENCE_IMAGES",
                            message: "HappyHorse Reference-Image-to-Video 需要 1-9 张参考图",
                            title: "参数错误"
                        }
                    },
                    { status: 400 }
                );
            }

            if (mode === "video-edit" && !hasSourceVideo) {
                return Response.json(
                    {
                        error: {
                            code: "MISSING_VIDEO",
                            message: "HappyHorse Video Edit 需要上传源视频",
                            title: "参数错误"
                        }
                    },
                    { status: 400 }
                );
            }

            if (video_url && happyHorseFirstFrame) {
                return Response.json(
                    {
                        error: {
                            code: "MIXED_MEDIA_NOT_ALLOWED",
                            message: "video_url 不能和 first_frame_image 同时使用",
                            title: "参数错误"
                        }
                    },
                    { status: 400 }
                );
            }

            if (happyHorseFirstFrame && happyHorseReferenceImages.length > 0) {
                return Response.json(
                    {
                        error: {
                            code: "MIXED_MEDIA_NOT_ALLOWED",
                            message: "first_frame_image 不能和 image_urls 同时使用",
                            title: "参数错误"
                        }
                    },
                    { status: 400 }
                );
            }

            if (video_url && happyHorseReferenceImages.length > 5) {
                return Response.json(
                    {
                        error: {
                            code: "TOO_MANY_IMAGES",
                            message: "HappyHorse 视频编辑最多支持 5 张风格参考图",
                            title: "参数错误"
                        }
                    },
                    { status: 400 }
                );
            }
        }

        if (
            isApiMartModel &&
            resolution === "1080p" &&
            !supportsApiMartSeedance1080p(model)
        ) {
            return Response.json(
                {
                    error: {
                        code: "UNSUPPORTED_RESOLUTION",
                        message: "1080p 仅支持 Seedance 2.0 标准版和 Face 版",
                        title: "参数错误"
                    }
                },
                { status: 400 }
            );
        }

        // 4. 计算所需积分
        const requiredCredits = calculateVideoCredits({
            resolution,
            duration: String(duration),
            generateAudio: generate_audio,
            model: model as VideoCreditModel
        });

        console.log(`📊 视频生成积分计算:`, {
            model,
            resolution,
            duration,
            generate_audio,
            requiredCredits
        });

        // 5. 先检查余额，外部任务创建成功后再按 task_id 扣费，便于任务失败时回滚。
        const { balance } = await getUserCredits(user);
        if (balance < requiredCredits) {
            return Response.json(
                {
                    error: {
                        code: "INSUFFICIENT_CREDITS",
                        message: `积分不足,需要 ${requiredCredits} 积分`,
                        title: "积分不足"
                    }
                },
                { status: 402 }
            );
        }

        let provider: "kie_seedance" | "apimart_seedance" | "apimart_video";
        let taskId: string;
        let taskParams: Record<string, unknown>;

        try {
            if (isApiMartModel || isHappyHorseModel) {
                if (!env.APIMART_API_KEY) {
                    throw new Error("APIMART_API_KEY is not configured");
                }
                const apiMart = new ApiMartVideo({
                    apiKey: env.APIMART_API_KEY,
                    baseUrl: env.APIMART_BASE_URL,
                });
                const apiMartResponse = isHappyHorseModel
                    ? await apiMart.createHappyHorseTask({
                        model,
                        prompt,
                        imageUrls: happyHorseReferenceImages,
                        firstFrameImage: happyHorseFirstFrame,
                        videoUrl: video_url,
                        audioSetting: audio_setting,
                        size: aspect_ratio as ApiMartHappyHorseSize,
                        resolution: resolution.toUpperCase() as ApiMartHappyHorseResolution,
                        duration: Number(duration),
                    })
                    : await apiMart.createSeedanceTask({
                        model,
                        prompt,
                        imageUrls: input_urls,
                        size: aspect_ratio,
                        resolution,
                        duration: Number(duration),
                        generateAudio: generate_audio,
                    });

                provider = isHappyHorseModel ? "apimart_video" : "apimart_seedance";
                taskId = apiMartResponse.taskId;
                taskParams = apiMartResponse.request;
                console.log(`✅ ApiMart 视频任务创建成功:`, taskId);
            } else {
                const kieAI = new KieAI({ accessKey: env.KIEAI_APIKEY });
                const callbackUrl = new URL("/webhooks/seedance-video", env.DOMAIN).toString();
                const kieTaskParams: CreateSeedanceTaskOptions = {
                    prompt,
                    input_urls,
                    aspect_ratio,
                    resolution,
                    duration: duration as SeedanceDuration,
                    fixed_lens,
                    generate_audio,
                    callBackUrl: callbackUrl
                };
                const kieResponse = await kieAI.createSeedanceTask(kieTaskParams);

                provider = "kie_seedance";
                taskId = kieResponse.taskId;
                taskParams = kieTaskParams as unknown as Record<string, unknown>;
                console.log(`✅ Kie AI 视频任务创建成功:`, taskId);
            }
        } catch (error: any) {
            console.error(`❌ 视频生成 API 调用失败:`, error);

            const message =
                error instanceof ApiMartVideoApiError
                    ? error.message
                    : error.message || "视频生成服务暂时不可用";
            return Response.json(
                {
                    error: {
                        code: "API_ERROR",
                        message,
                        title: "服务错误"
                    }
                },
                { status: 500 }
            );
        }

        // 6. 扣除积分并创建任务记录
        const consumptionResult = await consumptionsCredits(user, {
            credits: requiredCredits,
            source_type: "ai_video_task",
            source_id: taskId,
            reason: `${model} 视频生成 (${resolution}, ${duration}s${generate_audio ? ', 含音频' : ''})`
        });
        console.log(`✅ 积分扣除成功:`, consumptionResult);

        const estimatedStartAt = new Date(Date.now() + 60 * 1000); // 预计1分钟后开始

        let task;
        try {
            [task] = await insertAiTask({
                user_id: user.id,
                status: "running",
                input_params: {
                    model,
                    prompt,
                    input_urls: uploadedImageUrls,
                    image_urls: happyHorseReferenceImages.length ? happyHorseReferenceImages : undefined,
                    first_frame_image: happyHorseFirstFrame,
                    video_url,
                    aspect_ratio,
                    resolution,
                    duration,
                    fixed_lens: isKieModel ? fixed_lens : undefined,
                    generate_audio: isHappyHorseModel ? undefined : generate_audio
                },
                estimated_start_at: estimatedStartAt,
                ext: {
                    generation_mode: isHappyHorseModel
                        ? mode
                        : input_urls.length > 0 ? "image-to-video" : "text-to-video",
                    credits_consumed: requiredCredits,
                    model
                },
                aspect: aspect_ratio,
                provider,
                task_id: taskId,
                request_param: taskParams,
            });
        } catch (error: any) {
            await rollbackCredits(consumptionResult.details, `Video Task Insert Failed: ${error.message}`);
            throw error;
        }

        console.log(`✅ 任务记录创建成功:`, task.task_no);

        // 7. 返回响应
        const response: CreateVideoResponse = {
            tasks: [{
                task_no: task.task_no,
                status: task.status,
                estimated_start_at: task.estimated_start_at
            }],
            consumptionCredits: {
                consumed: requiredCredits,
                remainingBalance: consumptionResult.remainingBalance
            }
        };

        return Response.json(response, { status: 200 });

    } catch (error: any) {
        console.error(`❌ 视频生成请求处理失败:`, error);

        return Response.json(
            {
                error: {
                    code: "INTERNAL_ERROR",
                    message: error.message || "服务器内部错误",
                    title: "系统错误"
                }
            },
            { status: 500 }
        );
    }
}
