# 支付系统实施与部署指南

本文档总结了我们在最近两天内完成的支付系统实施工作，包括代码重构、配置调整以及针对测试环境的关键修复。

## 1.主要成就

### 核心功能
*   **新定价页面**：重构了 `/pricing` 页面，支持月付/年付/一次性购买三种模式。
*   **订阅支持**：实现了 `Basic`、`Pro`、`Ultra` 三种订阅计划的购买流程。
*   **支付集成**：通过 Creem 支付网关实现了完整的结账流程。

### 关键修复 (The "Big Fix")
我们解决了测试环境下支付失败（400 Bad Request）的核心问题：
1.  **环境隔离**：修复了后端代码错误地连接到 Creem 正式环境 API 的问题。现在的代码会优先检查 `CREEM_TEST_KEY`，确保测试环境正确连接 Creem Test API。
2.  **ID 适配**：由于 Cloudflare Workers 测试环境构建时 `PROD` 变量为 true，导致代码选择了（未配置的）正式环境商品 ID。我们调整了配置，确保在当前测试部署中强制使用 **测试环境商品 ID**。

---

## 2. 代码变更摘要

### 配置文件
*   **`wrangler.test.jsonc`**: 添加了 `CREEM_TEST_KEY` 环境变量。

### 核心逻辑
*   **`app/.server/libs/creem/index.ts`**:
    *   **Fix**: 修改 `createCreem` 工厂函数，使其能接收环境上下文 (`contextEnv`)。
*   **`app/routes/_api/create-order/route.ts`**:
    *   **Update**: 从请求中解析 `plan_id` 并传递给后端（用于订阅）。
    *   **Fix**: 从 `context.cloudflare.env` 获取环境变量并传递给 `createOrder`。
*   **`app/.server/constants/product.ts` & `pricing.ts`**:
    *   **Fix**: 临时将 Production 分支的商品 ID 替换为 **测试环境 ID**，以适配测试环境部署。

---

## 3. 部署与验证

### 部署命令
```bash
npm run build && npx wrangler deploy -c wrangler.test.jsonc
```

### 验证状态
*   ✅ **支付跳转**：点击购买按钮能正确跳转到 `checkout.creem.io`。
*   ✅ **订阅激活**：用户支付后，数据库 `subscriptions` 表正确生成 `active` 状态记录。
*   ✅ **订单记录**：`orders` 表正确记录交易详情。

---

## 4. ⚠️ 生产环境发布注意事项 (CRITICAL)

当您准备发布到**正式生产环境** (Production) 时，请务必执行以下步骤：

### Step 1: 准备正式数据
1.  登录 **Creem 后台**，切换到 **Live Mode (正式模式)**。
2.  创建与测试环境对应的 9 个商品（Basic/Pro/Ultra 的月付/年付/一次性）。
3.  获取正式环境的 **API Key** (`CREEM_KEY`)。

### Step 2: 恢复代码配置
打开 `app/.server/constants/product.ts` 和 `app/.server/constants/pricing.ts`：
*   找到 `import.meta.env.PROD ? "prod_xxx" : "prod_yyy"` 的逻辑。
*   将 `?` 后面的 ID 替换为 **真正的正式环境 ID**（目前是为了测试填写的测试 ID）。

### Step 3: 配置环境变量
在 Cloudflare Dashboard 或 `wrangler.json` (生产配置) 中：
*   添加 `CREEM_KEY`（填入正式 Key）。
*   添加 `CREEM_WEBHOOK_SECRET`（正式环境的 Webhook 密钥）。

### Step 4: 部署
```bash
npm run build && npx wrangler deploy
```
