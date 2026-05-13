import { describe, expect, it } from "vitest";

import {
  DEFAULT_VIDEO_MODEL,
  VIDEO_MODEL_OPTIONS,
  calculateVideoTaskCredits,
  getMaxReferenceImages,
  getVideoPromptMaxLength,
  supportsVideoResolution,
} from "../app/features/video_generator/model-config";

describe("video model configuration", () => {
  it("defaults to Seedance 2.0 and keeps Seedance 1.5 Pro available", () => {
    expect(DEFAULT_VIDEO_MODEL).toBe("doubao-seedance-2.0");
    expect(VIDEO_MODEL_OPTIONS.map((item) => item.id)).toEqual([
      "doubao-seedance-2.0",
      "doubao-seedance-2.0-fast",
      "doubao-seedance-2.0-face",
      "doubao-seedance-2.0-fast-face",
      "seedance-1.5-pro",
    ]);
  });

  it("uses Seedance 2.0 limits for prompt length and reference images", () => {
    expect(getVideoPromptMaxLength("doubao-seedance-2.0")).toBe(4000);
    expect(getMaxReferenceImages("doubao-seedance-2.0")).toBe(9);
    expect(getVideoPromptMaxLength("seedance-1.5-pro")).toBe(2500);
    expect(getMaxReferenceImages("seedance-1.5-pro")).toBe(2);
  });

  it("restricts 1080p for fast Seedance 2.0 variants", () => {
    expect(supportsVideoResolution("doubao-seedance-2.0", "1080p")).toBe(true);
    expect(supportsVideoResolution("doubao-seedance-2.0-face", "1080p")).toBe(true);
    expect(supportsVideoResolution("doubao-seedance-2.0-fast", "1080p")).toBe(false);
    expect(supportsVideoResolution("doubao-seedance-2.0-fast-face", "1080p")).toBe(false);
  });

  it("applies the 1.5x Seedance 2.0 credit multiplier", () => {
    expect(
      calculateVideoTaskCredits({
        model: "seedance-1.5-pro",
        resolution: "720p",
        duration: "8",
        generateAudio: true,
      })
    ).toBe(480);

    expect(
      calculateVideoTaskCredits({
        model: "doubao-seedance-2.0",
        resolution: "720p",
        duration: "8",
        generateAudio: true,
      })
    ).toBe(720);
  });
});
