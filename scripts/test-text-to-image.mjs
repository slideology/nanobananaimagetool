/**
 * 测试Text-to-Image API调用
 * 用于排查500错误
 */

const API_BASE_URL = 'http://localhost:3004';

// 测试Text-to-Image API（模拟前端请求）
async function testTextToImageAPI() {
  try {
    console.log('🚀 开始测试Text-to-Image API...');
    
    // 首先测试不同的请求数据
    const testCases = [
      {
        name: '基础Text-to-Image请求',
        data: {
          mode: 'text-to-image',
          type: 'nano-banana',
          prompt: 'a beautiful sunset over mountains',
          width: 512,
          height: 512
        }
      },
      {
        name: '空提示词测试',
        data: {
          mode: 'text-to-image',
          type: 'nano-banana',
          prompt: '',
          width: 512,
          height: 512
        }
      },
      {
        name: '长提示词测试',
        data: {
          mode: 'text-to-image',
          type: 'nano-banana',
          prompt: 'a' + 'very '.repeat(100) + 'long prompt that might cause issues',
          width: 512,
          height: 512
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📋 测试: ${testCase.name}`);
      console.log('请求数据:', testCase.data);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/create/ai-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testCase.data)
        });
        
        console.log('📊 响应状态:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API调用失败:');
          console.error('状态码:', response.status);
          console.error('错误内容:', errorText);
          
          // 尝试解析JSON错误
          try {
            const errorJson = JSON.parse(errorText);
            console.error('解析后的错误:', errorJson);
          } catch (e) {
            console.error('无法解析错误JSON');
          }
        } else {
          const result = await response.json();
          console.log('✅ API调用成功:', result);
        }
      } catch (fetchError) {
        console.error('❌ 网络请求失败:', fetchError);
      }
      
      // 等待一秒再进行下一个测试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 测试API健康状态
async function testAPIHealth() {
  try {
    console.log('\n🏥 测试API健康状态...');
    
    // 测试根路径
    const rootResponse = await fetch(`${API_BASE_URL}/`);
    console.log('根路径状态:', rootResponse.status);
    
    // 测试不存在的API路径
    const notFoundResponse = await fetch(`${API_BASE_URL}/api/nonexistent`);
    console.log('不存在路径状态:', notFoundResponse.status);
    
  } catch (error) {
    console.error('❌ 健康检查失败:', error);
  }
}

// 运行所有测试
async function runAllTests() {
  await testAPIHealth();
  await testTextToImageAPI();
}

runAllTests();