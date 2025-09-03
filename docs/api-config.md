# API 配置统一规范

## Nano Banana API 标准配置

### 端点配置
```typescript
export const NANO_BANANA_CONFIG = {
  endpoints: {
    createTask: "/api/v1/playground/createTask",
    queryTask: "/api/v1/playground/recordInfo"
  },
  models: {
    textToImage: "google/nano-banana",
    imageToImage: "google/nano-banana-edit"
  },
  pricing: {
    nanoBanana: 4, // 积分/图像
    gpt4o: {
      textToImage: 2,
      imageToImage: 3
    },
    kontext: {
      textToImage: 1,
      imageToImage: 2
    }
  },
  limits: {
    maxImages: 5,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxPromptLength: 5000,
    supportedFormats: ["JPEG", "PNG", "WEBP"]
  }
};
```

### 状态映射
```typescript
export const STATUS_MAPPING = {
  nanoBanana: {
    "waiting": "pending",
    "queuing": "pending", 
    "generating": "running",
    "success": "succeeded",
    "fail": "failed"
  }
};
```

此配置应该在所有文档和代码中保持一致。