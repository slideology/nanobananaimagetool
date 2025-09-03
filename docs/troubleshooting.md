# 故障排除指南

## 🔧 常见问题解决方案

### 1. API调用问题

#### 问题：401 Unauthorized 错误
**症状**：API调用返回401状态码
**原因**：
- API密钥配置错误
- 环境变量未正确设置
- 密钥已过期

**解决方案**：
```bash
# 检查环境变量
echo $KIEAI_APIKEY

# 检查wrangler配置
cat wrangler.jsonc | grep KIEAI_APIKEY

# 测试API密钥有效性
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://kieai.erweima.ai/api/v1/chat/credit
```

#### 问题：任务创建失败
**症状**：createTask接口返回错误
**常见错误码**：
- `400`: 参数错误
- `413`: 文件过大
- `429`: 请求频率过高

**调试步骤**：
```typescript
// 启用详细日志
const debug = true;

try {
  const result = await kieAI.createNanoBananaTask(payload);
  if (debug) console.log("Create task success:", result);
} catch (error) {
  console.error("Create task failed:");
  console.error("Error code:", error.code);
  console.error("Error message:", error.message);
  console.error("Request payload:", payload);
}
```

### 2. 文件上传问题

#### 问题：图片上传失败
**检查清单**：
- [ ] 文件格式支持 (JPEG, PNG, WEBP)
- [ ] 文件大小 < 10MB
- [ ] R2存储权限配置正确
- [ ] CDN_URL环境变量设置

**调试代码**：
```typescript
// 文件上传调试
const validateFile = (file: File) => {
  console.log("File info:", {
    name: file.name,
    size: file.size,
    type: file.type
  });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`File too large: ${file.size} bytes`);
  }
};
```

### 3. 任务状态查询问题

#### 问题：任务状态不更新
**可能原因**：
- 轮询间隔太短
- TaskId不正确
- 网络连接问题

**改进方案**：
```typescript
// 智能轮询实现
class TaskPoller {
  private intervals = [2000, 3000, 5000, 8000]; // 渐进式间隔
  private maxAttempts = 20;

  async pollWithBackoff(taskId: string): Promise<TaskResult> {
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      try {
        const result = await this.queryTask(taskId);
        
        if (result.status === "succeeded" || result.status === "failed") {
          return result;
        }

        // 计算下次轮询间隔
        const intervalIndex = Math.min(attempt, this.intervals.length - 1);
        const delay = this.intervals[intervalIndex];
        
        console.log(`Task ${taskId} still running, retry in ${delay}ms`);
        await this.sleep(delay);
      } catch (error) {
        console.error(`Poll attempt ${attempt + 1} failed:`, error);
        
        if (attempt === this.maxAttempts - 1) {
          throw error;
        }
        
        await this.sleep(1000);
      }
    }
    
    throw new Error("Task polling timeout");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. 性能问题

#### 问题：响应时间过长
**优化策略**：

1. **前端优化**：
```typescript
// 实现请求缓存
const requestCache = new Map();

const cachedRequest = async (key: string, requestFn: () => Promise<any>) => {
  if (requestCache.has(key)) {
    console.log("Cache hit for:", key);
    return requestCache.get(key);
  }

  const result = await requestFn();
  requestCache.set(key, result);
  
  // 5分钟后清除缓存
  setTimeout(() => requestCache.delete(key), 5 * 60 * 1000);
  
  return result;
};
```

2. **后端优化**：
```typescript
// 实现连接池
class KieAIConnectionPool {
  private clients: KieAI[] = [];
  private maxSize = 5;

  getClient(): KieAI {
    if (this.clients.length > 0) {
      return this.clients.pop()!;
    }
    return new KieAI();
  }

  releaseClient(client: KieAI): void {
    if (this.clients.length < this.maxSize) {
      this.clients.push(client);
    }
  }
}
```

### 5. 部署问题

#### 问题：Cloudflare Workers部署失败
**检查步骤**：
```bash
# 1. 验证wrangler配置
wrangler whoami

# 2. 检查环境变量
wrangler secret list

# 3. 验证D1数据库
wrangler d1 list

# 4. 检查构建输出
pnpm run build

# 5. 本地预览测试
pnpm run preview
```

#### 问题：数据库迁移失败
**解决方案**：
```bash
# 重置本地数据库
rm -rf .wrangler/state/d1/
pnpm run db:migrate:local

# 检查迁移文件
ls app/.server/drizzle/migrations/

# 手动执行迁移
wrangler d1 execute DB_NAME --file=migration.sql
```

## 📊 监控和调试工具

### 1. 日志记录最佳实践
```typescript
// 结构化日志
const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({
      level: "INFO",
      timestamp: new Date().toISOString(),
      message,
      data
    }));
  },
  
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({
      level: "ERROR", 
      timestamp: new Date().toISOString(),
      message,
      error: error?.message,
      stack: error?.stack
    }));
  }
};
```

### 2. 性能监控
```typescript
// API调用性能监控
const measurePerformance = async (name: string, fn: () => Promise<any>) => {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logger.info("Performance metric", {
      operation: name,
      duration,
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error("Performance metric", {
      operation: name,
      duration,
      success: false,
      error: error.message
    });
    
    throw error;
  }
};

// 使用示例
const result = await measurePerformance("nano-banana-create-task", () =>
  kieAI.createNanoBananaTask(payload)
);
```

## 🆘 获取帮助

如果以上解决方案都无法解决问题，请：

1. **收集详细信息**：
   - 错误消息完整内容
   - 复现步骤
   - 环境信息 (Node版本、操作系统等)
   - 相关配置文件

2. **提供最小复现案例**：
   - 创建最简单的复现代码
   - 移除无关的业务逻辑
   - 确保他人可以直接运行

3. **检查现有资源**：
   - 查看GitHub Issues
   - 搜索相关文档
   - 查看API官方文档