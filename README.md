# Nano Banana AI 图像生成工具

一个基于 React Router v7 和 Cloudflare Workers 的现代化 AI 图像生成应用，支持文字生图和图片转图功能。

## 🚀 项目特点

- **现代化技术栈**：React 19 + React Router v7 + TypeScript
- **无服务器架构**：Cloudflare Workers + D1 数据库 + R2 存储
- **AI 图像生成**：集成 Kie AI API，支持多种生成模式
- **用户认证**：Google OAuth 登录系统
- **积分系统**：完整的用户积分管理和支付功能
- **响应式设计**：DaisyUI + Tailwind CSS 现代 UI
- **自动部署**：GitHub Actions 持续集成/部署

## 🛠 技术架构

### 前端技术
- **React 19.1.1** - 最新的 React 框架
- **React Router v7.8.2** - 全栈路由解决方案
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS** - 实用优先的 CSS 框架
- **DaisyUI** - 基于 Tailwind 的组件库
- **Vite** - 快速的构建工具

### 后端技术
- **Cloudflare Workers** - 边缘计算平台
- **D1 Database** - 基于 SQLite 的分布式数据库
- **R2 Object Storage** - 对象存储服务
- **KV Store** - 键值存储服务
- **Drizzle ORM** - 类型安全的数据库 ORM

### AI 和认证
- **Kie AI API** - AI 图像生成服务
- **Google OAuth** - 用户认证系统
- **Web Crypto API** - 安全的会话管理

## 📁 项目结构

```
nanobananaimageqoder/
├── app/                          # React Router v7 应用代码
│   ├── .server/                  # 服务端代码
│   │   ├── drizzle/             # 数据库 ORM 和迁移
│   │   ├── libs/                # 第三方库集成
│   │   ├── services/            # 业务逻辑服务
│   │   └── utils/               # 工具函数
│   ├── components/              # React 组件
│   ├── routes/                  # 路由和页面
│   └── styles/                  # 样式文件
├── workers/                     # Cloudflare Workers 入口
├── .github/workflows/           # GitHub Actions 工作流
├── wrangler.jsonc              # Cloudflare Workers 配置
└── package.json                # 项目依赖配置
```

## 🔧 本地开发

### 环境要求
- Node.js 18+ 
- npm 或 yarn
- Cloudflare 账户

### 安装依赖
```bash
npm install
```

### 环境配置
1. 复制环境配置文件
2. 配置必要的 API 密钥：
   - `GOOGLE_CLIENT_ID` - Google OAuth 客户端 ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth 客户端密钥
   - `KIEAI_APIKEY` - Kie AI API 密钥
   - `SESSION_SECRET` - 会话加密密钥
   - `CREEM_KEY` - 支付系统密钥

### 数据库设置
```bash
# 创建数据库
npx wrangler d1 create nanobanana

# 运行迁移
npx wrangler d1 migrations apply nanobanana --local
```

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3004 查看应用

## 🚀 部署

### 自动部署
项目配置了 GitHub Actions 自动部署，推送到 main 分支即可自动部署到生产环境。

详细配置请查看 [部署指南](./DEPLOY_GUIDE.md)

### 手动部署
```bash
# 构建项目
npm run build

# 部署到 Cloudflare Workers
npx wrangler deploy
```

## 🔑 环境变量配置

### 必需的密钥（使用 wrangler secret put 设置）
```
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put KIEAI_APIKEY
wrangler secret put SESSION_SECRET
wrangler secret put CREEM_KEY
wrangler secret put CREEM_WEBHOOK_SECRET
```

### 公开变量（在 wrangler.jsonc 中配置）
- `INITLIZE_CREDITS` - 新用户初始积分
- `DOMAIN` - 应用域名
- `CDN_URL` - CDN 地址
- `GOOGLE_ANALYTICS_ID` - Google Analytics ID
- `GOOGLE_ADS_ID` - Google Ads ID

## 📱 功能特性

### 图像生成模式
1. **文字生图（Text-to-Image）**
   - 支持详细的提示词描述
   - 多种艺术风格选择
   - 可调节图像尺寸和质量

2. **图片转图（Image-to-Image）**
   - 上传参考图片
   - 基于图片内容生成新图像
   - 支持风格转换

### 用户系统
- Google OAuth 一键登录
- 用户积分管理
- 生成历史记录
- 个人设置页面

### 支付系统
- 集成 Creem 支付平台
- 积分充值功能
- 交易记录查询

## 🔒 安全特性

- HTTPS 强制加密
- CSRF 防护
- 会话管理安全
- API 密钥安全存储
- 图片上传安全检查

## 📊 性能优化

- 边缘计算部署
- 图片 CDN 加速
- 数据库连接池
- 缓存策略优化
- 懒加载组件

## 🐛 故障排除

### 常见问题

1. **React Router Context 错误**
   ```bash
   rm -rf .react-router build node_modules/.cache
   npm install
   ```

2. **Cloudflare Workers 全局作用域错误**
   - 检查是否在全局使用了浏览器 API
   - 确保 setInterval/setTimeout 在函数内使用

3. **HMAC 密钥错误**
   - 确保 SESSION_SECRET 已正确设置
   - 使用 `wrangler secret put SESSION_SECRET`

### 日志查看
```
# 查看 Workers 日志
npx wrangler tail

# 查看本地开发日志
npm run dev
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 更新日志

### v1.0.0 (2024-01-XX)
- 初始版本发布
- 基础图像生成功能
- 用户认证系统
- 积分和支付系统

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [React Router v7 文档](https://reactrouter.com/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Kie AI 文档](https://www.kie.ai/)

## 📞 联系支持

如果遇到问题或需要帮助，请：
1. 查看项目文档
2. 创建 GitHub Issue
3. 查看 [部署指南](./DEPLOY_GUIDE.md)

---

**注意**：这是一个生产级别的应用，请确保在部署前正确配置所有必需的环境变量和密钥。
