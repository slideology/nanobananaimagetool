/**
 * 生产环境调试脚本
 * 模拟生产环境的完整流程，包括环境变量、回调URL等
 */

console.log("🔍 开始生产环境调试...");

// 生产环境配置
const PRODUCTION_CONFIG = {
  API_KEY: "ffe145c028f16a6ca99a460ca91af853",
  IMAGE_URL: "https://pub-cb92e8dab89d452aadee075624e92b5a.r2.dev/cache/3IQ19vNWomwiWNNn4MMoQ.png",
  CALLBACK_URL: "https://nanobanana.slideology0816.workers.dev/api/webhooks/kie-image",
  DOMAIN: "https://nanobanana.slideology0816.workers.dev",
  CDN_URL: "https://pub-cb92e8dab89d452aadee075624e92b5a.r2.dev"
};

// 测试用户信息
const TEST_USER = {
  id: 1,
  email: "slideology0816@gmail.com",
  nickname: "Test User"
};

async function simulateProductionRequest() {
  console.log("🚀 模拟生产环境API调用...");
  
  console.log("📋 生产环境配置:");
  console.log("- API密钥:", PRODUCTION_CONFIG.API_KEY ? `${PRODUCTION_CONFIG.API_KEY.substring(0, 8)}...` : "未设置");
  console.log("- 图片URL:", PRODUCTION_CONFIG.IMAGE_URL);
  console.log("- 回调URL:", PRODUCTION_CONFIG.CALLBACK_URL);
  console.log("- 域名:", PRODUCTION_CONFIG.DOMAIN);
  console.log("- CDN:", PRODUCTION_CONFIG.CDN_URL);
  
  try {
    // 1. 验证环境配置
    console.log("\n🔧 步骤1: 验证环境配置...");
    
    // 检查图片访问
    const imageResponse = await fetch(PRODUCTION_CONFIG.IMAGE_URL, { method: 'HEAD' });
    console.log("图片访问状态:", imageResponse.status);
    console.log("图片Content-Type:", imageResponse.headers.get('content-type'));
    
    if (!imageResponse.ok) {
      throw new Error("图片无法访问");
    }
    
    // 2. 测试 Kie AI API 调用（完全模拟生产环境）
    console.log("\n🎨 步骤2: 模拟生产环境Kie AI调用...");
    
    const payload = {
      model: "google/nano-banana-edit",
      callBackUrl: PRODUCTION_CONFIG.CALLBACK_URL,  // 🔥 使用生产环境回调URL
      input: {
        prompt: "make it more colorful and vibrant",
        image_urls: [PRODUCTION_CONFIG.IMAGE_URL],
        output_format: "png",
        image_size: "auto",
        enable_translation: true
      }
    };
    
    console.log("🔥 完整请求参数:", JSON.stringify(payload, null, 2));
    
    const startTime = Date.now();
    const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PRODUCTION_CONFIG.API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "NanoBanana-Production/1.0"
      },
      body: JSON.stringify(payload)
    });
    const duration = Date.now() - startTime;
    
    console.log("\n📥 API响应:");
    console.log("状态码:", response.status);
    console.log("响应时间:", `${duration}ms`);
    console.log("响应头:", Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log("响应内容:", JSON.stringify(result, null, 2));
    
    if (response.ok && result.code === 200) {
      console.log("✅ 生产环境API调用成功!");
      console.log("任务ID:", result.data.taskId);
      
      // 3. 查询任务状态
      await checkTaskStatus(result.data.taskId);
      
      return { success: true, taskId: result.data.taskId };
    } else {
      console.log("❌ 生产环境API调用失败!");
      console.log("错误代码:", result.code);
      console.log("错误消息:", result.msg);
      return { success: false, error: result };
    }
    
  } catch (error) {
    console.error("\n💥 生产环境调试异常:");
    console.error("错误类型:", typeof error);
    console.error("错误信息:", error instanceof Error ? error.message : String(error));
    console.error("错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息");
    return { success: false, error };
  }
}

async function checkTaskStatus(taskId) {
  console.log(`\n📊 步骤3: 查询任务状态 (${taskId})...`);
  
  try {
    const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PRODUCTION_CONFIG.API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    
    const result = await response.json();
    
    if (response.ok && result.code === 200) {
      console.log("✅ 任务状态查询成功:", result.data);
      return result.data;
    } else {
      console.log("❌ 任务状态查询失败:", result);
      return null;
    }
    
  } catch (error) {
    console.error("查询任务状态异常:", error.message);
    return null;
  }
}

// 对比测试：检查开发环境和生产环境的差异
async function compareEnvironments() {
  console.log("\n🔄 步骤4: 环境差异对比测试...");
  
  const testCases = [
    {
      name: "开发环境（无回调）",
      payload: {
        model: "google/nano-banana-edit",
        input: {
          prompt: "test prompt",
          image_urls: [PRODUCTION_CONFIG.IMAGE_URL],
          output_format: "png",
          image_size: "auto",
          enable_translation: true
        }
        // 无 callBackUrl
      }
    },
    {
      name: "生产环境（有回调）",
      payload: {
        model: "google/nano-banana-edit",
        callBackUrl: PRODUCTION_CONFIG.CALLBACK_URL,
        input: {
          prompt: "test prompt",
          image_urls: [PRODUCTION_CONFIG.IMAGE_URL],
          output_format: "png",
          image_size: "auto",
          enable_translation: true
        }
      }
    },
    {
      name: "生产环境（错误回调URL）",
      payload: {
        model: "google/nano-banana-edit",
        callBackUrl: "https://invalid-url.com/webhook",
        input: {
          prompt: "test prompt",
          image_urls: [PRODUCTION_CONFIG.IMAGE_URL],
          output_format: "png",
          image_size: "auto",
          enable_translation: true
        }
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 测试: ${testCase.name}`);
    
    try {
      const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PRODUCTION_CONFIG.API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(testCase.payload)
      });
      
      const result = await response.json();
      
      if (response.ok && result.code === 200) {
        console.log(`✅ ${testCase.name} 成功:`, result.data);
        
        // 立即查询状态
        setTimeout(() => checkTaskStatus(result.data.taskId), 2000);
      } else {
        console.log(`❌ ${testCase.name} 失败:`, result);
      }
      
    } catch (error) {
      console.error(`💥 ${testCase.name} 异常:`, error.message);
    }
    
    // 避免请求频率过高
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 执行完整测试
async function runCompleteTest() {
  const result = await simulateProductionRequest();
  await compareEnvironments();
  
  console.log("\n📊 测试总结:");
  if (result.success) {
    console.log("✅ 生产环境配置正常，API调用成功");
    console.log("🔍 建议检查:");
    console.log("1. 实际生产环境的日志输出");
    console.log("2. 前端到后端的请求参数传递");
    console.log("3. 生产环境的错误处理机制");
  } else {
    console.log("❌ 发现生产环境问题!");
    console.log("🔧 需要修复:");
    console.log("1. 检查环境变量配置");
    console.log("2. 验证API密钥权限");
    console.log("3. 确认网络连接稳定性");
  }
  
  return result;
}

runCompleteTest().catch(console.error);