/**
 * 前端日志记录工具
 * 用于在客户端记录图片生成流程的日志
 */

/**
 * 生成唯一的请求ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 前端日志记录器
 */
export class FrontendLogger {
  private static requestId: string | null = null;

  /**
   * 开始一个新的图片生成请求
   */
  static startImageGeneration(data: {
    mode: 'text-to-image' | 'image-to-image';
    prompt: string;
    hasFile: boolean;
    style?: string;
    model?: string;
    userId?: string;
  }): string {
    const requestId = generateRequestId();
    this.requestId = requestId;

    // 记录前端数据收集开始
    this.logStep('frontend_data_collection', 'start', {
      requestId,
      timestamp: new Date().toISOString(),
      step: 'frontend_data_collection',
      action: 'start',
      data: {
        mode: data.mode,
        promptLength: data.prompt.length,
        hasFile: data.hasFile,
        style: data.style,
        model: data.model,
        userId: data.userId,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    });

    return requestId;
  }

  /**
   * 记录前端数据收集完成
   */
  static completeDataCollection(data: {
    formDataSize?: number;
    validationErrors?: string[];
    processingTime?: number;
  }) {
    if (!this.requestId) return;

    this.logStep('frontend_data_collection', 'complete', {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      step: 'frontend_data_collection',
      action: 'complete',
      data: {
        formDataSize: data.formDataSize,
        validationErrors: data.validationErrors,
        processingTime: data.processingTime,
        success: !data.validationErrors || data.validationErrors.length === 0
      }
    });
  }

  /**
   * 记录前端数据收集错误
   */
  static logDataCollectionError(error: {
    type: string;
    message: string;
    code?: string;
    details?: any;
  }) {
    if (!this.requestId) return;

    this.logStep('frontend_data_collection', 'error', {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      step: 'frontend_data_collection',
      action: 'error',
      error: {
        type: error.type,
        message: error.message,
        code: error.code,
        details: error.details
      }
    });
  }

  /**
   * 记录API请求开始
   */
  static logApiRequestStart(data: {
    url: string;
    method: string;
    headers?: Record<string, string>;
  }) {
    if (!this.requestId) return;

    this.logStep('api_request', 'start', {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      step: 'api_request',
      action: 'start',
      data: {
        url: data.url,
        method: data.method,
        headers: data.headers
      }
    });
  }

  /**
   * 记录API请求完成
   */
  static logApiRequestComplete(data: {
    status: number;
    responseTime: number;
    responseSize?: number;
    success: boolean;
  }) {
    if (!this.requestId) return;

    this.logStep('api_request', 'complete', {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      step: 'api_request',
      action: 'complete',
      data: {
        status: data.status,
        responseTime: data.responseTime,
        responseSize: data.responseSize,
        success: data.success
      }
    });
  }

  /**
   * 记录状态轮询开始
   */
  static logPollingStart(data: {
    taskId: string;
    pollInterval: number;
  }) {
    if (!this.requestId) return;

    this.logStep('status_polling', 'start', {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      step: 'status_polling',
      action: 'start',
      data: {
        taskId: data.taskId,
        pollInterval: data.pollInterval
      }
    });
  }

  /**
   * 记录轮询状态更新
   */
  static logPollingUpdate(data: {
    taskId: string;
    status: string;
    progress?: number;
    pollCount: number;
    elapsedTime: number;
  }) {
    if (!this.requestId) return;

    this.logStep('status_polling', 'update', {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      step: 'status_polling',
      action: 'update',
      data: {
        taskId: data.taskId,
        status: data.status,
        progress: data.progress,
        pollCount: data.pollCount,
        elapsedTime: data.elapsedTime
      }
    });
  }

  /**
   * 记录轮询完成
   */
  static logPollingComplete(data: {
    taskId: string;
    finalStatus: string;
    totalPollCount: number;
    totalTime: number;
    success: boolean;
    resultUrl?: string;
  }) {
    if (!this.requestId) return;

    this.logStep('status_polling', 'complete', {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      step: 'status_polling',
      action: 'complete',
      data: {
        taskId: data.taskId,
        finalStatus: data.finalStatus,
        totalPollCount: data.totalPollCount,
        totalTime: data.totalTime,
        success: data.success,
        resultUrl: data.resultUrl
      }
    });
  }

  /**
   * 记录轮询超时
   */
  static logPollingTimeout(data: {
    taskId: string;
    pollCount: number;
    elapsedTime: number;
  }) {
    if (!this.requestId) return;

    this.logStep('status_polling', 'timeout', {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      step: 'status_polling',
      action: 'timeout',
      data: {
        taskId: data.taskId,
        pollCount: data.pollCount,
        elapsedTime: data.elapsedTime
      }
    });
  }

  /**
   * 获取当前请求ID
   */
  static getCurrentRequestId(): string | null {
    return this.requestId;
  }

  /**
   * 清理当前请求
   */
  static cleanup() {
    this.requestId = null;
  }

  /**
   * 日志记录方法
   */
  static logStep(step: string, action: string, data: any) {
    // 在开发环境中输出到控制台
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ImageGen-${step}] ${action}:`, data);
    }

    // 发送到服务端日志收集接口（如果需要）
    this.sendToServer(data).catch(error => {
      console.warn('Failed to send log to server:', error);
    });
  }

  /**
   * 发送日志到服务端
   */
  private static async sendToServer(logData: any) {
    try {
      // 这里可以发送到专门的日志收集接口
      await fetch('/api/logs/frontend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      // 静默失败，不影响主要功能
    }
  }
}

/**
 * 性能监控装饰器
 */
export function withPerformanceLogging<T extends (...args: any[]) => any>(
  fn: T,
  stepName: string
): T {
  return ((...args: any[]) => {
    const startTime = performance.now();
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const endTime = performance.now();
        FrontendLogger.logStep(stepName, 'performance', {
          requestId: FrontendLogger.getCurrentRequestId(),
          timestamp: new Date().toISOString(),
          step: stepName,
          action: 'performance',
          data: {
            duration: endTime - startTime,
            functionName: fn.name
          }
        });
      });
    } else {
      const endTime = performance.now();
      FrontendLogger.logStep(stepName, 'performance', {
        requestId: FrontendLogger.getCurrentRequestId(),
        timestamp: new Date().toISOString(),
        step: stepName,
        action: 'performance',
        data: {
          duration: endTime - startTime,
          functionName: fn.name
        }
      });
      return result;
    }
  }) as T;
}