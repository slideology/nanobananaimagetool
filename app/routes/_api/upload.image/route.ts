/**
 * 图片上传API端点
 * 用于将图片上传到R2存储并返回可访问的URL
 */
import type { Route } from "./+types/route";
import { data } from "react-router";
import { nanoid } from "nanoid";

import { getSessionHandler } from "~/.server/libs/session";
import { uploadFiles } from "~/.server/services/r2-bucket";

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
    // 1. 用户身份验证
    const [session] = await getSessionHandler(request);
    const user = session.get("user");
    if (!user) {
      throw new Response("Unauthorized", { status: 401 });
    }

    // 2. 解析FormData获取图片文件
    const formData = await request.formData();
    const image = formData.get("image") as File;
    
    if (!image || !(image instanceof File)) {
      throw new Response(
        JSON.stringify({ error: "No image file provided" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 3. 文件验证
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(image.type)) {
      throw new Response(
        JSON.stringify({ error: `Unsupported file type: ${image.type}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (image.size > maxSize) {
      throw new Response(
        JSON.stringify({ error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 4. 生成新的文件名并上传到R2
    const extName = image.name.split(".").pop()!;
    const newFileName = `ai-image-${nanoid()}.${extName}`;
    const file = new File([image], newFileName, { type: image.type });
    
    const [R2Object] = await uploadFiles(context.cloudflare.env, file, "images");
    
    if (!R2Object) {
      throw new Response(
        JSON.stringify({ error: "Failed to upload image to storage" }),
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
      JSON.stringify({ error: "Internal server error" }),
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