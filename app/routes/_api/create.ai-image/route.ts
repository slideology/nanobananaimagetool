import type { Route } from "./+types/route";
import { data } from "react-router";

import { createAiImageSchema } from "~/.server/schema/task";
import { getSessionHandler } from "~/.server/libs/session";
import { BackendApiLogger } from "~/.server/utils/step-loggers";
import { ErrorHandler } from "~/.server/utils/error-handler";
import { BaseError } from "~/.server/types/errors";

import { createAiImage, createAiImageForGuest } from "~/.server/services/ai-tasks";
import { atomicCheckAndInsertGuestCreditUsage } from "~/.server/model/guest_credit_usage";

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
  
  // 如果用户未登录，检查是否有临时积分权限和IP限制
  if (!user) {
    // 🔒 安全检查1：验证前端传递的临时积分状态
    const hasGuestCredit = json.hasGuestCredit === true;
    if (!hasGuestCredit) {
      throw new Response("Unauthorized", { status: 401 });
    }
    
    // 🔒 安全检查1.5：验证请求来源和基本参数
    const referer = request.headers.get("referer");
    const origin = request.headers.get("origin");
    const userAgent = request.headers.get("user-agent");
    
    // 检查请求来源是否合法（防止跨域恶意调用）
    if (origin && !origin.includes("nanobananaimage.org") && !origin.includes("localhost")) {
      console.warn("Suspicious origin for guest request:", origin);
      throw new Response("Forbidden", { status: 403 });
    }
    
    // 检查用户代理是否为正常浏览器（防止脚本调用）
    if (!userAgent || userAgent.length < 10) {
      console.warn("Suspicious user agent for guest request:", userAgent);
      throw new Response("Forbidden", { status: 403 });
    }
    
    // 🔒 安全检查2：IP地址限制，防止重复使用临时积分（原子性操作）
     const clientIP = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     request.headers.get("cf-connecting-ip") ||
                     "unknown";
     
     if (clientIP !== "unknown") {
       const userAgent = request.headers.get("user-agent");
       
       // 🔒 并发安全：原子性检查并插入IP使用记录
       const canUseCredit = await atomicCheckAndInsertGuestCreditUsage(clientIP, userAgent || undefined);
       
       if (!canUseCredit) {
         throw new Response(
           JSON.stringify({
             success: false,
             error: {
               code: 'GUEST_CREDIT_EXHAUSTED',
               message: '该网络已使用过免费体验，请登录获取更多积分',
               details: { 
                 reason: 'IP address already used guest credit',
                 suggestion: '请登录您的账户以获得更多积分'
               }
             }
           }),
           { 
             status: 403,
             headers: { 'Content-Type': 'application/json' }
           }
         );
       }
     }
    
    // 使用临时用户继续处理
    try {
      const result = await createAiImageForGuest(context.cloudflare.env, json);
      return data(result);
    } catch (e) {
      console.error("Create ai image error for guest user:", e);
      if (e instanceof BaseError) {
        const errorResponse = ErrorHandler.createErrorResponse(e.code, e.message, e.details);
        throw new Response(JSON.stringify(errorResponse), {
          status: errorResponse.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw new Response("Internal Server Error", { status: 500 });
    }
  }

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