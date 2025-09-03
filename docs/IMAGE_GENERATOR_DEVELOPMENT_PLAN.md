# AI 图像生成器开发计划

> **项目目标**: 将 `image_generator` 组件实现与 AI 发型生成系统一样的完整流程  
> **开发周期**: 预计 2-3 周  
> **项目**: Nano Banana AI Image Generator  
> **API验证**: ✅ 基于MCP工具验证的Kie AI官方API信息

## 📋 项目概述

### 当前状态分析
- ✅ **已完成**: `image_generator` 基础UI组件（参考 nanobanana.ai 设计风格）
- ✅ **已完成**: 前端交互界面和表单验证
- ❌ **缺失**: 后端API接口和业务逻辑
- ❌ **缺失**: 数据库数据模型适配
- ❌ **缺失**: AI服务集成
- ❌ **缺失**: 异步任务处理

### 目标功能
实现与 `hairstyle_changer` 同等级的完整功能：
1. 🎨 **双模式支持**: Image-to-Image 和 Text-to-Image
2. 🔄 **异步任务**: 完整的任务创建、执行、回调机制
3. 💰 **积分系统**: 积分扣除和消费记录
4. 📊 **实时进度**: 任务状态轮询和进度展示
5. 🔐 **用户认证**: Google OAuth 集成
6. 🍌 **Nano Banana 支持**: 集成经过MCP验证的Kie AI Nano Banana API

### 🔍 经过MCP验证的API信息
- **API端点**: `/api/v1/playground/createTask` 和 `/api/v1/playground/recordInfo`
- **模型支持**: 
  - `google/nano-banana`: Text-to-Image，仅需`prompt`参数
  - `google/nano-banana-edit`: Image-to-Image，需要`prompt`+`image_urls`参数
- **定价**: 4积分/图像 (~$0.020)
- **图像支持**: JPEG, PNG, WEBP，最大5张，单个最大10MB

---

## 🎯 开发里程碑

### 里程碑 1: 后端API基础架构 (第1周)
- **目标**: 建立完整的API接口和数据模型
- **优先级**: 🔴 高优先级
- **负责人**: 后端开发工程师

### 里程碑 2: AI服务集成 (第2周)
- **目标**: 集成Kie AI服务，实现双模式图像生成
- **优先级**: 🔴 高优先级  
- **负责人**: AI集成工程师

### 里程碑 3: 前后端联调 (第2-3周)
- **目标**: 前后端完整流程打通
- **优先级**: 🟡 中优先级
- **负责人**: 全栈开发工程师

### 里程碑 4: 测试和优化 (第3周)
- **目标**: 功能测试、性能优化、用户体验完善
- **优先级**: 🟢 普通优先级
- **负责人**: 测试工程师 + 前端工程师

---

## 🔧 详细开发任务

### 📊 任务 1: 扩展数据库模型

#### 1.1 更新 AI 任务表结构
**文件**: `/app/.server/drizzle/schema.ts`

**需要修改的字段**:
```typescript
// 在 ai_tasks 表中新增 generation_mode 字段
export const ai_tasks = sqliteTable("ai_tasks", {
  // ... 现有字段
  generation_mode: text({ enum: ["hairstyle", "image-to-image", "text-to-image"] })
    .notNull()
    .default("hairstyle"), // 新增字段，区分不同的生成模式
  // ... 其他字段
});
```

**迁移脚本**:
```sql
-- 添加生成模式字段
ALTER TABLE ai_tasks ADD COLUMN generation_mode TEXT DEFAULT 'hairstyle' CHECK (generation_mode IN ('hairstyle', 'image-to-image', 'text-to-image'));
```

#### 1.2 创建数据库迁移
**任务**:
```bash
# 生成迁移文件
pnpm run db:generate

# 执行本地迁移
pnpm run db:migrate:local

# 执行远程迁移（生产环境）
pnpm run db:migrate
```

**预估时间**: 0.5天  
**难度**: 🟢 简单

---

### 🛠️ 任务 2: 创建 AI 图像生成 API

#### 2.1 数据验证 Schema
**文件**: `/app/.server/schema/task.ts`

