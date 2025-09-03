#!/usr/bin/env tsx

/**
 * 本地测试脚本：直接测试 createAiImage 业务逻辑
 * 用于排查API问题，跳过网络和认证层
 */

import { createAiImage } from "../app/.server/services/ai-tasks";
import { getUserByEmail } from "../app/.server/model/user";

async function testCreateAiImage() {
  try {
    console.log("🔍 开始测试 createAiImage 业务逻辑...");
    
    // 模拟用户
    const user = await getUserByEmail("slideology0816@gmail.com");
    if (!user) {
      console.error("❌ 用户不存在");
      process.exit(1);
    }
    
    console.log(`✅ 找到用户: ${user.nickname} (ID: ${user.id})`);
    
    // 模拟环境变量
    const mockEnv = {
      KIEAI_APIKEY: "ffe145c028f16a6ca99a460ca91af853", // 从 .dev.vars 获取
      CDN_URL: "https://pub-cb92e8dab89d452aadee075624e92b5a.r2.dev",
      R2: {}, // 模拟 R2 存储
    } as any;
    
    // 模拟请求参数 - Text-to-Image 模式
    const requestData = {
      mode: "text-to-image" as const,
      prompt: "a beautiful sunset landscape",
      type: "nano-banana" as const,
      width: 1024,
      height: 1024,
    };
    
    console.log("📋 测试参数:", JSON.stringify(requestData, null, 2));
    console.log("💰 测试 Text-to-Image 模式...");
    
    // 调用业务逻辑
    const result = await createAiImage(mockEnv, requestData, user);
    
    console.log("✅ 测试成功!");
    console.log("📄 返回结果:", JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error("❌ 测试失败:");
    console.error("错误类型:", typeof error);
    console.error("错误信息:", error instanceof Error ? error.message : String(error));
    console.error("错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息");
    
    if (error && typeof error === 'object' && 'code' in error) {
      console.error("错误代码:", (error as any).code);
      console.error("错误数据:", (error as any).data);
    }
    
    process.exit(1);
  }
}

// 执行测试
testCreateAiImage()
  .then(() => {
    console.log("🎉 测试完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 意外错误:", error);
    process.exit(1);
  });