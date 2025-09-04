/**
 * 图片生成流程监控系统
 * 为图片生成的七个关键步骤提供详细的日志打点和性能监控
 */

import { Logger } from './logger';

/**
 * 图片生成流程的七个步骤枚举
 */
export enum ImageGenerationStep {
  FRONTEND_DATA_COLLECTION = 'frontend_data_collection',     // 第一步：前端数据收集
  BACKEND_API_RECEPTION = 'backend_api_reception',           // 第二步：后端API接收
  BUSINESS_LOGIC_PROCESSING = 'business_logic_processing',   // 第三步：业务逻辑处理
  KIE_AI_KEY_RETRIEVAL = 'kie_ai_key_retrieval',           // 第四步：Kie AI密钥获取
  KIE_AI_API_CALL = 'kie_ai_api_call',                     // 第五步：调用Kie AI API
  ASYNC_CALLBACK_HANDLING = 'async_callback_handling',      // 第六步：异步回调处理
  FRONTEND_STATUS_POLLING = 'frontend_status_polling'       // 第七步：前端状态轮询
}

/**
 * 图片生成任务的详细信息接口
 */
interface ImageGenerationTaskInfo {
  taskId?: string;
  userId?: string;
  mode: 'text-to-image' | 'image-to-image';
  type: 'nano-banana' | 'nano-banana-edit';
  prompt: string;
  imageUrl?: string;
  style?: string;
  requestId: string;
}

/**
 * 步骤执行结果接口
 */
interface StepResult {
  success: boolean;
  duration: number;
  data?: any;
  error?: any;
  metadata?: Record<string, any>;
}

/**
 * 图片生成流程监控器
 */
export class ImageGenerationMonitor {
  private static instance: ImageGenerationMonitor;
  private activeRequests = new Map<string, {
    taskInfo: ImageGenerationTaskInfo;
    startTime: number;
    stepTimes: Map<ImageGenerationStep, number>;
    stepResults: Map<ImageGenerationStep, StepResult>;
  }>();

  /**
   * 获取监控器单例实例
   */
  static getInstance(): ImageGenerationMonitor {
    if (!this.instance) {
      this.instance = new ImageGenerationMonitor();
    }
    return this.instance;
  }

  /**
   * 开始监控一个新的图片生成请求
   */
  startRequest(taskInfo: ImageGenerationTaskInfo): void {
    const logger = Logger.createContext(taskInfo.requestId);
    
    this.activeRequests.set(taskInfo.requestId, {
      taskInfo,
      startTime: Date.now(),
      stepTimes: new Map(),
      stepResults: new Map()
    });

    logger.info(
      '🚀 开始图片生成流程监控',
      'image-generation-monitor',
      {
        requestId: taskInfo.requestId,
        userId: taskInfo.userId,
        mode: taskInfo.mode,
        type: taskInfo.type,
        prompt: taskInfo.prompt.substring(0, 100) + (taskInfo.prompt.length > 100 ? '...' : ''),
        hasImage: !!taskInfo.imageUrl,
        style: taskInfo.style
      }
    );
  }

  /**
   * 记录步骤开始
   */
  stepStart(requestId: string, step: ImageGenerationStep, metadata?: Record<string, any>): void {
    const request = this.activeRequests.get(requestId);
    if (!request) {
      Logger.warn('未找到对应的请求记录', 'image-generation-monitor', { requestId, step });
      return;
    }

    const logger = Logger.createContext(requestId);
    request.stepTimes.set(step, Date.now());

    const stepDescriptions = {
      [ImageGenerationStep.FRONTEND_DATA_COLLECTION]: '📱 前端数据收集',
      [ImageGenerationStep.BACKEND_API_RECEPTION]: '🌐 后端API接收',
      [ImageGenerationStep.BUSINESS_LOGIC_PROCESSING]: '💼 业务逻辑处理',
      [ImageGenerationStep.KIE_AI_KEY_RETRIEVAL]: '🔑 Kie AI密钥获取',
      [ImageGenerationStep.KIE_AI_API_CALL]: '🚀 调用Kie AI API',
      [ImageGenerationStep.ASYNC_CALLBACK_HANDLING]: '📡 异步回调处理',
      [ImageGenerationStep.FRONTEND_STATUS_POLLING]: '🔄 前端状态轮询'
    };

    logger.info(
      `${stepDescriptions[step]} - 开始`,
      'image-generation-step',
      {
        step,
        stepNumber: Object.values(ImageGenerationStep).indexOf(step) + 1,
        totalSteps: Object.values(ImageGenerationStep).length,
        taskInfo: {
          mode: request.taskInfo.mode,
          type: request.taskInfo.type,
          userId: request.taskInfo.userId
        },
        metadata
      }
    );
  }

