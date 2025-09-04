/**
 * 图片生成流程的具体步骤日志打点方法
 * 为每个步骤提供标准化的日志记录接口
 */

import { Logger } from './logger';
import { ImageGenerationMonitor, ImageGenerationStep } from './image-generation-monitor';

/**
 * 步骤1: 前端数据收集日志记录器
 */
export class FrontendDataCollectionLogger {
  private static monitor = ImageGenerationMonitor.getInstance();

  /**
   * 记录用户开始上传图片
   */
  static logImageUploadStart(requestId: string, imageInfo: {
    fileName: string;
    fileSize: number;
    fileType: string;
  }) {
    this.monitor.stepStart(requestId, ImageGenerationStep.FRONTEND_DATA_COLLECTION, {
      success: true,
      duration: 0,
      data: {
        action: 'image_upload_start',
        ...imageInfo
      }
    });
    
    Logger.userAction(
      requestId,
      '用户开始上传图片',
      'FrontendDataCollection',
      {
        fileName: imageInfo.fileName,
        fileSize: imageInfo.fileSize,
        fileType: imageInfo.fileType
      },
      requestId
    );
  }

  /**
   * 记录用户输入提示词
   */
  static logPromptInput(requestId: string, promptData: {
    prompt: string;
    negativePrompt?: string;
    style?: string;
  }) {
    Logger.userAction(
      requestId,
      '用户输入提示词',
      'FrontendDataCollection',
      {
        promptLength: promptData.prompt.length,
        hasNegativePrompt: !!promptData.negativePrompt,
        style: promptData.style
      },
      requestId
    );
  }

  /**
   * 记录用户调整参数
   */
  static logParameterAdjustment(requestId: string, parameters: {
    width?: number;
    height?: number;
    steps?: number;
    cfgScale?: number;
  }) {
    Logger.userAction(
      requestId,
      '用户调整生成参数',
      'FrontendDataCollection',
      parameters,
      requestId
    );
  }

  /**
   * 记录前端数据收集完成
   */
  static logDataCollectionComplete(requestId: string, formData: any) {
    this.monitor.stepComplete(requestId, ImageGenerationStep.FRONTEND_DATA_COLLECTION, {
      success: true,
      data: {
        hasImage: !!formData.image,
        hasPrompt: !!formData.prompt,
        mode: formData.mode
      }
    });
    
    Logger.info(
      '前端数据收集完成',
      'FrontendDataCollection',
      {
        mode: formData.mode,
        hasImage: !!formData.image,
        hasPrompt: !!formData.prompt
      },
      requestId
    );
  }

  /**
   * 记录前端数据收集错误
   */
  static logDataCollectionError(requestId: string, error: Error) {
    this.monitor.stepError(requestId, ImageGenerationStep.FRONTEND_DATA_COLLECTION, error);
    
    Logger.error(
      '前端数据收集失败',
      'FrontendDataCollection',
      error,
      requestId
    );
  }
}

/**
 * 步骤2: 后端API接收日志记录器
 */
export class BackendApiLogger {
  private static monitor = ImageGenerationMonitor.getInstance();

  /**
   * 记录API请求开始
   */
  static logRequestStart(requestId: string, requestInfo: {
    method: string;
    url: string;
    userAgent?: string;
    ip?: string;
  }) {
    this.monitor.stepStart(requestId, ImageGenerationStep.BACKEND_API_RECEPTION, {
      success: true,
      duration: 0,
      data: {
        action: 'api_request_start',
        ...requestInfo
      }
    });
    
    Logger.apiCall(
      requestInfo.url,
      requestInfo.method,
      'BackendAPI',
      {
        requestId,
        ...requestInfo
      }
    );
  }

  /**
   * 记录表单数据解析
   */
  static logFormDataParsing(requestId: string, formDataInfo: {
    fieldsCount: number;
    hasFile: boolean;
    fileSize?: number;
  }) {
    Logger.info(
      '表单数据解析',
      'BackendAPI',
      formDataInfo,
      requestId
    );
  }

  /**
   * 记录数据验证
   */
  static logDataValidation(requestId: string, validationResult: {
    isValid: boolean;
    errors?: string[];
  }) {
    Logger.info(
      '数据验证',
      'BackendAPI',
      validationResult,
      requestId
    );
  }

