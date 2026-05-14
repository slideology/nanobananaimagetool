import { describe, expect, it } from "vitest";

import {
  getImageAspectRatioOptions,
  getMaxImageReferences,
  getImageTaskCredits,
  IMAGE_MODEL_OPTIONS,
  isAdvancedImageModel,
  supportsImageResolution,
} from "../app/features/image_generator/model-config";
import { createAiImageSchema } from "../app/.server/schema/task";

describe("image model configuration", () => {
  it("exposes Nano Banana Pro in both generation modes", () => {
    expect(
      IMAGE_MODEL_OPTIONS["text-to-image"].some((model) => model.id === "nano-banana-pro")
    ).toBe(true);
    expect(
      IMAGE_MODEL_OPTIONS["image-to-image"].some((model) => model.id === "nano-banana-pro")
    ).toBe(true);
    expect(
      IMAGE_MODEL_OPTIONS["text-to-image"].some((model) => model.id === "gpt-image-2")
    ).toBe(true);
    expect(
      IMAGE_MODEL_OPTIONS["image-to-image"].some((model) => model.id === "gpt-image-2")
    ).toBe(true);
  });

  it("uses the same credit tiers for Nano Banana 2 and Pro", () => {
    for (const resolution of ["1K", "2K", "4K"] as const) {
      expect(getImageTaskCredits("nano-banana-pro", resolution)).toBe(
        getImageTaskCredits("nano-banana-2", resolution)
      );
    }

    expect(getImageTaskCredits("nano-banana-pro", "1K")).toBe(50);
    expect(getImageTaskCredits("nano-banana-pro", "2K")).toBe(80);
    expect(getImageTaskCredits("nano-banana-pro", "4K")).toBe(120);
    expect(getImageTaskCredits("nano-banana", "4K")).toBe(30);
    expect(getImageTaskCredits("gpt-image-2", "1K")).toBe(15);
    expect(getImageTaskCredits("gpt-image-2", "2K")).toBe(25);
    expect(getImageTaskCredits("gpt-image-2", "4K")).toBe(40);
  });

  it("treats Nano Banana 2, Pro, and GPT Image 2 as advanced multi-image models", () => {
    expect(isAdvancedImageModel("nano-banana-2")).toBe(true);
    expect(isAdvancedImageModel("nano-banana-pro")).toBe(true);
    expect(isAdvancedImageModel("gpt-image-2")).toBe(true);
    expect(isAdvancedImageModel("nano-banana-edit")).toBe(false);
    expect(getMaxImageReferences("gpt-image-2")).toBe(16);
  });

  it("accepts Nano Banana Pro without output_format in the backend schema", () => {
    const result = createAiImageSchema.parse({
      mode: "text-to-image",
      type: "nano-banana-pro",
      prompt: "A clean product hero image",
      resolution: "2K",
      aspect_ratio: "16:9",
    });

    expect(result.type).toBe("nano-banana-pro");
    expect(result).not.toHaveProperty("output_format");
  });

  it("accepts GPT Image 2 through type or model fields", () => {
    const result = createAiImageSchema.parse({
      mode: "image-to-image",
      type: "gpt-image-2",
      model: "gpt-image-2",
      image: "https://example.com/ref.png",
      image_urls: ["https://example.com/ref.png"],
      prompt: "A clean poster with readable typography",
      resolution: "4K",
      aspect_ratio: "21:9",
    });

    expect(result.type).toBe("gpt-image-2");
    expect(result.model).toBe("gpt-image-2");
  });

  it("keeps extreme aspect ratios scoped to Nano Banana 2", () => {
    const nb2Ratios = getImageAspectRatioOptions("nano-banana-2").map(
      option => option.value
    );
    const proRatios = getImageAspectRatioOptions("nano-banana-pro").map(
      option => option.value
    );

    expect(nb2Ratios).toContain("1:8");
    expect(nb2Ratios).toContain("8:1");
    expect(proRatios).not.toContain("1:8");
    expect(proRatios).not.toContain("8:1");
    expect(proRatios).toContain("21:9");
  });

  it("uses GPT Image 2 aspect ratio and 4K constraints", () => {
    const ratios = getImageAspectRatioOptions("gpt-image-2").map(
      option => option.value
    );

    expect(ratios).toContain("auto");
    expect(ratios).toContain("9:21");
    expect(supportsImageResolution("gpt-image-2", "4K", "21:9")).toBe(true);
    expect(supportsImageResolution("gpt-image-2", "4K", "1:1")).toBe(false);
  });
});
