import type { Route } from "./+types/route";
import { updateTaskStatusByTaskId } from "~/.server/services/ai-tasks";

/**
 * Seedance 视频生成 Webhook 回调处理
 * 当 Kie AI 完成视频生成后会调用此接口
 */
export async function action({ request, context }: Route.ActionArgs) {
    if (request.method.toLowerCase() !== "post") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        // 解析 Webhook 回调数据
        const body = await request.json();
        console.log("📹 Seedance Webhook 回调:", JSON.stringify(body, null, 2));

        // 提取任务 ID
        const taskId = body.taskId;

        if (!taskId) {
            console.error("❌ Webhook 缺少 taskId");
            return new Response("Missing taskId", { status: 400 });
        }

        // 更新任务状态
        await updateTaskStatusByTaskId(context.cloudflare.env, taskId);

        console.log(`✅ 任务 ${taskId} 状态已更新`);

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("❌ Seedance Webhook 处理失败:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
