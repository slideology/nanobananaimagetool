import { env } from "cloudflare:workers";
import { cache, CACHE_CONFIG } from "../../utils/performance";

import type {
  ApiResult,
  Create4oTaskOptions,
  GPT4oTaskCallbackJSON,
  GPT4oTask,
  CreateKontextOptions,
  KontextTask,
  CreateNanoBananaTaskOptions,
  CreateNanoBananaEditTaskOptions,
  CreateNanoBanana2TaskOptions,
  CreateNanoBananaUnifiedOptions,
  NanoBananaTaskDetail,
  CreateSeedanceTaskOptions,
  SeedanceTaskDetail,
} from "./type";

// Create GPT 4o Options
export type { Create4oTaskOptions, GPT4oTask, GPT4oTaskCallbackJSON };

// Create Kontext Options
export type { CreateKontextOptions, KontextTask };

// Create Nano Banana Options
export type {
  CreateNanoBananaTaskOptions,
  CreateNanoBananaEditTaskOptions,
  CreateNanoBanana2TaskOptions,
  CreateNanoBananaUnifiedOptions,
  NanoBananaTaskDetail,
};

// Create Seedance Options
export type {
  CreateSeedanceTaskOptions,
  SeedanceTaskDetail,
};

interface KieAIModelConfig {
  accessKey: string;
}

interface CreateTaskResult {
  taskId: string;
}

interface QueryTaskParams {
  taskId: string;
}

interface Get4oDirectDownloadURLOptions {
  taskId: string;
  url: string;
}

export class KieAI {
  private API_URL = new URL("https://api.kie.ai");
  private readonly config: KieAIModelConfig;

  constructor(config: KieAIModelConfig) {
    this.config = config;
  }

  private async fetch<T = any>(
    path: string,
    data?: Record<string, any>,
    init: RequestInit & { useCache?: boolean } = {}
  ) {
    const { headers, method = "get", useCache = false, ...rest } = init;

    // 生成缓存键
    const cacheKey = useCache ? `kie_api_${method}_${path}_${JSON.stringify(data)}` : null;

    // 检查缓存
    if (cacheKey) {
      const cached = cache.get<ApiResult<T>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 🔧 重试机制配置 - 生产环境更保守
    const maxRetries = 2; // 减少重试次数
    const retryDelays = [2000, 5000]; // 2秒, 5秒 - 增加重试间隔

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const url = new URL(path, this.API_URL);
        const options: RequestInit = {
          ...rest,
          method,
          headers: {
            "content-type": "application/json",
            ...headers,
            Authorization: `Bearer ${this.config.accessKey}`,
          },
        };

        if (data) {
          if (method.toLowerCase() === "get") {
            Object.entries(data).forEach(([key, value]) => {
              url.searchParams.set(key, value);
            });
          } else {
            options.body = JSON.stringify(data);
          }
        }

        console.log(`🔄 Kie AI API调用尝试 ${attempt + 1}/${maxRetries + 1}:`, url.toString());

        const response = await fetch(url, options);
        const json = await response.json<ApiResult<T>>();

        if (!response.ok || json.code !== 200) {
          const apiError = {
            code: json.code ?? response.status,
            message: json.msg ?? response.statusText,
            data: json ? json.data : json,
          };

          // 判断是否应该重试 - 更严格的重试条件
          const shouldRetry = attempt < maxRetries && (
            response.status >= 500 || // 服务器错误
            response.status === 429 || // 请求过于频繁
            response.status === 408 || // 请求超时
            response.status === 502 || // 网关错误
            response.status === 503 || // 服务不可用
            // 🔧 移除对"No image content found"的自动重试，这通常是图片URL问题，重试无意义
            (json.code === 10040 && !json.msg?.includes("No image content found"))
          );

          if (shouldRetry) {
            console.warn(`⚠️ API调用失败，${retryDelays[attempt]}ms后重试:`, apiError.message);
            lastError = apiError;
            await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
            continue; // 继续重试
          } else {
            throw apiError; // 不重试，直接抛出错误
          }
        }

        // 🎉 成功响应处理
        console.log(`✅ Kie AI API调用成功 (尝试 ${attempt + 1})`);

        // 缓存结果
        if (cacheKey) {
          cache.set(cacheKey, json, CACHE_CONFIG.KIE_API);
        }

        return json;

      } catch (error) {
        lastError = error;

        // 网络错误或其他异常的重试逻辑
        const shouldRetry = attempt < maxRetries && (
          error instanceof TypeError || // 网络错误
          (error as any)?.name === 'AbortError' || // 超时错误
          (error as any)?.cause?.code === 'ECONNRESET' // 连接重置
        );

        if (shouldRetry) {
          console.warn(`⚠️ 网络错误，${retryDelays[attempt]}ms后重试:`, error instanceof Error ? error.message : String(error));
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
          continue;
        } else {
          console.error(`❌ API调用最终失败:`, error);
          throw error;
        }
      }
    }

