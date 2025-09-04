/**
 * 模拟生产环境的完整流程测试
 * 测试从前端请求到Kie AI的完整调用链
 */

console.log("🔍 模拟生产环境完整流程测试...");

const KIEAI_APIKEY = "ffe145c028f16a6ca99a460ca91af853";
const actualImageUrl = "https://pub-cb92e8dab89d452aadee075624e92b5a.r2.dev/cache/3IQ19vNWomwiWNNn4MMoQ.png";

// 模拟 KieAI 类的实现
class MockKieAI {
  constructor(config) {
    this.config = config;
    this.API_URL = new URL("https://api.kie.ai");
  }

  async fetch(path, data, init = {}) {
    const { headers, method = "get", ...rest } = init;
    
    const url = new URL(path, this.API_URL);
    const options = {
      ...rest,
      method,
      headers: {
        "content-type": "application/json",
        ...headers,
        Authorization: `Bearer ${this.config.accessKey}`,
      },
    };

    if (data) {
      if (method.toLowerCase() === "get") {
        Object.entries(data).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      } else {
        options.body = JSON.stringify(data);
      }
    }

    console.log("📡 发送请求:");
    console.log("URL:", url.toString());
    console.log("Method:", method);
    console.log("Headers:", JSON.stringify(options.headers, null, 2));
    console.log("Body:", options.body);

    const response = await fetch(url, options);
    const json = await response.json();

    console.log("📥 收到响应:");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(json, null, 2));

    if (!response.ok || json.code !== 200) {
      throw {
        code: json.code ?? response.status,
        message: json.msg ?? response.statusText,
        data: json ? json.data : json,
      };
    }

    return json;
  }

  async createNanoBananaEditTask(payload) {
    const result = await this.fetch(
      "/api/v1/jobs/createTask",
      {
        model: "google/nano-banana-edit",
        callBackUrl: payload.callBackUrl,
        input: {
          prompt: payload.prompt,
          image_urls: payload.image_urls,
          output_format: "png",
          image_size: "auto",
          enable_translation: true
        }
      },
      {
        method: "post",
      }
    );

    return result.data;
  }
}

async function testProductionFlow() {
  console.log("🚀 开始模拟生产环境流程...");
  
  try {
    // 1. 模拟环境变量配置
    console.log("\n📋 步骤1: 验证环境配置...");
    const mockEnv = {
      KIEAI_APIKEY: KIEAI_APIKEY
    };
    
    console.log("环境变量 KIEAI_APIKEY:", mockEnv.KIEAI_APIKEY ? `${mockEnv.KIEAI_APIKEY.substring(0, 8)}...` : "❌ 未配置");
    
    // 2. 模拟 KieAI 实例化
    console.log("\n🔧 步骤2: 创建KieAI实例...");
    const kieAI = new MockKieAI({ accessKey: mockEnv.KIEAI_APIKEY });
    console.log("✅ KieAI实例创建成功");
    
    // 3. 模拟业务层调用
    console.log("\n🎨 步骤3: 模拟业务层调用...");
    const requestData = {
      mode: "image-to-image",
      prompt: "create a highly detailed 1/7 scale commercialized figure of the character from the illustration, rendered in a realistic style. The character is posed dynamically. The figure is placed on the broad desk of a modern gaming/streaming setup, next to a large microphone and mechanical keyboard. It uses a circular transparent acrylic base without any text. On the main ultrawide monitor, a live ZBrush session is visible, showing the 3D model of the very same figure. The BANDAI-style toy packaging box is positioned on the desk like a piece of branded merch, perfectly framed in the stream's webcam view.",
      type: "nano-banana-edit",
      fileUrl: actualImageUrl,
      width: 1024,
      height: 1024,
    };
    
    console.log("业务层请求参数:", JSON.stringify(requestData, null, 2));
    
    // 4. 验证图片URL（业务层验证）
    console.log("\n🔍 步骤4: 业务层图片验证...");
    if (requestData.type === "nano-banana-edit") {
      if (!requestData.fileUrl) {
        throw new Error("Image is required for nano-banana-edit model");
      }
      const imageUrls = [requestData.fileUrl];
      if (imageUrls.length > 5) {
        throw new Error("Maximum 5 images allowed for nano-banana-edit");
      }
      console.log("✅ 图片验证通过");
    }
    
    // 5. 调用 Kie AI API
    console.log("\n🚀 步骤5: 调用Kie AI API...");
    const kieResponse = await kieAI.createNanoBananaEditTask({
      prompt: requestData.prompt,
      image_urls: [requestData.fileUrl],
      callBackUrl: undefined, // 开发环境不设置回调
    });
    
    console.log("✅ API调用成功!");
    console.log("任务ID:", kieResponse.taskId);
    
    return true;
    
  } catch (error) {
    console.error("\n❌ 流程测试失败:");
    console.error("错误类型:", typeof error);
    console.error("错误信息:", error instanceof Error ? error.message : String(error));
    console.error("错误详情:", error);
    return false;
  }
}

// 对比测试：检查生产环境可能的差异
// async function compareEnvironments() {
//   console.log("\n🔄 对比测试: 生产vs开发环境差异...");
//   
//   // 测试可能的生产环境差异
//   const testScenarios = [
//     {
//       name: "开发环境（无回调URL）",
//       callBackUrl: undefined
//     },
//     {
//       name: "生产环境（有回调URL）", 
//       callBackUrl: "https://nanobanana.slideology0816.workers.dev/api/webhooks/kie-image"
//     }
//   ];
//   
//   for (const scenario of testScenarios) {
//     console.log(`\n测试场景: ${scenario.name}`);
//     
//     try {
//       const payload = {
//         model: "google/nano-banana-edit",
//         input: {
//           prompt: "test prompt",
//           image_urls: [actualImageUrl],
//           output_format: "png",
//           image_size: "auto",
//           enable_translation: true
//         }
//       };
//       
//       if (scenario.callBackUrl) {
//         payload.callBackUrl = scenario.callBackUrl;
//       }
//       
//       const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${KIEAI_APIKEY}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify(payload)
//       });
//       
//       const result = await response.json();
//       
//       if (response.ok && result.code === 200) {
//         console.log(`✅ ${scenario.name} 成功:`, result.data);
//       } else {
//         console.log(`❌ ${scenario.name} 失败:`, result);
//       }
//       
//     } catch (error) {
//       console.error(`💥 ${scenario.name} 异常:`, error.message);
//     }
//   }
// }

// 执行测试
async function runCompleteTest() {
  const success = await testProductionFlow();
  // await compareEnvironments(); // 暂时注释掉对比测试
  
  if (success) {
    console.log("\n🎉 结论: 业务流程完全正常！");
    console.log("💡 建议检查:");
    console.log("1. 生产环境的环境变量是否正确");
    console.log("2. 生产环境的网络连接");
    console.log("3. 生产环境的错误日志");
    console.log("4. 前端到后端的请求参数传递");
  } else {
    console.log("\n⚠️  发现业务流程问题！");
  }
}

runCompleteTest().catch(console.error);