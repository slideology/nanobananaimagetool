# GitHub Actions 部署配置说明

## 🚀 自动部署流程

这个项目使用 GitHub Actions 自动部署到 Cloudflare Workers。

### 📋 部署环境

- **开发环境**: `develop` 分支推送时自动部署
- **生产环境**: `main` 分支推送时自动部署
- **测试**: Pull Request 时运行测试和构建检查

### 🔧 必需的 GitHub Secrets

在你的 GitHub 仓库设置中添加以下 Secrets：

#### Cloudflare 相关
```
CLOUDFLARE_API_TOKEN     # Cloudflare API Token
CLOUDFLARE_ACCOUNT_ID    # Cloudflare Account ID
```

#### 应用密钥 (生产环境)
```
KIEAI_APIKEY            # KIE AI API 密钥
GOOGLE_CLIENT_ID        # Google OAuth 客户端ID
GOOGLE_CLIENT_SECRET    # Google OAuth 客户端密钥
CREEM_KEY              # Creem 支付密钥
CREEM_WEBHOOK_SECRET   # Creem Webhook 密钥
SESSION_SECRET         # Session 加密密钥 (32位随机字符串)
```

### 🛠️ 如何获取 Cloudflare 凭据

1. **获取 API Token**:
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
   - 点击 "Create Token"
   - 选择 "Edit Cloudflare Workers" 模板
   - 或创建自定义令牌，权限包括：
     - `Zone:Zone:Read`
     - `Zone:Zone Settings:Edit`
     - `Account:Cloudflare Workers:Edit`
     - `Account:Account Settings:Read`

2. **获取 Account ID**:
   - 登录 Cloudflare Dashboard
   - 选择任意域名
   - 在右侧边栏可以看到 "Account ID"

### 📝 部署流程

1. **代码检查**: 
   - TypeScript 类型检查
   - 代码格式检查

2. **测试**:
   - 运行单元测试
   - 运行集成测试

3. **构建**:
   - 编译 TypeScript
   - 打包静态资源
   - 生成 Worker 脚本

4. **部署**:
   - 部署到对应环境
   - 执行数据库迁移
   - 验证部署状态

### 🔄 本地开发与部署

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm run dev

# 本地构建测试
pnpm run build

# 手动部署 (需要先配置 wrangler)
pnpm run deploy
```

### 🐛 常见问题解决

1. **pnpm 未找到错误**:
   - ✅ 已在工作流中添加 pnpm 安装步骤

2. **API Token 权限不足**:
   - 检查 Token 权限设置
   - 确保包含 Workers 编辑权限

3. **数据库迁移失败**:
   - 检查数据库名称配置
   - 确保 D1 数据库已创建

4. **部署超时**:
   - 检查构建日志
   - 可能需要增加超时时间

### 📊 监控和日志

部署完成后，可以通过以下方式监控：

```bash
# 查看 Worker 日志
wrangler tail --env production

# 查看部署状态
wrangler deployments list --env production
```