  /**
   * 记录API接收完成
   */
  static logRequestComplete(requestId: string, parsedData: any) {
    this.monitor.stepComplete(requestId, ImageGenerationStep.BACKEND_API_RECEPTION, {
      success: true,
      data: {
        mode: parsedData.mode,
        hasImage: !!parsedData.image
      }
    });
    
    Logger.info(
      'API请求处理完成',
      'BackendAPI',
      {
        mode: parsedData.mode
      },
      requestId
    );
  }

  /**
   * 记录API接收错误
   */
  static logRequestError(requestId: string, error: Error) {
    this.monitor.stepError(requestId, ImageGenerationStep.BACKEND_API_RECEPTION, error);
    
    Logger.error(
      'API请求处理失败',
      'BackendAPI',
      error,
      requestId
    );
  }
}

/**
 * 步骤3: 业务逻辑处理日志记录器
 */
export class BusinessLogicLogger {
  private static monitor = ImageGenerationMonitor.getInstance();

  /**
   * 记录业务逻辑处理开始
   */
  static logProcessingStart(requestId: string, taskInfo: {
    userId?: string;
    mode: string;
    type: string;
  }) {
    this.monitor.stepStart(requestId, ImageGenerationStep.BUSINESS_LOGIC_PROCESSING, {
      success: true,
      duration: 0,
      data: {
        action: 'business_processing_start',
        ...taskInfo
      }
    });
    
    Logger.info(
      '业务逻辑处理开始',
      'BusinessLogic',
      taskInfo,
      requestId
    );
  }

  /**
   * 记录积分验证
   */
  static logCreditValidation(requestId: string, creditInfo: {
    userId?: string;
    currentCredits?: number;
    requiredCredits: number;
    isValid: boolean;
  }) {
    Logger.info(
      '积分验证',
      'BusinessLogic',
      creditInfo,
      requestId
    );
  }

  /**
   * 记录图片上传到R2
   */
  static logImageUploadToR2(requestId: string, uploadInfo: {
    fileName: string;
    fileSize: number;
    uploadUrl?: string;
    success: boolean;
  }) {
    Logger.info(
      '图片上传到R2存储',
      'BusinessLogic',
      uploadInfo,
      requestId
    );
  }

  /**
   * 记录业务逻辑处理完成
   */
  static logProcessingComplete(requestId: string, result: {
    taskId?: string;
    fileUrl?: string;
  }) {
    this.monitor.stepComplete(requestId, ImageGenerationStep.BUSINESS_LOGIC_PROCESSING, {
      success: true,
      data: result
    });
    
    Logger.info(
      '业务逻辑处理完成',
      'BusinessLogic',
      result,
      requestId
    );
  }

  /**
   * 记录业务逻辑处理错误
   */
  static logProcessingError(requestId: string, error: Error) {
    this.monitor.stepError(requestId, ImageGenerationStep.BUSINESS_LOGIC_PROCESSING, error);
    
    Logger.error(
      '业务逻辑处理失败',
      'BusinessLogic',
      error,
      requestId
    );
  }
}

/**
 * 步骤4: Kie AI密钥获取日志记录器
 */
export class KieAiKeyLogger {
  private static monitor = ImageGenerationMonitor.getInstance();

  /**
   * 记录密钥获取开始
   */
  static logKeyRetrievalStart(requestId: string) {
    this.monitor.stepStart(requestId, ImageGenerationStep.KIE_AI_KEY_RETRIEVAL, {
      success: true,
      duration: 0,
      data: {
        action: 'key_retrieval_start'
      }
    });
    
    Logger.info(
      '开始获取Kie AI密钥',
      'KieAiKey',
      {},
      requestId
    );
  }

  /**
   * 记录密钥获取完成
   */
  static logKeyRetrievalComplete(requestId: string, keyInfo: {
    hasKey: boolean;
    keySource: string; // 'env' | 'config' | 'cache'
  }) {
    this.monitor.stepComplete(requestId, ImageGenerationStep.KIE_AI_KEY_RETRIEVAL, {
      success: true,
      data: keyInfo
    });
    
    Logger.info(
      'Kie AI密钥获取完成',
      'KieAiKey',
      {
        hasKey: keyInfo.hasKey,
        keySource: keyInfo.keySource
      },
      requestId
    );
  }

