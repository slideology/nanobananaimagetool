#!/bin/bash

# ===========================================
# Nano Banana 用户行为分析脚本
# 作者: AI助手
# 创建时间: 2025-01-08
# 功能: 深度分析用户行为模式和活跃度
# ===========================================

echo "======================================"
echo "  👤 用户行为分析报告"
echo "  📅 生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================"
echo ""

# 检查是否安装了wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ 错误: 未找到 wrangler 命令"
    echo "请先安装 Cloudflare Wrangler: npm install -g wrangler"
    exit 1
fi

echo "🏆 用户活跃度排行榜 (Top 10):"
echo "----------------------------------------"
wrangler d1 execute nanobanana --remote --command "SELECT u.nickname, u.email, COUNT(s.id) as login_times, MIN(datetime(s.created_at, 'unixepoch')) as first_login, MAX(datetime(s.created_at, 'unixepoch')) as last_login FROM users u LEFT JOIN signin_logs s ON u.id = s.user_id GROUP BY u.id ORDER BY login_times DESC LIMIT 10;" 2>/dev/null

echo ""
echo "🕐 登录时段分析 (24小时分布):"
echo "----------------------------------------"
wrangler d1 execute nanobanana --remote --command "SELECT strftime('%H', datetime(created_at, 'unixepoch')) as hour, COUNT(*) as login_count FROM signin_logs GROUP BY hour ORDER BY hour;" 2>/dev/null

echo ""
echo "🔐 登录方式统计:"
echo "----------------------------------------"
wrangler d1 execute nanobanana --remote --command "SELECT type, COUNT(*) as count FROM signin_logs GROUP BY type;" 2>/dev/null

echo ""
echo "🌍 登录IP地址统计 (Top 10):"
echo "----------------------------------------"
wrangler d1 execute nanobanana --remote --command "SELECT ip, COUNT(*) as login_count FROM signin_logs WHERE ip IS NOT NULL GROUP BY ip ORDER BY login_count DESC LIMIT 10;" 2>/dev/null

echo ""
echo "📊 用户留存分析:"
echo "----------------------------------------"
echo "显示用户注册时间、总登录次数和距离上次登录的天数"
wrangler d1 execute nanobanana --remote --command "SELECT u.id, u.nickname, DATE(datetime(u.created_at, 'unixepoch')) as registration_date, COUNT(s.id) as total_logins, CASE WHEN MAX(s.created_at) IS NULL THEN '从未登录' ELSE CAST(julianday('now') - julianday(datetime(MAX(s.created_at), 'unixepoch')) AS INTEGER) || ' 天前' END as last_login_days_ago FROM users u LEFT JOIN signin_logs s ON u.id = s.user_id GROUP BY u.id ORDER BY total_logins DESC;" 2>/dev/null

echo ""
echo "📈 每日注册趋势 (最近30天):"
echo "----------------------------------------"
wrangler d1 execute nanobanana --remote --command "SELECT DATE(datetime(created_at, 'unixepoch')) as registration_date, COUNT(*) as new_users FROM users WHERE created_at >= strftime('%s', 'now', '-30 days') GROUP BY DATE(datetime(created_at, 'unixepoch')) ORDER BY registration_date DESC;" 2>/dev/null

echo ""
echo "🎯 AI功能使用分析:"
echo "----------------------------------------"
echo "显示使用AI功能的用户统计"
wrangler d1 execute nanobanana --remote --command "SELECT u.nickname, COUNT(a.id) as ai_task_count, MIN(datetime(a.created_at, 'unixepoch')) as first_ai_use, MAX(datetime(a.created_at, 'unixepoch')) as last_ai_use FROM users u LEFT JOIN ai_tasks a ON u.id = a.user_id GROUP BY u.id HAVING ai_task_count > 0 ORDER BY ai_task_count DESC LIMIT 10;" 2>/dev/null

echo ""
echo "💰 付费用户分析:"
echo "----------------------------------------"
echo "显示有订单记录的用户信息"
wrangler d1 execute nanobanana --remote --command "SELECT u.nickname, u.email, COUNT(o.id) as order_count, MIN(datetime(o.created_at, 'unixepoch')) as first_order, MAX(datetime(o.created_at, 'unixepoch')) as last_order FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id HAVING order_count > 0 ORDER BY order_count DESC;" 2>/dev/null

echo ""
echo "⚠️ 风险用户识别:"
echo "----------------------------------------"
echo "显示注册后从未登录或长时间未活跃的用户"
wrangler d1 execute nanobanana --remote --command "SELECT u.id, u.nickname, u.email, DATE(datetime(u.created_at, 'unixepoch')) as registration_date, CASE WHEN s.user_id IS NULL THEN '从未登录' ELSE '已登录' END as login_status FROM users u LEFT JOIN signin_logs s ON u.id = s.user_id WHERE s.user_id IS NULL OR u.id NOT IN (SELECT DISTINCT user_id FROM signin_logs WHERE created_at >= strftime('%s', 'now', '-30 days')) GROUP BY u.id ORDER BY u.created_at DESC;" 2>/dev/null

echo ""
echo "✅ 分析报告生成完成！"
echo "💡 提示: 使用 './user_analysis.sh > analysis_$(date +%Y%m%d).txt' 可以保存分析结果到文件"
echo ""