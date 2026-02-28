import { z } from "zod";

// 移除发型相关的Schema定义 - 简化版本不支持发型生成功能

// Simplified AI Image Generation Schema - Only Nano Banana models
export const createAiImageSchema = z.object({
  mode: z.enum(["image-to-image", "text-to-image", "nano-banana-2"]),
  image: z.string().url().optional(), // Required for image-to-image mode (legacy)
  image_urls: z.array(z.string().url()).max(14).optional(), // For new nano-banana-2 multi-image support
  prompt: z.string().min(1, "Prompt is required"),
  type: z.enum(["nano-banana", "nano-banana-edit", "nano-banana-2"]).default("nano-banana"),
  width: z.number().optional().default(1024),
  height: z.number().optional().default(1024),
  aspect_ratio: z.string().optional(),
  google_search: z.boolean().optional(),
  resolution: z.enum(["1K", "2K", "4K"]).optional(),
  output_format: z.enum(["jpg", "png"]).optional(),
  hasGuestCredit: z.boolean().optional(), // 用于未登录用户的临时积分验证
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
