import type { Route } from "./+types/route";
import { env } from "cloudflare:workers";

import { ApiMartVideo } from "~/.server/aisdk";
import { getSessionHandler } from "~/.server/libs/session";
import { insertAiTask } from "~/.server/model/ai_tasks";
import type {
    ApiMartRealAvatarAction,
    CreateApiMartRealAvatarOptions
} from "~/.server/aisdk";

type RealAvatarRequest = CreateApiMartRealAvatarOptions & {
    callback_url?: string;
    byted_token?: string;
    group_id?: string;
    project_name?: string;
    asset_type?: "Image" | "Video";
};

const REAL_AVATAR_ACTIONS: ApiMartRealAvatarAction[] = [
    "create_session",
    "query_auth",
    "submit_assets",
];

const normalizeRealAvatarRequest = (
    body: RealAvatarRequest
): CreateApiMartRealAvatarOptions => ({
    ...body,
    callbackUrl: body.callbackUrl ?? body.callback_url,
    bytedToken: body.bytedToken ?? body.byted_token,
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

        const rawBody = await request.json() as RealAvatarRequest;
        const body = normalizeRealAvatarRequest(rawBody);

        if (!REAL_AVATAR_ACTIONS.includes(body.action)) {
            return Response.json(
                {
                    error: {
                        code: "INVALID_ACTION",
                        message: "action must be create_session, query_auth, or submit_assets",
                        title: "参数错误"
                    }
                },
                { status: 400 }
            );
        }

        if (body.action === "create_session" && !body.callbackUrl) {
            return Response.json(
                {
                    error: {
                        code: "MISSING_CALLBACK_URL",
                        message: "callbackUrl is required for create_session",
                        title: "参数错误"
                    }
                },
                { status: 400 }
            );
        }

        if (body.action === "query_auth" && !body.bytedToken) {
            return Response.json(
                {
                    error: {
                        code: "MISSING_BYTED_TOKEN",
                        message: "bytedToken is required for query_auth",
                        title: "参数错误"
                    }
                },
                { status: 400 }
            );
        }

        if (body.action === "submit_assets") {
            if (!body.groupId || !body.assets?.length) {
                return Response.json(
                    {
                        error: {
                            code: "MISSING_ASSETS",
                            message: "groupId and assets are required for submit_assets",
                            title: "参数错误"
                        }
                    },
                    { status: 400 }
                );
            }

            if (body.assets.length > 20) {
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
        }

        const apiMart = new ApiMartVideo({
            apiKey: env.APIMART_API_KEY,
            baseUrl: env.APIMART_BASE_URL,
        });
        const result = await apiMart.realAvatar(body);

        if (!("id" in result) || typeof result.id !== "string") {
            return Response.json({ data: result });
        }

        const [task] = await insertAiTask({
            user_id: user.id,
            status: result.status === "failed" ? "failed" : "running",
            input_params: body,
            estimated_start_at: new Date(),
            ext: {
                operation: `seedance2_real_avatar_${body.action}`,
                asset_type: body.assetType || (body.action === "submit_assets" ? "Video" : undefined),
            },
            aspect: "1:1",
            provider: "apimart_seedance_avatar",
            task_id: result.id,
            request_param: body,
            result_data: result,
            fail_reason: result.status === "failed" ? "Real avatar operation failed" : null,
        });

        return Response.json({
            task_no: task.task_no,
            task_id: result.id,
            status: task.status,
            data: result,
        });
    } catch (error: any) {
        console.error("❌ Seedance 2.0 real avatar request failed:", error);

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
