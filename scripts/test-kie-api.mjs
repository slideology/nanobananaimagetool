/**
 * 测试脚本：直接验证 Kie AI API 连接和密钥
 * 用于排查图片没有传到Kie服务的问题
 */

console.log("🔍 开始测试 Kie AI API 连接...");

// 从环境变量获取API密钥
const KIEAI_APIKEY = "ffe145c028f16a6ca99a460ca91af853"; // 从 .dev.vars 获取

async function testKieAIConnection() {
  console.log("📋 测试配置:");
  console.log("- API Key:", KIEAI_APIKEY ? `${KIEAI_APIKEY.substring(0, 8)}...` : "❌ 未配置");
  console.log("- Base URL: https://api.kie.ai");
  
  try {
    // 1. 测试获取积分余额（最简单的API调用）
    console.log("\n💰 测试1: 获取积分余额...");
    const creditResponse = await fetch("https://api.kie.ai/api/v1/chat/credit", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${KIEAI_APIKEY}`,
        "Content-Type": "application/json"
      }
    });
    
    console.log("状态码:", creditResponse.status);
    
    if (creditResponse.ok) {
      const creditData = await creditResponse.json();
      console.log("✅ 积分余额获取成功:", creditData);
    } else {
      const errorText = await creditResponse.text();
      console.error("❌ 积分余额获取失败:");
      console.error("错误详情:", errorText);
      return false;
    }
    
    // 2. 测试创建 Text-to-Image 任务
    console.log("\n🖼️ 测试2: 创建 Text-to-Image 任务...");
    const textToImagePayload = {
      model: "google/nano-banana",
      input: {
        prompt: "a beautiful sunset landscape",
        output_format: "png",
        image_size: "auto",
        enable_translation: true
      }
    };
    
    console.log("请求参数:", JSON.stringify(textToImagePayload, null, 2));
    
    const textToImageResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KIEAI_APIKEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(textToImagePayload)
    });
    
    console.log("状态码:", textToImageResponse.status);
    
    if (textToImageResponse.ok) {
      const taskData = await textToImageResponse.json();
      console.log("✅ Text-to-Image 任务创建成功:", taskData);
    } else {
      const errorText = await textToImageResponse.text();
      console.error("❌ Text-to-Image 任务创建失败:");
      console.error("错误详情:", errorText);
      return false;
    }
    
    // 3. 测试创建 Image-to-Image 任务（使用一个公开的测试图片URL）
    console.log("\n🎨 测试3: 创建 Image-to-Image 任务...");
    const imageToImagePayload = {
      model: "google/nano-banana-edit",
      input: {
        prompt: "make it more colorful and vibrant",
        image_urls: ["https://picsum.photos/512/512"], // 使用公开的测试图片
        output_format: "png",
        image_size: "auto",
        enable_translation: true
      }
    };
    
    console.log("请求参数:", JSON.stringify(imageToImagePayload, null, 2));
    
    const imageToImageResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KIEAI_APIKEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(imageToImagePayload)
    });
    
    console.log("状态码:", imageToImageResponse.status);
    
    if (imageToImageResponse.ok) {
      const taskData = await imageToImageResponse.json();
      console.log("✅ Image-to-Image 任务创建成功:", taskData);
    } else {
      const errorText = await imageToImageResponse.text();
      console.error("❌ Image-to-Image 任务创建失败:");
      console.error("错误详情:", errorText);
      
      // 尝试解析错误信息
      try {
        const errorJson = JSON.parse(errorText);
        console.error("解析后的错误信息:", errorJson);
      } catch {
        console.error("无法解析错误信息为JSON");
      }
      
      return false;
    }
    
    console.log("\n🎉 所有测试通过！Kie AI API 连接正常");
    return true;
    
  } catch (error) {
    console.error("\n💥 测试过程中发生异常:");
    console.error("错误类型:", typeof error);
    console.error("错误信息:", error instanceof Error ? error.message : String(error));
    console.error("错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息");
    return false;
  }
}

// 执行测试
testKieAIConnection()
  .then((success) => {
    if (success) {
      console.log("\n✅ Kie AI API 测试完成 - 连接正常");
      process.exit(0);
    } else {
      console.log("\n❌ Kie AI API 测试失败 - 请检查配置");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n💥 意外错误:", error);
    process.exit(1);
  });