import { z } from "zod";

// Legacy schemas (for backward compatibility)
const hairstyleSchema = z.object({
  name: z.string(),
  value: z.string(),
  cover: z.string(),
  type: z.string().optional(),
});

const haircolorSchema = z.object({
  name: z.string(),
  value: z.string(),
  type: z.string().optional(),
  color: z.string().optional(),
  cover: z.string().optional(),
});

export const createAiHairstyleSchema = z.object({
  photo: z.instanceof(File),
  type: z.enum(["gpt-4o", "kontext"]).default("gpt-4o"),
  hairstyle: z.string().transform((value, ctx) => {
    try {
      const parsed = JSON.parse(value);
      return hairstyleSchema.array().parse(parsed);
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid JSON format for hairstyle",
      });
      return z.NEVER;
    }
  }),
  hair_color: z.string().transform((value, ctx) => {
    try {
      const parsed = JSON.parse(value);
      return haircolorSchema.parse(parsed);
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid JSON format for hair color",
      });
      return z.NEVER;
    }
  }),
  detail: z.string(),
});

export type CreateAiHairstyleDTO = z.infer<typeof createAiHairstyleSchema>;

// New AI Image Generation Schema
export const createAiImageSchema = z.object({
  mode: z.enum(["image-to-image", "text-to-image"]),
  image: z.instanceof(File).optional(), // Required for image-to-image mode
  prompt: z.string().min(1, "Prompt is required"),
  negative_prompt: z.string().optional(),
  style: z.string().optional(),
  type: z.enum(["gpt-4o", "kontext", "nano-banana", "nano-banana-edit"]).default("nano-banana"),
  width: z.number().optional().default(1024),
  height: z.number().optional().default(1024),
  steps: z.number().optional().default(30),
  cfg_scale: z.number().optional().default(7.5),
}).refine(
  (data) => {
    // If mode is image-to-image, image is required
    if (data.mode === "image-to-image" && !data.image) {
      return false;
    }
    return true;
  },
  {
    message: "Image is required for image-to-image mode",
    path: ["image"],
  }
);

export type CreateAiImageDTO = z.infer<typeof createAiImageSchema>;
