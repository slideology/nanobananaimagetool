import { describe, expect, it } from "vitest";

import {
  getImageAspectRatioOptions,
  getImageTaskCredits,
  IMAGE_MODEL_OPTIONS,
  isAdvancedImageModel,
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
  });

  it("treats Nano Banana 2 and Pro as advanced multi-image models", () => {
    expect(isAdvancedImageModel("nano-banana-2")).toBe(true);
    expect(isAdvancedImageModel("nano-banana-pro")).toBe(true);
    expect(isAdvancedImageModel("nano-banana-edit")).toBe(false);
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
});
