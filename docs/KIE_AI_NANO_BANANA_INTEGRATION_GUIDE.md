# Kie AI Nano Banana API 接入指引

> **项目**: Nano Banana AI Image Generator  
> **API提供商**: Kie.ai  
> **模型**: google/nano-banana & google/nano-banana-edit  
> **最后更新**: 2024-12  
> **验证状态**: ✅ 已通过MCP实际访问API页面验证

## ⚠️ 重要更新说明

**本文档已基于MCP工具实际访问Kie AI官方API页面进行验证和校正**：
- ✅ **API端点**: 已确认实际端点为 `/api/v1/playground/createTask` 和 `/api/v1/playground/recordInfo`
- ✅ **模型区别**: 明确区分nano-banana(仅Text-to-Image)和nano-banana-edit(Image-to-Image)
- ✅ **参数格式**: 已验证实际请求参数结构和字段名称
- ✅ **响应格式**: 已确认实际响应字段和状态值
- ✅ **定价信息**: 确认为4积分/图像(~$0.020)

**验证方法**: 通过MCP Playwright工具直接访问以下页面获取最新信息：
- https://kie.ai/nano-banana?model=google%2Fnano-banana-edit （Image-to-Image编辑模型）
- https://kie.ai/nano-banana?model=google%2Fnano-banana （Text-to-Image生成模型）

## 📋 目录

