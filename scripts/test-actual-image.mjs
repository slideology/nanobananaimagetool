/**
 * 测试脚本：使用实际的图片URL测试Kie AI API
 */

console.log("🔍 测试实际图片URL...");

const KIEAI_APIKEY = "ffe145c028f16a6ca99a460ca91af853";
const actualImageUrl = "https://pub-cb92e8dab89d452aadee075624e92b5a.r2.dev/cache/3IQ19vNWomwiWNNn4MMoQ.png";

async function testActualImage() {
  console.log("📋 测试配置:");
  console.log("- 实际图片URL:", actualImageUrl);
  
  try {
    // 1. 先测试图片是否可访问
    console.log("\n📷 步骤1: 检查图片访问性...");
    const imageResponse = await fetch(actualImageUrl);
    
    console.log("图片访问状态:", imageResponse.status);
    console.log("Content-Type:", imageResponse.headers.get('content-type'));
    console.log("Content-Length:", imageResponse.headers.get('content-length'));
    console.log("Cache-Control:", imageResponse.headers.get('cache-control'));
    console.log("Access-Control-Allow-Origin:", imageResponse.headers.get('access-control-allow-origin'));
    
    if (!imageResponse.ok) {
      console.error("❌ 图片无法访问！");
      return false;
    }
    
    console.log("✅ 图片可以正常访问");
    
    // 2. 测试Kie AI是否能够处理这个图片
    console.log("\n🎨 步骤2: 测试Kie AI Image-to-Image...");
    
    const payload = {
      model: "google/nano-banana-edit",
      input: {
        prompt: "make it more colorful and vibrant",
        image_urls: [actualImageUrl],
        output_format: "png",
        image_size: "auto",
        enable_translation: true
      }
    };
    
    console.log("请求参数:", JSON.stringify(payload, null, 2));
    
    const kieResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KIEAI_APIKEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    console.log("Kie AI 响应状态:", kieResponse.status);
    
    const result = await kieResponse.json();
    console.log("Kie AI 响应内容:", JSON.stringify(result, null, 2));
    
    if (kieResponse.ok && result.code === 200) {
      console.log("✅ 成功！Kie AI 接受了图片URL");
      console.log("任务ID:", result.data.taskId);
      return true;
    } else {
      console.log("❌ 失败！Kie AI 拒绝了图片URL");
      console.log("错误信息:", result.msg);
      return false;
    }
    
  } catch (error) {
    console.error("\n💥 测试过程中发生异常:");
    console.error("错误类型:", typeof error);
    console.error("错误信息:", error instanceof Error ? error.message : String(error));
    console.error("错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息");
    return false;
  }
}

// 额外测试：检查图片格式转换
async function testImageFormatCompatibility() {
  console.log("\n🔧 步骤3: 测试不同的图片URL格式...");
  
  // 测试直接访问vs通过不同域名访问
  const testUrls = [
    actualImageUrl, // 原始URL
    actualImageUrl.replace('https://', 'http://'), // HTTP版本（如果支持）
    // 可以添加其他变体进行测试
  ];
  
  for (const url of testUrls) {
    console.log(`\n测试URL: ${url}`);
    try {
      const response = await fetch(url, { method: 'HEAD' }); // 只获取头部信息
      console.log(`状态: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
    } catch (error) {
      console.log(`❌ 访问失败: ${error.message}`);
    }
  }
}

// 执行测试
async function runAllTests() {
  const success = await testActualImage();
  await testImageFormatCompatibility();
  
  if (success) {
    console.log("\n🎉 测试结论: 图片URL和格式都没有问题！");
    console.log("💡 可能的原因:");
    console.log("1. 网络连接问题");
    console.log("2. Kie AI服务端临时问题");
    console.log("3. 请求频率限制");
  } else {
    console.log("\n⚠️  测试结论: 发现问题！");
    console.log("💡 需要检查:");
    console.log("1. R2存储桶的CORS配置");
    console.log("2. 图片文件格式和大小");
    console.log("3. CDN配置和访问权限");
  }
}

runAllTests().catch(console.error);