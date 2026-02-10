import { KieAI } from "~/.server/aisdk/kie-ai";

export async function loader({ context, request }: any) {
    const limit = 5;
    const db = context.cloudflare.env.DB;
    const apiKey = context.cloudflare.env.KIEAI_APIKEY;

    try {
        // 1. Get recent video tasks from DB using direct D1 binding
        // Using prepare().bind().all() pattern standard for Cloudflare D1
        const { results: tasks } = await db.prepare(
            `SELECT * FROM ai_tasks WHERE provider = 'kie_seedance' ORDER BY created_at DESC LIMIT ?`
        ).bind(limit).all();

        if (!tasks || tasks.length === 0) {
            return Response.json({ message: "No video tasks found" });
        }

        // 2. For each task, query Kie AI for real-time status
        const kieAI = new KieAI({ accessKey: apiKey });

        const debugInfo = await Promise.all(tasks.map(async (task: any) => {
            let kieStatus = null;
            let parseResult = null;
            let parseError = null;

            if (task.task_id) {
                try {
                    kieStatus = await kieAI.querySeedanceTask(task.task_id);

                    // Try to simulate the parsing logic in ai-tasks.ts
                    if (kieStatus && kieStatus.resultJson) {
                        try {
                            const parsed = JSON.parse(kieStatus.resultJson);
                            parseResult = {
                                resultUrls: parsed.resultUrls,
                                firstUrl: parsed.resultUrls?.[0]
                            };
                        } catch (e: any) {
                            parseError = e.message;
                        }
                    }
                } catch (e: any) {
                    kieStatus = { error: e.message };
                }
            }

            return {
                task_no: task.task_no,
                task_id: task.task_id,
                db_status: task.status,
                db_result_url: task.result_url,
                db_fail_reason: task.fail_reason,
                kie_realtime: kieStatus,
                parsing_simulation: {
                    success: !!parseResult,
                    data: parseResult,
                    error: parseError,
                    raw_result_json_type: typeof kieStatus?.resultJson,
                    raw_result_json_value: kieStatus?.resultJson
                }
            };
        }));

        return Response.json({
            timestamp: new Date().toISOString(),
            tasks: debugInfo
        }, {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
