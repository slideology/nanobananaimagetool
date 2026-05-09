import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiMartApiError,
  ApiMartImage,
  APIMART_IMAGE_MODEL_MAP,
  getApiMartFailReason,
  getApiMartFirstImageUrl,
  normalizeApiMartSize,
} from "../app/.server/aisdk/apimart-image";

describe("ApiMart image client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps product models to ApiMart image model IDs", () => {
    expect(APIMART_IMAGE_MODEL_MAP["nano-banana"]).toBe(
      "gemini-2.5-flash-image-preview"
    );
    expect(APIMART_IMAGE_MODEL_MAP["nano-banana-edit"]).toBe(
      "gemini-2.5-flash-image-preview"
    );
    expect(APIMART_IMAGE_MODEL_MAP["nano-banana-2"]).toBe(
      "gemini-3.1-flash-image-preview"
    );
    expect(APIMART_IMAGE_MODEL_MAP["nano-banana-pro"]).toBe(
      "gemini-3-pro-image-preview"
    );
  });

  it("creates a Nano Banana 2 task with the expected payload", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 200,
        data: [{ status: "submitted", task_id: "task_123" }],
      }),
    });

    const client = new ApiMartImage({
      apiKey: "test-key",
      baseUrl: "https://example.test/v1/",
    });

    const result = await client.createImageTask({
      productModel: "nano-banana-2",
      prompt: "A product photo",
      imageUrls: ["https://example.com/ref.png"],
      size: "16:9",
      resolution: "4K",
      googleSearch: true,
    });

    expect(result.taskId).toBe("task_123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/v1/images/generations",
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
      model: "gemini-3.1-flash-image-preview",
      prompt: "A product photo",
      size: "16:9",
      n: 1,
      official_fallback: false,
      image_urls: ["https://example.com/ref.png"],
      resolution: "4K",
      google_search: true,
    });
    expect(body).not.toHaveProperty("output_format");
  });

  it("creates a Nano Banana Pro task without google_search", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 200,
        data: [{ status: "submitted", task_id: "task_pro" }],
      }),
    });

    const client = new ApiMartImage({ apiKey: "test-key" });
    await client.createImageTask({
      productModel: "nano-banana-pro",
      prompt: "A cinematic portrait",
      size: "1:1",
      resolution: "2K",
      googleSearch: true,
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe("gemini-3-pro-image-preview");
    expect(body.resolution).toBe("2K");
    expect(body).not.toHaveProperty("google_search");
    expect(body).not.toHaveProperty("output_format");
  });

  it("queries task status through /tasks/{task_id}", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 200,
        data: {
          id: "task_123",
          status: "completed",
          progress: 100,
          result: { images: [{ url: ["https://example.com/result.png"] }] },
        },
      }),
    });

    const client = new ApiMartImage({ apiKey: "test-key" });
    const status = await client.queryTask("task_123");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.apimart.ai/v1/tasks/task_123?language=en"
    );
    expect(getApiMartFirstImageUrl(status)).toBe("https://example.com/result.png");
  });

  it("throws a structured error for non-200 ApiMart responses", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 402,
      statusText: "Payment Required",
      json: async () => ({
        code: 402,
        message: "Insufficient balance",
      }),
    });

    const client = new ApiMartImage({ apiKey: "test-key" });

    await expect(
      client.createImageTask({
        productModel: "nano-banana",
        prompt: "A test image",
      })
    ).rejects.toMatchObject<ApiMartApiError>({
      name: "ApiMartApiError",
      status: 402,
      message: "Insufficient balance",
    });
  });

  it("normalizes unsupported auto aspect and extracts failure reasons", () => {
    expect(normalizeApiMartSize()).toBe("1:1");
    expect(normalizeApiMartSize("auto")).toBe("1:1");
    expect(normalizeApiMartSize("21:9")).toBe("21:9");

    expect(
      getApiMartFailReason({
        id: "task_failed",
        status: "failed",
        error: { message: "content policy" },
      })
    ).toBe("content policy");
  });
});
