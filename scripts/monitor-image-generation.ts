/**
 * 图片生成流程监控脚本
 * 用于查看和分析七步骤日志监控数据
 */

import { Logger } from '../app/.server/utils/logger';

// 日志类型定义
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context: string;
  details: any;
  requestId: string;
}

interface StepLog {
  step: string;
  action: string;
  timestamp: string;
  requestId: string;
  data: any;
}

// 监控脚本类
class ImageGenerationMonitor {
  private logs: LogEntry[] = [];
  
  /**
   * 模拟获取日志数据（实际项目中应该从日志存储系统获取）
   */
  private async fetchLogs(): Promise<LogEntry[]> {
    // 这里应该连接到实际的日志存储系统
    // 比如 Cloudflare Analytics、外部日志服务等
    console.log('📊 正在获取日志数据...');
    
    // 模拟日志数据
    return [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Frontend data collection started',
        context: 'frontend_data_collection',
        details: { step: 'data_collection', action: 'start' },
        requestId: 'req_123456'
      }
    ];
  }
  
  /**
   * 按请求ID分组日志
   */
  private groupLogsByRequestId(logs: LogEntry[]): Map<string, LogEntry[]> {
    const grouped = new Map<string, LogEntry[]>();
    
    logs.forEach(log => {
      if (!grouped.has(log.requestId)) {
        grouped.set(log.requestId, []);
      }
      grouped.get(log.requestId)!.push(log);
    });
    
    return grouped;
  }
  
  /**
   * 分析单个请求的流程
   */
  private analyzeRequestFlow(requestId: string, logs: LogEntry[]): void {
    console.log(`\n🔍 分析请求: ${requestId}`);
    console.log('=' .repeat(50));
    
    const steps = [
      'frontend_data_collection',
      'backend_api_reception', 
      'business_logic_processing',
      'kie_ai_api_call',
      'async_callback_processing',
      'frontend_status_polling'
    ];
    
    const stepLogs = new Map<string, LogEntry[]>();
    
    // 按步骤分组日志
    logs.forEach(log => {
      const step = log.context;
      if (!stepLogs.has(step)) {
        stepLogs.set(step, []);
      }
      stepLogs.get(step)!.push(log);
    });
    
    // 分析每个步骤
    steps.forEach((step, index) => {
      const stepLogEntries = stepLogs.get(step) || [];
      console.log(`\n${index + 1}. ${this.getStepName(step)}`);
      
      if (stepLogEntries.length === 0) {
        console.log('   ❌ 未找到日志记录');
        return;
      }
      
      stepLogEntries.forEach(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        console.log(`   📝 ${time} - ${log.message}`);
        
        if (log.details && typeof log.details === 'object') {
          Object.entries(log.details).forEach(([key, value]) => {
            console.log(`      ${key}: ${JSON.stringify(value)}`);
          });
        }
      });
    });
  }
  
  /**
   * 获取步骤的中文名称
   */
  private getStepName(step: string): string {
    const stepNames: Record<string, string> = {
      'frontend_data_collection': '前端数据收集',
      'backend_api_reception': '后端API接收',
      'business_logic_processing': '业务逻辑处理',
      'kie_ai_api_call': 'Kie AI调用',
      'async_callback_processing': '异步回调处理',
      'frontend_status_polling': '前端状态轮询'
    };
    
    return stepNames[step] || step;
  }
  
  /**
   * 生成性能统计报告
   */
  private generatePerformanceReport(logs: LogEntry[]): void {
    console.log('\n📈 性能统计报告');
    console.log('=' .repeat(50));
    
    const requestGroups = this.groupLogsByRequestId(logs);
    
    console.log(`总请求数: ${requestGroups.size}`);
    
    // 计算平均处理时间
    const processingTimes: number[] = [];
    
    requestGroups.forEach((requestLogs, requestId) => {
      const startLog = requestLogs.find(log => 
        log.context === 'frontend_data_collection' && 
        log.message.includes('start')
      );
      
      const endLog = requestLogs.find(log => 
        log.context === 'frontend_status_polling' && 
        log.message.includes('complete')
      );
      
      if (startLog && endLog) {
        const startTime = new Date(startLog.timestamp).getTime();
        const endTime = new Date(endLog.timestamp).getTime();
        const duration = endTime - startTime;
        processingTimes.push(duration);
      }
    });
    
    if (processingTimes.length > 0) {
      const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      const maxTime = Math.max(...processingTimes);
      const minTime = Math.min(...processingTimes);
      
      console.log(`平均处理时间: ${(avgTime / 1000).toFixed(2)}秒`);
      console.log(`最长处理时间: ${(maxTime / 1000).toFixed(2)}秒`);
      console.log(`最短处理时间: ${(minTime / 1000).toFixed(2)}秒`);
    }
  }
  
  /**
   * 检查错误和异常
   */
  private checkErrorsAndExceptions(logs: LogEntry[]): void {
    console.log('\n🚨 错误和异常检查');
    console.log('=' .repeat(50));
    
    const errorLogs = logs.filter(log => 
      log.level === 'error' || log.message.includes('error') || log.message.includes('failed')
    );
    
    if (errorLogs.length === 0) {
      console.log('✅ 未发现错误或异常');
      return;
    }
    
    console.log(`❌ 发现 ${errorLogs.length} 个错误或异常:`);
    
    errorLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${new Date(log.timestamp).toLocaleString()}`);
      console.log(`   请求ID: ${log.requestId}`);
      console.log(`   步骤: ${this.getStepName(log.context)}`);
      console.log(`   错误: ${log.message}`);
      
      if (log.details) {
        console.log(`   详情: ${JSON.stringify(log.details, null, 2)}`);
      }
    });
  }
  
  /**
   * 主监控方法
   */
  public async monitor(): Promise<void> {
    try {
      console.log('🚀 启动图片生成流程监控');
      console.log('时间:', new Date().toLocaleString());
      
      // 获取日志数据
      this.logs = await this.fetchLogs();
      
      if (this.logs.length === 0) {
        console.log('\n📭 暂无日志数据');
        return;
      }
      
      // 按请求分组分析
      const requestGroups = this.groupLogsByRequestId(this.logs);
      
      // 分析每个请求的流程
      requestGroups.forEach((logs, requestId) => {
        this.analyzeRequestFlow(requestId, logs);
      });
      
      // 生成性能报告
      this.generatePerformanceReport(this.logs);
      
      // 检查错误
      this.checkErrorsAndExceptions(this.logs);
      
      console.log('\n✅ 监控完成');
      
    } catch (error) {
      console.error('❌ 监控过程中发生错误:', error);
    }
  }
  
  /**
   * 实时监控模式
   */
  public startRealTimeMonitoring(intervalMs: number = 30000): void {
    console.log(`🔄 启动实时监控模式 (间隔: ${intervalMs/1000}秒)`);
    
    // 立即执行一次
    this.monitor();
    
    // 定时执行
    setInterval(() => {
      console.log('\n' + '='.repeat(80));
      console.log('🔄 实时监控更新');
      this.monitor();
    }, intervalMs);
  }
}

// 导出监控类
export { ImageGenerationMonitor };

// 如果直接运行此脚本
if (require.main === module) {
  const monitor = new ImageGenerationMonitor();
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  
  if (args.includes('--realtime')) {
    // 实时监控模式
    const interval = parseInt(args[args.indexOf('--interval') + 1]) || 30000;
    monitor.startRealTimeMonitoring(interval);
  } else {
    // 单次监控
    monitor.monitor();
  }
}