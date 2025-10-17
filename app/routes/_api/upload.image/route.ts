/**
 * 图片上传API端点
 * 用于将图片上传到R2存储并返回可访问的URL
 * 支持登录用户和未登录用户（带IP限制）
 */
import type { Route } from "./+types/route";
import { data } from "react-router";
import { nanoid } from "nanoid";

import { getSessionHandler } from "~/.server/libs/session";
import { uploadFiles } from "~/.server/services/r2-bucket";
import { getGuestCreditUsageByIP } from "~/.server/model/guest_credit_usage";
import { verifyTurnstile } from "~/.server/services/turnstile";

/**
 * 处理图片上传请求
 * @param request - 包含图片文件的FormData请求
 * @returns 返回上传后的图片URL
 */
export const action = async ({ request, context }: Route.ActionArgs) => {
  if (request.method.toLowerCase() !== "post") {
    throw new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // 1. 解析FormData获取图片文件和Turnstile token
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const turnstileToken = formData.get("cf-turnstile-response") as string;

    // 2. 用户身份验证和IP限制检查
    const [session] = await getSessionHandler(request);
    const user = session.get("user");
    
    // 如果用户未登录，检查IP是否已使用过临时积分
    if (!user) {
      const clientIP = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || 
                      request.headers.get("cf-connecting-ip") ||
                      "unknown";
      
      if (clientIP === "unknown") {
        throw new Response(
          JSON.stringify({ error: "Unable to determine client IP address" }),
          { 
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
       // 检查IP是否已使用过临时积分
        const hasUsedCredit = await getGuestCreditUsageByIP(clientIP);
        if (hasUsedCredit) {
          throw new Response(
            JSON.stringify({ 
              error: "This IP has already used the free trial. Please sign in to upload more images." 
            }),
            { 
              status: 403,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
        
        // 验证 Turnstile token（未登录用户必须通过人机验证）
        if (!turnstileToken) {
          throw new Response(
            JSON.stringify({ 
              error: "Please complete the verification to upload images." 
            }),
            { 
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
        
        // 验证 Turnstile token 的有效性
        const turnstileSecret = (context.cloudflare.env as any).TURNSTILE_SECRET_KEY;
        if (!turnstileSecret) {
          console.error("TURNSTILE_SECRET_KEY not configured");
          throw new Response(
            JSON.stringify({ 
              error: "Verification service not available. Please try again later." 
            }),
            { 
              status: 500,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
        
        const isValidToken = await verifyTurnstile(turnstileToken, turnstileSecret, clientIP);
        if (!isValidToken) {
          throw new Response(
            JSON.stringify({ 
              error: "Verification failed. Please try again." 
            }),
            { 
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }
    
    if (!image || !(image instanceof File)) {
      throw new Response(
        JSON.stringify({ error: "No image file provided" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 3. 文件验证（严格按照Kie AI官方要求）
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB (Kie AI官方限制)
    const minSize = 1024; // 1KB最小大小
    
    // 检查文件类型
    if (!allowedTypes.includes(image.type)) {
      throw new Response(
        JSON.stringify({ 
          error: `Unsupported file type: ${image.type}. Only JPEG, PNG, and WebP files are supported.` 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 检查文件大小上限
    if (image.size > maxSize) {
      throw new Response(
        JSON.stringify({ 
          error: `File size must be less than 10MB. Current size: ${Math.round(image.size / 1024 / 1024)}MB.` 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 检查文件大小下限
    if (image.size < minSize) {
      throw new Response(
        JSON.stringify({ 
          error: `File too small: ${image.size} bytes. Minimum size is 1KB.` 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 4. 生成新的文件名并上传到R2（统一存储策略）
    const extName = image.name.split(".").pop()!;
    const newFileName = `upload-${nanoid()}.${extName}`;
    const file = new File([image], newFileName, { type: image.type });
    
    const [R2Object] = await uploadFiles(context.cloudflare.env, file, "images");
    
    if (!R2Object) {
      throw new Response(
        JSON.stringify({ error: "Upload failed. Please try again." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 5. 构造完整的图片URL
    const imageUrl = new URL(R2Object.key, context.cloudflare.env.CDN_URL).toString();

    // 6. 返回成功响应
    return data({
      success: true,
      imageUrl,
      fileName: newFileName,
      fileSize: image.size,
      fileType: image.type
    });

  } catch (error) {
    console.error("Image upload error:", error);
    
    // 如果是已经处理过的Response错误，直接抛出
    if (error instanceof Response) {
      throw error;
    }
    
    // 其他未知错误
    throw new Response(
      JSON.stringify({ error: "Upload failed. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

/**
 * 图片上传响应类型
 */
export type ImageUploadResult = {
  success: boolean;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
};