# 🔐 Cloudflare Workers 密钥配置指南

## 🎯 修复 500 错误的正确方式

### ❌ 问题原因
在 `wrangler.jsonc` 中设置敏感变量为空字符串 `""` 会导致运行时错误。

### ✅ 正确解决方案
敏感变量应该通过 `wrangler secret put` 命令单独设置，**不在配置文件中定义**。

## 🔧 必需设置的密钥

### 生产环境密钥
```bash
# 设置生产环境密钥
wrangler secret put SESSION_SECRET --env production
wrangler secret put GOOGLE_CLIENT_ID --env production  
wrangler secret put GOOGLE_CLIENT_SECRET --env production
wrangler secret put KIEAI_APIKEY --env production
wrangler secret put CREEM_KEY --env production
wrangler secret put CREEM_WEBHOOK_SECRET --env production
wrangler secret put CREEM_TEST_KEY --env production
```

### 开发环境密钥（可选）
```bash
# 设置开发环境密钥
wrangler secret put SESSION_SECRET --env development
wrangler secret put GOOGLE_CLIENT_ID --env development
wrangler secret put GOOGLE_CLIENT_SECRET --env development
wrangler secret put KIEAI_APIKEY --env development
wrangler secret put CREEM_KEY --env development
wrangler secret put CREEM_WEBHOOK_SECRET --env development
wrangler secret put CREEM_TEST_KEY --env development
```

## 📋 各密钥说明

| 密钥名 | 用途 | 获取方式 |
|--------|------|----------|
| `SESSION_SECRET` | 用户会话加密 | 生成32位随机字符串 |
| `GOOGLE_CLIENT_ID` | Google OAuth | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Google Cloud Console |
| `KIEAI_APIKEY` | AI图片生成 | KIE AI 平台 |
| `CREEM_KEY` | 支付处理 | Creem 支付平台 |
| `CREEM_WEBHOOK_SECRET` | 支付回调验证 | Creem 支付平台 |
| `CREEM_TEST_KEY` | 支付测试 | Creem 支付平台 |

## 🔍 验证密钥设置

### 查看已设置的密钥
```bash
# 查看生产环境密钥列表
wrangler secret list --env production

# 查看开发环境密钥列表  
wrangler secret list --env development
```

### 删除错误的密钥
```bash
# 如果需要删除某个密钥
wrangler secret delete KIEAI_APIKEY --env production
```

## 🚀 Git 部署兼容性

### ✅ 现在的配置是安全的
- `wrangler.jsonc` 不包含敏感变量
- GitHub Actions 部署不会覆盖已设置的密钥
- 密钥通过 Cloudflare 安全存储，不在代码库中

### 📂 文件结构
```
wrangler.jsonc          # 只包含非敏感配置
types/env.d.ts          # TypeScript 类型定义
.dev.vars               # 本地开发环境变量（不提交到Git）
```

## 🔄 部署流程

### GitHub Actions 自动部署
1. **推送代码** → 触发 GitHub Actions
2. **构建应用** → 使用 wrangler.jsonc 配置
3. **部署应用** → 使用已设置的密钥
4. **运行正常** → 无配置冲突

### 本地部署
```bash
# 本地开发（使用 .dev.vars）
pnpm run dev

# 本地部署到开发环境
pnpm run deploy:dev

# 本地部署到生产环境  
pnpm run deploy:prod
```

## 🛡️ 安全最佳实践

1. **永远不要**在 Git 中提交密钥
2. **使用** `wrangler secret put` 设置敏感变量
3. **定期轮换**密钥（特别是 SESSION_SECRET）
4. **分离环境**密钥（开发/生产使用不同值）
5. **最小权限**原则（每个密钥只给必需的权限）

## 🎯 立即修复 500 错误的步骤

1. **设置必需密钥**（至少 SESSION_SECRET 和 KIEAI_APIKEY）
2. **推送当前修复到 Git**
3. **等待自动部署完成**
4. **验证网站正常运行**

---

**🎉 这样修复后，GitHub Actions 部署和生产环境密钥不会有任何冲突！**
