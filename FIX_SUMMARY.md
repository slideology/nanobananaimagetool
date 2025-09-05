# 🎯 GitHub Actions pnpm 问题解决方案

## 📋 问题描述
GitHub Actions 部署时出现错误：
```
Error: Unable to locate executable file: pnpm
```

## ✅ 完整解决方案

### 1. 🔧 核心修复
在 GitHub Actions 工作流中，**必须先安装 pnpm，然后再设置 Node.js**：

```yaml
# ❌ 错误的顺序
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: pnpm  # 这时 pnpm 还不存在！

# ✅ 正确的顺序
- name: Install pnpm
  uses: pnpm/action-setup@v3
  with:
    version: 8

- name: Setup Node.js  
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'  # 现在 pnpm 已经安装了
```

### 2. 📁 已创建的文件

#### `.github/workflows/ci.yml` - 主要部署工作流
- ✅ 正确的 pnpm 安装顺序
- ✅ 自动测试和构建
- ✅ 环境区分（开发/生产）
- ✅ Cloudflare Workers 部署

#### `.github/workflows/test-setup.yml` - 测试工作流
- ✅ 手动触发，用于验证配置
- ✅ 验证 pnpm 安装
- ✅ 测试构建流程

#### `GITHUB_ACTIONS_SETUP.md` - 详细配置指南
- ✅ 完整的设置步骤
- ✅ 必需的 GitHub Secrets 清单
- ✅ Cloudflare 凭据获取方法
- ✅ 常见问题排查

### 3. 🔑 必需的 GitHub Secrets

在你的 GitHub 仓库 **Settings → Secrets and variables → Actions** 中添加：

```
CLOUDFLARE_API_TOKEN     # Cloudflare API Token
CLOUDFLARE_ACCOUNT_ID    # Cloudflare Account ID
KIEAI_APIKEY            # KIE AI API 密钥
GOOGLE_CLIENT_ID        # Google OAuth 客户端ID
GOOGLE_CLIENT_SECRET    # Google OAuth 客户端密钥
CREEM_KEY              # Creem 支付密钥
CREEM_WEBHOOK_SECRET   # Creem Webhook 密钥
SESSION_SECRET         # Session 加密密钥
```

### 4. 🚀 如何使用

#### 方法1: 推送代码触发自动部署
```bash
git add .
git commit -m "fix: 修复 GitHub Actions pnpm 问题"
git push origin main        # 部署到生产环境
# 或
git push origin develop     # 部署到开发环境
```

#### 方法2: 手动触发测试工作流
1. 访问 GitHub 仓库的 Actions 标签页
2. 选择 "测试 pnpm 设置" 工作流
3. 点击 "Run workflow"

#### 方法3: 本地测试
```bash
# 验证配置
pnpm run ci:test

# 手动部署
pnpm run deploy:dev     # 开发环境
pnpm run deploy:prod    # 生产环境
```

### 5. 📊 验证部署成功

部署完成后，访问：
- 🔧 开发环境: `https://nanobanana-dev.your-subdomain.workers.dev`
- 🌐 生产环境: `https://nanobanana.slideology0816.workers.dev`

### 6. 🔍 监控和调试

```bash
# 查看实时日志
wrangler tail --env production

# 查看部署历史
wrangler deployments list --env production

# 检查 Worker 状态
wrangler status
```

### 7. 🎉 预期结果

修复后，GitHub Actions 将能够：
- ✅ 成功安装 pnpm
- ✅ 缓存 pnpm 依赖以加速构建
- ✅ 运行测试和类型检查
- ✅ 构建应用
- ✅ 部署到 Cloudflare Workers
- ✅ 执行数据库迁移

### 8. 🎯 下一步

1. **设置 GitHub Secrets**（最重要）
2. **推送代码测试部署**
3. **配置自定义域名**（可选）
4. **设置监控告警**（推荐）

---

**💡 提示**: 如果部署失败，请检查 GitHub Actions 日志中的具体错误信息，大多数问题都与缺失的 Secrets 相关。
