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
  CreateNanoBananaUnifiedOptions,
  NanoBananaTaskDetail,
} from "./type";

// Create GPT 4o Options
export type { Create4oTaskOptions, GPT4oTask, GPT4oTaskCallbackJSON };

// Create Kontext Options
export type { CreateKontextOptions, KontextTask };

// Create Nano Banana Options
export type {
  CreateNanoBananaTaskOptions,
  CreateNanoBananaEditTaskOptions,
  CreateNanoBananaUnifiedOptions,
  NanoBananaTaskDetail,
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
  private API_URL = new URL("https://kieai.erweima.ai");
  private readonly config: KieAIModelConfig;

  constructor(config?: KieAIModelConfig) {
    this.config = config || { accessKey: env.KIEAI_APIKEY };
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

    const response = await fetch(url, options);
    const json = await response.json<ApiResult<T>>();

    if (!response.ok || json.code !== 200) {
      throw {
        code: json.code ?? response.status,
        message: json.msg ?? response.statusText,
        data: json ? json.data : json,
      };
    }

    // 缓存成功的响应
    if (cacheKey && json.code === 200) {
      cache.set(cacheKey, json, CACHE_CONFIG.API_RESPONSE_TTL);
    }

    return json;
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
      { useCache: true } // 启用缓存以减少频繁查询
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
      "/api/v1/playground/createTask", // 基于MCP验证的实际API端点
      {
        model: "google/nano-banana",
        callBackUrl: payload.callBackUrl,
        input: {
          prompt: payload.prompt,
        }
      },
      {
        method: "post",
      }
    );

    return result.data;
  }

  /**
   * 创建 Nano Banana 图像编辑任务
   * 使用 google/nano-banana-edit 模型，支持 Image-to-Image
   */
  async createNanoBananaEditTask(payload: CreateNanoBananaEditTaskOptions) {
    // 验证参数
    if (!payload.image_urls || payload.image_urls.length === 0) {
      throw new Error("At least one image URL is required for nano-banana-edit");
    }
    
    if (payload.image_urls.length > 5) {
      throw new Error("Maximum 5 images allowed for nano-banana-edit");
    }

    const result = await this.fetch<CreateTaskResult>(
      "/api/v1/playground/createTask", // 基于MCP验证的实际API端点
      {
        model: "google/nano-banana-edit",
        callBackUrl: payload.callBackUrl,
        input: {
          prompt: payload.prompt,
          image_urls: payload.image_urls, // 使用经过MCP验证的参数名
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
      "/api/v1/playground/recordInfo", // 基于MCP验证的实际API端点
      { taskId },
      { method: "get", useCache: true } // 启用缓存以减少频繁查询
    );

    return result.data;
  }
}
