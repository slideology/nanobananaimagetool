import { describe, expect, it } from "vitest";

import {
  DEFAULT_VIDEO_MODEL,
  VIDEO_MODEL_OPTIONS,
  calculateVideoTaskCredits,
  getVideoAspectRatioOptions,
  getVideoDurationOptions,
  getMaxReferenceImages,
  getVideoPromptMaxLength,
  getVideoResolutionOptions,
  isHappyHorseVideoModel,
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
      "happyhorse-1.0",
    ]);
  });

  it("uses Seedance 2.0 limits for prompt length and reference images", () => {
    expect(getVideoPromptMaxLength("doubao-seedance-2.0")).toBe(4000);
    expect(getMaxReferenceImages("doubao-seedance-2.0")).toBe(9);
    expect(getVideoPromptMaxLength("seedance-1.5-pro")).toBe(2500);
    expect(getMaxReferenceImages("seedance-1.5-pro")).toBe(2);
    expect(getVideoPromptMaxLength("happyhorse-1.0")).toBe(2500);
    expect(getMaxReferenceImages("happyhorse-1.0")).toBe(9);
  });

  it("restricts 1080p for fast Seedance 2.0 variants", () => {
    expect(supportsVideoResolution("doubao-seedance-2.0", "1080p")).toBe(true);
    expect(supportsVideoResolution("doubao-seedance-2.0-face", "1080p")).toBe(true);
    expect(supportsVideoResolution("doubao-seedance-2.0-fast", "1080p")).toBe(false);
    expect(supportsVideoResolution("doubao-seedance-2.0-fast-face", "1080p")).toBe(false);
    expect(supportsVideoResolution("happyhorse-1.0", "480p")).toBe(false);
    expect(supportsVideoResolution("happyhorse-1.0", "1080p")).toBe(true);
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

  it("exposes HappyHorse-specific controls and cost formula", () => {
    expect(isHappyHorseVideoModel("happyhorse-1.0")).toBe(true);
    expect(getVideoAspectRatioOptions("happyhorse-1.0").map((item) => item.value)).toEqual([
      "16:9",
      "9:16",
      "1:1",
      "4:3",
      "3:4",
    ]);
    expect(getVideoResolutionOptions("happyhorse-1.0").map((item) => item.value)).toEqual([
      "720p",
      "1080p",
    ]);
    expect(getVideoDurationOptions("happyhorse-1.0").map((item) => item.value)).toContain("15");
    expect(
      calculateVideoTaskCredits({
        model: "happyhorse-1.0",
        resolution: "720p",
        duration: "5",
        generateAudio: true,
      })
    ).toBe(715);
  });
});
