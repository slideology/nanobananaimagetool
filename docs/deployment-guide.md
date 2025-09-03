# Nano Banana AI 图像生成器 - 环境配置指南

## 🔧 环境变量配置

### 必需的环境变量

```bash
# === Kie AI API 配置 ===
KIEAI_APIKEY=your_kie_ai_api_key_here

# === 基础服务配置 ===
SESSION_SECRET=your_32_character_random_string
CDN_URL=https://your-cdn-domain.com
DOMAIN=https://your-domain.com/

# === 数据库和存储 ===
DATABASE_URL=your_cloudflare_d1_database_url
R2_BUCKET_NAME=your_r2_bucket_name

# === 第三方服务 ===
# Google OAuth (用户认证)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Creem 支付服务
CREEM_KEY=creem_your_production_key
CREEM_TEST_KEY=creem_test_your_test_key
CREEM_WEBHOOK_SECRET=your_webhook_secret

# === 分析和监控 ===
GOOGLE_ANALYTICS_ID=G-XXXXXXX
GOOGLE_ADS_ID=pub-xxxxxxxxxxxxxxxx

# === 业务配置 ===
INITLIZE_CREDITS=3  # 新用户初始积分
```

### Cloudflare Workers 配置 (wrangler.toml)

```toml
name = "nanobananaimageqoder"
main = "./workers/app.ts"
compatibility_date = "2024-01-01"

[env.production]
name = "nanobananaimageqoder-prod"

# 环境变量
[env.production.vars]
SESSION_SECRET = "your_32_character_random_string"
CDN_URL = "https://your-cdn-domain.com"
DOMAIN = "https://your-domain.com/"
GOOGLE_ANALYTICS_ID = "G-XXXXXXX"
GOOGLE_ADS_ID = "pub-xxxxxxxxxxxxxxxx"
INITLIZE_CREDITS = 3

# 加密的环境变量 (使用 wrangler secret put)
# KIEAI_APIKEY
# GOOGLE_CLIENT_ID
# GOOGLE_CLIENT_SECRET
# CREEM_KEY
# CREEM_WEBHOOK_SECRET

# 绑定资源
[[env.production.kv_namespaces]]
binding = "KV"
id = "your_kv_namespace_id"

[[env.production.r2_buckets]]
binding = "R2"
bucket_name = "your_r2_bucket_name"

[[env.production.d1_databases]]
binding = "DB"
database_name = "ai-hairstyle"
database_id = "your_d1_database_id"

[env.development]
name = "nanobananaimageqoder-dev"

[env.development.vars]
SESSION_SECRET = "dev_32_character_random_string"
CDN_URL = "http://localhost:3007"
DOMAIN = "http://localhost:3007/"
INITLIZE_CREDITS = 10  # 开发环境给更多积分

# 开发环境使用测试密钥
[[env.development.kv_namespaces]]
binding = "KV"
id = "your_dev_kv_namespace_id"

[[env.development.r2_buckets]]
binding = "R2"
bucket_name = "your_dev_r2_bucket"

[[env.development.d1_databases]]
binding = "DB"
database_name = "ai-hairstyle-dev"
database_id = "your_dev_d1_database_id"
```

## 🚀 部署步骤

### 1. 准备Cloudflare资源

```bash
# 创建D1数据库
wrangler d1 create ai-hairstyle

# 创建KV命名空间
wrangler kv:namespace create "NanoBanana"

# 创建R2存储桶
wrangler r2 bucket create nanobanan-images
```

### 2. 配置环境变量

```bash
# 设置敏感的环境变量
wrangler secret put KIEAI_APIKEY
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put CREEM_KEY
wrangler secret put CREEM_WEBHOOK_SECRET

# 对于开发环境
wrangler secret put KIEAI_APIKEY --env development
wrangler secret put CREEM_TEST_KEY --env development
```

### 3. 数据库迁移

