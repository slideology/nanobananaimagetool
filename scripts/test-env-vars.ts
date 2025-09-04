/**
 * 测试环境变量读取脚本
 * 用于验证KIEAI_APIKEY等环境变量是否能正确读取
 */

import * as fs from 'fs';
import * as path from 'path';

// 模拟Remix环境中的env对象
interface TestEnv {
  KIEAI_APIKEY?: string;
  GOOGLE_CLIENT_ID?: string;
  SESSION_SECRET?: string;
}

// 手动读取.dev.vars文件
function loadDevVars(): Record<string, string> {
  const devVarsPath = path.join(process.cwd(), '.dev.vars');
  const vars: Record<string, string> = {};
  
  try {
    const content = fs.readFileSync(devVarsPath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          vars[key] = valueParts.join('=');
        }
      }
    }
  } catch (error) {
    console.error('读取.dev.vars文件失败:', error);
  }
  
  return vars;
}

// 加载环境变量
const devVars = loadDevVars();
const env: TestEnv = {
  KIEAI_APIKEY: process.env.KIEAI_APIKEY || devVars.KIEAI_APIKEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || devVars.GOOGLE_CLIENT_ID,
  SESSION_SECRET: process.env.SESSION_SECRET || devVars.SESSION_SECRET,
};

console.log('=== 环境变量测试 ===');
console.log('KIEAI_APIKEY:', env.KIEAI_APIKEY ? `${env.KIEAI_APIKEY.substring(0, 8)}...` : '❌ 未设置');
console.log('GOOGLE_CLIENT_ID:', env.GOOGLE_CLIENT_ID ? `${env.GOOGLE_CLIENT_ID.substring(0, 8)}...` : '❌ 未设置');
console.log('SESSION_SECRET:', env.SESSION_SECRET ? `${env.SESSION_SECRET.substring(0, 8)}...` : '❌ 未设置');

// 测试KieAI实例化
try {
  if (env.KIEAI_APIKEY) {
    console.log('\n✅ KIEAI_APIKEY 可用，可以创建KieAI实例');
    // 这里不实际创建实例，只是验证密钥存在
  } else {
    console.log('\n❌ KIEAI_APIKEY 不可用，无法创建KieAI实例');
  }
} catch (error) {
  console.error('❌ 测试过程中出现错误:', error);
}

console.log('\n=== 测试完成 ===');