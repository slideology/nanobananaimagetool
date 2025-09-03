/**
 * 测试脚本：检查R2存储的图片URL和格式
 */

console.log("🔍 测试R2存储的图片URL访问...");

const testImageUrls = [
  "https://pub-cb92e8dab89d452aadee075624e92b5a.r2.dev/images/", // 你的CDN基础URL
  "https://nanobanana.slideology0816.workers.dev/images/", // Workers域名
];

// 测试一个公开的图片URL，验证Kie AI对不同格式的支持
const testUrls = [
  "https://picsum.photos/512/512.jpg", // JPG格式
  "https://picsum.photos/512/512.png", // PNG格式  
  "https://httpbin.org/image/png", // PNG格式测试
  "https://httpbin.org/image/jpeg", // JPEG格式测试
];

async function testImageFormat() {
  const KIEAI_APIKEY = "ffe145c028f16a6ca99a460ca91af853";
  
  for (const imageUrl of testUrls) {
    console.log(`\n🖼️ 测试图片URL: ${imageUrl}`);
    
    try {
      // 先检查图片是否可访问
      const imageResponse = await fetch(imageUrl);
      console.log(`图片访问状态: ${imageResponse.status}`);
      console.log(`Content-Type: ${imageResponse.headers.get('content-type')}`);
      console.log(`Content-Length: ${imageResponse.headers.get('content-length')}`);
      
      if (!imageResponse.ok) {
        console.log("❌ 图片无法访问，跳过测试");
        continue;
      }
      
      // 测试Kie AI是否支持这个格式
      const payload = {
        model: "google/nano-banana-edit",
        input: {
          prompt: "make it more colorful and vibrant",
          image_urls: [imageUrl],
          output_format: "png",
          image_size: "auto",
          enable_translation: true
        }
      };
      
      const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${KIEAI_APIKEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok && result.code === 200) {
        console.log("✅ Kie AI 支持这个格式:", result);
      } else {
        console.log("❌ Kie AI 不支持或出错:", result);
      }
      
    } catch (error) {
      console.error("测试出错:", error.message);
    }
  }
}

// 测试函数
async function checkR2Images() {
  console.log("\n📁 检查R2存储配置...");
  
  // 这里需要你提供一个实际的图片URL进行测试
  const actualImageUrl = "https://pub-cb92e8dab89d452aadee075624e92b5a.r2.dev/cache/3IQ19vNWomwiWNNn4MMoQ.png"; // 用户提供的实际图片URL
  
  if (actualImageUrl) {
    console.log(`测试实际图片: ${actualImageUrl}`);
    
    try {
      const response = await fetch(actualImageUrl);
      console.log(`状态: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      console.log(`Content-Length: ${response.headers.get('content-length')}`);
    } catch (error) {
      console.error("访问实际图片失败:", error.message);
    }
  } else {
    console.log("⚠️  请提供实际的图片URL进行测试");
  }
}

// 执行测试
async function runTests() {
  await testImageFormat();
  await checkR2Images();
}

runTests().catch(console.error);