```bash
# 运行数据库迁移 (生产环境)
wrangler d1 migrations apply ai-hairstyle

# 开发环境
wrangler d1 migrations apply ai-hairstyle --local --env development
```

### 4. 部署应用

```bash
# 部署到生产环境
pnpm run build
wrangler deploy --env production

# 部署到开发环境
wrangler deploy --env development
```

## 🔒 安全配置

### API密钥安全

1. **Kie AI API密钥**
   - 从 [Kie AI 控制台](https://kieai.erweima.ai) 获取
   - 确保密钥有足够的积分和权限
   - 定期轮换密钥

2. **回调URL配置**
   ```bash
   # Nano Banana 回调URL应该指向
   https://your-domain.com/api/webhook/nano-banana
   ```

### CORS和CSP配置

```typescript
// app/entry.server.tsx 中的安全头配置
const securityHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https: blob:;
    connect-src 'self' https://kieai.erweima.ai;
    frame-ancestors 'none';
  `.replace(/\s+/g, ' ').trim(),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
```

## 📊 监控和日志

### Cloudflare Analytics

1. 在Cloudflare控制台启用Web Analytics
2. 配置自定义指标:
   - 图像生成成功率
   - API响应时间
   - 错误率统计

### 错误监控

```typescript
// 在 app/root.tsx 中配置全局错误处理
export function ErrorBoundary({ error }) {
  // 发送错误到监控服务
  console.error('Global error:', error);
  
  // 可以集成 Sentry 或其他错误监控服务
  // Sentry.captureException(error);
  
  return (
    <div>Something went wrong</div>
  );
}
```

### 性能监控

```bash
# 使用 Cloudflare 的实时日志
wrangler tail --env production

# 查看资源使用情况
wrangler metrics --env production
```

## 🧪 验证部署

### 健康检查端点

```typescript
// app/routes/health.tsx
export const loader = () => {
  return Response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "connected", // 实际检查数据库连接
      kie_ai: "connected",   // 实际检查Kie AI API
      storage: "connected"   // 实际检查R2存储
    }
  });
};
```

### 测试检查清单

- [ ] 主页加载正常
- [ ] Google OAuth登录功能
- [ ] 文件上传到R2存储
- [ ] Nano Banana API调用
- [ ] 数据库读写操作
- [ ] 支付流程 (Creem)
- [ ] 错误处理和用户提示
- [ ] 移动端响应式设计

### API测试脚本

```bash
#!/bin/bash
# test-deployment.sh

DOMAIN="https://your-domain.com"

echo "Testing health endpoint..."
curl -f "$DOMAIN/health" || exit 1

echo "Testing image generation API..."
curl -f -X POST "$DOMAIN/api/create/ai-image" \
  -H "Content-Type: multipart/form-data" \
  -F "prompt=test image" \
  -F "model=nano-banana" \
  -F "generationMode=text-to-image" || exit 1

echo "All tests passed!"
```

## 🔄 维护和更新

### 定期任务

1. **每周**
   - 检查API使用量和积分余额
   - 查看错误日志和性能指标
   - 备份重要数据

2. **每月**
   - 更新依赖包
   - 检查安全漏洞
   - 优化性能指标

3. **按需**
   - Kie AI API密钥轮换
   - 扩容存储和数据库
   - 新功能部署

### 故障排除

```bash
# 查看实时日志
wrangler tail --env production

# 检查资源状态
wrangler kv:namespace list
wrangler r2 bucket list
wrangler d1 list

# 回滚部署
wrangler rollback --env production
```

## 📞 支持联系

- **Kie AI技术支持**: [https://kieai.erweima.ai/support](https://kieai.erweima.ai/support)
- **Cloudflare文档**: [https://developers.cloudflare.com/workers/](https://developers.cloudflare.com/workers/)
- **项目文档**: 参考项目README.md

---

*最后更新: 2025-09-02*  
*版本: Nano Banana 集成 v1.0*