import type { Route } from "./+types/route";
import { data } from "react-router";

import { createAiImageSchema } from "~/.server/schema/task";
import { getSessionHandler } from "~/.server/libs/session";
import { BackendApiLogger } from "~/.server/utils/step-loggers";
import { ErrorHandler } from "~/.server/utils/error-handler";
import { BaseError } from "~/.server/types/errors";

import { createAiImage } from "~/.server/services/ai-tasks";

export const action = async ({ request, context }: Route.ActionArgs) => {
  if (request.method.toLowerCase() !== "post") {
    throw new Response("Not Found", { status: 404 });
  }

  const startTime = performance.now();
  let requestId: string | undefined;

  const raw = await request.json();
  
  // 验证请求数据
  const parseResult = createAiImageSchema.safeParse(raw);
  if (!parseResult.success) {
    console.error("Schema validation failed:", parseResult.error.issues);
    
    // 返回400错误而不是500错误
    throw new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request data validation failed',
          details: { validationErrors: parseResult.error.issues }
        }
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  const json = parseResult.data;

  const [session] = await getSessionHandler(request);
  const user = session.get("user");
  if (!user) throw new Response("Unauthorized", { status: 401 });

  try {
    // 生成请求ID
    requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 记录API请求开始
    BackendApiLogger.logRequestStart(requestId, {
      method: 'POST',
      url: '/api/create/ai-image',
      userAgent: request.headers.get('user-agent') || '',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
    });

    // 记录JSON数据解析
    BackendApiLogger.logFormDataParsing(requestId, {
      fieldsCount: Object.keys(json).length,
      hasFile: !!json.image,
      fileSize: undefined // JSON格式不包含文件大小信息
    });

    // 记录数据验证
    BackendApiLogger.logDataValidation(requestId, {
      isValid: true
    });

    const result = await createAiImage(context.cloudflare.env, json, user);
    
    // 记录API接收完成
    BackendApiLogger.logRequestComplete(requestId, json);
    
    return data(result);
  } catch (e) {
    // 记录数据验证失败（如果是验证错误）
    if (requestId && e instanceof Error && e.message.includes('validation')) {
      BackendApiLogger.logDataValidation(requestId, {
        isValid: false,
        errors: [e.message]
      });
    }

    console.error("Create ai image error:");
    console.error("Error details:", {
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
      type: typeof e,
      json: json,
      user: { id: user.id, email: user.email }
    });
    
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

export type AiImageResult = Awaited<ReturnType<typeof action>>["data"];