**新增内容**:
```typescript
// 新增 AI 图像生成验证 Schema
export const createAiImageSchema = z.object({
  mode: z.enum(["image-to-image", "text-to-image"]),
  image: z.instanceof(File).optional(),
  prompt: z.string().min(1, "Prompt is required"),
  negative_prompt: z.string().optional(),
  style: z.string().optional(),
  type: z.enum(["gpt-4o", "kontext", "nano-banana", "nano-banana-edit"]).default("nano-banana"),
  width: z.number().optional().default(1024),
  height: z.number().optional().default(1024),
  steps: z.number().optional().default(30),
  cfg_scale: z.number().optional().default(7.5),
}).refine(
  (data) => {
    // Image-to-Image 模式必须提供图片
    if (data.mode === "image-to-image" && !data.image) {
      return false;
    }
    return true;
  },
  {
    message: "Image is required for image-to-image mode",
    path: ["image"],
  }
);

export type CreateAiImageDTO = z.infer<typeof createAiImageSchema>;
```

#### 2.2 API 路由实现
**文件**: `/app/routes/_api/create.ai-image/route.ts`

**需要完善的功能**:
```typescript
import type { Route } from "./+types/route";
import { data } from "react-router";

import { createAiImageSchema } from "~/.server/schema/task";
import { getSessionHandler } from "~/.server/libs/session";
import { createAiImage } from "~/.server/services/ai-tasks";

export const action = async ({ request }: Route.ActionArgs) => {
  if (request.method.toLowerCase() !== "post") {
    throw new Response("Not Found", { status: 404 });
  }

  // 1. 解析和验证请求数据
  const form = await request.formData();
  const raw = Object.fromEntries(form.entries());
  const json = createAiImageSchema.parse(raw);

  // 2. 用户身份验证
  const [session] = await getSessionHandler(request);
  const user = session.get("user");
  if (!user) throw new Response("Unauthorized", { status: 401 });

  // 3. 调用业务逻辑
  try {
    const result = await createAiImage(json, user);
    return data(result);
  } catch (e) {
    console.error("Create ai image error", e);
    throw new Response("Server Error", { status: 500 });
  }
};

export type AiImageResult = Awaited<ReturnType<typeof action>>["data"];
```

**预估时间**: 1天  
**难度**: 🟡 中等

---

### 🧠 任务 3: 业务逻辑服务层

#### 3.1 AI 图像生成服务
**文件**: `/app/.server/services/ai-tasks.ts`

