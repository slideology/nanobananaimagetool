# Nano Banana 网站转换指南

## 📋 项目概述

本文档详细说明了将当前的 AI 图像生成工具转换为基于 "Nano Banana" 关键词的网站所需的文件修改清单。

### 当前项目状态
- **项目名称**: nanobananaimageqoder
- **主要功能**: AI 图像生成工具（文字生图、图片转图）
- **技术栈**: React Router v7 + Cloudflare Workers + TypeScript
- **品牌元素**: 目前以 "Nano Banana AI Image Generator" 为主题

## 🎯 转换目标

将网站转换为以 "Nano Banana" 为核心关键词的主题网站，需要更新品牌元素、内容描述、SEO 元数据等。

## 📁 文件修改清单

### 🔴 必须修改的文件

#### 1. 项目配置文件
- **`package.json`** 
  - 修改项目名称和描述
  - 更新关键词字段

- **`README.md`**
  - 更新项目标题和描述
  - 修改功能介绍文案
  - 更新项目特点说明

#### 2. 品牌和元数据文件
- **`app/utils/meta.ts`**
  - 更新默认 SEO 元数据
  - 修改网站标题和描述模板

- **`public/favicon.ico`**
  - 替换为 Nano Banana 主题的图标

- **`public/assets/logo.webp`**
  - 替换为 Nano Banana 主题的 Logo

#### 3. 主页面和路由文件
- **`app/routes/base/_index/route.tsx`**
  - 修改页面标题和 meta 描述
  - 更新 SEO 关键词

- **`app/routes/base/_index/config.ts`**
  - 更新页面内容配置
  - 修改功能描述文案

#### 4. Landing 页面组件
- **`app/components/pages/landing/hero.tsx`**
  - 修改主标题和副标题
  - 更新产品描述文案
  - 调整 CTA 按钮文案

- **`app/components/pages/landing/features.tsx`**
  - 更新功能特性描述
  - 修改功能标题和说明

- **`app/components/pages/landing/how-it-works.tsx`**
  - 更新使用流程说明
  - 修改步骤描述文案

- **`app/components/pages/landing/pricing.tsx`**
  - 更新定价方案描述
  - 修改套餐名称和说明

- **`app/components/pages/landing/testimonials.tsx`**
  - 更新用户评价内容
  - 修改推荐语文案

- **`app/components/pages/landing/faqs.tsx`**
  - 更新常见问题内容
  - 修改问答文案以符合 Nano Banana 主题

- **`app/components/pages/landing/cta.tsx`**
  - 更新行动号召文案
  - 修改按钮文字和描述

- **`app/components/pages/landing/alternating-content.tsx`**
  - 更新交替内容区域的文案
  - 修改产品介绍内容

#### 5. 图像生成器组件
- **`app/features/image_generator/index.tsx`**
  - 更新组件内的文案描述
  - 修改提示文字和说明
  - 调整用户界面文案

#### 6. 布局和导航组件
- **`app/features/layout/header.tsx`**
  - 更新网站标题
  - 修改导航菜单文案

- **`app/features/layout/footer.tsx`**
  - 更新版权信息
  - 修改公司/产品名称

#### 7. 法律页面
- **`app/routes/_legal/privacy/route.tsx`**
  - 更新隐私政策中的产品名称
  - 修改相关描述文案

- **`app/routes/_legal/terms/route.tsx`**
  - 更新服务条款中的产品名称
  - 修改相关法律文案

#### 8. 错误页面
- **`app/routes/base/404/route.tsx`**
  - 更新 404 页面文案
  - 修改错误提示信息

### 🟡 可能需要修改的文件

#### 1. 样式配置
- **`app/app.css`**
  - 根据 Nano Banana 主题调整颜色方案
  - 更新品牌色彩变量

- **`tailwind.config.js`**
  - 调整主题色彩配置
  - 更新设计系统变量

#### 2. 图片资源
- **`public/assets/` 目录下的所有图片**
  - 替换示例图片为 Nano Banana 主题
  - 更新产品截图和演示图片

#### 3. 邮件模板（如果存在）
- **邮件通知模板文件**
  - 更新邮件中的品牌名称
  - 修改邮件内容文案

### 🟢 无需修改的文件

#### 1. 核心功能代码
- **`app/.server/` 目录下的业务逻辑文件**
  - 数据库操作逻辑
  - API 接口实现
  - 认证和支付逻辑
  - 文件上传处理

#### 2. 工具和配置文件
- **`app/hooks/` 目录**
  - React Hooks 逻辑
  - 数据处理钩子

- **`app/utils/` 目录（除 meta.ts 外）**
  - 工具函数
  - 辅助方法

- **构建和部署配置**
  - `vite.config.ts`
  - `tsconfig.json`
  - `wrangler.jsonc`（除非需要更新域名）
  - `.github/workflows/`

#### 3. 数据库和 API
- **`migrations/` 目录**
  - 数据库迁移文件

- **`app/routes/_api/` 目录**
  - API 路由实现
  - 数据处理逻辑

- **`app/routes/_webhooks/` 目录**
  - Webhook 处理逻辑

#### 4. 测试文件
- **`test/` 目录**
  - 单元测试文件
  - 集成测试代码

- **`scripts/` 目录**
  - 监控和调试脚本
  - 数据库操作脚本

## 🎨 内容更新建议

### 主要文案方向
1. **突出 "Nano Banana" 品牌**
   - 将所有 "AI Image Generator" 替换为 "Nano Banana"
   - 强调 Nano Banana 的独特性和创新性

2. **保持功能描述的准确性**
   - 继续强调 AI 图像生成功能
   - 保持技术特性的描述

3. **优化 SEO 关键词**
   - 在标题和描述中自然融入 "Nano Banana"
   - 保持搜索引擎友好的内容结构

### 品牌色彩建议
- **主色调**: 香蕉黄 (#FFD700) 或温暖的黄色系
- **辅助色**: 绿色系（代表自然、新鲜）
- **强调色**: 橙色或红色（用于 CTA 按钮）

## 📋 实施步骤

### 第一阶段：核心品牌元素
1. 更新 Logo 和 Favicon
2. 修改主页标题和描述
3. 更新 README.md

### 第二阶段：页面内容
1. 修改 Landing 页面所有组件
2. 更新导航和布局组件
3. 调整法律页面内容

### 第三阶段：优化和完善
1. 更新样式和色彩方案
2. 替换相关图片资源
3. 测试所有页面和功能

### 第四阶段：SEO 优化
1. 更新所有页面的 meta 标签
2. 优化关键词分布
3. 检查搜索引擎友好性

## ⚠️ 注意事项

1. **保持功能完整性**: 在修改文案时，确保不影响现有功能
2. **测试充分性**: 每次修改后都要测试相关功能
3. **SEO 连续性**: 避免大幅改动可能影响搜索排名的关键元素
4. **用户体验**: 确保新的文案和设计提升而非降低用户体验
5. **品牌一致性**: 在所有页面和组件中保持 Nano Banana 品牌的一致性

## 📊 预估工作量

- **文案修改**: 2-3 天
- **设计元素更新**: 1-2 天
- **测试和优化**: 1-2 天
- **总计**: 4-7 天

---

**最后更新**: 2025年1月
**文档版本**: v1.0
**状态**: 待实施