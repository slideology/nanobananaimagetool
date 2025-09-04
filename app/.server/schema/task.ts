import { z } from "zod";

// 移除发型相关的Schema定义 - 简化版本不支持发型生成功能

// Simplified AI Image Generation Schema - Only Nano Banana models
export const createAiImageSchema = z.object({
  mode: z.enum(["image-to-image", "text-to-image"]),
  image: z.string().url().optional(), // Required for image-to-image mode - now expects image URL
  prompt: z.string().min(1, "Prompt is required"),
  type: z.enum(["nano-banana", "nano-banana-edit"]).default("nano-banana"),
  width: z.number().optional().default(1024),
  height: z.number().optional().default(1024),
}).refine(
  (data) => {
    // If mode is image-to-image, image URL is required
    if (data.mode === "image-to-image" && !data.image) {
      return false;
    }
    return true;
  },
  {
    message: "Image URL is required for image-to-image mode",
    path: ["image"],
  }
);

export type CreateAiImageDTO = z.infer<typeof createAiImageSchema>;
