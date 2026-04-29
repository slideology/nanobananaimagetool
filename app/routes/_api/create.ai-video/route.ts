import type { Route } from "./+types/route";
import { env } from "cloudflare:workers";

import { getSessionHandler } from "~/.server/libs/session";
import {
    consumptionsCredits,
    rollbackCredits
} from "~/.server/services/credits";
import { KieAI } from "~/.server/aisdk/kie-ai";
import { calculateVideoCredits } from "~/.server/utils/video-credits";
import { insertAiTask } from "~/.server/model/ai_tasks";
import type {
    CreateSeedanceTaskOptions,
} from "~/.server/aisdk/kie-ai";
import type {
    SeedanceAspectRatio,
    SeedanceResolution,
    SeedanceDuration
} from "~/.server/aisdk/kie-ai/type";

// 请求参数接口
interface CreateVideoRequest {
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
            prompt,
            input_urls = [],
            aspect_ratio,
            resolution = "720p",
            duration,
            fixed_lens = false,
            generate_audio = false,
        } = body;

        // 3. 参数验证
        if (!prompt || prompt.length < 3 || prompt.length > 2500) {
            return Response.json(
                {
                    error: {
                        code: "INVALID_PROMPT",
                        message: "提示词长度必须在 3-2500 字符之间",
                        title: "参数错误"
                    }
                },
                { status: 400 }
            );
        }

        if (input_urls.length > 2) {
            return Response.json(
                {
                    error: {
                        code: "TOO_MANY_IMAGES",
                        message: "最多只能上传 2 张参考图片",
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
            generateAudio: generate_audio
        });

        console.log(`📊 视频生成积分计算:`, {
            resolution,
            duration,
            generate_audio,
            requiredCredits
        });

        // 5. 扣除积分
        let consumptionResult;
        try {
            consumptionResult = await consumptionsCredits(user, {
                credits: requiredCredits,
                source_type: "ai_video_task",
                reason: `视频生成 (${resolution}, ${duration}s${generate_audio ? ', 含音频' : ''})`
            });

            console.log(`✅ 积分扣除成功:`, consumptionResult);
        } catch (error: any) {
            if (error.message === "Credits Insufficient") {
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
            throw error;
        }

        // 6. 调用 Kie AI API 创建视频任务
        const kieAI = new KieAI({ accessKey: env.KIEAI_APIKEY });
        const callbackUrl = new URL("/webhooks/seedance-video", env.DOMAIN).toString();

        const taskParams: CreateSeedanceTaskOptions = {
            prompt,
            input_urls,
            aspect_ratio,
            resolution,
            duration,
            fixed_lens,
            generate_audio,
            callBackUrl: callbackUrl
        };

        let kieResponse: { taskId: string };
        try {
            kieResponse = await kieAI.createSeedanceTask(taskParams);
            console.log(`✅ Kie AI 视频任务创建成功:`, kieResponse.taskId);
        } catch (error: any) {
            console.error(`❌ Kie AI API 调用失败:`, error);

            // API 调用失败,回滚积分
            if (consumptionResult?.details) {
                console.log("↺ 正在回滚积分...");
                await rollbackCredits(consumptionResult.details, `Video Generation Failed: ${error.message}`);
            }

            return Response.json(
                {
                    error: {
                        code: "API_ERROR",
                        message: error.message || "视频生成服务暂时不可用, 积分已自动回滚",
                        title: "服务错误"
                    }
                },
                { status: 500 }
            );
        }

        // 7. 创建任务记录
        const estimatedStartAt = new Date(Date.now() + 60 * 1000); // 预计1分钟后开始

        const [task] = await insertAiTask({
            user_id: user.id,
            status: "running",
            input_params: {
                prompt,
                input_urls,
                aspect_ratio,
                resolution,
                duration,
                fixed_lens,
                generate_audio
            },
            estimated_start_at: estimatedStartAt,
            ext: {
                generation_mode: input_urls.length > 0 ? "image-to-video" : "text-to-video",
                credits_consumed: requiredCredits
            },
            aspect: aspect_ratio,
            provider: "kie_seedance",
            task_id: kieResponse.taskId,
            request_param: taskParams,
        });

        console.log(`✅ 任务记录创建成功:`, task.task_no);

        // 8. 返回响应
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