    // 所有重试都失败了
    console.error(`❌ 经过 ${maxRetries + 1} 次尝试后API调用仍然失败:`, lastError);
    throw lastError;
  }

  async create4oTask(payload: Create4oTaskOptions) {
    const result = await this.fetch<CreateTaskResult>(
      "/api/v1/gpt4o-image/generate",
      payload,
      {
        method: "post",
      }
    );

    return result.data;
  }

  async query4oTaskDetail(params: QueryTaskParams) {
    const result = await this.fetch<GPT4oTask>(
      "/api/v1/gpt4o-image/record-info",
      params,
      { useCache: false } // 禁用缓存以获取最新状态
    );

    return result.data;
  }

  async get4oDownloadURL(params: Get4oDirectDownloadURLOptions) {
    console.log("params", params);

    const result = await this.fetch<string>(
      "/api/v1/gpt4o-image/download-url",
      params,
      { method: "post" }
    );
    console.log("result", result);

    return result.data;
  }

  async getCreditsRemaining() {
    const result = await this.fetch<number>("/api/v1/chat/credit");

    return result.data;
  }

  async createKontextTask(payload: CreateKontextOptions) {
    const result = await this.fetch<CreateTaskResult>(
      "/api/v1/flux/kontext/generate",
      payload,
      {
        method: "post",
      }
    );

    return result.data;
  }

  async queryKontextTask(params: QueryTaskParams) {
    const result = await this.fetch<KontextTask>(
      "/api/v1/flux/kontext/record-info",
      params
    );

    return result.data;
  }

  // ===== Nano Banana API Methods =====

  /**
   * 创建 Nano Banana 文本生成图像任务
   * 使用 google/nano-banana 模型，仅支持 Text-to-Image
   */
  async createNanoBananaTask(payload: CreateNanoBananaTaskOptions) {
    const result = await this.fetch<CreateTaskResult>(
      "/api/v1/jobs/createTask",
      {
        model: "google/nano-banana",
        callBackUrl: payload.callBackUrl,
        input: {
          prompt: payload.prompt,
          output_format: "png",
          image_size: "auto",
          enable_translation: true
        }
      },
      {
        method: "post",
      }
    );

    return result.data;
  }

  /**
   * 创建 Nano Banana 编辑图像任务
   */
  async createNanoBananaEditTask(payload: CreateNanoBananaEditTaskOptions) {
    const result = await this.fetch<CreateTaskResult>(
      "/api/v1/jobs/createTask",
      {
        model: "google/nano-banana-edit",
        callBackUrl: payload.callBackUrl,
        input: {
          prompt: payload.prompt,
          image_urls: payload.image_urls,
          output_format: "png",
          image_size: "auto",
          enable_translation: true
        }
      },
      {
        method: "post",
      }
    );

    return result.data;
  }

  /**
   * 创建 Nano Banana 2 图像生成任务 (支持高级功能和多图)
   */
  async createNanoBanana2Task(payload: CreateNanoBanana2TaskOptions) {
    const result = await this.fetch<CreateTaskResult>(
      "/api/v1/jobs/createTask",
      {
        model: "nano-banana-2",
        callBackUrl: payload.callBackUrl,
        input: {
          prompt: payload.prompt,
          ...(payload.image_input ? { image_input: payload.image_input } : {}),
          ...(payload.aspect_ratio ? { aspect_ratio: payload.aspect_ratio } : { aspect_ratio: "auto" }),
          ...(payload.google_search !== undefined ? { google_search: payload.google_search } : { google_search: false }),
          ...(payload.resolution ? { resolution: payload.resolution } : { resolution: "1K" }),
          ...(payload.output_format ? { output_format: payload.output_format } : { output_format: "jpg" })
        }
      },
      {
        method: "post",
      }
    );

    return result.data;
  }

  /**
   * 统一的 Nano Banana 任务创建接口
   * 根据模式自动选择正确的API调用
   */
  async createNanoBananaUnifiedTask(request: CreateNanoBananaUnifiedOptions) {
    switch (request.mode) {
      case "text-to-image":
        return this.createNanoBananaTask(request.options);
      case "image-to-image":
        return this.createNanoBananaEditTask(request.options);
      case "nano-banana-2":
        return this.createNanoBanana2Task(request.options);
      default:
        throw new Error(`Unsupported Nano Banana mode: ${(request as any).mode}`);
    }
  }

  /**
   * 查询 Nano Banana 任务状态
   * 使用统一的查询接口
   */
  async queryNanoBananaTask(taskId: string) {
    const result = await this.fetch<NanoBananaTaskDetail>(
      "/api/v1/jobs/recordInfo",
      { taskId },
      { method: "get", useCache: false } // 禁用缓存以获取最新状态
    );

    return result.data;
  }

  // ===== Seedance 1.5 Pro API Methods =====

  /**
   * 创建 Seedance 1.5 Pro 视频生成任务
   * 支持文字生成视频和图片生成视频
   */
  async createSeedanceTask(payload: CreateSeedanceTaskOptions) {
    const result = await this.fetch<CreateTaskResult>(
      "/api/v1/jobs/createTask",
      {
        model: "bytedance/seedance-1.5-pro",
        callBackUrl: payload.callBackUrl,
        input: {
          prompt: payload.prompt,
          input_urls: payload.input_urls || [],
          aspect_ratio: payload.aspect_ratio,
          resolution: payload.resolution || "720p",
          duration: payload.duration,
          fixed_lens: payload.fixed_lens || false,
          generate_audio: payload.generate_audio || false,
        }
      },
      {
        method: "post",
      }
    );

    return result.data;
  }

  /**
   * 查询 Seedance 任务状态
   * 使用统一的查询接口
   */
  async querySeedanceTask(taskId: string) {
    const result = await this.fetch<SeedanceTaskDetail>(
      "/api/v1/jobs/recordInfo",
      { taskId },
      { method: "get", useCache: false } // 禁用缓存以获取最新状态
    );

    return result.data;
  }
}
