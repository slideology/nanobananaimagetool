#!/bin/bash

# Nano Banana AI Image Generator - Cloudflare 部署脚本
# 使用方法: ./deploy.sh [production|development]

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取环境参数
ENVIRONMENT=${1:-development}

echo -e "${BLUE}🚀 开始部署 Nano Banana AI Image Generator 到 Cloudflare Workers${NC}"
echo -e "${BLUE}📦 目标环境: ${ENVIRONMENT}${NC}"
echo ""

# 检查必要工具
echo -e "${YELLOW}🔍 检查必要工具...${NC}"
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI 未安装${NC}"
    echo -e "${YELLOW}请运行: npm install -g wrangler${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm 未安装${NC}"
    echo -e "${YELLOW}请运行: npm install -g pnpm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 工具检查完成${NC}"

# 检查登录状态
echo -e "${YELLOW}🔑 检查 Cloudflare 登录状态...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 请登录 Cloudflare...${NC}"
    wrangler login
fi
echo -e "${GREEN}✅ Cloudflare 已登录${NC}"

# 安装依赖
echo -e "${YELLOW}📦 安装项目依赖...${NC}"
pnpm install
echo -e "${GREEN}✅ 依赖安装完成${NC}"

# 创建Cloudflare资源 (仅首次部署时)
create_resources() {
    echo -e "${YELLOW}🏗️  创建 Cloudflare 资源...${NC}"
    
    # 创建D1数据库
    if [[ $ENVIRONMENT == "production" ]]; then
        DB_NAME="nanobanana"
        KV_NAME="NanoBanana"
        R2_NAME="nanobanan-images-prod"
    else
        DB_NAME="nanobanana-dev"
        KV_NAME="NanoBanana-dev"
        R2_NAME="nanobanan-images-dev"
    fi
    
    echo -e "${BLUE}Creating D1 database: ${DB_NAME}${NC}"
    wrangler d1 create $DB_NAME || echo "Database might already exist"
    
    echo -e "${BLUE}Creating KV namespace: ${KV_NAME}${NC}"
    wrangler kv:namespace create $KV_NAME || echo "KV namespace might already exist"
    
    echo -e "${BLUE}Creating R2 bucket: ${R2_NAME}${NC}"
    wrangler r2 bucket create $R2_NAME || echo "R2 bucket might already exist"
    
    echo -e "${GREEN}✅ Cloudflare 资源创建完成${NC}"
}

# 设置环境变量
setup_secrets() {
    echo -e "${YELLOW}🔐 设置环境变量和密钥...${NC}"
    
    # 检查是否已设置密钥
    echo -e "${BLUE}检查必要的环境变量...${NC}"
    
    # 提示用户设置密钥
    echo -e "${YELLOW}请确保已设置以下密钥 (如果尚未设置):${NC}"
    echo -e "${BLUE}wrangler secret put KIEAI_APIKEY --env $ENVIRONMENT${NC}"
    echo -e "${BLUE}wrangler secret put GOOGLE_CLIENT_ID --env $ENVIRONMENT${NC}"
    echo -e "${BLUE}wrangler secret put GOOGLE_CLIENT_SECRET --env $ENVIRONMENT${NC}"
    echo -e "${BLUE}wrangler secret put CREEM_KEY --env $ENVIRONMENT${NC}"
    echo -e "${BLUE}wrangler secret put CREEM_WEBHOOK_SECRET --env $ENVIRONMENT${NC}"
    echo -e "${BLUE}wrangler secret put SESSION_SECRET --env $ENVIRONMENT${NC}"
    echo ""
    
    read -p "是否需要现在设置这些密钥? (y/N): " setup_now
    if [[ $setup_now =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}设置 KIEAI_APIKEY:${NC}"
        wrangler secret put KIEAI_APIKEY --env $ENVIRONMENT
        
        echo -e "${YELLOW}设置 GOOGLE_CLIENT_ID:${NC}"
        wrangler secret put GOOGLE_CLIENT_ID --env $ENVIRONMENT
        
        echo -e "${YELLOW}设置 GOOGLE_CLIENT_SECRET:${NC}"
        wrangler secret put GOOGLE_CLIENT_SECRET --env $ENVIRONMENT
        
        echo -e "${YELLOW}设置 CREEM_KEY:${NC}"
        wrangler secret put CREEM_KEY --env $ENVIRONMENT
        
        echo -e "${YELLOW}设置 CREEM_WEBHOOK_SECRET:${NC}"
        wrangler secret put CREEM_WEBHOOK_SECRET --env $ENVIRONMENT
        
        echo -e "${YELLOW}设置 SESSION_SECRET (建议使用32位随机字符串):${NC}"
        wrangler secret put SESSION_SECRET --env $ENVIRONMENT
    fi
    
    echo -e "${GREEN}✅ 环境变量设置完成${NC}"
}

# 数据库迁移
run_migrations() {
    echo -e "${YELLOW}🗄️  执行数据库迁移...${NC}"
    
    # 生成迁移文件
    pnpm run db:generate
    
    # 执行迁移
    if [[ $ENVIRONMENT == "production" ]]; then
        wrangler d1 migrations apply nanobanana --env production
    else
        wrangler d1 migrations apply nanobanana-dev --env development
    fi
    
    echo -e "${GREEN}✅ 数据库迁移完成${NC}"
}

# 构建和部署
deploy_app() {
    echo -e "${YELLOW}🏗️  构建应用...${NC}"
    
    # TypeScript 类型检查
    pnpm run typecheck
    
    # 运行测试
    echo -e "${YELLOW}🧪 运行测试...${NC}"
    pnpm run test:run
    
    # 构建应用
    pnpm run build
    
    echo -e "${YELLOW}🚀 部署到 Cloudflare Workers...${NC}"
    wrangler deploy --env $ENVIRONMENT
    
    echo -e "${GREEN}✅ 应用部署完成${NC}"
}

# 部署后验证
verify_deployment() {
    echo -e "${YELLOW}✅ 验证部署...${NC}"
    
    # 获取部署URL
    if [[ $ENVIRONMENT == "production" ]]; then
        APP_URL="https://nanobananaimageqoder-prod.your-subdomain.workers.dev"
    else
        APP_URL="https://nanobananaimageqoder-dev.your-subdomain.workers.dev"
    fi
    
    echo -e "${BLUE}应用URL: ${APP_URL}${NC}"
    
    # 健康检查
    echo -e "${YELLOW}执行健康检查...${NC}"
    if curl -f "${APP_URL}/health" &> /dev/null; then
        echo -e "${GREEN}✅ 健康检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️  健康检查失败，可能需要几分钟才能完全启动${NC}"
    fi
}

# 主要部署流程
main() {
    echo -e "${YELLOW}开始部署流程...${NC}"
    
    # 询问是否首次部署
    read -p "这是首次部署吗? (需要创建 Cloudflare 资源) (y/N): " first_deploy
    
    if [[ $first_deploy =~ ^[Yy]$ ]]; then
        create_resources
    fi
    
    setup_secrets
    run_migrations
    deploy_app
    verify_deployment
    
    echo ""
    echo -e "${GREEN}🎉 部署完成!${NC}"
    echo -e "${BLUE}应用已成功部署到 Cloudflare Workers${NC}"
    echo ""
    echo -e "${YELLOW}📋 后续步骤:${NC}"
    echo -e "1. 访问应用并测试功能"
    echo -e "2. 配置自定义域名 (可选)"
    echo -e "3. 设置监控和告警"
    echo -e "4. 查看日志: ${BLUE}wrangler tail --env $ENVIRONMENT${NC}"
    echo ""
}

# 执行主函数
main