**新增函数**: `createAiImage`
```typescript
export const createAiImage = async (
  value: CreateAiImageDTO,
  user: User
) => {
  const { mode, image, prompt, negative_prompt, style, type, width, height, steps, cfg_scale } = value;

  // 1. 计算积分消耗（基于实际API定价）
  const taskCredits = (() => {
    if (type === "nano-banana" || type === "nano-banana-edit") {
      return 4; // Nano Banana: 4积分/图像 (~$0.020)
    } else if (type === "gpt-4o") {
      return mode === "text-to-image" ? 2 : 3; // GPT-4o定价
    } else {
      return mode === "text-to-image" ? 1 : 2; // Kontext定价
    }
  })();

  // 2. 积分扣除
  const consumptionResult = await consumptionsCredits(user, {
    credits: taskCredits,
  });

  // 3. 处理图片上传（仅 image-to-image 模式）
  let fileUrl: string | undefined;
  if (mode === "image-to-image" && image) {
    const extName = image.name.split(".").pop()!;
    const newFileName = `${nanoid()}.${extName}`;
    const file = new File([image], newFileName);
    const [R2Object] = await uploadFiles(file);
    fileUrl = new URL(R2Object.key, env.CDN_URL).toString();
  }

  // 4. 生成任务参数
  let insertPayload: InsertAiTask;
  
  if (type === "nano-banana" || type === "nano-banana-edit") {
    // Nano Banana 模式实现
    const isImageToImage = type === "nano-banana-edit";
    
    const params = {
      model: type === "nano-banana" ? "google/nano-banana" : "google/nano-banana-edit",
      callBackUrl: import.meta.env.PROD ? `${env.DOMAIN}/webhooks/kie-image` : undefined,
      input: {
        prompt: createAiImagePrompt({ mode, prompt, negative_prompt, style }),
        ...(isImageToImage && fileUrl ? { image_urls: [fileUrl] } : {}),
      },
    };

    insertPayload = {
      user_id: user.id,
      status: "pending",
      estimated_start_at: new Date(),
      generation_mode: isImageToImage ? "image-to-image" : "text-to-image",
      input_params: { mode, image: fileUrl, prompt, negative_prompt, style, width, height },
      ext: { style, mode, model: type },
      aspect: `${width}:${height}`,
      provider: "kie_nano_banana",
      request_param: params,
    };
  } else if (type === "gpt-4o") {
    const params: Create4oTaskOptions = {
      filesUrl: fileUrl ? [fileUrl] : [],
      prompt: createAiImagePrompt({
        mode,
        prompt,
        negative_prompt,
        style,
      }),
      size: `${width}:${height}`,
      nVariants: "1",
      callBackUrl: import.meta.env.PROD ? `${env.DOMAIN}/webhooks/kie-image` : undefined,
    };

    insertPayload = {
      user_id: user.id,
      status: "pending",
      estimated_start_at: new Date(),
      generation_mode: mode,
      input_params: { mode, image: fileUrl, prompt, negative_prompt, style, width, height },
      ext: { style, mode },
      aspect: `${width}:${height}`,
      provider: "kie_4o",
      request_param: params,
    };
  } else {
    // Kontext 模式实现
    const params: CreateKontextOptions = {
      inputImage: fileUrl,
      prompt: createAiImageKontextPrompt({
        prompt,
        style,
      }),
      aspectRatio: `${width}:${height}`,
      model: "flux-kontext-pro",
      outputFormat: "png",
      callBackUrl: import.meta.env.PROD ? `${env.DOMAIN}/webhooks/kie-image` : undefined,
    };

    insertPayload = {
      user_id: user.id,
      status: "pending",
      estimated_start_at: new Date(),
      generation_mode: mode,
      input_params: { mode, image: fileUrl, prompt, negative_prompt, style, width, height },
      ext: { style, mode },
      aspect: `${width}:${height}`,
      provider: "kie_kontext",
      request_param: params,
    };
  }

  // 5. 创建任务
  const tasks = await createAiTask(insertPayload);
  return { tasks: [tasks], consumptionCredits: consumptionResult };
};
```

#### 3.2 AI 提示词生成
**文件**: `/app/.server/prompt/ai-image.ts` (新建)

```typescript
interface CreateAiImagePromptOptions {
  mode: "image-to-image" | "text-to-image";
  prompt: string;
  negative_prompt?: string;
  style?: string;
}

export const createAiImagePrompt = ({
  mode,
  prompt,
  negative_prompt,
  style,
}: CreateAiImagePromptOptions) => {
  const prompts: string[] = [];

  // 主要提示词
  prompts.push(prompt);

  // 样式要求
  if (style) {
    prompts.push(`Style: ${style}`);
  }

  // 模式特定的要求
  if (mode === "image-to-image") {
    prompts.push("Transform the uploaded image according to the description while maintaining the overall composition and structure.");
  } else {
    prompts.push("Create a high-quality, detailed image based on the description.");
  }

  // 质量要求
  prompts.push("High resolution, detailed, professional quality, vibrant colors, sharp focus.");

  // 负面提示词
  if (negative_prompt) {
    prompts.push(`Avoid: ${negative_prompt}`);
  }

  return prompts.join(" ");
};

// Kontext 模式的提示词（简化版）
export const createAiImageKontextPrompt = ({
  prompt,
  style,
}: {
  prompt: string;
  style?: string;
}) => {
  return style ? `${prompt}, ${style}` : prompt;
};
```

**预估时间**: 2天  
**难度**: 🔴 困难

---

### 🎨 任务 4: 前端组件完善

#### 4.1 更新 ImageGenerator 组件
**文件**: `/app/features/image_generator/index.tsx`

**需要添加的功能**:
1. **任务提交逻辑**:
```typescript
const handleSubmit = async () => {
  if (!canGenerate) return;

  if (!user && loginRef.current) {
    loginRef.current.login();
    return;
  }

  setSubmitting(true);
  const form = new FormData();

  // 构建表单数据
  form.set("mode", mode);
  if (mode === "image-to-image" && file) {
    form.set("image", file);
  }
  form.set("prompt", prompt);
  if (selectedStyle) {
    form.set("style", selectedStyle);
  }

  try {
    const res = await fetch("/api/create/ai-image", {
      method: "post",
      body: form,
    });

    if (res.ok) {
      const result = await res.json<AiImageResult>();
      const { tasks, consumptionCredits } = result;

      setCredits(consumptionCredits.remainingBalance);
      setTasks(tasks.map((item) => ({ ...item, progress: 0 })));
      setDone(true);
    } else if (res.status === 401) {
      loginRef.current?.login();
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (error) {
    console.error("Generate image error:", error);
    // 显示错误提示
  } finally {
    setSubmitting(false);
  }
};
```

