#!/usr/bin/env tsx

/**
 * 管理员工具：为指定用户增加积分
 * 使用方法：tsx scripts/add-credits.ts <email> <credits> [reason]
 * 
 * 示例：
 * tsx scripts/add-credits.ts slideology0816@gmail.com 100 "管理员手动增加积分"
 */

import { getUserByEmail } from "../app/.server/model/user";
import { insertCreditRecord } from "../app/.server/model/credit_record";

async function addCreditsToUser(email: string, credits: number, reason?: string) {
  try {
    console.log(`🔍 查找用户: ${email}`);
    
    // 查找用户
    const user = await getUserByEmail(email);
    if (!user) {
      console.error(`❌ 用户不存在: ${email}`);
      process.exit(1);
    }

    console.log(`✅ 找到用户: ${user.nickname} (ID: ${user.id})`);
    
    // 添加积分记录
    const creditRecord = {
      user_id: user.id,
      credits: credits,
      remaining_credits: credits,
      trans_type: "adjustment" as const,
      source_type: "admin",
      source_id: "manual",
      note: reason || "管理员手动增加积分",
    };

    console.log(`💰 正在为用户增加 ${credits} 积分...`);
    
    const [newRecord] = await insertCreditRecord(creditRecord);
    
    console.log(`✅ 积分增加成功!`);
    console.log(`📄 积分记录ID: ${newRecord.id}`);
    console.log(`💳 增加积分: ${credits}`);
    console.log(`📝 备注: ${creditRecord.note}`);
    console.log(`⏰ 创建时间: ${new Date(newRecord.created_at * 1000).toLocaleString()}`);
    
  } catch (error) {
    console.error("❌ 执行失败:", error);
    process.exit(1);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("❌ 使用方法: tsx scripts/add-credits.ts <email> <credits> [reason]");
  console.error("📝 示例: tsx scripts/add-credits.ts slideology0816@gmail.com 100 \"管理员手动增加积分\"");
  process.exit(1);
}

const email = args[0];
const credits = parseInt(args[1], 10);
const reason = args[2];

if (isNaN(credits) || credits <= 0) {
  console.error("❌ 积分数量必须是正整数");
  process.exit(1);
}

if (!email.includes("@")) {
  console.error("❌ 请提供有效的邮箱地址");
  process.exit(1);
}

// 执行增加积分
addCreditsToUser(email, credits, reason)
  .then(() => {
    console.log("🎉 操作完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 意外错误:", error);
    process.exit(1);
  });