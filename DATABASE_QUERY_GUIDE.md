# 🗃️ Nano Banana 数据库查询指南

> **作者**: AI助手  
> **创建时间**: 2025-01-08  
> **项目**: Nano Banana AI 图像生成平台  
> **数据库**: Cloudflare D1 (SQLite)

## 📖 目录

1. [快速开始](#快速开始)
2. [核心数据查询](#核心数据查询)
3. [用户数据分析](#用户数据分析)
4. [登录活动监控](#登录活动监控)
5. [业务数据统计](#业务数据统计)
6. [数据库结构查询](#数据库结构查询)
7. [高级分析查询](#高级分析查询)
8. [自动化脚本](#自动化脚本)
9. [常用技巧](#常用技巧)

---

## 🚀 快速开始

### 基本命令格式
```bash
# 查询生产环境数据库
wrangler d1 execute nanobanana --remote --command "SQL_QUERY"

# 查询本地开发数据库
wrangler d1 execute nanobanana --command "SQL_QUERY"
```

### 重要说明
- `--remote` 参数用于操作生产环境数据库
- 不加 `--remote` 则操作本地开发数据库
- SQL 查询语句需要用双引号包围
- 时间戳存储为 Unix 时间戳，需要用 `datetime()` 函数转换

---

## 📊 核心数据查询

### 1. 注册用户总数
```bash
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) as total_users FROM users;"
```
**作用**: 统计平台注册用户总数，了解用户规模

**示例输出**:
```
┌─────────────┐
│ total_users │
├─────────────┤
│ 2           │
└─────────────┘
```

### 2. 总登录次数
```bash
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) as total_logins FROM signin_logs;"
```
**作用**: 统计所有登录记录，反映用户活跃度

**示例输出**:
```
┌──────────────┐
│ total_logins │
├──────────────┤
│ 9            │
└──────────────┘
```

### 3. 活跃天数统计
```bash
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(DISTINCT DATE(datetime(created_at, 'unixepoch'))) as active_days FROM signin_logs;"
```
**作用**: 计算有登录记录的不同日期数量

### 4. 活跃时间范围
```bash
wrangler d1 execute nanobanana --remote --command "SELECT MIN(datetime(created_at, 'unixepoch')) as first_activity, MAX(datetime(created_at, 'unixepoch')) as last_activity FROM signin_logs;"
```
**作用**: 查看平台最早和最近的活动时间

---

## 👥 用户数据分析

### 5. 用户详细信息
```bash
wrangler d1 execute nanobanana --remote --command "SELECT id, email, nickname, datetime(created_at, 'unixepoch') as registration_date FROM users ORDER BY created_at DESC;"
```
**作用**: 获取所有用户的详细信息和注册时间

**示例输出**:
```
┌────┬──────────────────────────┬────────────┬─────────────────────┐
│ id │ email                    │ nickname   │ registration_date   │
├────┼──────────────────────────┼────────────┼─────────────────────┤
│ 2  │ hyny52011@gmail.com      │ 黄宁       │ 2025-09-04 09:55:12 │
│ 1  │ slideology0816@gmail.com │ slideology │ 2025-09-03 09:21:36 │
└────┴──────────────────────────┴────────────┴─────────────────────┘
```

### 6. 用户注册趋势
```bash
wrangler d1 execute nanobanana --remote --command "SELECT DATE(datetime(created_at, 'unixepoch')) as registration_date, COUNT(*) as new_users FROM users GROUP BY DATE(datetime(created_at, 'unixepoch')) ORDER BY registration_date DESC;"
```
**作用**: 分析每日新用户注册趋势

### 7. 用户活跃度排行
```bash
wrangler d1 execute nanobanana --remote --command "SELECT u.nickname, u.email, COUNT(s.id) as login_times, MIN(datetime(s.created_at, 'unixepoch')) as first_login, MAX(datetime(s.created_at, 'unixepoch')) as last_login FROM users u LEFT JOIN signin_logs s ON u.id = s.user_id GROUP BY u.id ORDER BY login_times DESC;"
```
**作用**: 分析每个用户的登录频率和活跃时间段

---

## 🔐 登录活动监控

### 8. 每日登录统计
```bash
wrangler d1 execute nanobanana --remote --command "SELECT DATE(datetime(created_at, 'unixepoch')) as login_date, COUNT(*) as login_count FROM signin_logs GROUP BY DATE(datetime(created_at, 'unixepoch')) ORDER BY login_date DESC;"
```
**作用**: 分析每日用户活跃度变化

**示例输出**:
```
┌────────────┬─────────────┐
│ login_date │ login_count │
├────────────┼─────────────┤
│ 2025-09-05 │ 3           │
│ 2025-09-04 │ 4           │
│ 2025-09-03 │ 2           │
└────────────┴─────────────┘
```

### 9. 最近登录记录
```bash
wrangler d1 execute nanobanana --remote --command "SELECT user_id, type, datetime(created_at, 'unixepoch') as login_time, ip FROM signin_logs ORDER BY created_at DESC LIMIT 10;"
```
**作用**: 查看最新的登录活动，监控用户行为和安全性

### 10. 登录方式统计
```bash
wrangler d1 execute nanobanana --remote --command "SELECT type, COUNT(*) as count FROM signin_logs GROUP BY type;"
```
**作用**: 了解用户偏好的登录方式（如Google OAuth）

### 11. IP地址统计
```bash
wrangler d1 execute nanobanana --remote --command "SELECT ip, COUNT(*) as login_count FROM signin_logs WHERE ip IS NOT NULL GROUP BY ip ORDER BY login_count DESC;"
```
**作用**: 分析登录来源IP，检测异常登录

### 12. 按小时统计登录活跃度
```bash
wrangler d1 execute nanobanana --remote --command "SELECT strftime('%H', datetime(created_at, 'unixepoch')) as hour, COUNT(*) as login_count FROM signin_logs GROUP BY hour ORDER BY hour;"
```
**作用**: 分析用户在一天中的活跃时段

---

## 💰 业务数据统计

### 13. AI任务使用统计
```bash
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) as total_ai_tasks FROM ai_tasks;"
```
**作用**: 统计用户使用AI功能的总次数

### 14. AI任务详细统计
```bash
wrangler d1 execute nanobanana --remote --command "SELECT DATE(datetime(created_at, 'unixepoch')) as task_date, COUNT(*) as task_count FROM ai_tasks GROUP BY DATE(datetime(created_at, 'unixepoch')) ORDER BY task_date DESC;"
```
**作用**: 按日期统计AI任务使用情况

### 15. 积分消费统计
```bash
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) as total_consumptions, SUM(credits) as total_credits_used FROM credit_consumptions;"
```
**作用**: 了解平台的积分使用情况

### 16. 积分记录统计
```bash
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) as total_credit_records FROM credit_records;"
```
**作用**: 统计积分充值和赠送记录

### 17. 订单统计
```bash
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) as total_orders FROM orders;"
```
**作用**: 统计付费订单数量，分析商业转化率

### 18. 订单详细统计
```bash
wrangler d1 execute nanobanana --remote --command "SELECT status, COUNT(*) as order_count FROM orders GROUP BY status;"
```
**作用**: 按状态统计订单情况

---

## 🗄️ 数据库结构查询

### 19. 查看所有数据表
```bash
wrangler d1 execute nanobanana --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```
**作用**: 了解数据库中有哪些数据表

**示例输出**:
```
┌─────────────────────┐
│ name                │
├─────────────────────┤
│ users               │
│ ai_tasks            │
│ credit_consumptions │
│ credit_records      │
│ orders              │
│ subscriptions       │
│ user_auth           │
│ signin_logs         │
└─────────────────────┘
```

### 20. 查看表结构
```bash
# 查看用户表结构
wrangler d1 execute nanobanana --remote --command "PRAGMA table_info(users);"

# 查看登录日志表结构
wrangler d1 execute nanobanana --remote --command "PRAGMA table_info(signin_logs);"

# 查看AI任务表结构
wrangler d1 execute nanobanana --remote --command "PRAGMA table_info(ai_tasks);"
```
**作用**: 了解表的字段结构，为编写查询语句提供参考

### 21. 查看表记录数量
```bash
wrangler d1 execute nanobanana --remote --command "SELECT 'users' as table_name, COUNT(*) as record_count FROM users UNION ALL SELECT 'signin_logs', COUNT(*) FROM signin_logs UNION ALL SELECT 'ai_tasks', COUNT(*) FROM ai_tasks UNION ALL SELECT 'orders', COUNT(*) FROM orders;"
```
**作用**: 快速了解各表的数据量

---

## 📈 高级分析查询

### 22. 用户留存分析
```bash
wrangler d1 execute nanobanana --remote --command "SELECT u.id, u.nickname, DATE(datetime(u.created_at, 'unixepoch')) as registration_date, COUNT(s.id) as total_logins, julianday('now') - julianday(datetime(MAX(s.created_at), 'unixepoch')) as days_since_last_login FROM users u LEFT JOIN signin_logs s ON u.id = s.user_id GROUP BY u.id ORDER BY days_since_last_login;"
```
**作用**: 分析用户留存情况和流失风险

### 23. 周活跃用户统计
```bash
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(DISTINCT user_id) as weekly_active_users FROM signin_logs WHERE created_at >= strftime('%s', 'now', '-7 days');"
```
**作用**: 统计过去7天内的活跃用户数

### 24. 月活跃用户统计
```bash
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(DISTINCT user_id) as monthly_active_users FROM signin_logs WHERE created_at >= strftime('%s', 'now', '-30 days');"
```
**作用**: 统计过去30天内的活跃用户数

### 25. 用户行为漏斗分析
```bash
wrangler d1 execute nanobanana --remote --command "SELECT (SELECT COUNT(*) FROM users) as registered_users, (SELECT COUNT(DISTINCT user_id) FROM signin_logs) as login_users, (SELECT COUNT(DISTINCT user_id) FROM ai_tasks) as ai_users, (SELECT COUNT(DISTINCT user_id) FROM orders) as paying_users;"
```
**作用**: 分析用户从注册到付费的转化漏斗

---

## 🔧 自动化脚本

### 每日数据报告脚本
创建文件 `daily_report.sh`:

```bash
#!/bin/bash

echo "======================================"
echo "  Nano Banana 每日数据报告"
echo "  生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================"
echo ""

echo "📊 核心指标:"
echo "----------------------------------------"
echo -n "注册用户总数: "
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) FROM users;" | grep -E '^\│.*\│$' | tail -1 | sed 's/│//g' | xargs

echo -n "总登录次数: "
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) FROM signin_logs;" | grep -E '^\│.*\│$' | tail -1 | sed 's/│//g' | xargs

echo -n "AI任务总数: "
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) FROM ai_tasks;" | grep -E '^\│.*\│$' | tail -1 | sed 's/│//g' | xargs

echo ""
echo "📈 过去7天登录统计:"
echo "----------------------------------------"
wrangler d1 execute nanobanana --remote --command "SELECT DATE(datetime(created_at, 'unixepoch')) as login_date, COUNT(*) as login_count FROM signin_logs WHERE created_at >= strftime('%s', 'now', '-7 days') GROUP BY DATE(datetime(created_at, 'unixepoch')) ORDER BY login_date DESC;"

echo ""
echo "👥 活跃用户统计:"
echo "----------------------------------------"
echo -n "周活跃用户: "
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(DISTINCT user_id) FROM signin_logs WHERE created_at >= strftime('%s', 'now', '-7 days');" | grep -E '^\│.*\│$' | tail -1 | sed 's/│//g' | xargs

echo -n "月活跃用户: "
wrangler d1 execute nanobanana --remote --command "SELECT COUNT(DISTINCT user_id) FROM signin_logs WHERE created_at >= strftime('%s', 'now', '-30 days');" | grep -E '^\│.*\│$' | tail -1 | sed 's/│//g' | xargs

echo ""
echo "报告生成完成！"
```

使用方法:
```bash
chmod +x daily_report.sh
./daily_report.sh
```

### 用户行为分析脚本
创建文件 `user_analysis.sh`:

```bash
#!/bin/bash

echo "======================================"
echo "  用户行为分析报告"
echo "  生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================"
echo ""

echo "🏆 用户活跃度排行榜:"
echo "----------------------------------------"
wrangler d1 execute nanobanana --remote --command "SELECT u.nickname, COUNT(s.id) as login_times FROM users u LEFT JOIN signin_logs s ON u.id = s.user_id GROUP BY u.id ORDER BY login_times DESC;"

echo ""
echo "🕐 登录时段分析:"
echo "----------------------------------------"
wrangler d1 execute nanobanana --remote --command "SELECT strftime('%H', datetime(created_at, 'unixepoch')) as hour, COUNT(*) as login_count FROM signin_logs GROUP BY hour ORDER BY hour;"

echo ""
echo "🔐 登录方式统计:"
echo "----------------------------------------"
wrangler d1 execute nanobanana --remote --command "SELECT type, COUNT(*) as count FROM signin_logs GROUP BY type;"
```

---

## 💡 常用技巧

### 1. 时间格式转换
```sql
-- Unix时间戳转可读格式
datetime(created_at, 'unixepoch')

-- 获取日期部分
DATE(datetime(created_at, 'unixepoch'))

-- 获取小时部分
strftime('%H', datetime(created_at, 'unixepoch'))
```

### 2. 时间范围查询
```sql
-- 过去7天
WHERE created_at >= strftime('%s', 'now', '-7 days')

-- 过去30天
WHERE created_at >= strftime('%s', 'now', '-30 days')

-- 今天
WHERE DATE(datetime(created_at, 'unixepoch')) = DATE('now')
```

### 3. 常用聚合函数
```sql
COUNT(*)        -- 计数
SUM(column)     -- 求和
AVG(column)     -- 平均值
MIN(column)     -- 最小值
MAX(column)     -- 最大值
COUNT(DISTINCT column)  -- 去重计数
```

### 4. 分组和排序
```sql
GROUP BY column     -- 分组
ORDER BY column ASC -- 升序排列
ORDER BY column DESC-- 降序排列
LIMIT 10           -- 限制结果数量
```

### 5. 联表查询
```sql
-- 内连接
FROM users u JOIN signin_logs s ON u.id = s.user_id

-- 左连接（保留左表所有记录）
FROM users u LEFT JOIN signin_logs s ON u.id = s.user_id
```

---

## 🔗 相关资源

- **Cloudflare D1 文档**: [https://developers.cloudflare.com/d1/](https://developers.cloudflare.com/d1/)
- **SQLite 函数参考**: [https://www.sqlite.org/lang_corefunc.html](https://www.sqlite.org/lang_corefunc.html)
- **Wrangler CLI 文档**: [https://developers.cloudflare.com/workers/wrangler/](https://developers.cloudflare.com/workers/wrangler/)

## 📝 更新日志

- **2025-01-08**: 初始版本创建，包含基础查询命令
- 后续更新将记录在此处...

---

**注意**: 
- 所有查询都可以根据实际需求进行修改和扩展
- 建议定期备份重要数据
- 在生产环境中谨慎使用 `DELETE` 和 `UPDATE` 语句
- 大量数据查询时注意性能影响

**如有问题或需要添加新的查询，请及时更新此文档！** 📚