2. **任务状态管理**:
```typescript
const [tasks, setTasks] = useTasks<
  AiImageResult["tasks"][number] & { progress: number }
>({
  onUpdateTask: async (task) => {
    const res = await fetch(`/api/task/${task.task_no}`);
    if (res.ok) {
      const result = await res.json<TaskResult>();
      const { task, progress } = result;
      return { ...task, progress };
    } else {
      return task;
    }
  },
  taskKey: "task_no",
  verifySuccess: (task) => ["failed", "succeeded"].includes(task.status),
  intervalMs: 8000,
  immediate: true,
});
```

#### 4.2 样式选择数据
**文件**: `/app/routes/base/_index/config.ts`

**新增图像样式配置**:
```typescript
export const imageStyles = [
  {
    name: "Photorealistic",
    value: "photorealistic",
    description: "Ultra-realistic, high-detail photography style"
  },
  {
    name: "Digital Art",
    value: "digital-art",
    description: "Modern digital artwork with vibrant colors"
  },
  {
    name: "Oil Painting",
    value: "oil-painting",
    description: "Classic oil painting technique with rich textures"
  },
  {
    name: "Watercolor",
    value: "watercolor",
    description: "Soft watercolor painting with flowing transitions"
  },
  {
    name: "Anime Style",
    value: "anime",
    description: "Japanese anime/manga artistic style"
  },
  {
    name: "Abstract",
    value: "abstract",
    description: "Abstract artistic interpretation"
  },
  {
    name: "Vintage",
    value: "vintage",
    description: "Retro vintage aesthetic with classic tones"
  },
  {
    name: "Minimalist",
    value: "minimalist",
    description: "Clean, simple, minimalist design"
  }
];
```

**预估时间**: 1.5天  
**难度**: 🟡 中等

---

### 🔗 任务 5: 集成测试和优化

#### 5.1 端到端测试
**测试场景**:
1. **Text-to-Image 流程测试**:
   - 用户登录 → 输入提示词 → 选择样式 → 生成图片 → 查看结果
   - 验证积分扣除正确性
   - 验证生成结果质量

2. **Image-to-Image 流程测试**:
   - 用户登录 → 上传图片 → 输入提示词 → 选择样式 → 生成图片 → 查看结果
   - 验证图片上传和处理
   - 验证风格转换效果

3. **错误处理测试**:
   - 未登录用户访问
   - 积分不足场景
   - AI服务异常场景
   - 网络错误场景

#### 5.2 性能优化
**优化点**:
1. **前端优化**:
   - 图片上传压缩
   - 懒加载和代码分割
   - 缓存策略优化

2. **后端优化**:
   - 数据库查询优化
   - 文件上传优化
   - API响应缓存

3. **用户体验优化**:
   - 加载状态优化
   - 错误提示优化
   - 进度反馈优化

**预估时间**: 1.5天  
**难度**: 🟡 中等

---

## 📅 开发时间表

### 第1周 (5个工作日)
| 日期 | 任务 | 负责人 | 预计产出 |
|------|------|--------|----------|
| 周一 | 任务1: 数据库模型扩展 | 后端工程师 | 数据库迁移完成 |
| 周二-周三 | 任务2: AI图像生成API | 后端工程师 | API接口完成 |
| 周四-周五 | 任务3.1: 业务逻辑服务层 | 后端工程师 | 核心业务逻辑完成 |

### 第2周 (5个工作日)
| 日期 | 任务 | 负责人 | 预计产出 |
|------|------|--------|----------|
| 周一 | 任务3.2: AI提示词生成 | AI工程师 | 提示词模块完成 |
| 周二-周三 | 任务4.1: 前端组件完善 | 前端工程师 | 组件功能完成 |
| 周四 | 任务4.2: 样式配置 | 前端工程师 | 样式选择完成 |
| 周五 | 前后端联调测试 | 全栈工程师 | 基础流程打通 |