  /**
   * 记录密钥获取错误
   */
  static logKeyRetrievalError(requestId: string, error: Error) {
    this.monitor.stepError(requestId, ImageGenerationStep.KIE_AI_KEY_RETRIEVAL, error);
    
    Logger.error(
      'Kie AI密钥获取失败',
      'KieAiKey',
      error,
      requestId
    );
  }
}

/**
 * 步骤5: Kie AI API调用日志记录器
 */
export class KieAiApiLogger {
  private static monitor = ImageGenerationMonitor.getInstance();

  /**
   * 记录API调用开始
   */
  static logApiCallStart(requestId: string, apiInfo: {
    endpoint: string;
    method: string;
    taskType: string;
  }) {
    this.monitor.stepStart(requestId, ImageGenerationStep.KIE_AI_API_CALL, {
      success: true,
      duration: 0,
      data: {
        action: 'api_call_start',
        ...apiInfo
      }
    });
    
    Logger.apiCall(
      apiInfo.endpoint,
      apiInfo.method,
      'KieAiAPI',
      {
        requestId,
        ...apiInfo
      }
    );
  }

  /**
   * 记录API请求参数
   */
  static logApiParameters(requestId: string, parameters: {
    prompt: string;
    hasImageUrls: boolean;
    callbackUrl: string;
  }) {
    Logger.info(
      'Kie AI API请求参数',
      'KieAiAPI',
      {
        promptLength: parameters.prompt.length,
        hasImageUrls: parameters.hasImageUrls,
        callbackUrl: parameters.callbackUrl
      },
      requestId
    );
  }

  /**
   * 记录API调用完成
   */
  static logApiCallComplete(requestId: string, response: {
    taskId?: string;
    status: string;
    responseTime: number;
  }) {
    this.monitor.stepComplete(requestId, ImageGenerationStep.KIE_AI_API_CALL, {
      success: true,
      data: response
    });
    
    Logger.apiCall(
      'kie-ai-api',
      'POST',
      'KieAiAPI',
      {
        requestId,
        ...response
      }
    );
  }

  /**
   * 记录API调用错误
   */
  static logApiCallError(requestId: string, error: Error, apiInfo?: {
    statusCode?: number;
    responseBody?: string;
  }) {
    this.monitor.stepError(requestId, ImageGenerationStep.KIE_AI_API_CALL, error);
    
    Logger.error(
      'Kie AI API调用失败',
      'KieAiAPI',
      error,
      requestId
    );
  }
}

/**
 * 步骤6: 异步回调处理日志记录器
 */
export class CallbackProcessingLogger {
  private static monitor = ImageGenerationMonitor.getInstance();

  /**
   * 记录回调接收开始
   */
  static logCallbackReceived(requestId: string, callbackInfo: {
    taskId: string;
    status: string;
    source: string; // 'kie-ai'
  }) {
    this.monitor.stepStart(requestId, ImageGenerationStep.ASYNC_CALLBACK_HANDLING, {
      success: true,
      duration: 0,
      data: {
        action: 'callback_received',
        ...callbackInfo
      }
    });
    
    Logger.info(
      '接收到异步回调',
      'CallbackProcessing',
      callbackInfo,
      requestId
    );
  }

  /**
   * 记录回调数据解析
   */
  static logCallbackDataParsing(requestId: string, parseInfo: {
    taskId: string;
    hasResult: boolean;
    hasError: boolean;
    resultUrls?: number;
  }) {
    Logger.info(
      '回调数据解析',
      'CallbackProcessing',
      parseInfo,
      requestId
    );
  }

  /**
   * 记录图片下载到本地
   */
  static logImageDownload(requestId: string, downloadInfo: {
    taskId: string;
    sourceUrl: string;
    localPath?: string;
    success: boolean;
    fileSize?: number;
  }) {
    Logger.info(
      '图片下载到本地存储',
      'CallbackProcessing',
      downloadInfo,
      requestId
    );
  }

  /**
   * 记录任务状态更新
   */
  static logTaskStatusUpdate(requestId: string, updateInfo: {
    taskId: string;
    oldStatus: string;
    newStatus: string;
    resultUrl?: string;
  }) {
    Logger.info(
      '任务状态更新',
      'CallbackProcessing',
      updateInfo,
      requestId
    );
  }

