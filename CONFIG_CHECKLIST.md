# 🔧 自动部署配置检查清单

完成以下所有步骤后，你的项目将支持自动部署功能。

## ✅ 已完成的配置

- [x] ✅ 项目已推送到 GitHub 仓库
- [x] ✅ GitHub Actions 工作流文件已创建 (`.github/workflows/deploy.yml`)
- [x] ✅ Wrangler 生产环境配置已完成 (`wrangler.jsonc`)
- [x] ✅ 项目文档已创建 (`README.md`, `DEPLOY_GUIDE.md`)

## ⏳ 待完成的配置

### 第1步：获取 Cloudflare API Token

请按以下步骤操作：

1. **登录 Cloudflare Dashboard**
   - 访问：https://dash.cloudflare.com/
   - 使用你的账户登录

2. **创建 API Token**
   - 点击右上角头像 → "My Profile"
   - 左侧菜单选择 "API Tokens"
   - 点击 "Create Token"
   - 选择 "Custom token"

3. **配置权限**
   ```
   Token name: GitHub Actions Deploy
   
   Permissions:
   - Account: Cloudflare Workers:Edit ✅
   - Zone: Zone:Read ✅
   
   Zone Resources:
   - Include: All zones ✅
   
   Account Resources:
   - Include: [你的账户] ✅
   
   IP Address Filtering:
   - 留空 ✅
   ```

4. **生成并保存 Token**
   - 点击 "Continue to summary"
   - 点击 "Create Token"
   - **复制 Token**（只显示一次！）

### 第2步：获取 Account ID

- 在 Cloudflare Dashboard 右侧边栏找到 "Account ID"
- 复制这个 ID

### 第3步：配置 GitHub Secrets

访问：https://github.com/slideology/nanobananaimagetool/settings/secrets/actions

添加以下两个 Repository Secrets：

1. **CLOUDFLARE_API_TOKEN**
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: [第1步获取的 API Token]

2. **CLOUDFLARE_ACCOUNT_ID**
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: [第2步获取的 Account ID]

## 🧪 第4步：测试配置

完成上述配置后，运行测试脚本：

```bash
./test-deploy.sh
```

或者手动测试：

```bash
# 1. 做一个小改动
echo "测试自动部署: $(date)" >> README.md

# 2. 提交并推送
git add .
git commit -m "test: verify auto deployment"
git push origin main

# 3. 查看部署状态
# 访问：https://github.com/slideology/nanobananaimagetool/actions
```

## 📊 验证部署成功

### GitHub Actions 状态

访问：https://github.com/slideology/nanobananaimagetool/actions

成功的工作流应该显示：
- ✅ Checkout code
- ✅ Setup Node.js
- ✅ Install dependencies
- ✅ Build project
- ✅ Run database migrations
- ✅ Deploy to Cloudflare Workers

### 应用访问

部署成功后，应用将在以下地址更新：
https://nanobanana.slideology0816.workers.dev

## 🚨 常见问题排除

### 1. API Token 权限错误
```
Error: Insufficient permissions
```
**解决方案**：确保 API Token 有 "Cloudflare Workers:Edit" 权限

### 2. Account ID 错误
```
Error: Account not found
```
**解决方案**：重新检查并复制正确的 Account ID

### 3. 构建失败
```
Error: Build failed
```
**解决方案**：
- 检查 `package.json` 中的构建脚本
- 确保所有依赖已正确安装
- 本地运行 `npm run build` 测试

### 4. 数据库迁移失败
```
Error: Database migration failed
```
**解决方案**：
- 检查 D1 数据库配置
- 确保数据库 ID 正确
- 本地运行 `npx wrangler d1 migrations apply nanobanana`

## 📞 获取帮助

如果遇到问题：

1. **查看详细日志**
   - GitHub Actions 页面 → 点击失败的工作流 → 展开错误步骤

2. **检查配置文件**
   - [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - 详细配置指南
   - [README.md](./README.md) - 项目文档

3. **验证本地环境**
   ```bash
   npm run build  # 测试构建
   npx wrangler deploy --dry-run  # 测试部署（不实际部署）
   ```

## 🎯 完成标志

当你看到以下情况时，说明自动部署配置成功：

- ✅ GitHub Actions 工作流运行成功（绿色对勾）
- ✅ 应用在 https://nanobanana.slideology0816.workers.dev 正常访问
- ✅ 每次推送代码到 main 分支都会自动部署
- ✅ 无需手动运行 `wrangler deploy` 命令

---

**🚀 一旦配置完成，你只需要：**
1. 编写代码
2. 提交到 Git：`git add . && git commit -m "feat: new feature"`
3. 推送到 GitHub：`git push origin main`
4. 自动部署完成！🎉