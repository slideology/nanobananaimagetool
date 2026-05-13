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
    isApiMartSeedanceModel,
    KieAI,
    supportsApiMartSeedance1080p,
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

type VideoModel = "seedance-1.5-pro" | ApiMartSeedanceModel;

const DEFAULT_VIDEO_MODEL: VideoModel = "doubao-seedance-2.0";
const KIE_SEEDANCE_MODEL: VideoModel = "seedance-1.5-pro";
const KIE_DURATIONS: SeedanceDuration[] = ["4", "8", "12"];

// 请求参数接口
interface CreateVideoRequest {
    model?: VideoModel;
    prompt: string;
    input_urls?: string[];
    aspect_ratio: SeedanceAspectRatio;
    resolution?: SeedanceResolution;
    duration: SeedanceDuration;
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
            prompt,
            input_urls = [],
            aspect_ratio,
            resolution = "720p",
            duration,
            fixed_lens = false,
            generate_audio = false,
        } = body;

        const isApiMartModel = isApiMartSeedanceModel(model);
        const isKieModel = model === KIE_SEEDANCE_MODEL;
        const promptMaxLength = isApiMartModel ? 4000 : 2500;

        // 3. 参数验证
        if (!isApiMartModel && !isKieModel) {
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

        const maxInputImages = isApiMartModel ? 9 : 2;
        if (input_urls.length > maxInputImages) {
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

        if (!KIE_DURATIONS.includes(duration)) {
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
            duration,
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

        let provider: "kie_seedance" | "apimart_seedance";
        let taskId: string;
        let taskParams: Record<string, unknown>;

        try {
            if (isApiMartModel) {
                if (!env.APIMART_API_KEY) {
                    throw new Error("APIMART_API_KEY is not configured");
                }
                const apiMart = new ApiMartVideo({
                    apiKey: env.APIMART_API_KEY,
                    baseUrl: env.APIMART_BASE_URL,
                });
                const apiMartResponse = await apiMart.createSeedanceTask({
                    model,
                    prompt,
                    imageUrls: input_urls,
                    size: aspect_ratio,
                    resolution,
                    duration: Number(duration),
                    generateAudio: generate_audio,
                });

                provider = "apimart_seedance";
                taskId = apiMartResponse.taskId;
                taskParams = apiMartResponse.request;
                console.log(`✅ ApiMart Seedance 2.0 视频任务创建成功:`, taskId);
            } else {
                const kieAI = new KieAI({ accessKey: env.KIEAI_APIKEY });
                const callbackUrl = new URL("/webhooks/seedance-video", env.DOMAIN).toString();
                const kieTaskParams: CreateSeedanceTaskOptions = {
                    prompt,
                    input_urls,
                    aspect_ratio,
                    resolution,
                    duration,
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
                    input_urls,
                    aspect_ratio,
                    resolution,
                    duration,
                    fixed_lens: isKieModel ? fixed_lens : undefined,
                    generate_audio
                },
                estimated_start_at: estimatedStartAt,
                ext: {
                    generation_mode: input_urls.length > 0 ? "image-to-video" : "text-to-video",
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
