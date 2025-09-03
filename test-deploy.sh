#!/bin/bash

# 测试自动部署配置脚本
# 用于验证 GitHub Actions 自动部署是否配置正确

echo "🔧 开始测试自动部署配置..."

# 检查是否在 Git 仓库中
if [ ! -d ".git" ]; then
    echo "❌ 错误: 当前目录不是 Git 仓库"
    exit 1
fi

# 检查是否有远程仓库
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ -z "$REMOTE_URL" ]; then
    echo "❌ 错误: 没有配置远程仓库"
    exit 1
fi

echo "✅ Git 仓库检查通过"
echo "📍 远程仓库: $REMOTE_URL"

# 检查工作流文件是否存在
if [ ! -f ".github/workflows/deploy.yml" ]; then
    echo "❌ 错误: GitHub Actions 工作流文件不存在"
    echo "   请确保 .github/workflows/deploy.yml 文件存在"
    exit 1
fi

echo "✅ GitHub Actions 工作流文件存在"

# 检查 wrangler.jsonc 配置
if [ ! -f "wrangler.jsonc" ]; then
    echo "❌ 错误: wrangler.jsonc 配置文件不存在"
    exit 1
fi

echo "✅ Wrangler 配置文件存在"

# 检查 package.json 中的构建脚本
if ! grep -q '"build"' package.json; then
    echo "❌ 错误: package.json 中缺少 build 脚本"
    exit 1
fi

echo "✅ 构建脚本配置正确"

# 创建一个小的测试更改
echo "📝 创建测试提交..."

# 更新 README.md 添加测试时间戳
if [ -f "README.md" ]; then
    echo "" >> README.md
    echo "<!-- Last auto-deploy test: $(date) -->" >> README.md
    
    git add README.md
    git commit -m "test: trigger auto-deploy verification at $(date)"
    
    echo "📤 推送测试提交到 GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 测试提交成功推送！"
        echo ""
        echo "📋 下一步操作:"
        echo "1. 访问 GitHub Actions 页面查看部署状态:"
        echo "   https://github.com/slideology/nanobananaimagetool/actions"
        echo ""
        echo "2. 如果看到工作流运行失败，可能的原因:"
        echo "   - Cloudflare API Token 未正确配置"
        echo "   - Account ID 不正确"
        echo "   - API Token 权限不足"
        echo ""
        echo "3. 检查 GitHub Secrets 配置:"
        echo "   https://github.com/slideology/nanobananaimagetool/settings/secrets/actions"
        echo ""
        echo "4. 需要配置的 Secrets:"
        echo "   - CLOUDFLARE_API_TOKEN: [从 Cloudflare Dashboard 获取]"
        echo "   - CLOUDFLARE_ACCOUNT_ID: [从 Cloudflare Dashboard 获取]"
        echo ""
        echo "🔍 如果部署成功，你的应用将在以下地址更新:"
        echo "   https://nanobanana.slideology0816.workers.dev"
    else
        echo "❌ 推送失败，请检查 Git 配置"
        exit 1
    fi
else
    echo "❌ 错误: README.md 文件不存在"
    exit 1
fi

echo ""
echo "✨ 自动部署测试完成！"