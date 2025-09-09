# 🍌 Nano Banana 数据库管理脚本使用指南

本目录包含了一系列用于管理 Nano Banana 项目数据库的实用脚本。这些脚本基于 `/DATABASE_QUERY_GUIDE.md` 文档创建，旨在简化日常的数据库操作和分析工作。

## 📋 脚本列表

### 1. 📊 daily_report.sh - 每日数据报告
**功能**: 生成每日核心业务数据报告

**包含内容**:
- 核心指标统计（用户数、登录数、AI任务数、订单数）
- 登录和活跃用户分析
- 用户转化漏斗分析
- 每日新增用户趋势
- AI功能使用统计
- 付费转化分析

**使用方法**:
```bash
# 生成今日报告
./daily_report.sh

# 生成报告并保存到文件
./daily_report.sh > reports/daily_$(date +%Y%m%d).txt
```

### 2. 👥 user_analysis.sh - 用户行为分析
**功能**: 深度分析用户行为和使用模式

**包含内容**:
- 用户活跃度排行榜
- 登录时段分析
- 登录方式统计
- 登录IP地址统计
- 用户留存分析
- 每日注册趋势
- AI功能使用分析
- 付费用户分析
- 风险用户识别

**使用方法**:
```bash
# 运行完整用户分析
./user_analysis.sh

# 保存分析结果
./user_analysis.sh > reports/user_analysis_$(date +%Y%m%d).txt
```

### 3. ⚡ quick_query.sh - 快速查询工具
**功能**: 提供常用数据库查询的快捷命令

**可用命令**:
- `users` - 查看所有用户信息
- `stats` - 显示核心统计数据
- `logins` - 查看最近登录记录
- `active` - 显示活跃用户统计
- `tables` - 查看所有数据表
- `ai-tasks` - 查看AI任务统计
- `orders` - 查看订单统计
- `today` - 查看今日数据
- `custom [SQL]` - 执行自定义SQL查询
- `help` - 显示帮助信息

**使用方法**:
```bash
# 查看帮助
./quick_query.sh help

# 查看用户列表
./quick_query.sh users

# 查看今日统计
./quick_query.sh today

# 执行自定义查询
./quick_query.sh custom "SELECT COUNT(*) FROM users WHERE created_at >= strftime('%s', 'now', '-7 days');"
```

### 4. 💾 backup_data.sh - 数据备份工具
**功能**: 备份数据库表结构和统计信息

**备份内容**:
- 所有数据表的结构信息
- 各表的数据行数统计
- 备份时间戳
- 备份历史记录

**使用方法**:
```bash
# 执行数据备份
./backup_data.sh

# 备份文件会自动保存到 ./backups/ 目录
# 文件名格式: nanobanana_backup_YYYYMMDD_HHMMSS.sql
```

## 🚀 快速开始

### 1. 环境准备
确保已安装 Cloudflare Wrangler:
```bash
npm install -g wrangler
```

### 2. 权限设置
为脚本添加执行权限:
```bash
chmod +x *.sh
```

### 3. 验证连接
测试数据库连接:
```bash
./quick_query.sh tables
```

## 📁 目录结构

```
scripts/
├── daily_report.sh      # 每日报告脚本
├── user_analysis.sh     # 用户分析脚本
├── quick_query.sh       # 快速查询工具
├── backup_data.sh       # 数据备份脚本
├── README.md           # 使用说明（本文件）
├── backups/            # 备份文件目录（自动创建）
└── reports/            # 报告文件目录（需手动创建）
```

## 💡 使用建议

### 日常运维
1. **每日检查**: 每天运行 `daily_report.sh` 了解业务状况
2. **周度分析**: 每周运行 `user_analysis.sh` 深入了解用户行为
3. **定期备份**: 定期运行 `backup_data.sh` 备份重要数据
4. **快速查询**: 使用 `quick_query.sh` 进行临时数据查询

### 报告管理
创建报告目录并按日期组织:
```bash
mkdir -p reports/{daily,weekly,monthly}

# 每日报告
./daily_report.sh > reports/daily/report_$(date +%Y%m%d).txt

# 用户分析报告
./user_analysis.sh > reports/weekly/user_analysis_$(date +%Y%m%d).txt
```

### 自动化建议
可以将这些脚本加入到 cron 任务中实现自动化:
```bash
# 编辑 crontab
crontab -e

# 每天早上8点生成日报
0 8 * * * cd /path/to/scripts && ./daily_report.sh > reports/daily/report_$(date +\%Y\%m\%d).txt

# 每周一生成用户分析报告
0 9 * * 1 cd /path/to/scripts && ./user_analysis.sh > reports/weekly/user_analysis_$(date +\%Y\%m\%d).txt

# 每天凌晨2点备份数据
0 2 * * * cd /path/to/scripts && ./backup_data.sh
```

## ⚠️ 注意事项

1. **权限要求**: 确保有 Cloudflare D1 数据库的访问权限
2. **网络连接**: 脚本需要网络连接来访问远程数据库
3. **数据安全**: 备份文件可能包含敏感信息，请妥善保管
4. **性能影响**: 大量查询可能影响数据库性能，建议在低峰期运行
5. **错误处理**: 如遇到错误，请检查 wrangler 配置和网络连接

## 🔧 故障排除

### 常见问题

**问题**: `wrangler: command not found`
**解决**: 安装 Cloudflare Wrangler
```bash
npm install -g wrangler
```

**问题**: 权限被拒绝
**解决**: 添加执行权限
```bash
chmod +x script_name.sh
```

**问题**: 数据库连接失败
**解决**: 检查 wrangler 配置
```bash
wrangler auth login
wrangler d1 list
```

**问题**: 查询结果为空
**解决**: 检查数据库名称和表名是否正确
```bash
./quick_query.sh tables
```

## 📞 技术支持

如果在使用过程中遇到问题，请：
1. 检查上述故障排除指南
2. 确认 `/DATABASE_QUERY_GUIDE.md` 中的数据库配置
3. 验证 Cloudflare Wrangler 的配置和权限

---

**最后更新**: 2025-01-08  
**版本**: 1.0.0  
**作者**: AI助手  
**项目**: Nano Banana Image Tool