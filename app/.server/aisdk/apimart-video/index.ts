import { APIMART_DEFAULT_BASE_URL } from "../apimart-image";
import type {
  ApiMartAvatarAsset,
  ApiMartAvatarTaskResult,
  ApiMartRealAvatarAction,
  ApiMartResponse,
  ApiMartSeedanceAvatarAssetType,
  ApiMartSeedanceImageWithRole,
  ApiMartSeedanceModel,
  ApiMartSeedanceResolution,
  ApiMartSeedanceSize,
  ApiMartVideoTaskStatus,
  CreateApiMartPrivateAvatarOptions,
  CreateApiMartRealAvatarOptions,
  CreateApiMartSeedanceTaskOptions,
  ApiMartSeedanceTaskCreateResult,
} from "./type";

export type {
  ApiMartAvatarTaskResult,
  ApiMartAvatarAsset,
  ApiMartRealAvatarAction,
  ApiMartResponse,
  ApiMartSeedanceAvatarAssetType,
  ApiMartSeedanceImageWithRole,
  ApiMartSeedanceModel,
  ApiMartSeedanceResolution,
  ApiMartSeedanceSize,
  ApiMartVideoTaskStatus,
  CreateApiMartPrivateAvatarOptions,
  CreateApiMartRealAvatarOptions,
  CreateApiMartSeedanceTaskOptions,
  ApiMartSeedanceTaskCreateResult,
};

export const APIMART_SEEDANCE_MODELS: ApiMartSeedanceModel[] = [
  "doubao-seedance-2.0",
  "doubao-seedance-2.0-fast",
  "doubao-seedance-2.0-face",
  "doubao-seedance-2.0-fast-face",
];

export const isApiMartSeedanceModel = (
  model: string
): model is ApiMartSeedanceModel =>
  APIMART_SEEDANCE_MODELS.includes(model as ApiMartSeedanceModel);

export const supportsApiMartSeedance1080p = (model: ApiMartSeedanceModel) =>
  model === "doubao-seedance-2.0" || model === "doubao-seedance-2.0-face";

interface ApiMartVideoConfig {
  apiKey: string;
  baseUrl?: string;
}

export class ApiMartVideoApiError extends Error {
  readonly status: number;
  readonly code?: string | number;
  readonly data?: unknown;

  constructor(message: string, status: number, code?: string | number, data?: unknown) {
    super(message);
    this.name = "ApiMartVideoApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export class ApiMartVideo {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: ApiMartVideoConfig) {
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
        "ApiMart video request failed";
      throw new ApiMartVideoApiError(
        message,
        response.status,
        json?.error?.code ?? json?.code,
        json
      );
    }

    return json.data;
  }

  async createSeedanceTask(
    options: CreateApiMartSeedanceTaskOptions
  ): Promise<ApiMartSeedanceTaskCreateResult> {
    const request = {
      model: options.model,
      ...(options.prompt ? { prompt: options.prompt } : {}),
      ...(options.resolution ? { resolution: options.resolution } : {}),
      ...(options.size ? { size: options.size } : {}),
      ...(options.duration ? { duration: options.duration } : {}),
      ...(options.generateAudio !== undefined ? { generate_audio: options.generateAudio } : {}),
      ...(options.seed !== undefined ? { seed: options.seed } : {}),
      ...(options.returnLastFrame !== undefined
        ? { return_last_frame: options.returnLastFrame }
        : {}),
      ...(options.webSearch ? { tools: [{ type: "web_search" }] } : {}),
      ...(options.imageUrls?.length ? { image_urls: options.imageUrls } : {}),
      ...(options.imageWithRoles?.length ? { image_with_roles: options.imageWithRoles } : {}),
      ...(options.videoUrls?.length ? { video_urls: options.videoUrls } : {}),
      ...(options.audioUrls?.length ? { audio_urls: options.audioUrls } : {}),
    };

    const data = await this.request<Array<{ status: "submitted"; task_id: string }>>(
      "/videos/generations",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    const task = data[0];
    if (!task?.task_id) {
      throw new ApiMartVideoApiError(
        "ApiMart did not return a video task_id",
        502,
        "missing_task_id",
        data
      );
    }

    return {
      taskId: task.task_id,
      status: task.status,
      model: options.model,
      request,
    };
  }

  async submitPrivateAvatar(options: CreateApiMartPrivateAvatarOptions) {
    const request = {
      ...(options.group ? { group: options.group } : {}),
      ...(options.groupId ? { group_id: options.groupId } : {}),
      project_name: options.projectName || "default",
      asset_type: options.assetType || "Image",
      ...(options.assets?.length ? { assets: options.assets } : {}),
      ...(options.url ? { url: options.url } : {}),
      ...(options.name ? { name: options.name } : {}),
    };

    return this.request<ApiMartAvatarTaskResult>("/seedance2/private-avatar", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async realAvatar(options: CreateApiMartRealAvatarOptions) {
    let request: Record<string, unknown>;

    if (options.action === "create_session") {
      request = {
        callback_url: options.callbackUrl,
        project_name: options.projectName || "default",
      };
    } else if (options.action === "query_auth") {
      request = {
        byted_token: options.bytedToken,
        project_name: options.projectName || "default",
      };
    } else {
      request = {
        group_id: options.groupId,
        project_name: options.projectName || "default",
        asset_type: options.assetType || "Video",
        assets: options.assets || [],
      };
    }

    return this.request<ApiMartAvatarTaskResult | Record<string, unknown>>(
      "/seedance2/real-avatar",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  async queryTask(taskId: string, language = "en") {
    return this.request<ApiMartVideoTaskStatus>(
      `/tasks/${encodeURIComponent(taskId)}?language=${encodeURIComponent(language)}`
    );
  }
}

const firstString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.find((item): item is string => typeof item === "string");
  return undefined;
};

export const getApiMartFirstVideoUrl = (task: ApiMartVideoTaskStatus) => {
  const first = task.result?.videos?.[0];
  if (typeof first === "string") return first;
  if (!first || typeof first !== "object") return undefined;
  return firstString(first.url) || firstString(first.video_url) || firstString(first.urls);
};

export const getApiMartVideoThumbnailUrl = (task: ApiMartVideoTaskStatus) =>
  task.result?.thumbnail_url;

export const getApiMartVideoFailReason = (task: ApiMartVideoTaskStatus) => {
  if (typeof task.error === "string") return task.error;
  return task.error?.message || task.fail_reason || "ApiMart video generation failed";
};

export const apiMartVideoTimestampToDate = (timestamp?: number) => {
  if (!timestamp) return new Date();
  return new Date(timestamp * 1000);
};