  /**
   * 记录步骤完成
   */
  stepComplete(
    requestId: string, 
    step: ImageGenerationStep, 
    result: Omit<StepResult, 'duration'>
  ): void {
    const request = this.activeRequests.get(requestId);
    if (!request) {
      Logger.warn('未找到对应的请求记录', 'image-generation-monitor', { requestId, step });
      return;
    }

    const stepStartTime = request.stepTimes.get(step);
    if (!stepStartTime) {
      Logger.warn('未找到步骤开始时间', 'image-generation-monitor', { requestId, step });
      return;
    }

    const duration = Date.now() - stepStartTime;
    const stepResult: StepResult = { ...result, duration };
    request.stepResults.set(step, stepResult);

    const logger = Logger.createContext(requestId);
    const stepDescriptions = {
      [ImageGenerationStep.FRONTEND_DATA_COLLECTION]: '📱 前端数据收集',
      [ImageGenerationStep.BACKEND_API_RECEPTION]: '🌐 后端API接收',
      [ImageGenerationStep.BUSINESS_LOGIC_PROCESSING]: '💼 业务逻辑处理',
      [ImageGenerationStep.KIE_AI_KEY_RETRIEVAL]: '🔑 Kie AI密钥获取',
      [ImageGenerationStep.KIE_AI_API_CALL]: '🚀 调用Kie AI API',
      [ImageGenerationStep.ASYNC_CALLBACK_HANDLING]: '📡 异步回调处理',
      [ImageGenerationStep.FRONTEND_STATUS_POLLING]: '🔄 前端状态轮询'
    };

    const logLevel = result.success ? 'info' : 'error';
    const status = result.success ? '✅ 完成' : '❌ 失败';

    logger[logLevel](
      `${stepDescriptions[step]} - ${status} (${duration}ms)`,
      'image-generation-step',
      {
        step,
        stepNumber: Object.values(ImageGenerationStep).indexOf(step) + 1,
        success: result.success,
        duration,
        data: result.data,
        error: result.error,
        metadata: result.metadata,
        taskInfo: {
          mode: request.taskInfo.mode,
          type: request.taskInfo.type,
          userId: request.taskInfo.userId,
          taskId: request.taskInfo.taskId
        }
      }
    );

    // 如果是最后一步或者出现错误，生成完整的流程报告
    if (step === ImageGenerationStep.FRONTEND_STATUS_POLLING || !result.success) {
      this.generateFlowReport(requestId);
    }
  }

  /**
   * 记录步骤错误
   */
  stepError(
    requestId: string, 
    step: ImageGenerationStep, 
    error: any, 
    metadata?: Record<string, any>
  ): void {
    this.stepComplete(requestId, step, {
      success: false,
      error,
      metadata
    });
  }

  /**
   * 更新任务ID（当从Kie AI获取到taskId时）
   */
  updateTaskId(requestId: string, taskId: string): void {
    const request = this.activeRequests.get(requestId);
    if (request) {
      request.taskInfo.taskId = taskId;
      
      const logger = Logger.createContext(requestId);
      logger.info(
        '🆔 任务ID已更新',
        'image-generation-monitor',
        { requestId, taskId }
      );
    }
  }

