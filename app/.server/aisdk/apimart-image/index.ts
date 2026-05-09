import type {
  ApiMartImageModel,
  ApiMartImageProductModel,
  ApiMartResponse,
  ApiMartTaskCreateResult,
  ApiMartTaskStatus,
  CreateApiMartImageTaskOptions,
} from "./type";

export type {
  ApiMartImageModel,
  ApiMartImageProductModel,
  ApiMartTaskCreateResult,
  ApiMartTaskStatus,
  CreateApiMartImageTaskOptions,
};

export const APIMART_DEFAULT_BASE_URL = "https://api.apimart.ai/v1";

export const APIMART_IMAGE_MODEL_MAP: Record<
  ApiMartImageProductModel,
  ApiMartImageModel
> = {
  "nano-banana": "gemini-2.5-flash-image-preview",
  "nano-banana-edit": "gemini-2.5-flash-image-preview",
  "nano-banana-2": "gemini-3.1-flash-image-preview",
  "nano-banana-pro": "gemini-3-pro-image-preview",
};

interface ApiMartImageConfig {
  apiKey: string;
  baseUrl?: string;
}

export class ApiMartApiError extends Error {
  readonly status: number;
  readonly code?: string | number;
  readonly data?: unknown;

  constructor(message: string, status: number, code?: string | number, data?: unknown) {
    super(message);
    this.name = "ApiMartApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export class ApiMartImage {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: ApiMartImageConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || APIMART_DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  private buildUrl(path: string) {
    return `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  }

  private async request<T>(path: string, init: RequestInit = {}) {
    const response = await fetch(this.buildUrl(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...(init.headers || {}),
      },
    });

    const json = await response.json<ApiMartResponse<T>>().catch(() => null);

    if (!response.ok || !json || json.code !== 200) {
      const message =
        json?.error?.message ||
        json?.message ||
        json?.msg ||
        response.statusText ||
        "ApiMart request failed";
      throw new ApiMartApiError(message, response.status, json?.error?.code ?? json?.code, json);
    }

    return json.data;
  }

  async createImageTask(
    options: CreateApiMartImageTaskOptions
  ): Promise<ApiMartTaskCreateResult> {
    const model = APIMART_IMAGE_MODEL_MAP[options.productModel];
    const size = normalizeApiMartSize(options.size);
    const request = {
      model,
      prompt: options.prompt,
      size,
      n: 1,
      official_fallback: false as const,
      ...(options.imageUrls?.length ? { image_urls: options.imageUrls } : {}),
      ...(options.resolution ? { resolution: options.resolution } : {}),
      ...(options.productModel === "nano-banana-2" && options.googleSearch !== undefined
        ? { google_search: options.googleSearch }
        : {}),
    };

    const data = await this.request<Array<{ status: "submitted"; task_id: string }>>(
      "/images/generations",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    const task = data[0];
    if (!task?.task_id) {
      throw new ApiMartApiError("ApiMart did not return a task_id", 502, "missing_task_id", data);
    }

    return {
      taskId: task.task_id,
      status: task.status,
      model,
      request,
    };
  }

  async queryTask(taskId: string) {
    return this.request<ApiMartTaskStatus>(
      `/tasks/${encodeURIComponent(taskId)}?language=en`
    );
  }
}

export const normalizeApiMartSize = (size?: string) => {
  if (!size || size === "auto") return "1:1";
  return size;
};

export const getApiMartFirstImageUrl = (task: ApiMartTaskStatus) => {
  const first = task.result?.images?.[0]?.url;
  if (Array.isArray(first)) return first[0];
  return first;
};

export const getApiMartFailReason = (task: ApiMartTaskStatus) => {
  if (typeof task.error === "string") return task.error;
  return task.error?.message || task.fail_reason || "ApiMart image generation failed";
};

export const apiMartTimestampToDate = (timestamp?: number) => {
  if (!timestamp) return new Date();
  return new Date(timestamp * 1000);
};
