# AI 图像生成器技术实施指南

> **配套文档**: 与开发计划配套使用  
> **目标**: 提供核心代码实现要点  
> **API验证**: ✅ 基于MCP工具验证的Nano Banana API信息

## 📋 核心实现要点

### 1. 数据库Schema扩展

**文件**: `/app/.server/drizzle/schema.ts`

```typescript
// 在 ai_tasks 表中添加字段
export const ai_tasks = sqliteTable("ai_tasks", {
  // ... 现有字段
  generation_mode: text({ 
    enum: ["hairstyle", "image-to-image", "text-to-image"] 
  }).notNull().default("hairstyle"),
  // ... 其他字段
});
```

**迁移命令**:
```bash
pnpm run db:generate
pnpm run db:migrate:local
```

### 2. 数据验证Schema

**文件**: `/app/.server/schema/task.ts`

```typescript
export const createAiImageSchema = z.object({
  mode: z.enum(["image-to-image", "text-to-image"]),
  image: z.instanceof(File).optional(),
  prompt: z.string().min(1, "Prompt is required"),
  negative_prompt: z.string().optional(),
  style: z.string().optional(),
  type: z.enum(["gpt-4o", "kontext", "nano-banana", "nano-banana-edit"]).default("nano-banana"),
  width: z.number().optional().default(1024),
  height: z.number().optional().default(1024),
}).refine(
  (data) => {
    if (data.mode === "image-to-image" && !data.image) {
      return false;
    }
    return true;
  },
  { message: "Image is required for image-to-image mode", path: ["image"] }
);
```

### 3. API路由实现

**文件**: `/app/routes/_api/create.ai-image/route.ts`

```typescript
export const action = async ({ request }: Route.ActionArgs) => {
  // 1. 验证请求方法
  if (request.method.toLowerCase() !== "post") {
    throw new Response("Not Found", { status: 404 });
  }

  // 2. 解析和验证数据
  const form = await request.formData();
  const raw = Object.fromEntries(form.entries());
  const json = createAiImageSchema.parse(raw);

  // 3. 用户认证
  const [session] = await getSessionHandler(request);
  const user = session.get("user");
  if (!user) throw new Response("Unauthorized", { status: 401 });

  // 4. 调用业务逻辑
  try {
    const result = await createAiImage(json, user);
    return data(result);
  } catch (e) {
    console.error("Create ai image error", e);
    throw new Response("Server Error", { status: 500 });
  }
};
```

### 4. 业务逻辑服务

**文件**: `/app/.server/services/ai-tasks.ts`

```typescript
export const createAiImage = async (
  value: CreateAiImageDTO,
  user: User
) => {
  const { mode, image, prompt, style, type, width, height } = value;

  // 1. 计算积分（基于实际API定价）
  const taskCredits = (() => {
    if (type === "nano-banana" || type === "nano-banana-edit") {
      return 4; // Nano Banana: 4积分/图像 (~$0.020)
    } else if (type === "gpt-4o") {
      return mode === "text-to-image" ? 2 : 3;
    } else {
      return mode === "text-to-image" ? 1 : 2;
    }
  })();

  // 2. 扣除积分
  const consumptionResult = await consumptionsCredits(user, {
    credits: taskCredits,
  });

  // 3. 处理图片上传
  let fileUrl: string | undefined;
  if (mode === "image-to-image" && image) {
    const extName = image.name.split(".").pop()!;
    const newFileName = `ai-image-${nanoid()}.${extName}`;
    const file = new File([image], newFileName);
    const [R2Object] = await uploadFiles(file);
    fileUrl = new URL(R2Object.key, env.CDN_URL).toString();
  }

  // 4. 构建任务参数
  const inputParams = { mode, image: fileUrl, prompt, style, width, height };
  const ext = { style, mode, width, height };

  let insertPayload: InsertAiTask;
  
  if (type === "nano-banana" || type === "nano-banana-edit") {
    // Nano Banana 模式实现（基于MCP验证的API信息）
    const isImageToImage = type === "nano-banana-edit";
    
    insertPayload = {
      user_id: user.id,
      status: "pending",
      estimated_start_at: new Date(),
      generation_mode: isImageToImage ? "image-to-image" : "text-to-image",
      input_params: inputParams,
      ext: { ...ext, model: type },
      aspect: `${width}:${height}`,
      provider: "kie_nano_banana",
      request_param: {
        model: type === "nano-banana" ? "google/nano-banana" : "google/nano-banana-edit",
        callBackUrl: `${env.DOMAIN}/webhooks/kie-image`,
        input: {
          prompt: createAiImagePrompt({ mode, prompt, style }),
          ...(isImageToImage && fileUrl ? { image_urls: [fileUrl] } : {}),
        },
      },
    };
  } else if (type === "gpt-4o") {
    insertPayload = {
      user_id: user.id,
      status: "pending",
      estimated_start_at: new Date(),
      generation_mode: mode as any,
      input_params: inputParams,
      ext,
      aspect: `${width}:${height}`,
      provider: "kie_4o",
      request_param: {
        filesUrl: fileUrl ? [fileUrl] : [],
        prompt: createAiImagePrompt({ mode, prompt, style }),
        size: `${width}:${height}`,
        nVariants: "1",
        callBackUrl: `${env.DOMAIN}/webhooks/kie-image`,
      },
    };
  } else {
    // Kontext 实现类似
  }

  // 5. 创建任务
  const task = await createAiTask(insertPayload);
  return { tasks: [task], consumptionCredits: consumptionResult };
};
```

