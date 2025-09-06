# 🌐 域名迁移指南：从 Workers.dev 到 nanobananaimage.org

## 📋 迁移概述

**目标**: 将项目从 `https://nanobanana.slideology0816.workers.dev` 迁移到 `https://nanobananaimage.org`

**当前状况**: 
- ✅ `https://nanobananaimage.org` 目前指向 Cloudflare Pages (`nanobananaimage.pages.dev`)
- 🎯 需要将域名从 Pages 切换到 Workers 部署

**影响范围**: Cloudflare DNS配置、Workers自定义域名、代码配置、第三方服务集成

**预计工作量**: 1-2小时（主要是DNS切换和验证）

---

## 🔍 当前配置分析

### 主要域名配置位置
1. **Wrangler配置** (`wrangler.jsonc`) - 主要配置
2. **测试脚本** (`scripts/production-debug.mjs`) - 硬编码URL
3. **部署测试** (`test-deploy.sh`) - 硬编码URL
4. **OAuth配置** - Google Console需要更新回调URL

---

## 📝 详细迁移清单

### 🔧 第一步：核心配置文件更新

#### 1.1 更新 Wrangler 配置
**文件**: `wrangler.jsonc`

**当前配置**:
```json
{
  "vars": {
    "DOMAIN": "https://nanobanana.slideology0816.workers.dev",
    "CDN_URL": "https://pub-cb92e8dab89d452aadee075624e92b5a.r2.dev"
  }
}
```

**更新为**:
```json
{
  "vars": {
    "DOMAIN": "https://nanobananaimage.org",
    "CDN_URL": "https://pub-cb92e8dab89d452aadee075624e92b5a.r2.dev"
  },
  "routes": [
    {
      "pattern": "nanobananaimage.org",
      "custom_domain": true
    },
    {
      "pattern": "www.nanobananaimage.org",
      "custom_domain": true
    }
  ]
}
```

#### 1.2 添加自定义域名路由
需要取消注释并配置 `routes` 部分，启用自定义域名支持。

---



---

### ☁️ 第三步：Cloudflare 域名配置（关键步骤）

#### 3.1 从 Pages 切换到 Workers
**⚠️ 重要**: 由于域名当前指向 Pages，需要先解除 Pages 绑定

1. **登录 Cloudflare Dashboard**
2. **解除 Pages 域名绑定**:
   - 进入 `Cloudflare Pages` > `nanobananaimage` 项目
   - 在 `Custom domains` 中移除 `nanobananaimage.org` 绑定
   - 确认解除绑定

3. **配置 Workers 自定义域名**:
   ```bash
   # 添加域名到 Workers
   wrangler custom-domains add nanobananaimage.org
   wrangler custom-domains add www.nanobananaimage.org
   ```

#### 3.2 DNS 记录无需更改
**✅ 好消息**: 由于域名已经在 Cloudflare 管理下，DNS 记录会自动更新
- Cloudflare 会自动将域名从 Pages 路由切换到 Workers 路由
- 无需手动修改 DNS 记录

#### 3.3 验证域名切换
```bash
# 检查域名是否已切换到 Workers
wrangler custom-domains list

# 测试新的 Workers 部署
curl -I https://nanobananaimage.org
```

---

### 🔐 第四步：第三方服务配置更新