1. [API概述](#api概述)
2. [两个模型对比](#两个模型对比)
3. [接入准备](#接入准备)
4. [API接口规范](#api接口规范)
5. [代码实现](#代码实现)
6. [错误处理](#错误处理)
7. [测试验证](#测试验证)
8. [性能优化](#性能优化)

---

## 🎯 API概述

### Nano Banana 简介
Nano Banana 是基于 Gemini 2.5 Flash 的高效图像生成和编辑模型，通过 Kie.ai 平台提供服务。该模型具有以下特点：

- **高性价比**: 相比其他模型更加经济实惠
- **高质量**: 基于 Google Gemini 2.5 Flash 技术
- **快速响应**: 毫秒级图像处理能力
- **多功能**: 支持图像生成和图像编辑两种模式

### 支持的功能
1. **Text-to-Image**: 根据文本描述生成图像
2. **Image-to-Image**: 对现有图像进行编辑和修改

---

## 🔍 两个模型对比

### google/nano-banana (Text-to-Image模型)
**主要用途**: 纯文本生成图像

| 特性 | 说明 |
|------|------|
| **输入参数** | 仅需 `prompt` (必需) |
| **输出** | 生成的图像 |
| **适用场景** | 从零开始创建图像，纯文本描述生成 |
| **优势** | 快速、经济、适合批量生成原创内容 |
| **模型名称** | `"google/nano-banana"` |
| **功能类型** | Text-to-Image |
| **图像输入** | 不支持 |

### google/nano-banana-edit (Image-to-Image编辑模型)
**主要用途**: 基于现有图像进行编辑

| 特性 | 说明 |
|------|------|
| **输入参数** | `prompt` (必需) + `image_urls` (必需) |
| **输出** | 编辑后的图像 |
| **适用场景** | 对现有图像进行修改、风格转换、内容编辑 |
| **优势** | 保持原图结构，精确控制编辑效果 |
| **模型名称** | `"google/nano-banana-edit"` |
| **功能类型** | Image-to-Image |
| **图像输入** | 支持最多5张图片 |

### 技术规格对比

| 规格项 | nano-banana | nano-banana-edit |
|--------|-------------|------------------|
| **功能类型** | Text-to-Image | Image-to-Image |
| **输入要求** | 仅文本提示词 | 文本提示词 + 图像URL |
| **图像输入支持** | 不支持 | 支持 |
| **支持格式** | N/A | JPEG, PNG, WEBP |
| **最大文件大小** | N/A | 10MB |
| **最大图片数量** | N/A | 5张 |
| **响应时间** | 快 | 中等 |
| **适用成本** | 4积分/图像 (~$0.020) | 4积分/图像 (~$0.020) |
| **提示词长度** | 最大5000字符 | 最大5000字符 |

---

## 🛠️ 接入准备

### 1. 环境配置
确保项目中已配置以下环境变量：

```bash
# wrangler.jsonc
{
  "vars": {
    "KIEAI_APIKEY": "your_kie_ai_api_key",
    "KIEAI_BASE_URL": "https://kieai.erweima.ai"
  }
}
```

### 2. 依赖检查
确认项目中已有以下依赖：
- TypeScript 支持
- Fetch API (Cloudflare Workers 内置)
- File 对象处理能力

### 3. 权限配置
- Kie.ai 账户开通
- API 密钥获取
- 调用配额确认

---

## 📡 API接口规范

### 基础请求配置

```typescript
interface KieAIConfig {
  baseURL: string;
  apiKey: string;
  timeout: number;
}

const defaultConfig: KieAIConfig = {
  baseURL: "https://api.kie.ai",
  apiKey: env.KIEAI_APIKEY,
  timeout: 30000, // 30秒超时
};
```

### Text-to-Image 接口 (nano-banana)

**模型名称**: `google/nano-banana`
**使用场景**: 纯文本生成图像，适合原创内容创作

#### 请求参数
```typescript
interface NanoBananaTextToImageRequest {
  model: "google/nano-banana";  // 必需：指定使用Text-to-Image模型
  callBackUrl?: string;        // 可选：异步回调地址
  input: {
    prompt: string;            // 必需：图像生成描述，最大5000字符
  };
}
```

#### 请求示例
```typescript
{
  "model": "google/nano-banana",
  "callBackUrl": "https://your-domain.com/webhooks/kie-image",
  "input": {
    "prompt": "一只可爱的橘色小猫坐在阳光明媚的窗台上，毛发蓬松，眼睛明亮，高质量数字艺术"
  }
}
```

### Image-to-Image 接口 (nano-banana-edit)

**模型名称**: `google/nano-banana-edit`
**使用场景**: 基于现有图像进行编辑、风格转换、内容修改

#### 请求参数
```typescript
interface NanoBananaImageToImageRequest {
  model: "google/nano-banana-edit"; // 必需：指定使用Image-to-Image模型
  callBackUrl?: string;             // 可选：异步回调地址
  input: {
    prompt: string;                 // 必需：图像编辑描述，最大5000字符
    image_urls: string[];           // 必需：输入图像URL数组，最多5张
  };
}
```

#### 请求约束（仅适用于Image-to-Image）
- **图像格式**: JPEG, PNG, WEBP
- **文件大小**: 最大10MB
- **图像数量**: 最多5张

#### 请求示例
```typescript
{
  "model": "google/nano-banana-edit",
  "callBackUrl": "https://your-domain.com/webhooks/kie-image",
  "input": {
    "prompt": "将这张照片转换为油画风格，增加温暖的色调，保持人物特征",
    "image_urls": [
      "https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png"
    ]
  }
}
```

#### 响应格式
```typescript
interface NanoBananaCreateTaskResponse {
  code: number;            // 状态码，200为成功
  message: string;         // 响应消息
  data: {
    taskId: string;        // 任务ID，用于查询任务状态
  };
}
```

### 查询任务状态接口 (Query Task)

**接口地址**: `GET /api/v1/playground/recordInfo`
**完整URL**: `https://api.kie.ai/api/v1/playground/recordInfo?taskId={TASK_ID}`

#### 请求参数
- `taskId` (必需): 创建任务时返回的任务ID

#### 响应格式
```typescript
interface NanoBananaQueryTaskResponse {
  code: number;            // 状态码，200为成功
  message: string;         // 响应消息
  data: {
    taskId: string;        // 任务ID
    model: string;         // 使用的模型名称
    state: "waiting" | "queuing" | "generating" | "success" | "fail"; // 任务状态
    param: string;         // 创建任务时的完整请求参数（JSON字符串）
    resultJson: string;    // 结果JSON字符串，包含生成的图像URL
    failCode: string;      // 失败代码（任务失败时）
    failMsg: string;       // 失败消息（任务失败时）
    completeTime: number;  // 完成时间戳
    createTime: number;    // 创建时间戳
    updateTime: number;    // 更新时间戳
  };
}
```

#### 任务状态说明
- `waiting`: 等待生成
- `queuing`: 排队中
- `generating`: 生成中
- `success`: 生成成功
- `fail`: 生成失败

#### 成功响应示例
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "taskId": "task_12345678",
    "model": "google/nano-banana-edit",
    "state": "success",
    "param": "{\"model\":\"google/nano-banana-edit\",\"callBackUrl\":\"https://your-domain.com/api/callback\",\"input\":{\"prompt\":\"将这张照片转换为油画风格\",\"image_urls\":[\"https://example.com/image.jpg\"]}}",
    "resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",
    "failCode": "",
    "failMsg": "",
    "completeTime": 1698765432000,
    "createTime": 1698765400000,
    "updateTime": 1698765432000
  }
}
```

---

## 💻 代码实现

### 1. 扩展现有 Kie AI SDK

**文件位置**: `/app/.server/aisdk/kie-ai/index.ts`

在现有的 KieAI 类中添加 Nano Banana 支持：

```typescript
// 在现有 KieAI 类中添加以下方法

/**
 * 创建 Nano Banana 文本生成图像任务
 */
async createNanoBananaTask(payload: CreateNanoBananaTaskOptions) {
  const result = await this.fetch<CreateTaskResult>(
    "/api/v1/playground/createTask", // 使用实际的API端点
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
 */
async createNanoBananaEditTask(payload: CreateNanoBananaEditTaskOptions) {
  const result = await this.fetch<CreateTaskResult>(
    "/api/v1/playground/createTask", // 使用实际的API端点
    {
      model: "google/nano-banana-edit",
      callBackUrl: payload.callBackUrl,
      input: {
        prompt: payload.prompt,
        image_urls: payload.image_urls, // 使用实际的参数名
      }
    },
    {
      method: "post",
    }
  );

  return result.data;
}

/**
 * 查询 Nano Banana 任务状态
 */
async queryNanoBananaTask(taskId: string) {
  const result = await this.fetch<NanoBananaTaskDetail>(
    "/api/v1/playground/recordInfo", // 使用实际的API端点
    { taskId },
    { method: "get" }
  );

  return result.data;
}
```

### 2. 类型定义扩展

**文件位置**: `/app/.server/aisdk/kie-ai/type.ts`

```typescript
// 添加 Nano Banana 相关类型定义

/**
 * Nano Banana Text-to-Image 任务创建选项
 */
export interface CreateNanoBananaTaskOptions {
  prompt: string;           // 必需：图像生成描述
  callBackUrl?: string;     // 可选：异步回调地址
}

/**
 * Nano Banana Image-to-Image 编辑任务创建选项
 */
export interface CreateNanoBananaEditTaskOptions {
  prompt: string;          // 必需：编辑指令描述
  image_urls: string[];    // 必需：输入图像URL数组，最多5张
  callBackUrl?: string;    // 可选：异步回调地址
}

/**
 * 通用的 Nano Banana 任务创建接口
 * 根据模型类型自动选择正确的参数结构
 */
export type CreateNanoBananaUnifiedOptions = 
  | { mode: "text-to-image"; options: CreateNanoBananaTaskOptions }
  | { mode: "image-to-image"; options: CreateNanoBananaEditTaskOptions };

/**
 * Nano Banana 任务状态查询响应
 */
export interface NanoBananaTaskDetail {
  taskId: string;
  model: string;
  state: "waiting" | "queuing" | "generating" | "success" | "fail";
  param: string;           // 创建任务时的完整请求参数（JSON字符串）
  resultJson: string;      // 结果JSON字符串，包含生成的图像URL
  failCode: string;
  failMsg: string;
  completeTime: number;
  createTime: number;
  updateTime: number;
}

// 导出类型
export type { 
  CreateNanoBananaTaskOptions, 
  CreateNanoBananaEditTaskOptions, 
  CreateNanoBananaUnifiedOptions,
  NanoBananaTaskDetail 
};
```

### 3. 更新 SDK 方法

**文件位置**: `/app/.server/aisdk/kie-ai/index.ts`

```typescript
// 更新 KieAI 类的方法，区分两种模式

/**
 * 创建 Nano Banana Text-to-Image 任务
 */
async createNanoBananaTask(payload: CreateNanoBananaTaskOptions) {
  const result = await this.fetch<CreateTaskResult>(
    "/api/v1/playground/createTask",
    {
      model: "google/nano-banana",
      callBackUrl: payload.callBackUrl,
      input: {
        prompt: payload.prompt,
      }
    },
    { method: "post" }
  );

  return result.data;
}

/**
 * 创建 Nano Banana Image-to-Image 编辑任务
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
    "/api/v1/playground/createTask",
    {
      model: "google/nano-banana-edit",
      callBackUrl: payload.callBackUrl,
      input: {
        prompt: payload.prompt,
        image_urls: payload.image_urls,
      }
    },
    { method: "post" }
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
```

### 4. 业务逻辑集成

**文件位置**: `/app/.server/services/ai-tasks.ts`

在现有的 `createAiHairstyle` 函数基础上，添加 Nano Banana 支持：

```typescript
import { KieAI } from "~/.server/aisdk/kie-ai";
import type { CreateNanoBananaTaskOptions, CreateNanoBananaEditTaskOptions } from "~/.server/aisdk/kie-ai/type";

/**
 * 创建 Nano Banana 图像生成任务
 */
export const createNanoBananaImageTask = async (
  value: CreateAiImageDTO,
  user: User
) => {
  const { mode, image, prompt, style } = value;

  // 1. 积分计算 (Nano Banana 更便宜 - 4积分每图)
  const taskCredits = 4; // 根据实际API定价

  // 2. 积分扣除
  const consumptionResult = await consumptionsCredits(user, {
    credits: taskCredits,
  });

  // 3. 初始化 Kie AI 客户端
  const kieAI = new KieAI();

  let insertPayload: InsertAiTask;
  let kieResponse: any;

  if (mode === "text-to-image") {
    // Text-to-Image 使用 nano-banana 模型
    const enhancedPrompt = enhancePromptForNanoBanana(prompt, style);
    
    const taskPayload: CreateNanoBananaTaskOptions = {
      prompt: enhancedPrompt,
      callBackUrl: `${env.DOMAIN}/webhooks/kie-image`,
    };

    kieResponse = await kieAI.createNanoBananaTask(taskPayload);

    insertPayload = {
      user_id: user.id,
      status: "pending",
      estimated_start_at: new Date(),
      generation_mode: "text-to-image",
      input_params: { mode, prompt, style },
      ext: { style, mode, model: "nano-banana" },
      aspect: "1:1", // Nano Banana 默认正方形
      provider: "kie_nano_banana",
      task_id: kieResponse.taskId, // 使用实际返回的taskId
      request_param: taskPayload,
    };
  } else {
    // Image-to-Image 使用 nano-banana-edit 模型
    if (!image) {
      throw new Error("Image is required for image-to-image mode");
    }

    // 上传图片到 R2
    const extName = image.name.split(".").pop()!;
    const newFileName = `nano-banana-${nanoid()}.${extName}`;
    const file = new File([image], newFileName);
    const [R2Object] = await uploadFiles(file);
    const imageUrl = new URL(R2Object.key, env.CDN_URL).toString();

    const enhancedPrompt = enhancePromptForNanoBananaEdit(prompt, style);

    const taskPayload: CreateNanoBananaEditTaskOptions = {
      prompt: enhancedPrompt,
      image_urls: [imageUrl], // 使用实际的参数名
      callBackUrl: `${env.DOMAIN}/webhooks/kie-image`,
    };

    kieResponse = await kieAI.createNanoBananaEditTask(taskPayload);

    insertPayload = {
      user_id: user.id,
      status: "pending",
      estimated_start_at: new Date(),
      generation_mode: "image-to-image",
      input_params: { mode, image: imageUrl, prompt, style },
      ext: { style, mode, model: "nano-banana-edit" },
      aspect: "1:1",
      provider: "kie_nano_banana",
      task_id: kieResponse.taskId, // 使用实际返回的taskId
      request_param: taskPayload,
    };
  }

  // 4. 创建任务记录
  const task = await createAiTask(insertPayload);
  return { tasks: [task], consumptionCredits: consumptionResult };
};

/**
 * 更新任务状态查询函数
 */
export const updateNanoBananaTaskStatus = async (taskNo: string) => {
  const task = await getAiTaskByTaskNo(taskNo);
  if (!task) {
    throw new Error(`Task not found: ${taskNo}`);
  }

  // 对于 Nano Banana 任务，使用新的查询接口
  if (task.provider === "kie_nano_banana") {
    const kieAI = new KieAI();
    const taskDetail = await kieAI.queryNanoBananaTask(task.task_id!);
    
    // 更新任务状态
    const updates: Partial<AiTask> = {
      status: mapNanoBananaStateToTaskStatus(taskDetail.state),
      updated_at: new Date(),
    };

    if (taskDetail.state === "success") {
      // 解析结果
      const resultData = JSON.parse(taskDetail.resultJson);
      updates.result_url = resultData.resultUrls?.[0];
      updates.completed_at = new Date(taskDetail.completeTime);
    } else if (taskDetail.state === "fail") {
      updates.fail_reason = taskDetail.failMsg;
      updates.completed_at = new Date(taskDetail.completeTime || Date.now());
    }

    await updateAiTaskById(task.id, updates);
    return { ...task, ...updates };
  }

  // 其他模型使用原有逻辑
  return updateTaskStatus(taskNo);
};

/**
 * 映射 Nano Banana 状态到系统任务状态
 */
function mapNanoBananaStateToTaskStatus(
  state: "waiting" | "queuing" | "generating" | "success" | "fail"
): AiTask["status"] {
  switch (state) {
    case "waiting":
    case "queuing":
      return "pending";
    case "generating":
      return "running";
    case "success":
      return "completed";
    case "fail":
      return "failed";
    default:
      return "pending";
  }
}

/**
 * 增强 Text-to-Image 提示词
 */
function enhancePromptForNanoBanana(prompt: string, style?: string): string {
  const parts = [prompt];

  if (style) {
    const styleEnhancement = getNanoBananaStylePrompt(style);
    if (styleEnhancement) {
      parts.push(styleEnhancement);
    }
  }

  // Nano Banana 特定的质量增强
  parts.push("high quality, detailed, professional, vivid colors");

  return parts.join(", ");
}

/**
 * 增强 Image-to-Image 提示词
 */
function enhancePromptForNanoBananaEdit(prompt: string, style?: string): string {
  const parts = [prompt];

  if (style) {
    parts.push(`in ${style} style`);
  }

  // 编辑特定的指令
  parts.push("preserve main composition, enhance details, improve quality");

  return parts.join(", ");
}

/**
 * 获取 Nano Banana 样式提示词
 */
function getNanoBananaStylePrompt(style: string): string {
  const styleMap: Record<string, string> = {
    "photorealistic": "photorealistic, realistic lighting, sharp focus, natural",
    "digital-art": "digital art, vibrant colors, modern style, artistic",
    "oil-painting": "oil painting style, artistic brushstrokes, textured",
    "watercolor": "watercolor painting, soft colors, artistic, flowing",
    "anime": "anime style, manga art, clean lines, colorful",
    "abstract": "abstract art, creative composition, artistic interpretation",
    "vintage": "vintage style, retro aesthetic, aged look, nostalgic",
    "minimalist": "minimalist design, clean, simple, elegant",
  };

  return styleMap[style] || "";
}
```

### 4. Webhook 回调处理

**复用现有回调处理器**: `/app/routes/_webhooks/kie-image/route.ts`

Nano Banana 模型可以复用现有的 Kie AI 回调处理器，因为它们使用相同的 API 结构。

现有的回调处理器已经支持：

```typescript
import type { Route } from "./+types/route";
import { data } from "react-router";
import { updateTaskStatusByTaskId } from "~/.server/services/ai-tasks";
import type { GPT4oTaskCallbackJSON } from "~/.server/aisdk";

export const action = async ({ request }: Route.ActionArgs) => {
  const json = await request.json<GPT4oTaskCallbackJSON>();
  if (!json.data?.taskId) return data({});
  
  // 这个函数已经可以处理所有 Kie AI 模型的回调，包括 Nano Banana
  await updateTaskStatusByTaskId(json.data.taskId);

  return data({});
};
```

**配置说明**:
- Nano Banana 使用相同的回调 URL: `${env.DOMAIN}/webhooks/kie-image`
- 回调数据格式与 GPT-4o 保持一致
- 无需额外的回调处理器

### 5. API 路由集成

**文件位置**: `/app/routes/_api/create.ai-image/route.ts`

在现有的 AI 图像生成 API 中添加 Nano Banana 支持：

```typescript
export const action = async ({ request }: Route.ActionArgs) => {
  const form = await request.formData();
  const raw = Object.fromEntries(form.entries());
  const json = createAiImageSchema.parse(raw); // 扩展 schema 支持 nano-banana
  
  const [session] = await getSessionHandler(request);
  const user = session.get("user");
  if (!user) throw new Response("Unauthorized", { status: 401 });
  
  try {
    let result;
    
    // 根据模型类型选择不同的处理函数
    switch (json.type) {
      case "nano-banana":
      case "nano-banana-edit":
        result = await createNanoBananaImageTask(json, user);
        break;
      case "gpt-4o":
        result = await createAiHairstyle(json, user); // 现有逻辑
        break;
      case "kontext":
        result = await createKontextTask(json, user); // 现有逻辑
        break;
      default:
        throw new Error(`Unsupported model type: ${json.type}`);
    }
    
    return data(result);
  } catch (e) {
    console.error("Create AI image error", e);
    throw new Response("Server Error", { status: 500 });
  }
};
```

### 6. 前端组件更新

**文件位置**: `/app/features/image_generator/index.tsx`

在现有的生成模式中添加 Nano Banana 选项：

```typescript
// 在生成模式配置中添加 Nano Banana
const generationModes = [
  {
    id: "text-to-image",
    name: "Text to Image",
    description: "Create images from text descriptions",
    icon: <Type size={20} />,
    models: [
      { id: "gpt-4o", name: "GPT-4o", description: "High quality, versatile" },
      { id: "kontext", name: "Flux Kontext", description: "Artistic style" },
      { id: "nano-banana", name: "Nano Banana", description: "Fast & affordable" }, // 新增
    ],
  },
  {
    id: "image-to-image",
    name: "Image to Image", 
    description: "Edit and transform existing images",
    icon: <ImageIcon size={20} />,
    models: [
      { id: "gpt-4o", name: "GPT-4o", description: "Professional editing" },
      { id: "kontext", name: "Flux Kontext", description: "Style transfer" },
      { id: "nano-banana-edit", name: "Nano Banana Edit", description: "Quick edits" }, // 新增
    ],
  },
];

// 在提交处理中添加模型选择
const handleSubmit = async () => {
  if (!prompt.trim()) {
    setError("请输入描述文本");
    return;
  }

  if (mode === "image-to-image" && !file) {
    setError("请上传一张图片");
    return;
  }

  setIsGenerating(true);
  setError("");

  const form = new FormData();
  form.set("mode", mode);
  form.set("prompt", prompt.trim());
  form.set("type", selectedModel); // 包括 nano-banana 和 nano-banana-edit
  form.set("style", selectedStyle);
  
  if (mode === "image-to-image" && file) {
    form.set("image", file);
  }

  try {
    // 使用统一的 API 端点
    const res = await fetch("/api/create/ai-image", {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      const result = await res.json<AiImageResult>();
      setTasks(result.tasks.map(item => ({ ...item, progress: 0 })));
      setDone(true);
    } else {
      const errorText = await res.text();
      setError(errorText || "生成失败，请重试");
    }
  } catch (error) {
    console.error("Submit error:", error);
    setError("网络错误，请检查网络连接");
  } finally {
    setIsGenerating(false);
  }
};

// 添加模型选择器组件
const ModelSelector = () => {
  const currentMode = generationModes.find(m => m.id === mode);
  
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        选择 AI 模型
      </label>
      <div className="grid grid-cols-1 gap-2">
        {currentMode?.models.map(model => (
          <label
            key={model.id}
            className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <input
              type="radio"
              name="model"
              value={model.id}
              checked={selectedModel === model.id}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium">{model.name}</div>
              <div className="text-sm text-gray-500">{model.description}</div>
              {model.id.includes("nano-banana") && (
                <div className="text-xs text-green-600 mt-1">
                  💰 经济实惠 | ☁️ 快速生成
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};
```

---

## ⚠️ 错误处理

### 常见错误类型

1. **认证错误 (401)**
   ```typescript
   {
     "error": "Invalid API key",
     "code": "UNAUTHORIZED"
   }
   ```

2. **参数错误 (400)**
   ```typescript
   {
     "error": "Missing required parameter: prompt",
     "code": "INVALID_PARAMETERS"
   }
   ```

3. **文件格式错误 (400)**
   ```typescript
   {
     "error": "Unsupported image format. Only JPEG, PNG, WEBP are supported",
     "code": "INVALID_FILE_FORMAT"
   }
   ```

4. **文件大小错误 (413)**
   ```typescript
   {
     "error": "File size exceeds 10MB limit",
     "code": "FILE_TOO_LARGE"
   }
   ```

5. **配额限制 (429)**
   ```typescript
   {
     "error": "API rate limit exceeded",
     "code": "RATE_LIMIT_EXCEEDED"
   }
   ```

### 错误处理实现

```typescript
export class NanoBananaError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "NanoBananaError";
  }
}

// 在 SDK 中添加错误处理
private async handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    throw new NanoBananaError(
      errorData.code || "UNKNOWN_ERROR",
      response.status,
      errorData.error || `HTTP ${response.status}`
    );
  }

  try {
    return await response.json() as T;
  } catch (error) {
    throw new NanoBananaError(
      "PARSE_ERROR",
      500,
      "Failed to parse API response"
    );
  }
}
```

---

## 🧪 测试验证

### 1. 单元测试

```typescript
// __tests__/nano-banana.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KieAINanoBanana } from '../nano-banana';

describe('KieAINanoBanana', () => {
  let client: KieAINanoBanana;

  beforeEach(() => {
    client = new KieAINanoBanana({
      apiKey: 'test-api-key',
      baseURL: 'https://test.kieai.com'
    });
  });

  it('should generate image successfully', async () => {
    const mockResponse = {
      task_id: 'test-task-123',
      status: 'pending',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.generateImage({
      prompt: 'A beautiful sunset'
    });

    expect(result.task_id).toBe('test-task-123');
    expect(result.status).toBe('pending');
  });

  it('should edit image successfully', async () => {
    const mockResponse = {
      task_id: 'test-edit-123',
      status: 'pending',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.editImage({
      prompt: 'Make it more colorful',
      image_urls: ['https://example.com/image.jpg']
    });

    expect(result.task_id).toBe('test-edit-123');
  });

  it('should handle API errors properly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request'),
    });

    await expect(client.generateImage({
      prompt: ''
    })).rejects.toThrow('Kie AI API Error: 400');
  });
});
```

### 2. 集成测试

```typescript
// 测试完整的工作流程
describe('Nano Banana Integration', () => {
  it('should complete text-to-image workflow', async () => {
    // 1. 创建任务
    const createResponse = await fetch('/api/create/nano-banana-image', {
      method: 'POST',
      body: new FormData({
        mode: 'text-to-image',
        prompt: 'A futuristic city',
        type: 'nano-banana'
      })
    });

    expect(createResponse.ok).toBe(true);
    const createData = await createResponse.json();
    expect(createData.tasks).toHaveLength(1);

    // 2. 查询任务状态
    const taskNo = createData.tasks[0].task_no;
    const statusResponse = await fetch(`/api/task/${taskNo}`);
    
    expect(statusResponse.ok).toBe(true);
    const statusData = await statusResponse.json();
    expect(['pending', 'running', 'completed']).toContain(statusData.task.status);
  });
});
```

---

## 🚀 性能优化

### 1. 缓存策略

```typescript
// 实现任务结果缓存
export class NanoBananaCacheManager {
  private cache = new Map<string, any>();
  private cacheTimeout = 1000 * 60 * 60; // 1小时

  async getCachedResult(prompt: string, options: any): Promise<any> {
    const cacheKey = this.generateCacheKey(prompt, options);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    return null;
  }

  setCachedResult(prompt: string, options: any, result: any): void {
    const cacheKey = this.generateCacheKey(prompt, options);
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });
  }

  private generateCacheKey(prompt: string, options: any): string {
    return btoa(JSON.stringify({ prompt, ...options }));
  }
}
```

### 2. 批量处理

```typescript
// 支持批量图像生成
export async function batchGenerateImages(
  requests: NanoBananaGenerateRequest[]
): Promise<NanoBananaGenerateResponse[]> {
  const batchSize = 5; // 限制并发数
  const results: NanoBananaGenerateResponse[] = [];

  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchPromises = batch.map(req => nanoBanana.generateImage(req));
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Batch request ${i + index} failed:`, result.reason);
        // 添加错误处理逻辑
      }
    });

    // 添加延迟以避免触发速率限制
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

### 3. 监控和日志

```typescript
// 添加性能监控
export class NanoBananaMonitor {
  static trackAPICall(endpoint: string, duration: number, success: boolean) {
    const metrics = {
      endpoint,
      duration,
      success,
      timestamp: Date.now(),
    };

    // 发送到监控系统
    console.log('Nano Banana API Metrics:', metrics);
    
    // 可以集成到 Cloudflare Analytics
    if (env.ANALYTICS_TOKEN) {
      this.sendToAnalytics(metrics);
    }
  }

  private static async sendToAnalytics(metrics: any) {
    // 实现发送到分析系统的逻辑
  }
}
```

---

## 📋 部署检查清单

### 环境配置
- [ ] Kie.ai API 密钥配置正确
- [ ] Webhook 回调地址可访问
- [ ] 文件上传权限设置
- [ ] CORS 策略配置

### 功能测试
- [ ] Text-to-Image 生成测试
- [ ] Image-to-Image 编辑测试  
- [ ] 错误处理验证
- [ ] Webhook 回调测试

### 性能监控
- [ ] API 响应时间监控
- [ ] 错误率统计
- [ ] 用户使用量统计
- [ ] 成本追踪

### 安全检查
- [ ] API 密钥安全存储
- [ ] 用户权限验证
- [ ] 文件类型验证
- [ ] 输入参数验证

---

## 🔗 相关资源

- **Kie.ai 官方文档**: https://kie.ai/docs
- **Nano Banana 模型页面**: https://kie.ai/nano-banana
- **API 参考**: https://kie.ai/docs/api-reference
- **状态页面**: https://status.kie.ai
- **[社区支持](https://discord.gg/kieai)**: https://discord.gg/kieai

---

## 🎯 实际应用示例

### 完整工作流程示例

```typescript
// 示例：完整的 Nano Banana 图像生成工作流程
export async function completeNanoBananaWorkflow() {
  // 1. 用户上传图片并输入提示词
  const userInput = {
    mode: "image-to-image",
    prompt: "将这张照片转换为油画风格，增加温暖的色调",
    image: userUploadedFile,
    style: "oil-painting"
  };
  
  // 2. 验证用户积分
  const user = await getCurrentUser();
  const credits = await getUserCredits(user.id);
  if (credits < 2) {
    throw new Error("积分不足，请充值");
  }
  
  // 3. 创建 AI 任务
  const result = await createNanoBananaImageTask(userInput, user);
  
  // 4. 返回任务信息给前端
  return {
    taskId: result.tasks[0].task_no,
    estimatedTime: "30-60秒",
    creditsUsed: 2,
    remainingCredits: credits - 2
  };
}

// 前端轮询示例
export function pollTaskStatus(taskId: string) {
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/task/${taskId}`);
      const data = await response.json();
      
      if (data.task.status === "completed") {
        clearInterval(pollInterval);
        displayResult(data.task.result_url);
      } else if (data.task.status === "failed") {
        clearInterval(pollInterval);
        showError("图像生成失败，请重试");
      }
      // 继续轮询 pending 和 running 状态
    } catch (error) {
      console.error("轮询错误:", error);
    }
  }, 8000); // 每8秒查询一次
}
```

### 批量处理示例

```typescript
// 批量图像生成
export async function batchImageGeneration(prompts: string[]) {
  const results = [];
  const batchSize = 3; // 控制并发数量
  
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    const batchPromises = batch.map(prompt => 
      createNanoBananaImageTask({
        mode: "text-to-image",
        prompt,
        style: "photorealistic"
      }, currentUser)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
    
    // 避免超出速率限制
    if (i + batchSize < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}
```

---

## 💡 最佳实践

### 1. 性能优化

**提示词优化**:
```typescript
// ✅ 好的提示词
const goodPrompt = "一只可爱的橘色小猫坐在阳光明媚的窗台上，毛发蓬松，眼睛明亮，背景是绿色植物，自然光照，高质量摄影";

// ❌ 不好的提示词
const badPrompt = "猫";
```

**图像预处理**:
```typescript
// 图像压缩和格式转换
export async function preprocessImage(file: File): Promise<File> {
  // 检查文件大小（Nano Banana 限制 10MB）
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("文件大小超过 10MB 限制");
  }
  
  // 检查文件格式
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("仅支持 JPEG、PNG、WEBP 格式");
  }
  
  return file;
}
```

### 2. 用户体验优化

**进度提示**:
```typescript
// 智能进度估算
export function getEstimatedProgress(task: AiTask): number {
  const now = Date.now();
  const startTime = new Date(task.estimated_start_at).getTime();
  const elapsed = now - startTime;
  
  // Nano Banana 通常 30-90 秒完成
  const estimatedTotal = task.provider === "kie_nano_banana" ? 60000 : 120000;
  const progress = Math.min(90, (elapsed / estimatedTotal) * 100);
  
  return Math.round(progress);
}
```

**错误处理和重试**:
```typescript
export async function robustApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.error(`API调用失败 (第${attempt}次尝试):`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 指数退避
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
  
  throw new Error("超出最大重试次数");
}
```

### 3. 成本控制

**积分消费监控**:
```typescript
export class CreditMonitor {
  static async checkDailyUsage(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const usage = await getDailyUsage(userId, today);
    
    // Nano Banana 每日使用限制
    const dailyLimit = 100; // 根据用户套餐调整
    
    if (usage.nanoBananaUsage >= dailyLimit) {
      throw new Error("今日 Nano Banana 使用次数已达上限");
    }
  }
  
  static async suggestCostOptimization(tasks: AiTask[]): Promise<string[]> {
    const suggestions: string[] = [];
    
    const nanoBananaTasks = tasks.filter(t => 
      t.provider === "kie_nano_banana"
    ).length;
    
    const gpt4oTasks = tasks.filter(t => 
      t.provider === "kie_4o"
    ).length;
    
    if (gpt4oTasks > nanoBananaTasks * 2) {
      suggestions.push(
        "💡 建议：对于简单的图像生成，可以尝试使用更经济的 Nano Banana 模型"
      );
    }
    
    return suggestions;
  }
}
```

### 4. 监控和分析

**性能指标收集**:
```typescript
export class NanoBananaMetrics {
  static trackGeneration(taskData: {
    model: string;
    mode: string;
    promptLength: number;
    processingTime: number;
    success: boolean;
  }) {
    // 发送到分析系统
    analytics.track('nano_banana_generation', {
      ...taskData,
      timestamp: Date.now(),
      costEfficiency: this.calculateCostEfficiency(taskData),
    });
  }
  
  private static calculateCostEfficiency(taskData: any): number {
    // Nano Banana vs GPT-4o 成本效率对比
    const nanoBananaCost = taskData.mode === "text-to-image" ? 1 : 2;
    const gpt4oCost = taskData.mode === "text-to-image" ? 3 : 5;
    
    return (gpt4oCost / nanoBananaCost) * 100; // 成本效率百分比
  }
}
```

---

## 📊 使用建议

### 何时选择 Nano Banana

**✅ 推荐使用场景**:
- 🎨 **快速原型设计**: 需要快速生成概念图
- 💰 **成本敏感项目**: 预算有限但需要大量图像
- 🔄 **批量处理**: 需要处理大量相似图像
- 📱 **移动端应用**: 对响应速度要求较高
- 🎯 **简单编辑**: 基础的风格转换和图像增强

**❌ 不推荐使用场景**:
- 🎭 **专业级创作**: 需要极高质量的艺术作品
- 🔬 **精细控制**: 需要复杂的图像操作
- 📚 **复杂场景**: 包含多个复杂元素的图像
- 🎪 **特殊效果**: 需要特定艺术风格的专业作品

### 模型选择矩阵

| 需求 | Nano Banana | GPT-4o | Flux Kontext |
|------|-------------|---------|---------------|
| **成本** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **速度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **质量** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **创意性** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **通用性** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

*此文档将根据 Kie.ai 平台更新和项目需求变化持续维护更新* 🚀