  /**
   * 记录回调处理完成
   */
  static logCallbackComplete(requestId: string, result: {
    taskId: string;
    finalStatus: string;
    processingTime: number;
  }) {
    this.monitor.stepComplete(requestId, ImageGenerationStep.ASYNC_CALLBACK_HANDLING, {
      success: true,
      data: result
    });
    
    Logger.info(
      '异步回调处理完成',
      'CallbackProcessing',
      result,
      requestId
    );
  }

  /**
   * 记录回调处理错误
   */
  static logCallbackError(requestId: string, error: Error, taskId?: string) {
    this.monitor.stepError(requestId, ImageGenerationStep.ASYNC_CALLBACK_HANDLING, error);
    
    Logger.error(
      '异步回调处理失败',
      'CallbackProcessing',
      error,
      requestId
    );
  }
}

/**
 * 步骤7: 前端状态轮询日志记录器
 */
export class FrontendPollingLogger {
  private static monitor = ImageGenerationMonitor.getInstance();

  /**
   * 记录轮询开始
   */
  static logPollingStart(requestId: string, pollingInfo: {
    taskId: string;
    interval: number;
    maxAttempts: number;
  }) {
    this.monitor.stepStart(requestId, ImageGenerationStep.FRONTEND_STATUS_POLLING, {
      success: true,
      duration: 0,
      data: {
        action: 'polling_start',
        ...pollingInfo
      }
    });
    
    Logger.info(
      '前端状态轮询开始',
      'FrontendPolling',
      pollingInfo,
      requestId
    );
  }

  /**
   * 记录单次轮询请求
   */
  static logPollingRequest(requestId: string, requestInfo: {
    taskId: string;
    attemptNumber: number;
    timestamp: number;
  }) {
    Logger.info(
      '轮询请求',
      'FrontendPolling',
      requestInfo,
      requestId
    );
  }

  /**
   * 记录轮询响应
   */
  static logPollingResponse(requestId: string, responseInfo: {
    taskId: string;
    status: string;
    hasResult: boolean;
    responseTime: number;
  }) {
    Logger.info(
      '轮询响应',
      'FrontendPolling',
      responseInfo,
      requestId
    );
  }

  /**
   * 记录轮询完成
   */
  static logPollingComplete(requestId: string, result: {
    taskId: string;
    finalStatus: string;
    totalAttempts: number;
    totalTime: number;
    success: boolean;
  }) {
    this.monitor.stepComplete(requestId, ImageGenerationStep.FRONTEND_STATUS_POLLING, {
      success: result.success,
      data: result
    });
    
    Logger.info(
      '前端状态轮询完成',
      'FrontendPolling',
      result,
      requestId
    );
  }

  /**
   * 记录轮询错误
   */
  static logPollingError(requestId: string, error: Error, taskId?: string) {
    this.monitor.stepError(requestId, ImageGenerationStep.FRONTEND_STATUS_POLLING, error);
    
    Logger.error(
      '前端状态轮询失败',
      'FrontendPolling',
      error,
      requestId
    );
  }
}

/**
 * 统一的监控工具类
 * 提供便捷的监控方法
 */
export class ImageGenerationMonitoringUtils {
  private static monitor = ImageGenerationMonitor.getInstance();

  /**
   * 开始一个新的图片生成请求监控
   */
  static startRequest(requestId: string, taskInfo: {
    taskId?: string;
    userId?: string;
    mode: 'text-to-image' | 'image-to-image';
    type: 'nano-banana' | 'nano-banana-edit';
    prompt: string;
    imageUrl?: string;
    style?: string;
  }) {
    return this.monitor.startRequest({
      taskId: taskInfo.taskId || requestId,
      userId: taskInfo.userId,
      mode: taskInfo.mode,
      type: taskInfo.type,
      prompt: taskInfo.prompt,
      imageUrl: taskInfo.imageUrl,
      style: taskInfo.style,
      requestId
    });
  }

  /**
   * 获取当前活跃请求的统计信息
   */
  static getActiveRequestsStats() {
    return this.monitor.getActiveRequestsStats();
  }

  /**
   * 清理超时的请求
   */
  static cleanupTimeoutRequests() {
    return this.monitor.cleanupTimeoutRequests();
  }

  /**
   * 更新任务ID
   */
  static updateTaskId(requestId: string, taskId: string) {
    return this.monitor.updateTaskId(requestId, taskId);
  }
}