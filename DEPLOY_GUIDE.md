# 自动部署配置指南

## 概述
这个文档将指导你完成 GitHub Actions 自动部署到 Cloudflare Workers 的配置过程。完成配置后，每次推送代码到 main 分支都会自动部署到生产环境。

## 第一步：获取 Cloudflare API Token

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com/
   - 使用你的账户登录

2. **创建 API Token**
   - 点击右上角的头像，选择 "My Profile"
   - 在左侧菜单中选择 "API Tokens"
   - 点击 "Create Token" 按钮
   - 选择 "Custom token" 模板

3. **配置 Token 权限**
   ```
   Token name: GitHub Actions Deploy
   
   Permissions:
   - Account: Cloudflare Workers:Edit
   - Zone: Zone:Read
   - Zone Resources: Include All zones
   
   Account Resources:
   - Include: 你的账户
   
   IP Address Filtering:
   - 留空（允许所有 IP）
   ```

4. **生成并保存 Token**
   - 点击 "Continue to summary"
   - 确认配置无误后点击 "Create Token"
   - **重要**：复制生成的 Token，这个 Token 只会显示一次

## 第二步：获取 Cloudflare Account ID

1. **在 Cloudflare Dashboard 中**
   - 在右侧边栏中找到 "Account ID"
   - 复制这个 ID

## 第三步：配置 GitHub Secrets

1. **访问你的 GitHub 仓库**
   - 打开 https://github.com/slideology/nanobananaimagetool
   - 点击 "Settings" 标签

2. **添加 Repository Secrets**
   - 在左侧菜单中点击 "Secrets and variables" → "Actions"
   - 点击 "New repository secret" 按钮

3. **添加以下两个 Secrets**

   **Secret 1: CLOUDFLARE_API_TOKEN**
   ```
   Name: CLOUDFLARE_API_TOKEN
   Value: [在第一步中获取的 API Token]
   ```

   **Secret 2: CLOUDFLARE_ACCOUNT_ID**
   ```
   Name: CLOUDFLARE_ACCOUNT_ID
   Value: [在第二步中获取的 Account ID]
   ```

## 第四步：验证配置

1. **推送更改**
   ```bash
   git add .
   git commit -m "feat: add GitHub Actions auto-deploy workflow"
   git push origin main
   ```

2. **检查部署状态**
   - 访问 GitHub 仓库的 "Actions" 标签
   - 查看最新的工作流运行状态
   - 如果配置正确，应该能看到部署成功

## 自动部署的工作流程

每次你推送代码到 main 分支时，GitHub Actions 会自动执行以下步骤：

1. ✅ 检出最新代码
2. ✅ 设置 Node.js 环境
3. ✅ 安装项目依赖
4. ✅ 构建项目
5. ✅ 运行数据库迁移
6. ✅ 部署到 Cloudflare Workers
7. ✅ 完成部署

## 故障排除

### 常见问题：

1. **API Token 权限不足**
   - 确保 Token 有 "Cloudflare Workers:Edit" 权限
   - 检查 Account Resources 是否包含正确的账户

2. **Account ID 错误**
   - 确认复制的 Account ID 是正确的
   - 在 Cloudflare Dashboard 右侧边栏中重新获取

3. **构建失败**
   - 检查 package.json 中的构建脚本
   - 确保所有依赖都在 package.json 中正确声明

4. **数据库迁移失败**
   - 确保 D1 数据库配置正确
   - 检查 wrangler.jsonc 中的数据库绑定

### 查看详细日志：

- 在 GitHub 仓库的 "Actions" 标签中点击失败的工作流
- 展开各个步骤查看详细的错误信息
- 根据错误信息调整配置

## 安全提醒

- ⚠️ 永远不要在代码中硬编码 API Token
- ⚠️ 定期轮换 API Token
- ⚠️ 只给 Token 必要的最小权限
- ⚠️ 如果怀疑 Token 泄露，立即撤销并重新生成

## 联系支持

如果遇到问题，可以：
1. 检查 Cloudflare Workers 文档
2. 查看 GitHub Actions 官方文档
3. 检查项目的 README.md 文件