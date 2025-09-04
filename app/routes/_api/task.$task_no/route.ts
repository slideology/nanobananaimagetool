import type { Route } from "./+types/route";
import { data } from "react-router";

import { updateTaskStatus } from "~/.server/services/ai-tasks";
import { ErrorHandler } from "~/.server/utils/error-handler";
import { BaseError } from "~/.server/types/errors";

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  try {
    const taskNo = params.task_no;
    const result = await updateTaskStatus(context.cloudflare.env, taskNo);
    return data(result);
  } catch (e) {
    console.error("Task status query error:");
    console.error(e);
    
    // 使用标准化错误处理
    if (e instanceof BaseError) {
      const errorResponse = ErrorHandler.createErrorResponse(e.code, e.message, e.details);
      throw new Response(JSON.stringify(errorResponse), {
        status: e.httpStatus,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 处理其他类型的错误
    const errorResponse = ErrorHandler.createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      e instanceof Error ? e.message : 'Unknown error'
    );
    throw new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
export type TaskResult = Awaited<ReturnType<typeof loader>>["data"];
