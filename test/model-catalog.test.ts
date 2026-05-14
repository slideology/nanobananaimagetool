import { describe, expect, it } from "vitest";

import {
  PUBLIC_MODEL_CATALOG,
  PUBLIC_MODEL_PAGE_ITEMS,
  getPublicModelById,
  getPublicModelBySlug,
} from "../app/constants/model-catalog";

describe("public model catalog", () => {
  it("contains pilot pages for GPT Image 2 and HappyHorse 1.0", () => {
    expect(PUBLIC_MODEL_PAGE_ITEMS.map((model) => model.slug)).toEqual([
      "gpt-image-2",
      "happyhorse-1-0",
    ]);
  });

  it("keeps model ids and slugs unique", () => {
    const ids = PUBLIC_MODEL_CATALOG.map((model) => model.id);
    const slugs = PUBLIC_MODEL_CATALOG.map((model) => model.slug);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves pilot model capabilities", () => {
    expect(getPublicModelBySlug("gpt-image-2")).toMatchObject({
      id: "gpt-image-2",
      mediaType: "image",
      defaultMode: "text-to-image",
      capabilities: {
        modes: ["text-to-image", "image-to-image"],
        maxReferenceImages: 16,
      },
    });

    expect(getPublicModelBySlug("happyhorse-1-0")).toMatchObject({
      id: "happyhorse-1.0",
      mediaType: "video",
      defaultMode: "text-to-video",
      capabilities: {
        modes: [
          "text-to-video",
          "image-to-video",
          "reference-image-to-video",
          "video-edit",
        ],
        maxReferenceImages: 9,
        supportsVideoUpload: true,
      },
    });
  });

  it("resolves existing aliases for compatibility", () => {
    expect(getPublicModelById("doubao-seedance-2.0")?.slug).toBe("seedance-2-0");
    expect(getPublicModelById("nano-banana-2")?.slug).toBe("nano-banana-2");
  });
});
