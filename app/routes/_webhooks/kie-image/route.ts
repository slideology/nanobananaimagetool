import type { Route } from "./+types/route";
import { data } from "react-router";

import { updateTaskStatusByTaskId } from "~/.server/services/ai-tasks";
import { Logger } from "~/.server/utils/logger";
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
  const logger = Logger.createContext();
  
  try {
    // 记录原始回调数据
    const rawBody = await request.text();
    logger.info("收到Kie AI回调请求", "webhook-kie-image", {
      contentType: request.headers.get('content-type'),
      userAgent: request.headers.get('user-agent'),
      bodyLength: rawBody.length
    });
    
    let json: UnifiedCallbackJSON;
    try {
      json = JSON.parse(rawBody);
    } catch (parseError) {
      logger.error("回调数据解析失败", "webhook-kie-image", parseError, {
        rawBody: rawBody.substring(0, 500) // 只记录前500字符
      });
      return new Response("Invalid JSON", { status: 400 });
    }
    
    logger.info("回调数据解析成功", "webhook-kie-image", {
      dataStructure: Object.keys(json),
      hasTaskId: !!(json as any).taskId || !!(json as any).data?.taskId,
      callbackType: (json as any).data ? 'GPT4o格式' : 'Nano Banana格式'
    });
    
    // 提取taskId - 支持两种格式
    let taskId: string | undefined;
    
    if ('data' in json && json.data?.taskId) {
      // GPT4o格式: { data: { taskId: "xxx" } }
      taskId = json.data.taskId;
      logger.debug("检测到GPT4o格式回调", "webhook-kie-image", { taskId });
    } else if ('taskId' in json) {
      // Nano Banana格式: { taskId: "xxx", state: "xxx" }
      taskId = (json as NanoBananaCallbackJSON).taskId;
      logger.debug("检测到Nano Banana格式回调", "webhook-kie-image", { 
        taskId,
        state: (json as NanoBananaCallbackJSON).state
      });
    }
    
    if (!taskId) {
      logger.warn("回调中未找到taskId", "webhook-kie-image", {
        jsonKeys: Object.keys(json),
        jsonData: json
      });
      return data({ success: false, error: "No taskId found" });
    }
    
    // 更新任务状态
    logger.info("开始更新任务状态", "webhook-kie-image", { taskId });
    
    await updateTaskStatusByTaskId(context.cloudflare.env, taskId);
    
    logger.info("任务状态更新成功", "webhook-kie-image", { taskId });
    
    return data({ success: true, taskId });
    
  } catch (error) {
    logger.error("webhook处理失败", "webhook-kie-image", error, {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    });
    
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
