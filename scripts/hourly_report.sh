#!/bin/bash
# ============================================================
# hourly_report.sh — NanoBanana 每小时用户数据统计脚本
# 使用方法：
#   1. 直接执行：bash scripts/hourly_report.sh
#   2. 每小时自动执行：通过 crontab 设置（见文件末尾说明）
# ============================================================

# ———— 配置区 ————
PROJECT_DIR="/Users/dahuang/CascadeProjects/tools/nanobananaimagetool"
WRANGLER_CONFIG="wrangler.jsonc"
DB_NAME="nanobanana"

# Slack Webhook URL（可选）
# 填入后，统计结果会自动发送到 Slack 频道
# 留空则只打印到终端
SLACK_WEBHOOK=""

# 日志文件路径（可选，留空则不写日志）
LOG_FILE="$PROJECT_DIR/scripts/report.log"
# ———— 配置区结束 ————


# ——— 工具函数 ———

# 切换到项目目录
cd "$PROJECT_DIR" || { echo "❌ 项目目录不存在: $PROJECT_DIR"; exit 1; }

# 统计时间
REPORT_TIME=$(date "+%Y-%m-%d %H:%M")

# 查询 D1 数据库，返回 count 数字
# 参数：$1 = SQL 语句
d1_count() {
  local sql="$1"
  local raw
  # 使用 wrangler d1 execute 的 --json 模式查询
  raw=$(npx wrangler d1 execute "$DB_NAME" \
    --command="$sql" \
    --json \
    -c "$WRANGLER_CONFIG" 2>/dev/null)
  # 从 JSON 结果中提取第一个数字
  echo "$raw" | grep -o '"[^"]*":[[:space:]]*[0-9]*' | head -1 | grep -o '[0-9]*$'
}

# 格式化数字（空则显示 0）
fmt() { echo "${1:-0}"; }


# ——— 执行查询 ———

echo "⏳ 正在查询数据..."

# 1. 新增用户数 — users 表中最近1小时创建的用户（含Google登录）
NEW_USERS=$(d1_count "SELECT COUNT(*) as count FROM users WHERE created_at >= strftime('%s', 'now', '-1 hours')")

# 2. 活跃用户数 — 最近1小时内有过登录行为的用户（去重）
ACTIVE_USERS=$(d1_count "SELECT COUNT(DISTINCT user_id) as count FROM signin_logs WHERE created_at >= strftime('%s', 'now', '-1 hours')")

# 3. 新增注册用户数 — 最近1小时内通过 OAuth 完成注册并绑定第三方账号的用户
NEW_REGISTERED=$(d1_count "SELECT COUNT(DISTINCT u.id) as count FROM users u INNER JOIN user_auth ua ON u.id = ua.user_id WHERE u.created_at >= strftime('%s', 'now', '-1 hours')")

# 4. 使用积分用户数 — 最近1小时内消耗过积分的用户（去重）
CREDIT_USERS=$(d1_count "SELECT COUNT(DISTINCT user_id) as count FROM credit_consumptions WHERE created_at >= strftime('%s', 'now', '-1 hours')")

# 5. 付费用户数 — 最近1小时内发起过付款（任意状态）的用户（去重）
PAID_USERS=$(d1_count "SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE created_at >= strftime('%s', 'now', '-1 hours')")

# 6. 付费成功用户数 — 最近1小时内订单状态为 completed 的用户（去重）
PAID_SUCCESS=$(d1_count "SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE status = 'completed' AND created_at >= strftime('%s', 'now', '-1 hours')")


# ——— 输出报告 ———

REPORT="
📊 NanoBanana 每小时数据报告
⏰ 统计时间：$REPORT_TIME（最近 1 小时）
══════════════════════════════

👤 新增用户数：       $(fmt $NEW_USERS)
🔥 活跃用户数：       $(fmt $ACTIVE_USERS)（有登录行为）
✅ 新增注册用户数：   $(fmt $NEW_REGISTERED)（已绑定 OAuth）
🪙 使用积分用户数：   $(fmt $CREDIT_USERS)
💳 付费用户数：       $(fmt $PAID_USERS)（发起付款）
🎉 付费成功用户数：   $(fmt $PAID_SUCCESS)（已完成付款）

══════════════════════════════
"

echo "$REPORT"

# ——— 写入日志文件 ———
if [ -n "$LOG_FILE" ]; then
  echo "$REPORT" >> "$LOG_FILE"
fi

# ——— 发送 Slack 通知（可选）———
if [ -n "$SLACK_WEBHOOK" ]; then
  SLACK_TEXT="*📊 NanoBanana 每小时数据报告（$REPORT_TIME）*\n\n"
  SLACK_TEXT+="👤 新增用户数：\`$(fmt $NEW_USERS)\`\n"
  SLACK_TEXT+="🔥 活跃用户数：\`$(fmt $ACTIVE_USERS)\`\n"
  SLACK_TEXT+="✅ 新增注册用户数：\`$(fmt $NEW_REGISTERED)\`\n"
  SLACK_TEXT+="🪙 使用积分用户数：\`$(fmt $CREDIT_USERS)\`\n"
  SLACK_TEXT+="💳 付费用户数：\`$(fmt $PAID_USERS)\`\n"
  SLACK_TEXT+="🎉 付费成功用户数：\`$(fmt $PAID_SUCCESS)\`"

  curl -s -X POST "$SLACK_WEBHOOK" \
    -H 'Content-type: application/json' \
    -d "{\"text\":\"$SLACK_TEXT\"}" \
    > /dev/null && echo "✅ Slack 通知已发送" || echo "⚠️ Slack 通知发送失败"
fi

# ============================================================
# crontab 配置说明（每小时整点执行）：
#
# 1. 打开 crontab 编辑器：
#    crontab -e
#
# 2. 添加以下一行（每小时整点执行，日志追加到 report.log）：
#    0 * * * * /bin/bash /Users/dahuang/CascadeProjects/tools/nanobananaimagetool/scripts/hourly_report.sh >> /Users/dahuang/CascadeProjects/tools/nanobananaimagetool/scripts/cron.log 2>&1
#
# 3. 保存退出后，用以下命令确认是否已添加成功：
#    crontab -l
# ============================================================