#### 4.1 Google OAuth 回调URL更新
**Google Cloud Console** - [console.cloud.google.com](https://console.cloud.google.com)

1. **导航到**: APIs & Services > Credentials
2. **选择您的 OAuth 2.0 客户端ID**
3. **更新授权的重定向URI**:
   - 移除: `https://nanobanana.slideology0816.workers.dev/api/auth`
   - 添加: `https://nanobananaimage.org/api/auth`
   - 可选添加: `https://www.nanobananaimage.org/api/auth`

#### 4.2 Kie AI Webhook URL更新
**API调用中的callBackUrl参数**:
- 当前: `https://nanobanana.slideology0816.workers.dev/api/webhooks/kie-image`
- 更新为: `https://nanobananaimage.org/api/webhooks/kie-image`

#### 4.3 Creem 支付回调URL更新
**Creem 控制台配置**:
- 更新 webhook 回调地址
- 当前: `https://nanobanana.slideology0816.workers.dev/api/webhooks/payment`
- 更新为: `https://nanobananaimage.org/api/webhooks/payment`

---

### 📄 第五步：文档和配置文件更新

#### 5.1 README.md 更新
搜索并替换所有对旧域名的引用：
```bash
# 查找所有引用
grep -r "slideology0816.workers.dev" .

# 批量替换（建议逐个确认）
find . -name "*.md" -exec sed -i 's/nanobanana\.slideology0816\.workers\.dev/nanobananaimage.org/g' {} \;
```

#### 5.2 其他可能需要更新的文件
- `CONFIG_CHECKLIST.md`
- `DEPLOY_GUIDE.md`
- 任何包含域名的配置或文档文件

---

## 🚀 部署步骤

### 步骤 1: 准备阶段
```bash
# 1. 备份当前配置
cp wrangler.jsonc wrangler.jsonc.backup
cp scripts/production-debug.mjs scripts/production-debug.mjs.backup
cp test-deploy.sh test-deploy.sh.backup

# 2. 确认当前 Pages 部署状态
# 3. 准备 Workers 部署
```

### 步骤 2: 更新 Workers 配置
```bash
# 建议使用 Git 分支进行更改
git checkout -b pages-to-workers-migration

# 更新 wrangler.jsonc 中的 DOMAIN
sed -i 's|"DOMAIN": "https://nanobanana.slideology0816.workers.dev"|"DOMAIN": "https://nanobananaimage.org"|g' wrangler.jsonc
```

### 步骤 3: 部署 Workers 到临时域名
```bash
# 先部署到 workers.dev 域名测试
pnpm run build
wrangler deploy

# 测试 Workers 功能正常
curl -I https://nanobanana.slideology0816.workers.dev
```

### 步骤 4: 切换域名绑定 (关键步骤)
```bash
# 4.1 从 Cloudflare Dashboard 解除 Pages 域名绑定
# (需要在网页上手动操作)

# 4.2 将域名绑定到 Workers
wrangler custom-domains add nanobananaimage.org
wrangler custom-domains add www.nanobananaimage.org

# 4.3 验证切换成功
wrangler custom-domains list
```

### 步骤 5: 验证和测试
```bash
# 测试新域名指向 Workers
curl -I https://nanobananaimage.org
curl -I https://www.nanobananaimage.org

# 测试关键功能
curl https://nanobananaimage.org/api/auth
```

### 步骤 6: 更新第三方服务
1. 更新 Google OAuth 配置
2. 更新 Creem 支付配置
3. 通知 Kie AI（如果需要白名单域名）

---

## ✅ 验证清单

### 技术验证
- [ ] 新域名可以正常访问
- [ ] HTTPS 证书正常
- [ ] 所有页面路由工作正常
- [ ] API 端点可以访问

### 功能验证
- [ ] Google OAuth 登录正常
- [ ] 图像生成功能正常
- [ ] 支付流程正常
- [ ] Webhook 回调正常

### 性能验证
- [ ] 页面加载速度正常
- [ ] CDN 资源加载正常
- [ ] 数据库连接正常

---

## 🔄 回滚计划

如果迁移过程中出现问题，可以快速回滚：

### 快速回滚步骤
```bash
# 1. 恢复配置文件
cp wrangler.jsonc.backup wrangler.jsonc
cp scripts/production-debug.mjs.backup scripts/production-debug.mjs
cp test-deploy.sh.backup test-deploy.sh

# 2. 重新部署
pnpm run build
wrangler deploy

# 3. 回滚第三方服务配置
# - 恢复 Google OAuth 回调URL
# - 恢复 Creem 支付回调URL
```

---

## 📋 具体执行命令

### 文件更新命令
```bash
# 1. 更新 wrangler.jsonc
sed -i 's|"DOMAIN": "https://nanobanana.slideology0816.workers.dev"|"DOMAIN": "https://nanobananaimage.org"|g' wrangler.jsonc

# 取消注释并配置 routes（需要手动编辑）
# 在 line 11-20 取消注释并更新域名


# 3. 批量更新文档（谨慎使用）
find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" -exec sed -i 's|nanobanana\.slideology0816\.workers\.dev|nanobananaimage.org|g' {} \;
```

### Cloudflare 命令
```bash
# 添加自定义域名
wrangler custom-domains add nanobananaimage.org
wrangler custom-domains add www.nanobananaimage.org

# 验证域名状态
wrangler custom-domains list

# 部署
wrangler deploy
```

---

## 🎯 针对您情况的简化执行计划

### 当前状态确认
- ✅ `nanobananaimage.org` 已指向 Cloudflare Pages
- ✅ 域名已在 Cloudflare 管理下
- 🎯 目标：切换到 Workers 部署

### 🚀 推荐执行顺序

#### 第1步：准备 Workers 部署
```bash
# 1. 更新配置文件
sed -i 's|"DOMAIN": "https://nanobanana.slideology0816.workers.dev"|"DOMAIN": "https://nanobananaimage.org"|g' wrangler.jsonc

# 2. 构建和部署到 workers.dev（测试）
pnpm run build
wrangler deploy

# 3. 测试 Workers 功能
curl -I https://nanobanana.slideology0816.workers.dev
```

#### 第2步：域名切换（关键操作）
```bash
# ⚠️ 在 Cloudflare Dashboard 手动操作：
# 1. Pages > nanobananaimage 项目 > Custom domains > 移除 nanobananaimage.org
# 2. 等待域名解除绑定（通常几分钟内完成）

# 3. 将域名绑定到 Workers
wrangler custom-domains add nanobananaimage.org
wrangler custom-domains add www.nanobananaimage.org
```

#### 第3步：验证和测试
```bash
# 验证域名绑定
wrangler custom-domains list

# 测试新部署
curl -I https://nanobananaimage.org
curl https://nanobananaimage.org/api/auth
```

### ⏰ 预计切换时间
- **准备阶段**: 10-15分钟
- **域名切换**: 2-5分钟（DNS传播）
- **验证测试**: 5-10分钟
- **总计**: 约20-30分钟

---

## ⚠️ 注意事项和风险

### 高风险事项（针对 Pages → Workers 切换）
1. **域名绑定冲突**: 确保完全解除 Pages 绑定后再绑定到 Workers
2. **OAuth 回调**: Google OAuth 配置可能需要更新（如果之前配置的是 Pages 地址）
3. **Webhook 回调**: 第三方服务回调失败会影响支付和AI生成
4. **短暂服务中断**: 域名切换期间可能有1-2分钟的服务中断

### 针对您情况的操作顺序
1. **✅ 域名已在 Cloudflare** - 无需 DNS 配置
2. **🔧 更新 Workers 配置** - 修改 DOMAIN 变量
3. **🚀 部署 Workers** - 先部署到 workers.dev 测试
4. **🔄 切换域名绑定** - 从 Pages 切换到 Workers
5. **✅ 验证功能** - 测试所有关键功能
6. **🔧 更新第三方服务** - 如果回调地址有变化

### 监控建议
- 部署后持续监控 24 小时
- 检查错误日志和用户反馈
- 准备快速回滚方案

---

## 🎯 迁移后的优化建议

### SEO 优化
1. **设置301重定向** (如果旧域名仍需支持)
2. **✅ sitemap.xml 自动更新** - 项目中的 sitemap 和 robots.txt 都是动态生成的，会自动使用新域名
3. **提交新域名到搜索引擎**

### 性能优化
1. **配置Cloudflare缓存规则**
2. **启用Cloudflare优化功能**
3. **监控新域名的性能指标**

### 安全设置
1. **启用HSTS**
2. **配置安全头**
3. **设置适当的CORS策略**

---

## 📞 支持和故障排除

### 常见问题
1. **域名不可访问**: 检查DNS配置和Cloudflare设置
2. **HTTPS证书问题**: 等待Cloudflare自动配置或手动触发
3. **OAuth登录失败**: 检查Google Console回调URL配置
4. **API调用失败**: 检查第三方服务的webhook配置

### 联系方式
- Cloudflare支持：通过Dashboard提交工单
- Google Cloud支持：查看Google Cloud Console文档
- 项目问题：查看GitHub Issues或项目文档

---

**⚠️ 重要提醒**:
1. 建议在非业务高峰期执行迁移
2. 提前通知用户可能的短暂服务中断
3. 准备回滚计划以应对意外情况
4. 确保所有团队成员了解迁移计划

---

---

## 📋 立即执行清单（Pages → Workers）

### ✅ 执行前检查
- [ ] 确认当前 `nanobananaimage.org` 指向 Pages
- [ ] 确认 Workers 项目代码最新
- [ ] 备份重要配置文件

### 🚀 执行步骤
```bash
# 1. 更新配置
sed -i 's|"DOMAIN": "https://nanobanana.slideology0816.workers.dev"|"DOMAIN": "https://nanobananaimage.org"|g' wrangler.jsonc

# 2. 部署测试
pnpm run build
wrangler deploy

# 3. 测试 Workers 功能
curl -I https://nanobanana.slideology0816.workers.dev
```

### 🔄 Cloudflare Dashboard 操作
1. **Pages 项目** → 移除自定义域名 `nanobananaimage.org`
2. **等待解除绑定完成**（1-2分钟）
3. **执行域名绑定**：
   ```bash
   wrangler custom-domains add nanobananaimage.org
   wrangler custom-domains add www.nanobananaimage.org
   ```

### ✅ 验证完成
- [ ] `curl -I https://nanobananaimage.org` 返回 Workers 响应
- [ ] 网站页面正常访问
- [ ] API 端点正常工作
- [ ] 登录功能正常（如果已配置 OAuth）

### 🆘 出现问题时
```bash
# 快速回滚：重新绑定到 Pages
wrangler custom-domains remove nanobananaimage.org
# 然后在 Cloudflare Dashboard 重新绑定到 Pages
```

---

*创建时间: 2024年12月*  
*针对 Pages → Workers 迁移场景优化*  
*最后更新: 迁移执行时请更新此文档*
