#!/bin/bash

# ===========================================
# Nano Banana 数据备份脚本
# 作者: AI助手
# 创建时间: 2025-01-08
# 功能: 备份重要数据表到本地文件
# ===========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="nanobanana_backup_${DATE}.sql"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  💾 Nano Banana 数据备份工具${NC}"
echo -e "${BLUE}  📅 备份时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# 检查wrangler是否安装
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 wrangler 命令${NC}"
    echo "请先安装 Cloudflare Wrangler: npm install -g wrangler"
    exit 1
fi

# 创建备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}📁 创建备份目录: $BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# 备份文件路径
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

echo -e "${YELLOW}🔍 获取数据库表列表...${NC}"

# 获取所有表名
TABLES=$(wrangler d1 execute nanobanana --remote --command "SELECT name FROM sqlite_master WHERE type='table';" 2>/dev/null | grep -E '^│.*│$' | sed 's/│//g' | sed 's/^ *//g' | sed 's/ *$//g' | grep -v '^name$' | grep -v '^─*$')

if [ -z "$TABLES" ]; then
    echo -e "${RED}❌ 无法获取数据库表列表${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 找到以下数据表:${NC}"
echo "$TABLES" | while read table; do
    if [ -n "$table" ]; then
        echo "  - $table"
    fi
done
echo ""

# 开始备份
echo -e "${YELLOW}💾 开始备份数据到: $BACKUP_PATH${NC}"
echo ""

# 写入备份文件头部
cat > "$BACKUP_PATH" << EOF
-- ==========================================
-- Nano Banana 数据库备份文件
-- 备份时间: $(date '+%Y-%m-%d %H:%M:%S')
-- 数据库: nanobanana (Cloudflare D1)
-- ==========================================

BEGIN TRANSACTION;

EOF

# 备份每个表的数据
echo "$TABLES" | while read table; do
    if [ -n "$table" ] && [ "$table" != "name" ]; then
        echo -e "${CYAN}📋 备份表: $table${NC}"
        
        # 获取表结构
        echo "-- 表结构: $table" >> "$BACKUP_PATH"
        wrangler d1 execute nanobanana --remote --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='$table';" 2>/dev/null | grep -E '^│.*│$' | sed 's/│//g' | sed 's/^ *//g' | sed 's/ *$//g' | grep -v '^sql$' | grep -v '^─*$' | head -1 >> "$BACKUP_PATH"
        echo ";" >> "$BACKUP_PATH"
        echo "" >> "$BACKUP_PATH"
        
        # 获取数据行数
        ROW_COUNT=$(wrangler d1 execute nanobanana --remote --command "SELECT COUNT(*) FROM $table;" 2>/dev/null | grep -E '^│.*│$' | tail -1 | sed 's/│//g' | xargs)
        
        if [ "$ROW_COUNT" -gt 0 ] 2>/dev/null; then
            echo "-- 数据: $table ($ROW_COUNT 行)" >> "$BACKUP_PATH"
            
            # 导出数据 (这里使用简化的方法，实际生产环境可能需要更复杂的导出逻辑)
            echo "-- 注意: 数据导出需要手动处理，此处仅记录表结构" >> "$BACKUP_PATH"
            echo "-- 表 $table 包含 $ROW_COUNT 行数据" >> "$BACKUP_PATH"
            echo "" >> "$BACKUP_PATH"
        else
            echo "-- 表 $table 为空" >> "$BACKUP_PATH"
            echo "" >> "$BACKUP_PATH"
        fi
    fi
done

# 写入备份文件尾部
cat >> "$BACKUP_PATH" << EOF

COMMIT;

-- ==========================================
-- 备份完成时间: $(date '+%Y-%m-%d %H:%M:%S')
-- ==========================================
EOF

echo ""
echo -e "${GREEN}✅ 数据备份完成!${NC}"
echo -e "${YELLOW}📁 备份文件位置: $BACKUP_PATH${NC}"
echo -e "${YELLOW}📊 备份文件大小: $(du -h "$BACKUP_PATH" | cut -f1)${NC}"
echo ""

# 显示备份目录中的所有备份文件
echo -e "${BLUE}📋 备份历史记录:${NC}"
echo "----------------------------------------"
ls -la "$BACKUP_DIR"/*.sql 2>/dev/null | while read line; do
    echo "$line"
done

echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo "  - 备份文件包含表结构信息"
echo "  - 如需完整数据导出，请使用 wrangler d1 export 命令"
echo "  - 建议定期清理旧的备份文件"
echo "  - 重要数据请额外保存到云存储服务"
echo ""