  /**
   * 生成完整的流程报告
   */
  private generateFlowReport(requestId: string): void {
    const request = this.activeRequests.get(requestId);
    if (!request) return;

    const logger = Logger.createContext(requestId);
    const totalDuration = Date.now() - request.startTime;
    
    const stepSummary = Object.values(ImageGenerationStep).map(step => {
      const result = request.stepResults.get(step);
      return {
        step,
        completed: !!result,
        success: result?.success ?? false,
        duration: result?.duration ?? 0,
        error: result?.error ? (result.error instanceof Error ? result.error.message : String(result.error)) : undefined
      };
    });

    const completedSteps = stepSummary.filter(s => s.completed).length;
    const successfulSteps = stepSummary.filter(s => s.success).length;
    const totalStepDuration = stepSummary.reduce((sum, s) => sum + s.duration, 0);
    
    const overallSuccess = stepSummary.every(s => !s.completed || s.success);
    
    logger.info(
      `📊 图片生成流程报告 - ${overallSuccess ? '✅ 成功' : '❌ 失败'}`,
      'image-generation-flow-report',
      {
        requestId,
        taskId: request.taskInfo.taskId,
        userId: request.taskInfo.userId,
        mode: request.taskInfo.mode,
        type: request.taskInfo.type,
        overallSuccess,
        totalDuration,
        stepDuration: totalStepDuration,
        waitingTime: totalDuration - totalStepDuration,
        completedSteps: `${completedSteps}/${Object.values(ImageGenerationStep).length}`,
        successfulSteps: `${successfulSteps}/${completedSteps}`,
        stepDetails: stepSummary,
        performance: {
          avgStepDuration: completedSteps > 0 ? Math.round(totalStepDuration / completedSteps) : 0,
          slowestStep: stepSummary.reduce((slowest, current) => 
            current.duration > slowest.duration ? current : slowest, 
            { step: 'none', duration: 0 }
          )
        }
      }
    );

    // 清理已完成的请求记录
    this.activeRequests.delete(requestId);
  }

  /**
   * 获取当前活跃请求的统计信息
   */
  getActiveRequestsStats(): {
    totalActive: number;
    byStep: Record<string, number>;
    byMode: Record<string, number>;
    byType: Record<string, number>;
  } {
    const stats = {
      totalActive: this.activeRequests.size,
      byStep: {} as Record<string, number>,
      byMode: {} as Record<string, number>,
      byType: {} as Record<string, number>
    };

    for (const [, request] of this.activeRequests) {
      // 统计当前步骤
      const currentStep = this.getCurrentStep(request);
      stats.byStep[currentStep] = (stats.byStep[currentStep] || 0) + 1;
      
      // 统计模式
      stats.byMode[request.taskInfo.mode] = (stats.byMode[request.taskInfo.mode] || 0) + 1;
      
      // 统计类型
      stats.byType[request.taskInfo.type] = (stats.byType[request.taskInfo.type] || 0) + 1;
    }

    return stats;
  }

  /**
   * 获取请求当前所在的步骤
   */
  private getCurrentStep(request: any): string {
    const steps = Object.values(ImageGenerationStep);
    for (let i = steps.length - 1; i >= 0; i--) {
      if (request.stepResults.has(steps[i])) {
        return i < steps.length - 1 ? steps[i + 1] : steps[i];
      }
    }
    return steps[0]; // 如果没有完成任何步骤，返回第一步
  }

  /**
   * 强制清理超时的请求（超过30分钟）
   */
  cleanupTimeoutRequests(): void {
    const timeout = 30 * 60 * 1000; // 30分钟
    const now = Date.now();
    
    for (const [requestId, request] of this.activeRequests) {
      if (now - request.startTime > timeout) {
        Logger.warn(
          '🧹 清理超时请求',
          'image-generation-monitor',
          {
            requestId,
            taskId: request.taskInfo.taskId,
            duration: now - request.startTime,
            timeout
          }
        );
        this.activeRequests.delete(requestId);
      }
    }
  }
}

/**
 * 便捷的监控函数，用于在各个步骤中快速添加监控
 */
export const monitor = ImageGenerationMonitor.getInstance();

/**
 * 步骤监控装饰器
 * 自动为函数添加步骤开始和完成的监控
 */
export function monitorStep(step: ImageGenerationStep) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // 尝试从参数中提取requestId
      let requestId: string | undefined;
      
      // 常见的requestId提取方式
      if (args[0]?.requestId) {
        requestId = args[0].requestId;
      } else if (args[1]?.requestId) {
        requestId = args[1].requestId;
      } else if (typeof args[0] === 'string' && args[0].startsWith('req_')) {
        requestId = args[0];
      }
      
      if (!requestId) {
        requestId = Logger.generateRequestId();
      }
      
      monitor.stepStart(requestId, step, {
        method: `${target.constructor.name}.${propertyName}`,
        args: args.length
      });
      
      try {
        const result = await method.apply(this, args);
        
        monitor.stepComplete(requestId, step, {
          success: true,
          data: result ? '结果已省略' : undefined
        });
        
        return result;
      } catch (error) {
        monitor.stepError(requestId, step, error, {
          method: `${target.constructor.name}.${propertyName}`
        });
        
        throw error;
      }
    };
  };
}

/**
 * 导出常用的监控方法
 */
export type {
  ImageGenerationTaskInfo,
  StepResult
};