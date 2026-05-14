import { describe, expect, it } from "vitest";

import {
  calculateVideoCredits,
  getVideoCreditsBreakdown,
} from "../app/.server/utils/video-credits";

describe("video credits", () => {
  it("calculates credits using resolution, duration, and audio multipliers", () => {
    expect(
      calculateVideoCredits({
        resolution: "480p",
        duration: "4",
        generateAudio: false,
      })
    ).toBe(60);

    expect(
      calculateVideoCredits({
        resolution: "720p",
        duration: "8",
        generateAudio: true,
      })
    ).toBe(480);

    expect(
      calculateVideoCredits({
        resolution: "1080p",
        duration: "12",
        generateAudio: true,
      })
    ).toBe(1080);

    expect(
      calculateVideoCredits({
        model: "doubao-seedance-2.0",
        resolution: "720p",
        duration: "8",
        generateAudio: true,
      })
    ).toBe(720);

    expect(
      calculateVideoCredits({
        model: "happyhorse-1.0",
        resolution: "720p",
        duration: "5",
        generateAudio: true,
      })
    ).toBe(715);
  });

  it("returns a consistent breakdown description", () => {
    expect(
      getVideoCreditsBreakdown({
        resolution: "720p",
        duration: "8",
        generateAudio: true,
      })
    ).toEqual({
      base: 120,
      durationMultiplier: 2,
      audioMultiplier: 2,
      modelMultiplier: 1,
      total: 480,
      description: "720p (120 credits) × 8s ×2 × Audio ×2 = 480 credits",
    });

    expect(
      getVideoCreditsBreakdown({
        model: "doubao-seedance-2.0",
        resolution: "720p",
        duration: "8",
        generateAudio: true,
      })
    ).toEqual({
      base: 120,
      durationMultiplier: 2,
      audioMultiplier: 2,
      modelMultiplier: 1.5,
      total: 720,
      description:
        "720p (120 credits) × 8s ×2 × Audio ×2 × Seedance 2.0 ×1.5 = 720 credits",
    });

    expect(
      getVideoCreditsBreakdown({
        model: "happyhorse-1.0",
        resolution: "720p",
        duration: "5",
        generateAudio: true,
      }).total
    ).toBe(715);
  });
});
