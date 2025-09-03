/**
 * Nano Banana AI 错误处理工具类
 * 
 * 提供统一的错误处理、分类和用户友好的提示信息
 * 支持多种错误类型的识别和处理
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
 * 错误处理主类
 */
export class ErrorHandler {
  /**
   * 处理HTTP响应错误
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