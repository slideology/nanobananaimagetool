import type { Route } from "./+types/route";
import { env } from "cloudflare:workers";

import { ApiMartVideo } from "~/.server/aisdk";
import { getSessionHandler } from "~/.server/libs/session";
import { insertAiTask } from "~/.server/model/ai_tasks";
import type { ApiMartSeedanceAvatarAssetType, CreateApiMartPrivateAvatarOptions } from "~/.server/aisdk";

type PrivateAvatarRequest = CreateApiMartPrivateAvatarOptions & {
    group_id?: string;
    project_name?: string;
    asset_type?: ApiMartSeedanceAvatarAssetType;
};

const normalizePrivateAvatarRequest = (
    body: PrivateAvatarRequest
): CreateApiMartPrivateAvatarOptions => ({
    ...body,
    groupId: body.groupId ?? body.group_id,
    projectName: body.projectName ?? body.project_name,
    assetType: body.assetType ?? body.asset_type,
});

export async function action({ request }: Route.ActionArgs) {
    if (request.method.toLowerCase() !== "post") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
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

        if (!env.APIMART_API_KEY) {
            return Response.json(
                {
                    error: {
                        code: "MISSING_API_KEY",
                        message: "APIMART_API_KEY is not configured",
                        title: "服务错误"
                    }
                },
                { status: 500 }
            );
        }

        const rawBody = await request.json() as PrivateAvatarRequest;
        const body = normalizePrivateAvatarRequest(rawBody);

        if (body.group && body.groupId) {
            return Response.json(
                {
                    error: {
                        code: "INVALID_GROUP",
                        message: "group 和 groupId 不能同时传入",
                        title: "参数错误"
                    }
                },
                { status: 400 }
            );
        }

        if (body.assets && body.assets.length > 20) {
            return Response.json(
                {
                    error: {
                        code: "TOO_MANY_ASSETS",
                        message: "单次最多提交 20 个素材",
                        title: "参数错误"
                    }
                },
                { status: 400 }
            );
        }

        const apiMart = new ApiMartVideo({
            apiKey: env.APIMART_API_KEY,
            baseUrl: env.APIMART_BASE_URL,
        });
        const result = await apiMart.submitPrivateAvatar(body);

        const [task] = await insertAiTask({
            user_id: user.id,
            status: result.status === "failed" ? "failed" : "running",
            input_params: body,
            estimated_start_at: new Date(),
            ext: {
                operation: "seedance2_private_avatar",
                asset_type: body.assetType || "Image",
            },
            aspect: "1:1",
            provider: "apimart_seedance_avatar",
            task_id: result.id,
            request_param: body,
            result_data: result,
            fail_reason: result.status === "failed" ? "Private avatar asset submission failed" : null,
        });

        return Response.json({
            task_no: task.task_no,
            task_id: result.id,
            status: task.status,
            data: result,
        });
    } catch (error: any) {
        console.error("❌ Seedance 2.0 private avatar submission failed:", error);

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
