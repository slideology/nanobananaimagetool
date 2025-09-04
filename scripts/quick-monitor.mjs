#!/usr/bin/env node

/**
 * 快速监控脚本 - 用于开发环境
 * 监控图片生成流程的日志输出
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

// 日志颜色配置
const colors = {
  frontend_data_collection: chalk.blue,
  backend_api_reception: chalk.green,
  business_logic_processing: chalk.yellow,
  kie_ai_api_call: chalk.magenta,
  async_callback_processing: chalk.cyan,
  frontend_status_polling: chalk.red,
  error: chalk.red.bold,
  success: chalk.green.bold,
  info: chalk.white
};

// 步骤名称映射
const stepNames = {
  'frontend_data_collection': '📱 前端数据收集',
  'backend_api_reception': '🔗 后端API接收', 
  'business_logic_processing': '⚙️ 业务逻辑处理',
  'kie_ai_api_call': '🤖 Kie AI调用',
  'async_callback_processing': '🔄 异步回调处理',
  'frontend_status_polling': '⏱️ 前端状态轮询'
};

/**
 * 解析日志行
 */
function parseLogLine(line) {
  try {
    // 尝试解析JSON格式的日志
    if (line.includes('{') && line.includes('}')) {
      const jsonStart = line.indexOf('{');
      const jsonStr = line.substring(jsonStart);
      const logData = JSON.parse(jsonStr);
      return logData;
    }
  } catch (e) {
    // 如果不是JSON格式，返回原始行
    return { message: line, raw: true };
  }
  return null;
}

/**
 * 格式化日志输出
 */
function formatLog(logData) {
  if (logData.raw) {
    return chalk.gray(logData.message);
  }
  
  const timestamp = new Date().toLocaleTimeString();
  const step = logData.step || logData.context || 'unknown';
  const action = logData.action || 'info';
  const message = logData.message || '';
  
  // 选择颜色
  const colorFn = colors[step] || colors.info;
  const stepName = stepNames[step] || step;
  
  // 格式化输出
  let output = `${chalk.gray(timestamp)} ${colorFn(stepName)}`;
  
  if (action !== 'info') {
    output += ` ${chalk.bold(action.toUpperCase())}`;
  }
  
  if (message) {
    output += ` - ${message}`;
  }
  
  // 添加详细信息
  if (logData.data) {
    const details = [];
    
    if (logData.data.taskId) {
      details.push(`任务ID: ${logData.data.taskId}`);
    }
    
    if (logData.data.status) {
      details.push(`状态: ${logData.data.status}`);
    }
    
    if (logData.data.progress !== undefined) {
      details.push(`进度: ${logData.data.progress}%`);
    }
    
    if (logData.data.elapsedTime) {
      details.push(`耗时: ${(logData.data.elapsedTime / 1000).toFixed(1)}s`);
    }
    
    if (details.length > 0) {
      output += ` (${details.join(', ')})`;
    }
  }
  
  return output;
}

/**
 * 启动监控
 */
function startMonitoring() {
  console.log(chalk.bold.blue('🚀 启动图片生成流程监控'));
  console.log(chalk.gray('监控开始时间:'), new Date().toLocaleString());
  console.log(chalk.gray('按 Ctrl+C 停止监控\n'));
  
  // 显示步骤说明
  console.log(chalk.bold('📋 监控步骤说明:'));
  Object.entries(stepNames).forEach(([key, name]) => {
    const colorFn = colors[key] || colors.info;
    console.log(`  ${colorFn(name)}`);
  });
  console.log('');
  
  // 启动开发服务器并监控日志
  const devProcess = spawn('pnpm', ['run', 'dev'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true
  });
  
  // 监控标准输出
  devProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        const logData = parseLogLine(line);
        if (logData) {
          console.log(formatLog(logData));
        } else {
          // 显示原始日志（开发服务器信息等）
          console.log(chalk.gray(line));
        }
      }
    });
  });
  
  // 监控错误输出
  devProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(chalk.red('❌ ERROR:'), line);
      }
    });
  });
  
  // 处理进程退出
  devProcess.on('close', (code) => {
    console.log(chalk.yellow(`\n📊 监控结束，退出码: ${code}`));
  });
  
  // 处理中断信号
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 停止监控...'));
    devProcess.kill('SIGINT');
    process.exit(0);
  });
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(chalk.bold.blue('📖 图片生成流程监控脚本'));
  console.log('');
  console.log(chalk.bold('用法:'));
  console.log('  node scripts/quick-monitor.mjs [选项]');
  console.log('');
  console.log(chalk.bold('选项:'));
  console.log('  --help, -h     显示帮助信息');
  console.log('  --version, -v  显示版本信息');
  console.log('');
  console.log(chalk.bold('功能:'));
  console.log('  🔍 实时监控图片生成流程的七个步骤');
  console.log('  🎨 彩色输出，便于区分不同步骤');
  console.log('  📊 显示任务状态、进度和耗时信息');
  console.log('  ⚡ 自动启动开发服务器');
  console.log('');
  console.log(chalk.bold('监控步骤:'));
  Object.entries(stepNames).forEach(([key, name]) => {
    const colorFn = colors[key] || colors.info;
    console.log(`  ${colorFn(name)}`);
  });
}

// 主程序
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    console.log('图片生成监控脚本 v1.0.0');
    return;
  }
  
  startMonitoring();
}

// 检查是否有chalk依赖
try {
  main();
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('chalk')) {
    console.log('❌ 缺少 chalk 依赖，请运行: pnpm add chalk');
    process.exit(1);
  } else {
    throw error;
  }
}