### 5. AI提示词生成

**新建文件**: `/app/.server/prompt/ai-image.ts`

```typescript
interface CreateAiImagePromptOptions {
  mode: "image-to-image" | "text-to-image";
  prompt: string;
  style?: string;
}

export const createAiImagePrompt = ({ mode, prompt, style }: CreateAiImagePromptOptions) => {
  const prompts: string[] = [prompt];

  // 模式指令
  if (mode === "image-to-image") {
    prompts.push("Transform the uploaded image according to the description while maintaining composition.");
  } else {
    prompts.push("Create a high-quality, detailed image based on the description.");
  }

  // 样式指令
  if (style) {
    prompts.push(getStyleInstructions(style));
  }

  // 质量要求
  prompts.push("High resolution, detailed, professional quality, vibrant colors, sharp focus.");

  return prompts.join(". ");
};

function getStyleInstructions(style: string): string {
  const styleMap: Record<string, string> = {
    "photorealistic": "Ultra-realistic photography style with perfect lighting and natural colors",
    "digital-art": "Modern digital artwork with vibrant colors and contemporary aesthetic",
    "oil-painting": "Classical oil painting with rich textures and visible brushstrokes",
    "watercolor": "Soft watercolor painting with flowing colors and gentle transitions",
    "anime": "Japanese anime style with clean lines and vibrant colors",
    // ... 更多样式
  };
  return styleMap[style] || "";
}
```

### 6. 前端组件完善

**文件**: `/app/features/image_generator/index.tsx`

```typescript
// 添加任务提交逻辑
const handleSubmit = async () => {
  if (!canGenerate || submitting) return;

  if (!user && loginRef.current) {
    loginRef.current.login();
    return;
  }

  setSubmitting(true);
  
  try {
    const form = new FormData();
    form.set("mode", mode);
    form.set("prompt", prompt.trim());
    
    if (mode === "image-to-image" && file) {
      form.set("image", file);
    }
    
    if (selectedStyle) {
      form.set("style", selectedStyle);
    }
    
    // 设置模型类型（默认使用nano-banana）
    form.set("type", mode === "image-to-image" ? "nano-banana-edit" : "nano-banana");

    const res = await fetch("/api/create/ai-image", {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      const result = await res.json<AiImageResult>();
      setCredits(result.consumptionCredits.remainingBalance);
      setTasks(result.tasks.map(item => ({ ...item, progress: 0 })));
      setDone(true);
    } else if (res.status === 401) {
      loginRef.current?.login();
    } else if (res.status === 402) {
      // 积分不足处理
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (error) {
    console.error("Generate image error:", error);
  } finally {
    setSubmitting(false);
  }
};

// 添加任务状态管理
const [tasks, setTasks] = useTasks<AiImageResult["tasks"][number] & { progress: number }>({
  onUpdateTask: async (task) => {
    const res = await fetch(`/api/task/${task.task_no}`);
    if (res.ok) {
      const result = await res.json<TaskResult>();
      return { ...result.task, progress: result.progress };
    }
    return task;
  },
  taskKey: "task_no",
  verifySuccess: (task) => ["failed", "succeeded"].includes(task.status),
  intervalMs: 8000,
  immediate: true,
});
```

### 7. 样式配置

**文件**: `/app/routes/base/_index/config.ts`

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
    description: "Classical oil painting with rich textures"
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
  }
];
```

## 🧪 测试检查清单

### 功能测试
- [ ] Text-to-Image 模式正常工作
- [ ] Image-to-Image 模式正常工作  
- [ ] 样式选择生效
- [ ] 积分正确扣除
- [ ] 任务状态正确更新
- [ ] 结果正确展示

### 错误处理测试
- [ ] 未登录用户处理
- [ ] 积分不足处理
- [ ] 文件格式验证
- [ ] 网络错误处理
- [ ] AI服务异常处理

### 性能测试
- [ ] 大文件上传测试
- [ ] 并发请求处理
- [ ] 内存使用监控
- [ ] 响应时间测量

## 🚀 部署检查清单

### 环境配置
- [ ] 数据库迁移完成
- [ ] 环境变量配置正确
- [ ] AI服务API密钥有效
- [ ] 文件存储权限正确

### 监控设置
- [ ] 错误日志收集
- [ ] 性能指标监控
- [ ] 用户行为跟踪
- [ ] 积分消耗统计

---

*实施指南提供核心要点，具体实现时请参考开发计划文档中的详细说明*