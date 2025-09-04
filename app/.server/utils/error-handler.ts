/**
 * 错误处理工具函数
 * 提供统一的错误处理和响应格式化功能
 * 兼容新的标准化错误类型系统
 */

import { BaseError, isStandardError, type ErrorDetails } from '../types/errors';

/**
 * 错误响应接口
 */
export interface ErrorResponse {
  success: false;
  error: ErrorDetails;
  requestId?: string;
}

/**
 * 成功响应接口
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  requestId?: string;
}

/**
 * API 响应类型
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * 兼容性：保留旧的错误类（已废弃，建议使用新的标准化错误类型）
 * @deprecated 请使用 app/.server/types/errors.ts 中的标准化错误类型
 */
export class NanoBananaError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "NanoBananaError";
  }
}

/**
 * 错误代码映射表
 */
export const ERROR_CODES = {
  // 认证相关错误
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_API_KEY: "INVALID_API_KEY",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  
  // 请求参数错误
  INVALID_REQUEST: "INVALID_REQUEST",
  MISSING_REQUIRED_PARAM: "MISSING_REQUIRED_PARAM",
  INVALID_FILE_FORMAT: "INVALID_FILE_FORMAT",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  PROMPT_TOO_LONG: "PROMPT_TOO_LONG",
  
  // 业务逻辑错误
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  TASK_NOT_FOUND: "TASK_NOT_FOUND",
  TASK_ALREADY_COMPLETED: "TASK_ALREADY_COMPLETED",
  
  // 服务相关错误
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  NETWORK_ERROR: "NETWORK_ERROR",
  
  // 系统错误
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  TIMEOUT: "TIMEOUT",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

/**
 * 用户友好的错误信息映射
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: {
    title: "身份验证失败",
    message: "请先登录后再试",
    action: "重新登录",
    severity: "warning" as const
  },
  [ERROR_CODES.INVALID_API_KEY]: {
    title: "API密钥无效",
    message: "服务配置异常，请联系管理员",
    action: "联系支持",
    severity: "error" as const
  },
  [ERROR_CODES.SESSION_EXPIRED]: {
    title: "登录已过期",
    message: "请重新登录以继续使用",
    action: "重新登录",
    severity: "warning" as const
  },
  [ERROR_CODES.INVALID_REQUEST]: {
    title: "请求参数错误",
    message: "请检查输入信息是否完整和正确",
    action: "检查输入",
    severity: "warning" as const
  },
  [ERROR_CODES.MISSING_REQUIRED_PARAM]: {
    title: "缺少必要参数",
    message: "请填写所有必需的信息",
    action: "完善信息",
    severity: "warning" as const
  },
  [ERROR_CODES.INVALID_FILE_FORMAT]: {
    title: "文件格式不支持",
    message: "请上传JPEG、PNG或WEBP格式的图片",
    action: "更换文件",
    severity: "warning" as const
  },
  [ERROR_CODES.FILE_TOO_LARGE]: {
    title: "文件过大",
    message: "图片大小不能超过10MB",
    action: "压缩图片",
    severity: "warning" as const
  },
  [ERROR_CODES.PROMPT_TOO_LONG]: {
    title: "提示词过长",
    message: "提示词不能超过5000个字符",
    action: "缩短描述",
    severity: "warning" as const
  },
  [ERROR_CODES.INSUFFICIENT_CREDITS]: {
    title: "积分不足",
    message: "您的积分余额不足，请充值后再试",
    action: "立即充值",
    severity: "info" as const
  },
  [ERROR_CODES.TASK_NOT_FOUND]: {
    title: "任务不存在",
    message: "找不到指定的生成任务",
    action: "重新生成",
    severity: "warning" as const
  },
  [ERROR_CODES.TASK_ALREADY_COMPLETED]: {
    title: "任务已完成",
    message: "该任务已经完成，无法重复执行",
    action: "查看结果",
    severity: "info" as const
  },
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
    title: "请求频率过高",
    message: "请稍后再试，避免频繁请求",
    action: "稍后重试",
    severity: "warning" as const
  },
  [ERROR_CODES.SERVICE_UNAVAILABLE]: {
    title: "服务暂不可用",
    message: "AI服务暂时不可用，请稍后重试",
    action: "稍后重试",
    severity: "error" as const
  },
  [ERROR_CODES.AI_GENERATION_FAILED]: {
    title: "AI生成失败",
    message: "图像生成过程中出现问题，请重试",
    action: "重新生成",
    severity: "error" as const
  },
  [ERROR_CODES.NETWORK_ERROR]: {
    title: "网络连接错误",
    message: "请检查网络连接后重试",
    action: "检查网络",
    severity: "error" as const
  },
  [ERROR_CODES.UNKNOWN_ERROR]: {
    title: "未知错误",
    message: "发生了未知错误，请稍后重试",
    action: "重试",
    severity: "error" as const
  },
  [ERROR_CODES.TIMEOUT]: {
    title: "请求超时",
    message: "服务响应超时，请稍后重试",
    action: "重试",
    severity: "warning" as const
  },
  [ERROR_CODES.DATABASE_ERROR]: {
    title: "数据库错误",
    message: "数据保存失败，请重试",
    action: "重试",
    severity: "error" as const
  }
} as const;

/**
 * HTTP状态码到错误代码的映射
 */
export const HTTP_STATUS_TO_ERROR_CODE = {
  400: ERROR_CODES.INVALID_REQUEST,
  401: ERROR_CODES.UNAUTHORIZED,
  402: ERROR_CODES.INSUFFICIENT_CREDITS,
  403: ERROR_CODES.UNAUTHORIZED,
  404: ERROR_CODES.TASK_NOT_FOUND,
  413: ERROR_CODES.FILE_TOO_LARGE,
  429: ERROR_CODES.RATE_LIMIT_EXCEEDED,
  500: ERROR_CODES.UNKNOWN_ERROR,
  502: ERROR_CODES.SERVICE_UNAVAILABLE,
  503: ERROR_CODES.SERVICE_UNAVAILABLE,
  504: ERROR_CODES.TIMEOUT,
} as const;

/**
 * 错误处理器类 - 支持新的标准化错误类型
 */
export class ErrorHandler {
  /**
   * 处理错误并返回标准化的错误响应
   * @param error - 错误对象
   * @param requestId - 请求ID（用于日志追踪）
   * @param context - 额外的上下文信息
   * @returns 标准化的错误响应
   */
  static handleError(
    error: unknown,
    requestId?: string,
    context?: Record<string, any>
  ): ErrorResponse {
    let standardError: BaseError;

    // 如果是标准化错误，直接使用
    if (isStandardError(error)) {
      standardError = error;
    } else {
      // 将非标准错误转换为通用错误
      standardError = this.convertToStandardError(error);
    }

    // 记录错误日志
    this.logError(standardError, requestId, context);

    // 返回标准化错误响应
    return {
      success: false,
      error: standardError.toResponse(),
      requestId
    };
  }

  /**
   * 创建成功响应
   * @param data - 响应数据
   * @param requestId - 请求ID
   * @returns 成功响应
   */
  static createSuccessResponse<T>(
    data: T,
    requestId?: string
  ): SuccessResponse<T> {
    return {
      success: true,
      data,
      requestId
    };
  }

  /**
   * 处理HTTP响应错误（兼容旧版本）
   * @deprecated 建议使用 handleError 方法
   */
  static async handleHttpError(response: Response): Promise<never> {
    let errorData: any = {};
    
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      } else {
        errorData.message = await response.text();
      }
    } catch (e) {
      // 无法解析响应体
    }

    const status = response.status;
    const errorCode = HTTP_STATUS_TO_ERROR_CODE[status as keyof typeof HTTP_STATUS_TO_ERROR_CODE] || ERROR_CODES.UNKNOWN_ERROR;
    const message = errorData.message || errorData.error || `HTTP ${status}`;

    throw new NanoBananaError(errorCode, status, message, errorData);
  }

  /**
   * 将非标准错误转换为标准错误
   * @param error - 原始错误
   * @returns 标准化错误
   */
  private static convertToStandardError(error: unknown): BaseError {
    if (error instanceof Error) {
      // 根据错误消息判断错误类型
      const message = error.message.toLowerCase();
      
      if (message.includes('credits insufficient') || message.includes('积分不足')) {
        return new (require('../types/errors').CreditInsufficientError)(0, 2, {
          originalError: error.message
        });
      }
      
      if (message.includes('unauthorized') || message.includes('未登录')) {
        return new (require('../types/errors').UserNotAuthenticatedError)({
          originalError: error.message
        });
      }
      
      if (message.includes('timeout') || message.includes('超时')) {
        return new (require('../types/errors').KieNetworkTimeoutError)(30000, {
          originalError: error.message
        });
      }
      
      if (message.includes('database') || message.includes('数据库')) {
        return new (require('../types/errors').DatabaseConnectionError)({
          originalError: error.message
        });
      }
      
      if (message.includes('file') || message.includes('upload') || message.includes('文件')) {
        return new (require('../types/errors').R2UploadError)('unknown', {
          originalError: error.message
        });
      }
      
      if (message.includes('api') || message.includes('kie')) {
        return new (require('../types/errors').KieInternalError)(error.message, {
          originalError: error.message
        });
      }
    }
    
    // 默认返回通用内部错误
    return new (require('../types/errors').KieInternalError)(
      error instanceof Error ? error.message : String(error),
      { originalError: error }
    );
  }

  /**
   * 记录错误日志
   * @param error - 标准化错误
   * @param requestId - 请求ID
   * @param context - 上下文信息
   */
  private static logError(
    error: BaseError,
    requestId?: string,
    context?: Record<string, any>
  ): void {
    const logData = {
      errorCode: error.code,
      errorMessage: error.message,
      httpStatus: error.httpStatus,
      timestamp: error.timestamp,
      requestId,
      context,
      stack: error.stack,
      details: error.details
    };

    // 根据错误严重程度选择日志级别
    if (error.httpStatus >= 500) {
      console.error(`[${error.code}] ${error.message}`, logData);
    } else if (error.httpStatus >= 400) {
      console.warn(`[${error.code}] ${error.message}`, logData);
    } else {
      console.info(`[${error.code}] ${error.message}`, logData);
    }
  }

  /**
   * 处理网络错误
   */
  static handleNetworkError(error: any): never {
    if (error instanceof NanoBananaError) {
      throw error;
    }

    let errorCode: string = ERROR_CODES.NETWORK_ERROR;
    let message = "网络连接错误";

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      errorCode = ERROR_CODES.NETWORK_ERROR;
      message = "无法连接到服务器";
    } else if (error.name === "TimeoutError") {
      errorCode = ERROR_CODES.TIMEOUT;
      message = "请求超时";
    }

    throw new NanoBananaError(errorCode, 0, message, error);
  }

  /**
   * 处理文件验证错误
   */
  static validateFile(file: File): void {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      throw new NanoBananaError(
        ERROR_CODES.INVALID_FILE_FORMAT,
        400,
        `不支持的文件格式: ${file.type}`,
        { supportedFormats: allowedTypes }
      );
    }

    if (file.size > maxSize) {
      throw new NanoBananaError(
        ERROR_CODES.FILE_TOO_LARGE,
        413,
        `文件大小超过限制: ${Math.round(file.size / 1024 / 1024)}MB`,
        { maxSize, currentSize: file.size }
      );
    }
  }

  /**
   * 处理提示词验证错误
   */
  static validatePrompt(prompt: string): void {
    const maxLength = 5000;

    if (!prompt.trim()) {
      throw new NanoBananaError(
        ERROR_CODES.MISSING_REQUIRED_PARAM,
        400,
        "提示词不能为空"
      );
    }

    if (prompt.length > maxLength) {
      throw new NanoBananaError(
        ERROR_CODES.PROMPT_TOO_LONG,
        400,
        `提示词过长: ${prompt.length}/${maxLength} 字符`,
        { maxLength, currentLength: prompt.length }
      );
    }
  }

  /**
   * 获取用户友好的错误信息
   */
  static getErrorInfo(error: any) {
    if (error instanceof NanoBananaError) {
      const errorInfo = ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
      return {
        ...errorInfo,
        code: error.code,
        details: error.details,
        originalMessage: error.message
      };
    }

    // 处理其他类型的错误
    return {
      ...ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
      code: ERROR_CODES.UNKNOWN_ERROR,
      originalMessage: error.message || "Unknown error"
    };
  }

  /**
   * 统一的错误处理函数
   */
  static handle(error: any): {
    title: string;
    message: string;
    action: string;
    severity: "info" | "warning" | "error";
    code: string;
    details?: any;
  } {
    console.error("Error occurred:", error);
    return this.getErrorInfo(error);
  }

  /**
   * 创建 Response 对象用于 API 返回
   * @param error - 错误对象
   * @param requestId - 请求ID
   * @param context - 上下文信息
   * @returns Response 对象
   */
  static createErrorResponse(
    error: unknown,
    requestId?: string,
    context?: Record<string, any>
  ): Response {
    const errorResponse = this.handleError(error, requestId, context);
    const standardError = isStandardError(error) ? error : this.convertToStandardError(error);
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: standardError.httpStatus,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * 包装异步函数，自动处理错误
   * @param fn - 要包装的异步函数
   * @param requestId - 请求ID
   * @param context - 上下文信息
   * @returns 包装后的函数
   */
  static wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    requestId?: string,
    context?: Record<string, any>
  ) {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        // 如果是标准化错误，直接抛出
        if (isStandardError(error)) {
          throw error;
        }
        
        // 转换为标准化错误后抛出
        const standardError = this.convertToStandardError(error);
        this.logError(standardError, requestId, context);
        throw standardError;
      }
    };
  }

  /**
   * 验证必需参数
   * @param params - 参数对象
   * @param requiredFields - 必需字段列表
   * @throws RequiredParameterMissingError
   */
  static validateRequiredParameters(
    params: Record<string, any>,
    requiredFields: string[]
  ): void {
    for (const field of requiredFields) {
      if (params[field] === undefined || params[field] === null || params[field] === '') {
        throw new (require('../types/errors').RequiredParameterMissingError)(field);
      }
    }
  }

  /**
   * 验证用户积分
   * @param currentBalance - 当前积分余额
   * @param requiredCredits - 需要的积分
   * @throws CreditInsufficientError
   */
  static validateUserCredits(
    currentBalance: number,
    requiredCredits: number
  ): void {
    if (currentBalance < requiredCredits) {
      throw new (require('../types/errors').CreditInsufficientError)(
        currentBalance,
        requiredCredits
      );
    }
  }
}

/**
 * 重试机制工具类
 */
export class RetryHandler {
  /**
   * 带重试的异步函数执行
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      delay?: number;
      backoff?: boolean;
      retryCondition?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = true,
      retryCondition = (error) => error.status !== 401 && error.status !== 403
    } = options;

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // 最后一次尝试失败
        if (attempt === maxRetries) {
          throw error;
        }

        // 检查是否应该重试
        if (!retryCondition(error)) {
          throw error;
        }

        // 计算延迟时间
        const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
        
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${waitTime}ms:`, error);
        
        // 等待指定时间后重试
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError;
  }
}

/**
 * 快捷函数：创建错误响应
 */
export const createErrorResponse = ErrorHandler.createErrorResponse;

/**
 * 快捷函数：创建成功响应
 */
export const createSuccessResponse = ErrorHandler.createSuccessResponse;

/**
 * 快捷函数：处理错误
 */
export const handleError = ErrorHandler.handleError;

/**
 * 快捷函数：包装异步函数
 */
export const wrapAsync = ErrorHandler.wrapAsync;