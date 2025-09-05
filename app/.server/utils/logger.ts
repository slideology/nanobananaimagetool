/**
 * 增强的结构化日志记录器
 * 用于统一处理应用程序日志记录和错误跟踪
 */

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: string;
  userId?: string;
  requestId: string;
  details?: any;
  environment?: string;
  userAgent?: string;
  url?: string;
  duration?: number;
}

interface ApiCallLog extends LogEntry {
  apiEndpoint: string;
  method: string;
  statusCode?: number;
  responseTime?: number;
  requestBody?: any;
  responseBody?: any;
}

export class Logger {
  private static requestIdCounter = 0;
  
  /**
   * 生成请求ID
   */
  static generateRequestId(): string {
    this.requestIdCounter++;
    return `req_${Date.now()}_${this.requestIdCounter}`;
  }
  
  /**
   * 基础日志记录方法
   */
  private static log(entry: LogEntry): void {
    const logData = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
      environment: import.meta.env.PROD ? 'production' : 'development'
    };
    
    // 控制台输出（带颜色和格式化）
    const colors = {
      debug: '\x1b[36m',    // 青色
      info: '\x1b[32m',     // 绿色
      warn: '\x1b[33m',     // 黄色
      error: '\x1b[31m',    // 红色
      reset: '\x1b[0m'      // 重置
    };
    
    const color = colors[entry.level] || colors.reset;
    const prefix = `${color}[${entry.level.toUpperCase()}]${colors.reset}`;
    const contextInfo = `${entry.context}${entry.userId ? ` (User: ${entry.userId})` : ''} [${entry.requestId}]`;
    
    console.log(`${prefix} ${entry.timestamp} ${contextInfo}: ${entry.message}`);
    
    if (entry.details) {
      console.log(`${color}Details:${colors.reset}`, JSON.stringify(entry.details, null, 2));
    }
    
    // 在生产环境中，可以发送到外部日志服务
    if (import.meta.env.PROD && entry.level === 'error') {
      // 这里可以集成 Sentry、LogRocket 等服务
      Logger.sendToExternalService(logData);
    }
  }
  
  /**
   * Debug级别日志
   */
  static debug(message: string, context: string, details?: any, requestId?: string): void {
    this.log({
      level: 'debug',
      message,
      context,
      details,
      requestId: requestId || this.generateRequestId(),
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Info级别日志
   */
  static info(message: string, context: string, details?: any, requestId?: string): void {
    this.log({
      level: 'info',
      message,
      context,
      details,
      requestId: requestId || this.generateRequestId(),
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Warning级别日志
   */
  static warn(message: string, context: string, details?: any, requestId?: string): void {
    this.log({
      level: 'warn',
      message,
      context,
      details,
      requestId: requestId || this.generateRequestId(),
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Error级别日志
   */
  static error(message: string, context: string, error?: any, requestId?: string): void {
    const details = error ? {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      code: error?.code,
      status: error?.status,
      data: error?.data
    } : undefined;
    
    this.log({
      level: 'error',
      message,
      context,
      details,
      requestId: requestId || this.generateRequestId(),
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * API调用专用日志
   */
  static apiCall(
    endpoint: string,
    method: string,
    context: string,
    options: {
      requestId?: string;
      userId?: string;
      requestBody?: any;
      responseBody?: any;
      statusCode?: number;
      duration?: number;
      error?: any;
    } = {}
  ): void {
    const { requestId, userId, requestBody, responseBody, statusCode, duration, error } = options;
    
    const isError = error || (statusCode && statusCode >= 400);
    const level = isError ? 'error' : 'info';
    
    const details: any = {
      endpoint,
      method: method.toUpperCase(),
      ...(requestBody && { requestBody }),
      ...(responseBody && { responseBody }),
      ...(statusCode && { statusCode }),
      ...(duration && { responseTime: `${duration}ms` }),
      ...(error && {
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          type: typeof error
        }
      })
    };
    
    const message = isError 
      ? `API调用失败: ${method.toUpperCase()} ${endpoint}`
      : `API调用成功: ${method.toUpperCase()} ${endpoint}`;
    
    this.log({
      level,
      message,
      context,
      details,
      userId,
      requestId: requestId || this.generateRequestId(),
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * 用户操作日志
   */
  static userAction(
    userId: string,
    action: string,
    context: string,
    details?: any,
    requestId?: string
  ): void {
    this.info(
      `用户操作: ${action}`,
      context,
      { ...details, userId },
      requestId
    );
  }
  
  /**
   * 性能监控日志
   */
  static performance(
    operation: string,
    duration: number,
    context: string,
    details?: any,
    requestId?: string
  ): void {
    const level = duration > 5000 ? 'warn' : 'info'; // 超过5秒警告
    
    this.log({
      level,
      message: `性能监控: ${operation} 耗时 ${duration}ms`,
      context,
      details: { ...details, duration },
      requestId: requestId || this.generateRequestId(),
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * 发送到外部服务（生产环境）
   */
  private static sendToExternalService(logData: LogEntry): void {
    // 这里可以实现发送到外部日志服务的逻辑
    // 例如：Sentry、LogRocket、DataDog 等
    try {
      // 示例：发送到 webhook 或 API
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logData)
      // }).catch(() => {});
    } catch (e) {
      // 静默处理外部服务错误，避免影响主流程
    }
  }
  
  /**
   * 创建带请求ID的日志上下文
   */
  static createContext(requestId?: string) {
    const id = requestId || this.generateRequestId();
    
    return {
      requestId: id,
      debug: (message: string, context: string, details?: any) => 
        this.debug(message, context, details, id),
      info: (message: string, context: string, details?: any) => 
        this.info(message, context, details, id),
      warn: (message: string, context: string, details?: any) => 
        this.warn(message, context, details, id),
      error: (message: string, context: string, error?: any) => 
        this.error(message, context, error, id),
      apiCall: (endpoint: string, method: string, context: string, options: any = {}) =>
        this.apiCall(endpoint, method, context, { ...options, requestId: id }),
      userAction: (userId: string, action: string, context: string, details?: any) =>
        this.userAction(userId, action, context, details, id),
      performance: (operation: string, duration: number, context: string, details?: any) =>
        this.performance(operation, duration, context, details, id)
    };
  }
}

/**
 * 性能监控装饰器
 */
export function logPerformance(context: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const requestId = Logger.generateRequestId();
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        Logger.performance(
          `${target.constructor.name}.${propertyName}`,
          duration,
          context,
          { args: args.length > 0 ? '参数已省略' : undefined },
          requestId
        );
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        Logger.error(
          `${target.constructor.name}.${propertyName} 执行失败`,
          context,
          error,
          requestId
        );
        
        throw error;
      }
    };
  };
}

/**
 * API调用监控装饰器
 */
export function logApiCall(endpoint: string, method: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const requestId = Logger.generateRequestId();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        Logger.apiCall(
          endpoint,
          method,
          `${target.constructor.name}.${propertyName}`,
          {
            requestId,
            duration,
            statusCode: 200, // 假设成功
            responseBody: result ? '响应已省略' : undefined
          }
        );
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        Logger.apiCall(
          endpoint,
          method,
          `${target.constructor.name}.${propertyName}`,
          {
            requestId,
            duration,
            error,
            statusCode: (error as any)?.status || 500
          }
        );
        
        throw error;
      }
    };
  };
}