### 第3周 (5个工作日)
| 日期 | 任务 | 负责人 | 预计产出 |
|------|------|--------|----------|
| 周一-周二 | 任务5.1: 端到端测试 | 测试工程师 | 测试报告 |
| 周三-周四 | 任务5.2: 性能优化 | 全栈工程师 | 性能优化完成 |
| 周五 | 最终验收和部署 | 全团队 | 功能上线 |

---

## 🔍 风险评估和应对策略

### 高风险项
1. **AI服务集成复杂性** 🔴
   - **风险**: Kie AI API 调用参数差异大，调试困难
   - **应对**: 提前搭建测试环境，分模型逐步测试

2. **数据库迁移风险** 🔴
   - **风险**: 生产环境数据迁移可能影响现有功能
   - **应对**: 先在开发环境充分测试，使用渐进式迁移

### 中风险项
3. **前后端接口对接** 🟡
   - **风险**: 数据格式不一致导致联调困难
   - **应对**: 提前定义详细的接口文档，使用TypeScript保证类型安全

4. **性能问题** 🟡
   - **风险**: 大文件上传和处理可能影响用户体验
   - **应对**: 实现文件压缩、进度显示、错误重试机制

### 低风险项
5. **UI样式调整** 🟢
   - **风险**: 样式细节调整工作量
   - **应对**: 基于已有的nanobanana.ai样式，增量优化

---

## 📊 成功标准

### 功能完整性
- ✅ **双模式支持**: Image-to-Image 和 Text-to-Image 都能正常工作
- ✅ **任务流程**: 创建→执行→回调→结果展示 完整流程无错误
- ✅ **积分系统**: 积分扣除、余额更新、消费记录准确无误
- ✅ **用户体验**: 界面友好、操作流畅、错误提示清晰

### 性能标准
- ⚡ **响应时间**: API接口响应时间 < 500ms
- ⚡ **上传速度**: 图片上传时间 < 10秒 (10MB以内)
- ⚡ **生成时间**: AI图像生成时间 30-120秒
- ⚡ **界面渲染**: 首屏加载时间 < 2秒

### 质量标准
- 🧪 **测试覆盖**: 核心功能测试覆盖率 > 90%
- 🔒 **安全性**: 所有用户输入都有验证，图片自动清理
- 📱 **兼容性**: 支持主流浏览器和移动设备
- 🌐 **可用性**: 系统可用性 > 99%

---

## 🎯 后续优化方向

### 短期优化 (1个月内)
1. **高级参数控制**: 添加更多AI生成参数调节
2. **批量处理**: 支持批量图片生成
3. **模板功能**: 预设常用的提示词模板
4. **分享功能**: 生成结果分享到社交媒体

### 中期优化 (3个月内)
1. **高级编辑**: 添加图片后处理和编辑功能
2. **个性化**: 基于用户历史偏好推荐样式
3. **API开放**: 提供开发者API接口
4. **移动应用**: 开发专门的移动端App

### 长期优化 (6个月内)
1. **AI模型优化**: 集成更多先进的AI模型
2. **企业版功能**: 团队协作、品牌管理等
3. **国际化**: 多语言支持
4. **生态建设**: 插件系统、第三方集成

---

## 📞 团队协作

### 开发团队
- **项目经理**: 协调进度，风险管控
- **后端工程师**: API开发，数据库设计
- **前端工程师**: UI实现，用户体验优化
- **AI工程师**: AI服务集成，提示词优化
- **测试工程师**: 功能测试，性能测试
- **运维工程师**: 部署配置，监控告警

### 沟通机制
- **每日站会**: 每天10分钟同步进度和问题
- **周度回顾**: 每周总结完成情况和下周计划
- **技术评审**: 关键节点进行技术方案评审
- **代码评审**: 所有代码提交都需要评审通过

### 协作工具
- **项目管理**: 使用项目管理工具跟踪任务进度
- **代码管理**: Git分支管理，PR审核流程
- **文档协作**: 实时协作文档，技术规范共享
- **测试环境**: 独立的开发、测试、预生产环境

---

*开发计划将根据实际进展动态调整，确保项目按时高质量交付* 🚀