import type { Route } from "./+types/route";
import { data } from "react-router";

import { updateTaskStatusByTaskId } from "~/.server/services/ai-tasks";
import { Logger } from "~/.server/utils/logger";
import { CallbackProcessingLogger } from "~/.server/utils/step-loggers";
import { ErrorHandler } from "~/.server/utils/error-handler";
import { BaseError, RequiredParameterMissingError, ParameterTypeError } from "~/.server/types/errors";
import type { GPT4oTaskCallbackJSON } from "~/.server/aisdk";

// Nano Banana 回调数据结构
interface NanoBananaCallbackJSON {
  taskId: string;
  state: 'waiting' | 'processing' | 'succeeded' | 'failed';
  resultJson?: {
    images?: string[];
    image?: string;
  };
  failCode?: string;
  failMsg?: string;
  completeTime?: number;
  [key: string]: any;
}

// 统一的回调数据结构
type UnifiedCallbackJSON = GPT4oTaskCallbackJSON | NanoBananaCallbackJSON;

export const action = async ({ request, context }: Route.ActionArgs) => {
  const requestId = Logger.generateRequestId();
  
  try {
    // 记录原始回调数据
    const rawBody = await request.text();
    Logger.info("收到Kie AI回调请求", "webhook-kie-image", {
      contentType: request.headers.get('content-type'),
      userAgent: request.headers.get('user-agent'),
      bodyLength: rawBody.length
    }, requestId);
    
    let json: UnifiedCallbackJSON;
    try {
      json = JSON.parse(rawBody);
    } catch (parseError) {
      Logger.error("回调数据解析失败", "webhook-kie-image", parseError, requestId);
      const paramError = new ParameterTypeError("request_body", "valid JSON", typeof rawBody);
      return ErrorHandler.createErrorResponse(paramError);
    }
    
    Logger.info("回调数据解析成功", "webhook-kie-image", {
      dataStructure: Object.keys(json),
      hasTaskId: !!(json as any).taskId || !!(json as any).data?.taskId,
      callbackType: (json as any).data ? 'GPT4o格式' : 'Nano Banana格式'
    }, requestId);
    
    // 提取taskId - 支持两种格式
    let taskId: string | undefined;
    
    if ('data' in json && json.data?.taskId) {
      // GPT4o格式: { data: { taskId: "xxx" } }
      taskId = json.data.taskId;
      Logger.debug("检测到GPT4o格式回调", "webhook-kie-image", { taskId }, requestId);
    } else if ('taskId' in json) {
      // Nano Banana格式: { taskId: "xxx", state: "xxx" }
      taskId = (json as NanoBananaCallbackJSON).taskId;
      Logger.debug("检测到Nano Banana格式回调", "webhook-kie-image", { 
        taskId,
        state: (json as NanoBananaCallbackJSON).state
      }, requestId);
    }
    
    if (!taskId) {
      Logger.warn("回调中未找到taskId", "webhook-kie-image", {
        jsonKeys: Object.keys(json),
        jsonData: json
      }, requestId);
      const paramError = new RequiredParameterMissingError("taskId");
      return ErrorHandler.createErrorResponse(paramError);
    }
    
    // 记录回调接收开始
    CallbackProcessingLogger.logCallbackReceived(requestId, {
      taskId,
      status: 'data' in json ? 'gpt4o-callback' : (json as NanoBananaCallbackJSON).state,
      source: 'kie-ai'
    });
    
    // 更新任务状态
    Logger.info("开始更新任务状态", "webhook-kie-image", { taskId }, requestId);
    
    await updateTaskStatusByTaskId(context.cloudflare.env, taskId);
    
    // 记录回调处理完成
    CallbackProcessingLogger.logCallbackComplete(requestId, {
      taskId,
      finalStatus: 'completed',
      processingTime: Date.now() - parseInt(requestId.split('_')[1])
    });
    
    Logger.info("任务状态更新成功", "webhook-kie-image", { taskId }, requestId);
    
    return data({ success: true, taskId });
    
  } catch (error) {
    // 记录回调处理错误
    CallbackProcessingLogger.logCallbackError(requestId, error instanceof Error ? error : new Error(String(error)));
    
    Logger.error("webhook处理失败", "webhook-kie-image", error, requestId);
    
    if (error instanceof BaseError) {
      // 对于webhook，即使是错误也返回200状态避免重复回调
      const errorResponse = ErrorHandler.createErrorResponse(error);
      return new Response(
        errorResponse.body,
        {
          status: 200, // 重要：返回200避免重复回调
          headers: errorResponse.headers
        }
      );
    }
    
    // 返回200状态避免Kie AI重复发送回调
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 200, // 重要：返回200避免重复回调
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
