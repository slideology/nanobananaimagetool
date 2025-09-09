#!/bin/bash

# ===========================================
# Nano Banana 每日数据报告脚本
# 作者: AI助手
# 创建时间: 2025-01-08
# 功能: 生成平台核心数据的每日报告
# ===========================================

echo "======================================"
echo "  🍌 Nano Banana 每日数据报告"
echo "  📅 生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================"
echo ""

# 检查是否安装了wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ 错误: 未找到 wrangler 命令"
    echo "请先安装 Cloudflare Wrangler: npm install -g wrangler"
    exit 1
fi

echo "📊 核心指标:"
echo "----------------------------------------"

# 注册用户总数
echo -n "👥 注册用户总数: "
USER_COUNT=$(wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) FROM users;" 2>/dev/null | grep -E '^│.*│$' | tail -1 | sed 's/│//g' | xargs)
echo "${USER_COUNT:-0}"

# 总登录次数
echo -n "🔐 总登录次数: "
LOGIN_COUNT=$(wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) FROM signin_logs;" 2>/dev/null | grep -E '^│.*│$' | tail -1 | sed 's/│//g' | xargs)
echo "${LOGIN_COUNT:-0}"

# AI任务总数
echo -n "🤖 AI任务总数: "
AI_TASK_COUNT=$(wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) FROM ai_tasks;" 2>/dev/null | grep -E '^│.*│$' | tail -1 | sed 's/│//g' | xargs)
echo "${AI_TASK_COUNT:-0}"

# 订单总数
echo -n "💰 订单总数: "
ORDER_COUNT=$(wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) FROM orders;" 2>/dev/null | grep -E '^│.*│$' | tail -1 | sed 's/│//g' | xargs)
echo "${ORDER_COUNT:-0}"

echo ""
echo "📈 过去7天登录统计:"
echo "----------------------------------------"
wrangler d1 execute nanobanana --remote --command "SELECT DATE(datetime(created_at, 'unixepoch')) as login_date, COUNT(*) as login_count FROM signin_logs WHERE created_at >= strftime('%s', 'now', '-7 days') GROUP BY DATE(datetime(created_at, 'unixepoch')) ORDER BY login_date DESC;" 2>/dev/null

echo ""
echo "👥 活跃用户统计:"
echo "----------------------------------------"

# 周活跃用户
echo -n "📅 周活跃用户 (7天): "
WEEKLY_ACTIVE=$(wrangler d1 execute nanobanana --remote --command "SELECT COUNT(DISTINCT user_id) FROM signin_logs WHERE created_at >= strftime('%s', 'now', '-7 days');" 2>/dev/null | grep -E '^│.*│$' | tail -1 | sed 's/│//g' | xargs)
echo "${WEEKLY_ACTIVE:-0}"

# 月活跃用户
echo -n "📅 月活跃用户 (30天): "
MONTHLY_ACTIVE=$(wrangler d1 execute nanobanana --remote --command "SELECT COUNT(DISTINCT user_id) FROM signin_logs WHERE created_at >= strftime('%s', 'now', '-30 days');" 2>/dev/null | grep -E '^│.*│$' | tail -1 | sed 's/│//g' | xargs)
echo "${MONTHLY_ACTIVE:-0}"

echo ""
echo "🔄 用户转化漏斗:"
echo "----------------------------------------"
echo "注册用户 → 登录用户 → AI使用用户 → 付费用户"
wrangler d1 execute nanobanana --remote --command "SELECT (SELECT COUNT(*) FROM users) as registered_users, (SELECT COUNT(DISTINCT user_id) FROM signin_logs) as login_users, (SELECT COUNT(DISTINCT user_id) FROM ai_tasks) as ai_users, (SELECT COUNT(DISTINCT user_id) FROM orders) as paying_users;" 2>/dev/null

echo ""
echo "✅ 报告生成完成！"
echo "💡 提示: 使用 './daily_report.sh > report_$(date +%Y%m%d).txt' 可以保存报告到文件"
echo ""