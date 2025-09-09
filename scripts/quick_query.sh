#!/bin/bash

# ===========================================
# Nano Banana 快速查询脚本
# 作者: AI助手
# 创建时间: 2025-01-08
# 功能: 提供常用数据库查询的快捷命令
# ===========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}  🍌 Nano Banana 快速查询工具${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""
    echo -e "${YELLOW}使用方法:${NC}"
    echo "  ./quick_query.sh [命令] [参数]"
    echo ""
    echo -e "${YELLOW}可用命令:${NC}"
    echo -e "  ${GREEN}users${NC}          - 查看所有用户信息"
    echo -e "  ${GREEN}stats${NC}          - 显示核心统计数据"
    echo -e "  ${GREEN}logins${NC}         - 查看最近登录记录"
    echo -e "  ${GREEN}active${NC}         - 显示活跃用户统计"
    echo -e "  ${GREEN}tables${NC}         - 查看所有数据表"
    echo -e "  ${GREEN}ai-tasks${NC}       - 查看AI任务统计"
    echo -e "  ${GREEN}orders${NC}         - 查看订单统计"
    echo -e "  ${GREEN}today${NC}          - 查看今日数据"
    echo -e "  ${GREEN}custom${NC} [SQL]   - 执行自定义SQL查询"
    echo -e "  ${GREEN}help${NC}           - 显示此帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  ./quick_query.sh users"
    echo "  ./quick_query.sh custom \"SELECT COUNT(*) FROM users;\""
    echo ""
}

# 检查wrangler是否安装
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 wrangler 命令${NC}"
        echo "请先安装 Cloudflare Wrangler: npm install -g wrangler"
        exit 1
    fi
}

# 执行数据库查询
execute_query() {
    local query="$1"
    local description="$2"
    
    if [ -n "$description" ]; then
        echo -e "${CYAN}$description${NC}"
        echo "----------------------------------------"
    fi
    
    wrangler d1 execute nanobanana --remote --command "$query" 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 查询执行失败${NC}"
        return 1
    fi
    echo ""
}

# 主函数
main() {
    check_wrangler
    
    case "$1" in
        "users")
            execute_query "SELECT id, email, nickname, datetime(created_at, 'unixepoch') as registration_date FROM users ORDER BY created_at DESC;" "👥 用户信息列表"
            ;;
        "stats")
            echo -e "${PURPLE}📊 核心统计数据${NC}"
            echo "----------------------------------------"
            execute_query "SELECT 'users' as metric, COUNT(*) as count FROM users UNION ALL SELECT 'logins', COUNT(*) FROM signin_logs UNION ALL SELECT 'ai_tasks', COUNT(*) FROM ai_tasks UNION ALL SELECT 'orders', COUNT(*) FROM orders;"
            ;;
        "logins")
            execute_query "SELECT user_id, type, datetime(created_at, 'unixepoch') as login_time, ip FROM signin_logs ORDER BY created_at DESC LIMIT 20;" "🔐 最近20次登录记录"
            ;;
        "active")
            echo -e "${GREEN}👥 活跃用户统计${NC}"
            echo "----------------------------------------"
            execute_query "SELECT 'weekly_active' as period, COUNT(DISTINCT user_id) as users FROM signin_logs WHERE created_at >= strftime('%s', 'now', '-7 days') UNION ALL SELECT 'monthly_active', COUNT(DISTINCT user_id) FROM signin_logs WHERE created_at >= strftime('%s', 'now', '-30 days');"
            ;;
        "tables")
            execute_query "SELECT name as table_name FROM sqlite_master WHERE type='table' ORDER BY name;" "🗄️ 数据库表列表"
            ;;
        "ai-tasks")
            execute_query "SELECT DATE(datetime(created_at, 'unixepoch')) as task_date, COUNT(*) as task_count FROM ai_tasks GROUP BY DATE(datetime(created_at, 'unixepoch')) ORDER BY task_date DESC LIMIT 10;" "🤖 AI任务统计 (最近10天)"
            ;;
        "orders")
            execute_query "SELECT status, COUNT(*) as order_count FROM orders GROUP BY status;" "💰 订单状态统计"
            ;;
        "today")
            echo -e "${YELLOW}📅 今日数据概览${NC}"
            echo "----------------------------------------"
            execute_query "SELECT 'new_users' as metric, COUNT(*) as count FROM users WHERE DATE(datetime(created_at, 'unixepoch')) = DATE('now') UNION ALL SELECT 'logins_today', COUNT(*) FROM signin_logs WHERE DATE(datetime(created_at, 'unixepoch')) = DATE('now') UNION ALL SELECT 'ai_tasks_today', COUNT(*) FROM ai_tasks WHERE DATE(datetime(created_at, 'unixepoch')) = DATE('now');"
            ;;
        "custom")
            if [ -z "$2" ]; then
                echo -e "${RED}❌ 错误: 请提供SQL查询语句${NC}"
                echo "示例: ./quick_query.sh custom \"SELECT COUNT(*) FROM users;\""
                exit 1
            fi
            execute_query "$2" "🔧 自定义查询结果"
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            echo -e "${RED}❌ 未知命令: $1${NC}"
            echo "使用 './quick_query.sh help' 查看可用命令"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"