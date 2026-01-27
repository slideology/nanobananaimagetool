#!/usr/bin/env tsx

/**
 * 手动更新任务状态 - 用于本地开发环境测试
 * 因为本地环境无法接收 Kie AI 的 Webhook 回调
 * 
 * 使用方法: tsx scripts/update-task-status.ts <task_no>
 */

import { updateTaskStatusByTaskId } from "../app/.server/services/ai-tasks";

async function updateTaskStatus(taskNo: string) {
    try {
        console.log(`🔄 正在更新任务状态: ${taskNo}`);

        // 模拟环境变量 (本地开发需要)
        const mockEnv = {
            KIEAI_APIKEY: process.env.KIEAI_APIKEY || '',
            DB: null as any, // 这里需要实际的 D1 绑定,但在脚本中我们直接操作数据库
        };

        // 调用更新函数
        await updateTaskStatusByTaskId(mockEnv, taskNo);

        console.log(`✅ 任务状态更新成功!`);
        console.log(`💡 提示: 刷新浏览器页面查看最新状态`);

    } catch (error) {
        console.error("❌ 更新失败:", error);
        console.error("\n💡 解决方案:");
        console.error("1. 确保 KIEAI_APIKEY 环境变量已设置");
        console.error("2. 检查任务 ID 是否正确");
        console.error("3. 查看 Kie AI 后台任务状态");
        process.exit(1);
    }
}

// 命令行参数处理
const args = process.argv.slice(2);

if (args.length < 1) {
    console.error("❌ 使用方法: tsx scripts/update-task-status.ts <task_no>");
    console.error("📝 示例: tsx scripts/update-task-status.ts xIS-7a7AdvNc6ahqdW8ee");
    process.exit(1);
}

const taskNo = args[0];

// 执行更新
updateTaskStatus(taskNo)
    .then(() => {
        console.log("🎉 操作完成!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 意外错误:", error);
        process.exit(1);
    });
