#!/bin/bash

# ===========================================
# Nano Banana 近7天注册用户使用与付费报告
# 作者: AI助手
# 功能: 输出近7天注册用户的邮箱、注册时间、积分余额、AI使用次数、付费次数、付费金额、付费成功次数
# 依赖: Cloudflare Wrangler 已登录且可访问 D1（数据库名称: nanobanana）
# ===========================================

set -e

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if ! command -v wrangler &> /dev/null; then
  echo -e "${RED}❌ 错误: 未找到 wrangler 命令${NC}"
  echo "请先安装 Cloudflare Wrangler: npm install -g wrangler"
  exit 1
fi

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  📋 近7天注册用户使用与付费报告${NC}"
echo -e "${BLUE}======================================${NC}"
echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "说明: 仅包含近7天注册的用户；统计窗口为近7天。"
echo ""

SQL="
WITH recent_users AS (
  SELECT id AS user_id,
         email,
         datetime(created_at, 'unixepoch') AS registered_at,
         created_at
  FROM users
  WHERE created_at >= strftime('%s', 'now', '-7 days')
),
credit_balance AS (
  SELECT user_id,
         COALESCE(SUM(remaining_credits), 0) AS credits_balance
  FROM credit_records
  GROUP BY user_id
),
ai_usage AS (
  SELECT user_id,
         COUNT(*) AS ai_uses_7d
  FROM ai_tasks
  WHERE created_at >= strftime('%s', 'now', '-7 days')
  GROUP BY user_id
),
order_stats AS (
  SELECT user_id,
         COUNT(*) AS orders_7d,
         COALESCE(SUM(amount), 0) AS orders_amount_7d,
         SUM(CASE WHEN status IN ('paid','completed') THEN 1 ELSE 0 END) AS orders_success_7d
  FROM orders
  WHERE created_at >= strftime('%s', 'now', '-7 days')
  GROUP BY user_id
)
SELECT r.email                                    AS email,
       r.registered_at                             AS registered_time,
       COALESCE(cb.credits_balance, 0)            AS credits_balance,
       COALESCE(au.ai_uses_7d, 0)                 AS ai_uses_7d,
       COALESCE(os.orders_7d, 0)                  AS pay_count_7d,
       COALESCE(os.orders_amount_7d, 0)           AS pay_amount_7d,
       COALESCE(os.orders_success_7d, 0)          AS pay_success_7d
FROM recent_users r
LEFT JOIN credit_balance cb ON cb.user_id = r.user_id
LEFT JOIN ai_usage au       ON au.user_id = r.user_id
LEFT JOIN order_stats os    ON os.user_id = r.user_id
ORDER BY r.created_at DESC;
"

# 执行查询
wrangler d1 execute nanobanana --remote --command "$SQL" 2>/dev/null || {
  echo -e "${RED}❌ 查询执行失败${NC}"
  exit 1
}

echo ""
echo -e "${GREEN}✅ 完成${NC}"



