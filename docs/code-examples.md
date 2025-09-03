# 完整代码示例

## 🚀 端到端实现示例

### 1. 完整的类型定义

```typescript
// types/nano-banana.ts
export interface NanoBananaRequest {
  mode: "text-to-image" | "image-to-image";
  prompt: string;
  image?: File;
  style?: string;
  model: "nano-banana" | "nano-banana-edit";
}

export interface NanoBananaResponse {
  taskId: string;
  status: "pending" | "running" | "succeeded" | "failed";
  resultUrl?: string;
  progress: number;
  error?: string;
}

export interface TaskResult {
  task: AiTask;
  progress: number;
}
```

### 2. 完整的API调用示例

```typescript
// services/nano-banana-client.ts
import { KieAI } from "~/.server/aisdk";
import type { NanoBananaRequest, NanoBananaResponse } from "~/types/nano-banana";

export class NanoBananaClient {
  private kieAI: KieAI;
  
  constructor() {
    this.kieAI = new KieAI();
  }

  async generateImage(request: NanoBananaRequest): Promise<NanoBananaResponse> {
    try {
      // 参数验证
      this.validateRequest(request);
      
      // 根据模式选择API调用
      const result = request.mode === "text-to-image" 
        ? await this.callTextToImage(request)
        : await this.callImageToImage(request);
      
      return {
        taskId: result.taskId,
        status: "pending",
        progress: 0
      };
    } catch (error) {
      console.error("Nano Banana generation failed:", error);
      throw new Error(`Generation failed: ${error.message}`);
    }
  }

  async queryTaskStatus(taskId: string): Promise<NanoBananaResponse> {
    try {
      const result = await this.kieAI.queryNanoBananaTask(taskId);
      
      return {
        taskId,
        status: this.mapStatus(result.state),
        progress: this.calculateProgress(result.state),
        resultUrl: result.state === "success" 
          ? this.extractResultUrl(result.resultJson)
          : undefined,
        error: result.state === "fail" ? result.failMsg : undefined
      };
    } catch (error) {
      console.error("Query task status failed:", error);
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  private validateRequest(request: NanoBananaRequest): void {
    if (!request.prompt?.trim()) {
      throw new Error("Prompt is required");
    }
    
    if (request.prompt.length > 5000) {
      throw new Error("Prompt too long (max 5000 characters)");
    }
    
    if (request.mode === "image-to-image" && !request.image) {
      throw new Error("Image is required for image-to-image mode");
    }
    
    if (request.image && request.image.size > 10 * 1024 * 1024) {
      throw new Error("Image file too large (max 10MB)");
    }
  }

  private async callTextToImage(request: NanoBananaRequest) {
    return await this.kieAI.createNanoBananaTask({
      prompt: request.prompt,
      callBackUrl: this.getCallbackUrl()
    });
  }

  private async callImageToImage(request: NanoBananaRequest) {
    const imageUrl = await this.uploadImage(request.image!);
    
    return await this.kieAI.createNanoBananaEditTask({
      prompt: request.prompt,
      image_urls: [imageUrl],
      callBackUrl: this.getCallbackUrl()
    });
  }

  private mapStatus(state: string): NanoBananaResponse["status"] {
    const statusMap = {
      "waiting": "pending",
      "queuing": "pending",
      "generating": "running", 
      "success": "succeeded",
      "fail": "failed"
    };
    return statusMap[state] || "pending";
  }

  private calculateProgress(state: string): number {
    const progressMap = {
      "waiting": 10,
      "queuing": 30,
      "generating": 70,
      "success": 100,
      "fail": 100
    };
    return progressMap[state] || 0;
  }

  private extractResultUrl(resultJson: string): string | undefined {
    try {
      const result = JSON.parse(resultJson);
      return result.resultUrls?.[0];
    } catch {
      return undefined;
    }
  }

  private getCallbackUrl(): string {
    return `${process.env.DOMAIN}/webhooks/kie-image`;
  }

  private async uploadImage(file: File): Promise<string> {
    // 实现图片上传逻辑
    // 返回上传后的URL
    throw new Error("Upload implementation needed");
  }
}
```

### 3. 前端组件使用示例

```typescript
// components/ImageGenerator.tsx
import { useState } from "react";
import { NanoBananaClient } from "~/services/nano-banana-client";
import type { NanoBananaRequest, NanoBananaResponse } from "~/types/nano-banana";

export function ImageGeneratorExample() {
  const [request, setRequest] = useState<Partial<NanoBananaRequest>>({
    mode: "text-to-image",
    model: "nano-banana"
  });
  const [response, setResponse] = useState<NanoBananaResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const client = new NanoBananaClient();

  const handleSubmit = async () => {
    if (!request.prompt) return;
    
    setLoading(true);
    try {
      const result = await client.generateImage(request as NanoBananaRequest);
      setResponse(result);
      
      // 开始轮询任务状态
      pollTaskStatus(result.taskId);
    } catch (error) {
      console.error("Generation failed:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await client.queryTaskStatus(taskId);
        setResponse(status);
        
        if (status.status === "succeeded" || status.status === "failed") {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Poll status failed:", error);
        clearInterval(interval);
      }
    }, 3000);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={request.prompt || ""}
        onChange={(e) => setRequest({...request, prompt: e.target.value})}
        placeholder="输入图像描述..."
        className="w-full p-3 border rounded"
      />
      
      <select
        value={request.mode}
        onChange={(e) => setRequest({
          ...request, 
          mode: e.target.value as "text-to-image" | "image-to-image",
          model: e.target.value === "text-to-image" ? "nano-banana" : "nano-banana-edit"
        })}
        className="p-2 border rounded"
      >
        <option value="text-to-image">文本生成图像</option>
        <option value="image-to-image">图像转图像</option>
      </select>

      {request.mode === "image-to-image" && (
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setRequest({...request, image: e.target.files?.[0]})}
          className="block"
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !request.prompt}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? "生成中..." : "生成图像"}
      </button>

      {response && (
        <div className="mt-4 p-4 border rounded">
          <p>状态: {response.status}</p>
          <p>进度: {response.progress}%</p>
          {response.resultUrl && (
            <img src={response.resultUrl} alt="Generated" className="mt-2 max-w-full" />
          )}
          {response.error && (
            <p className="text-red-500">错误: {response.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

### 4. 错误处理最佳实践

```typescript
// utils/error-handler.ts
export class NanoBananaError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "NanoBananaError";
  }
}

export function handleNanoBananaError(error: any): never {
  if (error.code === 401) {
    throw new NanoBananaError("UNAUTHORIZED", 401, "API密钥无效");
  } else if (error.code === 429) {
    throw new NanoBananaError("RATE_LIMIT", 429, "请求频率过高，请稍后重试");
  } else if (error.code === 400) {
    throw new NanoBananaError("INVALID_REQUEST", 400, "请求参数错误", error.details);
  } else {
    throw new NanoBananaError("UNKNOWN", 500, "未知错误", error);
  }
}

// 使用示例
try {
  await client.generateImage(request);
} catch (error) {
  if (error instanceof NanoBananaError) {
    // 处理特定错误
    switch (error.code) {
      case "UNAUTHORIZED":
        // 跳转到登录页面
        break;
      case "RATE_LIMIT":
        // 显示重试提示
        break;
      default:
        // 显示通用错误信息
    }
  } else {
    // 处理其他错误
    console.error("Unexpected error:", error);
  }
}
```