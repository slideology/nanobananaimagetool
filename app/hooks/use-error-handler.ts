/**
 * 前端错误处理 Hook
 * 
 * 提供统一的错误处理、用户提示和错误恢复机制
 */

import { useState, useCallback } from "react";

export interface ErrorInfo {
  title: string;
  message: string;
  action: string;
  severity: "info" | "warning" | "error";
  code: string;
  details?: any;
}

export interface UseErrorHandlerOptions {
  onError?: (error: ErrorInfo) => void;
  showToast?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { onError, showToast = true, autoRetry = false, maxRetries = 3 } = options;

  /**
   * 处理错误
   */
  const handleError = useCallback((error: any, context?: string) => {
    const errorInfo = parseError(error, context);
    setError(errorInfo);

    // 调用自定义错误处理函数
    if (onError) {
      onError(errorInfo);
    }

    // 显示用户提示
    if (showToast) {
      showErrorToast(errorInfo);
    }

    // 记录错误日志
    logError(errorInfo, context);

    return errorInfo;
  }, [onError, showToast]);

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  /**
   * 重试机制
   */
  const retry = useCallback(async (fn: () => Promise<any>) => {
    if (isRetrying || retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    try {
      const result = await fn();
      clearError();
      return result;
    } catch (error) {
      setRetryCount(prev => prev + 1);
      handleError(error, "Retry attempt");
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, retryCount, maxRetries, handleError, clearError]);

  /**
   * 包装异步函数，自动处理错误
   */
  const withErrorHandling = useCallback(<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T | undefined> => {
    return fn().catch(error => {
      handleError(error, context);
      return undefined;
    });
  }, [handleError]);

  return {
    error,
    isRetrying,
    retryCount,
    canRetry: retryCount < maxRetries,
    handleError,
    clearError,
    retry,
    withErrorHandling,
  };
}

/**
 * 解析错误对象
 */
function parseError(error: any, context?: string): ErrorInfo {
  // 如果是已经格式化的错误信息
  if (error.title && error.message) {
    return error;
  }

  // 如果是HTTP响应错误
  if (error.status) {
    return parseHttpError(error);
  }

  // 如果是网络错误
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return {
      title: "网络连接错误",
      message: "无法连接到服务器，请检查网络连接",
      action: "检查网络",
      severity: "error",
      code: "NETWORK_ERROR"
    };
  }

  // 默认错误处理
  return {
    title: "操作失败",
    message: error.message || "发生了未知错误",
    action: "重试",
    severity: "error",
    code: "UNKNOWN_ERROR",
    details: context ? { context } : undefined
  };
}

/**
 * 解析HTTP错误
 */
function parseHttpError(error: any): ErrorInfo {
  const status = error.status || 500;
  
  switch (status) {
    case 400:
      return {
        title: "请求参数错误",
        message: "请检查输入信息是否正确",
        action: "检查输入",
        severity: "warning",
        code: "INVALID_REQUEST"
      };
    
    case 401:
      return {
        title: "身份验证失败",
        message: "请先登录后再试",
        action: "重新登录",
        severity: "warning",
        code: "UNAUTHORIZED"
      };
    
    case 402:
      return {
        title: "积分不足",
        message: "您的积分余额不足，请充值后再试",
        action: "立即充值",
        severity: "info",
        code: "INSUFFICIENT_CREDITS"
      };
    
    case 413:
      return {
        title: "文件过大",
        message: "上传的文件超过10MB限制",
        action: "压缩文件",
        severity: "warning",
        code: "FILE_TOO_LARGE"
      };
    
    case 429:
      return {
        title: "请求频率过高",
        message: "请稍后再试，避免频繁请求",
        action: "稍后重试",
        severity: "warning",
        code: "RATE_LIMIT_EXCEEDED"
      };
    
    case 500:
    case 502:
    case 503:
      return {
        title: "服务器错误",
        message: "服务暂时不可用，请稍后重试",
        action: "稍后重试",
        severity: "error",
        code: "SERVICE_UNAVAILABLE"
      };
    
    case 504:
      return {
        title: "请求超时",
        message: "服务响应超时，请稍后重试",
        action: "重试",
        severity: "warning",
        code: "TIMEOUT"
      };
    
    default:
      return {
        title: "网络错误",
        message: `请求失败 (${status})`,
        action: "重试",
        severity: "error",
        code: "HTTP_ERROR"
      };
  }
}

/**
 * 显示错误提示
 */
function showErrorToast(error: ErrorInfo) {
  // 格式化错误信息以便调试
  const errorMessage = `${error.title}: ${error.message} [${error.code}]`;
  console.error("Error Toast:", {
    title: error.title,
    message: error.message,
    code: error.code,
    severity: error.severity,
    action: error.action,
    details: error.details
  });
  
  // 简单的浏览器原生提示
  if (typeof window !== "undefined") {
    // 可以使用更好的UI库替换
    if (error.severity === "error") {
      alert(errorMessage);
    } else {
      console.warn(errorMessage);
    }
  }
}

/**
 * 记录错误日志
 */
function logError(error: ErrorInfo, context?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      title: error.title,
      message: error.message,
      code: error.code,
      severity: error.severity,
      action: error.action,
      details: error.details
    },
    context,
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : null,
    url: typeof window !== "undefined" ? window.location.href : null,
  };

  console.error("Error Log:", JSON.stringify(logData, null, 2));
  
  // 同时输出简化版本便于快速查看
  console.error(`[${error.code}] ${error.title}: ${error.message}${context ? ` (Context: ${context})` : ''}`);

  // 这里可以发送错误日志到监控服务
  // 例如：sendToErrorTracking(logData);
}

/**
 * 文件验证hook
 */
export function useFileValidation() {
  const { handleError } = useErrorHandler();

  const validateFile = useCallback((file: File): boolean => {
    try {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        handleError({
          title: "文件格式不支持",
          message: "请上传JPEG、PNG或WEBP格式的图片",
          action: "更换文件",
          severity: "warning",
          code: "INVALID_FILE_FORMAT"
        });
        return false;
      }

      if (file.size > maxSize) {
        handleError({
          title: "文件过大",
          message: `文件大小${Math.round(file.size / 1024 / 1024)}MB，超过10MB限制`,
          action: "压缩文件",
          severity: "warning",
          code: "FILE_TOO_LARGE"
        });
        return false;
      }

      return true;
    } catch (error) {
      handleError(error, "File validation");
      return false;
    }
  }, [handleError]);

  return { validateFile };
}

/**
 * 提示词验证hook
 */
export function usePromptValidation() {
  const { handleError } = useErrorHandler();

  const validatePrompt = useCallback((prompt: string): boolean => {
    try {
      const maxLength = 5000;

      if (!prompt.trim()) {
        handleError({
          title: "提示词不能为空",
          message: "请输入图像描述",
          action: "输入描述",
          severity: "warning",
          code: "MISSING_REQUIRED_PARAM"
        });
        return false;
      }

      if (prompt.length > maxLength) {
        handleError({
          title: "提示词过长",
          message: `当前${prompt.length}字符，超过${maxLength}字符限制`,
          action: "缩短描述",
          severity: "warning",
          code: "PROMPT_TOO_LONG"
        });
        return false;
      }

      return true;
    } catch (error) {
      handleError(error, "Prompt validation");
      return false;
    }
  }, [handleError]);

  return { validatePrompt };
}