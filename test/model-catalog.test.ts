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

  it("keeps dedicated SEO metadata and FAQs for pilot model pages", () => {
    expect(getPublicModelBySlug("gpt-image-2")).toMatchObject({
      seo: {
        title: "GPT Image 2 AI Generator | Next-Gen Text-to-Image",
        description:
          "Generate photorealistic 4K visuals with OpenAI's GPT Image 2. Experience flawless text rendering, realistic UI mockups, and advanced image editing.",
      },
      faqs: expect.arrayContaining([
        expect.objectContaining({
          question: "What is GPT Image 2 and what are its key features?",
        }),
      ]),
    });

    expect(getPublicModelBySlug("happyhorse-1-0")).toMatchObject({
      seo: {
        title: "Happy Horse 1.0 AI Video Generator | Text-to-Video",
        description:
          "Experience Happy Horse 1.0, the top-ranked AI video generator. Convert text and images into high-quality, cinematic 1080p videos with unified audio.",
      },
      faqs: expect.arrayContaining([
        expect.objectContaining({
          question: "What is Happy Horse 1.0 and how does it work?",
        }),
      ]),
    });
  });

  it("resolves existing aliases for compatibility", () => {
    expect(getPublicModelById("doubao-seedance-2.0")?.slug).toBe("seedance-2-0");
    expect(getPublicModelById("nano-banana-2")?.slug).toBe("nano-banana-2");
  });
});
