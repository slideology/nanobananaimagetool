/**
 * 标准化错误类型定义
 * 为 AI 图像生成 API 提供统一的错误处理机制
 */

// 基础错误类型接口
export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
  timestamp?: Date;
}

// 基础错误类
export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  readonly timestamp: Date;
  readonly details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 转换为标准化的错误响应格式
   */
  toResponse(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

// ==================== 认证授权类错误 ====================

/**
 * 用户会话无效或已过期
 */
export class SessionInvalidError extends BaseError {
  readonly code = 'AUTH_001';
  readonly httpStatus = 401;

  constructor(details?: any) {
    super('用户会话无效或已过期，请重新登录', details);
  }
}

/**
 * 用户未登录
 */
export class UserNotAuthenticatedError extends BaseError {
  readonly code = 'AUTH_002';
  readonly httpStatus = 401;

  constructor(details?: any) {
    super('用户未登录，请先登录', details);
  }
}

/**
 * 用户权限不足
 */
export class InsufficientPermissionError extends BaseError {
  readonly code = 'AUTH_003';
  readonly httpStatus = 403;

  constructor(details?: any) {
    super('用户权限不足，无法执行此操作', details);
  }
}

// ==================== 积分相关错误 ====================

/**
 * 用户积分不足
 */
export class CreditInsufficientError extends BaseError {
  readonly code = 'INSUFFICIENT_CREDITS';
  readonly httpStatus = 402;

  constructor(currentBalance: number, requiredCredits: number, details?: any) {
    super(`积分不足：当前余额 ${currentBalance}，需要 ${requiredCredits} 积分`, {
      currentBalance,
      requiredCredits,
      ...details
    });
  }
}

/**
 * 积分扣除操作失败
 */
export class CreditDeductionError extends BaseError {
  readonly code = 'CREDIT_002';
  readonly httpStatus = 500;

  constructor(details?: any) {
    super('积分扣除操作失败，请稍后重试', details);
  }
}

/**
 * 积分查询数据库连接失败
 */
export class CreditQueryError extends BaseError {
  readonly code = 'CREDIT_003';
  readonly httpStatus = 500;

  constructor(details?: any) {
    super('积分查询失败，数据库连接异常', details);
  }
}

/**
 * 积分记录创建失败
 */
export class CreditRecordCreationError extends BaseError {
  readonly code = 'CREDIT_004';
  readonly httpStatus = 500;

  constructor(details?: any) {
    super('积分记录创建失败', details);
  }
}

// ==================== 文件处理错误 ====================

/**
 * 图片文件格式不支持
 */
export class UnsupportedFileFormatError extends BaseError {
  readonly code = 'FILE_001';
  readonly httpStatus = 400;

  constructor(fileName: string, supportedFormats: string[] = ['jpg', 'jpeg', 'png', 'webp'], details?: any) {
    super(`文件格式不支持：${fileName}，支持的格式：${supportedFormats.join(', ')}`, {
      fileName,
      supportedFormats,
      ...details
    });
  }
}

/**
 * 图片文件大小超限
 */
export class FileSizeExceededError extends BaseError {
  readonly code = 'FILE_002';
  readonly httpStatus = 400;

  constructor(fileSize: number, maxSize: number, details?: any) {
    super(`文件大小超限：${(fileSize / 1024 / 1024).toFixed(2)}MB，最大允许：${(maxSize / 1024 / 1024).toFixed(2)}MB`, {
      fileSize,
      maxSize,
      ...details
    });
  }
}

/**
 * 图片文件损坏或无法读取
 */
export class FileCorruptedError extends BaseError {
  readonly code = 'FILE_003';
  readonly httpStatus = 400;

  constructor(fileName: string, details?: any) {
    super(`文件损坏或无法读取：${fileName}`, {
      fileName,
      ...details
    });
  }
}

/**
 * R2存储桶上传失败
 */
export class R2UploadError extends BaseError {
  readonly code = 'FILE_004';
  readonly httpStatus = 500;

  constructor(fileName: string, details?: any) {
    super(`文件上传失败：${fileName}`, {
      fileName,
      ...details
    });
  }
}

/**
 * 文件名生成失败
 */
export class FileNameGenerationError extends BaseError {
  readonly code = 'FILE_005';
  readonly httpStatus = 500;

  constructor(details?: any) {
    super('文件名生成失败', details);
  }
}

/**
 * CDN URL构建失败
 */
export class CDNUrlBuildError extends BaseError {
  readonly code = 'FILE_006';
  readonly httpStatus = 500;

  constructor(details?: any) {
    super('CDN URL构建失败', details);
  }
}

// ==================== Kie AI API错误 ====================

/**
 * API密钥未配置或无效
 */
export class KieApiKeyError extends BaseError {
  readonly code = 'KIE_001';
  readonly httpStatus = 500;

  constructor(details?: any) {
    super('AI服务配置错误，请联系管理员', details);
  }
}

/**
 * 网络连接超时
 */
export class KieNetworkTimeoutError extends BaseError {
  readonly code = 'KIE_002';
  readonly httpStatus = 504;

  constructor(timeout: number, details?: any) {
    super(`AI服务连接超时（${timeout}ms），请稍后重试`, {
      timeout,
      ...details
    });
  }
}

/**
 * Kie AI服务不可用
 */
export class KieServiceUnavailableError extends BaseError {
  readonly code = 'KIE_003';
  readonly httpStatus = 503;

  constructor(statusCode?: number, details?: any) {
    super(`AI服务暂时不可用${statusCode ? ` (${statusCode})` : ''}，请稍后重试`, {
      statusCode,
      ...details
    });
  }
}

/**
 * API调用频率限制
 */
export class KieRateLimitError extends BaseError {
  readonly code = 'KIE_004';
  readonly httpStatus = 429;

  constructor(retryAfter?: number, details?: any) {
    super(`请求过于频繁${retryAfter ? `，请等待 ${retryAfter} 秒后重试` : '，请稍后重试'}`, {
      retryAfter,
      ...details
    });
  }
}

/**
 * 请求参数格式错误
 */
export class KieParameterError extends BaseError {
  readonly code = 'KIE_005';
  readonly httpStatus = 400;

  constructor(parameterName: string, details?: any) {
    super(`请求参数错误：${parameterName}`, {
      parameterName,
      ...details
    });
  }
}

/**
 * Kie AI内部处理失败
 */
export class KieInternalError extends BaseError {
  readonly code = 'KIE_006';
  readonly httpStatus = 500;

  constructor(errorMessage?: string, details?: any) {
    super(`AI服务内部错误${errorMessage ? `：${errorMessage}` : ''}`, {
      errorMessage,
      ...details
    });
  }
}

/**
 * 回调URL配置错误
 */
export class KieCallbackUrlError extends BaseError {
  readonly code = 'KIE_007';
  readonly httpStatus = 500;

  constructor(callbackUrl: string, details?: any) {
    super(`回调URL配置错误：${callbackUrl}`, {
      callbackUrl,
      ...details
    });
  }
}

// ==================== 数据验证错误 ====================

/**
 * 必需参数缺失
 */
export class RequiredParameterMissingError extends BaseError {
  readonly code = 'VALID_001';
  readonly httpStatus = 400;

  constructor(parameterName: string, details?: any) {
    super(`必需参数缺失：${parameterName}`, {
      parameterName,
      ...details
    });
  }
}

/**
 * 参数类型错误
 */
export class ParameterTypeError extends BaseError {
  readonly code = 'VALID_002';
  readonly httpStatus = 400;

  constructor(parameterName: string, expectedType: string, actualType: string, details?: any) {
    super(`参数类型错误：${parameterName}，期望 ${expectedType}，实际 ${actualType}`, {
      parameterName,
      expectedType,
      actualType,
      ...details
    });
  }
}

/**
 * 参数值超出允许范围
 */
export class ParameterRangeError extends BaseError {
  readonly code = 'VALID_003';
  readonly httpStatus = 400;

  constructor(parameterName: string, value: any, allowedRange: string, details?: any) {
    super(`参数值超出允许范围：${parameterName} = ${value}，允许范围：${allowedRange}`, {
      parameterName,
      value,
      allowedRange,
      ...details
    });
  }
}

/**
 * 图片模式与参数不匹配
 */
export class ImageModeParameterMismatchError extends BaseError {
  readonly code = 'VALID_004';
  readonly httpStatus = 400;

  constructor(mode: string, missingParameter: string, details?: any) {
    super(`${mode} 模式需要提供 ${missingParameter} 参数`, {
      mode,
      missingParameter,
      ...details
    });
  }
}

/**
 * 提示词长度超限
 */
export class PromptLengthExceededError extends BaseError {
  readonly code = 'VALID_005';
  readonly httpStatus = 400;

  constructor(currentLength: number, maxLength: number, details?: any) {
    super(`提示词长度超限：${currentLength} 字符，最大允许：${maxLength} 字符`, {
      currentLength,
      maxLength,
      ...details
    });
  }
}

// ==================== 数据库操作错误 ====================

/**
 * 数据库连接失败
 */
export class DatabaseConnectionError extends BaseError {
  readonly code = 'DB_001';
  readonly httpStatus = 500;

  constructor(details?: any) {
    super('数据库连接失败，请稍后重试', details);
  }
}

/**
 * 任务记录创建失败
 */
export class TaskCreationError extends BaseError {
  readonly code = 'DB_002';
  readonly httpStatus = 500;

  constructor(details?: any) {
    super('任务记录创建失败', details);
  }
}

/**
 * 用户信息查询失败
 */
export class UserQueryError extends BaseError {
  readonly code = 'DB_003';
  readonly httpStatus = 500;

  constructor(userId: string, details?: any) {
    super(`用户信息查询失败：${userId}`, {
      userId,
      ...details
    });
  }
}

/**
 * 数据约束违反
 */
export class DatabaseConstraintError extends BaseError {
  readonly code = 'DB_004';
  readonly httpStatus = 400;

  constructor(constraintName: string, details?: any) {
    super(`数据约束违反：${constraintName}`, {
      constraintName,
      ...details
    });
  }
}

/**
 * 事务回滚失败
 */
export class TransactionRollbackError extends BaseError {
  readonly code = 'DB_005';
  readonly httpStatus = 500;

  constructor(details?: any) {
    super('数据库事务回滚失败', details);
  }
}

// ==================== 任务管理错误 ====================

/**
 * 任务未找到
 */
export class TaskNotFoundError extends BaseError {
  readonly code = 'TASK_001';
  readonly httpStatus = 404;

  constructor(taskNo: string, details?: any) {
    super(`任务未找到：${taskNo}`, {
      taskNo,
      ...details
    });
  }
}

/**
 * 任务状态错误
 */
export class TaskStatusError extends BaseError {
  readonly code = 'TASK_002';
  readonly httpStatus = 400;

  constructor(currentStatus: string, expectedStatus: string, details?: any) {
    super(`任务状态错误：当前状态为 ${currentStatus}，期望状态为 ${expectedStatus}`, {
      currentStatus,
      expectedStatus,
      ...details
    });
  }
}

/**
 * 任务调度错误
 */
export class TaskScheduleError extends BaseError {
  readonly code = 'TASK_003';
  readonly httpStatus = 400;

  constructor(message: string, details?: any) {
    super(`任务调度错误：${message}`, details);
  }
}

/**
 * 不支持的提供商
 */
export class UnsupportedProviderError extends BaseError {
  readonly code = 'TASK_004';
  readonly httpStatus = 400;

  constructor(provider: string, supportedProviders: string[], details?: any) {
    super(`不支持的提供商：${provider}，支持的提供商：${supportedProviders.join(', ')}`, {
      provider,
      supportedProviders,
      ...details
    });
  }
}

// ==================== 系统配置错误 ====================

/**
 * 环境变量缺失
 */
export class EnvironmentVariableMissingError extends BaseError {
  readonly code = 'CONFIG_001';
  readonly httpStatus = 500;

  constructor(variableName: string, details?: any) {
    super(`环境变量缺失：${variableName}`, {
      variableName,
      ...details
    });
  }
}

/**
 * Cloudflare Workers配置错误
 */
export class CloudflareConfigError extends BaseError {
  readonly code = 'CONFIG_002';
  readonly httpStatus = 500;

  constructor(configName: string, details?: any) {
    super(`Cloudflare Workers配置错误：${configName}`, {
      configName,
      ...details
    });
  }
}

/**
 * R2存储桶配置错误
 */
export class R2ConfigError extends BaseError {
  readonly code = 'CONFIG_003';
  readonly httpStatus = 500;

  constructor(details?: any) {
    super('R2存储桶配置错误', details);
  }
}

/**
 * CDN配置错误
 */
export class CDNConfigError extends BaseError {
  readonly code = 'CONFIG_004';
  readonly httpStatus = 500;

  constructor(details?: any) {
    super('CDN配置错误', details);
  }
}

/**
 * 域名配置错误
 */
export class DomainConfigError extends BaseError {
  readonly code = 'CONFIG_005';
  readonly httpStatus = 500;

  constructor(domain: string, details?: any) {
    super(`域名配置错误：${domain}`, {
      domain,
      ...details
    });
  }
}

// ==================== 系统资源错误 ====================

/**
 * 内存不足
 */
export class OutOfMemoryError extends BaseError {
  readonly code = 'RESOURCE_001';
  readonly httpStatus = 507;

  constructor(details?: any) {
    super('系统内存不足，请稍后重试', details);
  }
}

/**
 * CPU资源耗尽
 */
export class CPUExhaustedError extends BaseError {
  readonly code = 'RESOURCE_002';
  readonly httpStatus = 503;

  constructor(details?: any) {
    super('系统负载过高，请稍后重试', details);
  }
}

/**
 * 磁盘空间不足
 */
export class DiskSpaceInsufficientError extends BaseError {
  readonly code = 'RESOURCE_003';
  readonly httpStatus = 507;

  constructor(details?: any) {
    super('存储空间不足', details);
  }
}

/**
 * 并发请求过多
 */
export class TooManyRequestsError extends BaseError {
  readonly code = 'RESOURCE_004';
  readonly httpStatus = 429;

  constructor(maxConcurrent: number, details?: any) {
    super(`并发请求过多，最大允许：${maxConcurrent}`, {
      maxConcurrent,
      ...details
    });
  }
}

/**
 * 请求处理超时
 */
export class RequestTimeoutError extends BaseError {
  readonly code = 'RESOURCE_005';
  readonly httpStatus = 408;

  constructor(timeout: number, details?: any) {
    super(`请求处理超时（${timeout}ms）`, {
      timeout,
      ...details
    });
  }
}

// ==================== 错误类型映射 ====================

/**
 * 所有错误类型的映射，用于根据错误代码创建对应的错误实例
 */
export const ERROR_TYPE_MAP = {
  // 认证授权类
  AUTH_001: SessionInvalidError,
  AUTH_002: UserNotAuthenticatedError,
  AUTH_003: InsufficientPermissionError,
  
  // 积分相关
  CREDIT_001: CreditInsufficientError, // 兼容旧码
  INSUFFICIENT_CREDITS: CreditInsufficientError,
  CREDIT_002: CreditDeductionError,
  CREDIT_003: CreditQueryError,
  CREDIT_004: CreditRecordCreationError,
  
  // 文件处理
  FILE_001: UnsupportedFileFormatError,
  FILE_002: FileSizeExceededError,
  FILE_003: FileCorruptedError,
  FILE_004: R2UploadError,
  FILE_005: FileNameGenerationError,
  FILE_006: CDNUrlBuildError,
  
  // Kie AI API
  KIE_001: KieApiKeyError,
  KIE_002: KieNetworkTimeoutError,
  KIE_003: KieServiceUnavailableError,
  KIE_004: KieRateLimitError,
  KIE_005: KieParameterError,
  KIE_006: KieInternalError,
  KIE_007: KieCallbackUrlError,
  
  // 数据验证
  VALID_001: RequiredParameterMissingError,
  VALID_002: ParameterTypeError,
  VALID_003: ParameterRangeError,
  VALID_004: ImageModeParameterMismatchError,
  VALID_005: PromptLengthExceededError,
  
  // 数据库操作
  DB_001: DatabaseConnectionError,
  DB_002: TaskCreationError,
  DB_003: UserQueryError,
  DB_004: DatabaseConstraintError,
  DB_005: TransactionRollbackError,
  
  // 任务管理
  TASK_001: TaskNotFoundError,
  TASK_002: TaskStatusError,
  TASK_003: TaskScheduleError,
  TASK_004: UnsupportedProviderError,
  
  // 系统配置
  CONFIG_001: EnvironmentVariableMissingError,
  CONFIG_002: CloudflareConfigError,
  CONFIG_003: R2ConfigError,
  CONFIG_004: CDNConfigError,
  CONFIG_005: DomainConfigError,
  
  // 系统资源
  RESOURCE_001: OutOfMemoryError,
  RESOURCE_002: CPUExhaustedError,
  RESOURCE_003: DiskSpaceInsufficientError,
  RESOURCE_004: TooManyRequestsError,
  RESOURCE_005: RequestTimeoutError,
} as const;

/**
 * 错误代码类型
 */
export type ErrorCode = keyof typeof ERROR_TYPE_MAP;

/**
 * 检查是否为标准化错误
 */
export function isStandardError(error: any): error is BaseError {
  return error instanceof BaseError;
}

/**
 * 根据错误代码获取错误类型
 */
export function getErrorTypeByCode(code: ErrorCode) {
  return ERROR_TYPE_MAP[code];
}