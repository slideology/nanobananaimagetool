# 🚀 GitHub Actions 部署配置指南

## ❌ 遇到的问题
```
Error: Unable to locate executable file: pnpm. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable.
```

## ✅ 解决方案

### 1. 核心问题
GitHub Actions 默认不包含 pnpm，需要在使用前先安装。

### 2. 正确的步骤顺序
```yaml
- name: 安装 pnpm (必须在 setup-node 之前)
  uses: pnpm/action-setup@v3
  with:
    version: 8

- name: 设置 Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'  # 现在可以安全使用 pnpm 缓存
```

### 3. 完整的工作流配置

已创建 `.github/workflows/ci.yml` 文件，包含正确的配置。

### 4. 必需的 GitHub Secrets

在你的 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：

#### 🔑 Cloudflare 凭据
```
CLOUDFLARE_API_TOKEN     # 从 Cloudflare Dashboard 获取
CLOUDFLARE_ACCOUNT_ID    # 从 Cloudflare Dashboard 获取
```

#### 🔐 应用密钥
```
KIEAI_APIKEY            # KIE AI API 密钥
GOOGLE_CLIENT_ID        # Google OAuth 客户端ID
GOOGLE_CLIENT_SECRET    # Google OAuth 客户端密钥
CREEM_KEY              # Creem 支付密钥
CREEM_WEBHOOK_SECRET   # Creem Webhook 密钥
SESSION_SECRET         # Session 加密密钥 (建议32位随机字符串)
```

### 5. 如何获取 Cloudflare API Token

1. 访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 "Create Token"
3. 选择 "Edit Cloudflare Workers" 模板
4. 或创建自定义令牌，权限包括：
   - `Zone:Zone:Read`
   - `Zone:Zone Settings:Edit` 
   - `Account:Cloudflare Workers:Edit`
   - `Account:Account Settings:Read`
   - `User:User Details:Read`

### 6. 如何获取 Account ID

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择任意域名
3. 在右侧边栏可以看到 "Account ID"

### 7. 测试部署

1. 确保所有 Secrets 已正确设置
2. 推送代码到 `develop` 或 `main` 分支
3. 在 GitHub Actions 标签页查看部署进度
4. 如果失败，检查日志中的具体错误信息

### 8. 验证部署

部署成功后，访问你的 Cloudflare Workers URL：
- 开发环境: `https://nanobanana-dev.your-subdomain.workers.dev`
- 生产环境: `https://nanobanana.slideology0816.workers.dev`

### 9. 常见问题排查

#### 问题1: pnpm 未找到
✅ **已解决**: 在工作流中添加了 `pnpm/action-setup@v3`

#### 问题2: API Token 权限不足
🔧 **解决方案**: 确保 API Token 包含所有必需权限

#### 问题3: Account ID 错误
🔧 **解决方案**: 从 Cloudflare Dashboard 复制正确的 Account ID

#### 问题4: 数据库迁移失败
🔧 **解决方案**: 确保 D1 数据库已创建且名称正确

### 10. 本地测试

在推送到 GitHub 之前，可以本地测试：

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm run test:run

# 构建应用
pnpm run build

# 本地部署测试（需要配置 wrangler）
pnpm run deploy
```

### 11. 监控和调试

```bash
# 查看 Worker 日志
wrangler tail --env production

# 查看部署列表
wrangler deployments list --env production

# 查看 Worker 状态
wrangler status
```
