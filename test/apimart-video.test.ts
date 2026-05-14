import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiMartVideo,
  APIMART_HAPPYHORSE_MODELS,
  APIMART_SEEDANCE_MODELS,
  getApiMartFirstVideoUrl,
  getApiMartVideoFailReason,
  getApiMartVideoThumbnailUrl,
  isApiMartHappyHorseModel,
  isApiMartSeedanceModel,
  isApiMartVideoGenerationModel,
  supportsApiMartSeedance1080p,
} from "../app/.server/aisdk/apimart-video";

describe("ApiMart video client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recognizes all Seedance 2.0 models and 1080p support", () => {
    expect(APIMART_SEEDANCE_MODELS).toEqual([
      "doubao-seedance-2.0",
      "doubao-seedance-2.0-fast",
      "doubao-seedance-2.0-face",
      "doubao-seedance-2.0-fast-face",
    ]);
    expect(isApiMartSeedanceModel("doubao-seedance-2.0-fast-face")).toBe(true);
    expect(isApiMartSeedanceModel("seedance-1.5-pro")).toBe(false);
    expect(APIMART_HAPPYHORSE_MODELS).toEqual(["happyhorse-1.0"]);
    expect(isApiMartHappyHorseModel("happyhorse-1.0")).toBe(true);
    expect(isApiMartVideoGenerationModel("happyhorse-1.0")).toBe(true);
    expect(supportsApiMartSeedance1080p("doubao-seedance-2.0")).toBe(true);
    expect(supportsApiMartSeedance1080p("doubao-seedance-2.0-face")).toBe(true);
    expect(supportsApiMartSeedance1080p("doubao-seedance-2.0-fast")).toBe(false);
    expect(supportsApiMartSeedance1080p("doubao-seedance-2.0-fast-face")).toBe(false);
  });

  it("creates a Seedance 2.0 video task with the expected payload", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 200,
        data: [{ status: "submitted", task_id: "task_video" }],
      }),
    });

    const client = new ApiMartVideo({
      apiKey: "test-key",
      baseUrl: "https://example.test/v1/",
    });

    const result = await client.createSeedanceTask({
      model: "doubao-seedance-2.0",
      prompt: "A cinematic product video",
      imageUrls: ["asset://asset_a"],
      size: "16:9",
      resolution: "720p",
      duration: 8,
      generateAudio: true,
    });

    expect(result.taskId).toBe("task_video");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/v1/videos/generations",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        }),
      })
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      model: "doubao-seedance-2.0",
      prompt: "A cinematic product video",
      resolution: "720p",
      size: "16:9",
      duration: 8,
      generate_audio: true,
      image_urls: ["asset://asset_a"],
    });
  });

  it("creates HappyHorse 1.0 tasks with image/video inputs", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 200,
        data: [{ status: "submitted", task_id: "task_happy" }],
      }),
    });

    const client = new ApiMartVideo({
      apiKey: "test-key",
      baseUrl: "https://example.test/v1/",
    });

    const result = await client.createHappyHorseTask({
      model: "happyhorse-1.0",
      prompt: "Make the product spin on a clean stage",
      size: "9:16",
      resolution: "1080P",
      duration: 6,
      firstFrameImage: "https://example.com/first.png",
    });

    expect(result.taskId).toBe("task_happy");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      model: "happyhorse-1.0",
      prompt: "Make the product spin on a clean stage",
      resolution: "1080P",
      size: "9:16",
      duration: 6,
      first_frame_image: "https://example.com/first.png",
    });
  });

  it("creates HappyHorse 1.0 video edit payloads", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 200,
        data: [{ status: "submitted", task_id: "task_edit" }],
      }),
    });

    const client = new ApiMartVideo({ apiKey: "test-key" });
    await client.createHappyHorseTask({
      model: "happyhorse-1.0",
      prompt: "Restyle as a fashion campaign",
      size: "16:9",
      resolution: "720P",
      duration: 5,
      videoUrl: "https://example.com/source.mp4",
      imageUrls: ["https://example.com/style.png"],
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      model: "happyhorse-1.0",
      prompt: "Restyle as a fashion campaign",
      resolution: "720P",
      size: "16:9",
      duration: 5,
      image_urls: ["https://example.com/style.png"],
      video_url: "https://example.com/source.mp4",
    });
  });

  it("submits private avatar assets", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 200,
        data: {
          id: "task_avatar",
          object: "seedance.avatar.asset.task",
          status: "processing",
          progress: 10,
          model: "doubao-seedance-2.0",
        },
      }),
    });

    const client = new ApiMartVideo({ apiKey: "test-key" });
    const result = await client.submitPrivateAvatar({
      group: { name: "virtual-avatar-group" },
      assets: [{ url: "https://example.com/avatar.png", name: "avatar" }],
    });

    expect(result.id).toBe("task_avatar");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.apimart.ai/v1/seedance2/private-avatar"
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      group: { name: "virtual-avatar-group" },
      project_name: "default",
      asset_type: "Image",
      assets: [{ url: "https://example.com/avatar.png", name: "avatar" }],
    });
  });

  it("handles real avatar actions", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 200,
        data: { id: "task_real", status: "completed" },
      }),
    });

    const client = new ApiMartVideo({ apiKey: "test-key" });
    await client.realAvatar({
      action: "create_session",
      callbackUrl: "https://example.com/callback",
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.apimart.ai/v1/seedance2/real-avatar"
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      callback_url: "https://example.com/callback",
      project_name: "default",
    });
  });

  it("queries task status and extracts video metadata", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 200,
        data: {
          id: "task_video",
          status: "completed",
          progress: 100,
          result: {
            videos: [{ url: ["https://example.com/result.mp4"] }],
            thumbnail_url: "https://example.com/thumb.jpg",
          },
        },
      }),
    });

    const client = new ApiMartVideo({ apiKey: "test-key" });
    const status = await client.queryTask("task_video");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.apimart.ai/v1/tasks/task_video?language=en"
    );
    expect(getApiMartFirstVideoUrl(status)).toBe("https://example.com/result.mp4");
    expect(getApiMartVideoThumbnailUrl(status)).toBe("https://example.com/thumb.jpg");
  });

  it("extracts failure reasons", () => {
    expect(
      getApiMartVideoFailReason({
        id: "task_failed",
        status: "failed",
        error: { message: "content policy" },
      })
    ).toBe("content policy");
  });
});
