import { data } from "react-router";
import { Logger } from "~/.server/utils/logger";
import { ErrorHandler } from "~/.server/utils/error-handler";
import { ParameterTypeError } from "~/.server/types/errors";

// 定义前端日志数据类型
interface FrontendLogData {
  requestId?: string;
  step?: string;
  action?: string;
  timestamp?: string;
  data?: any;
  error?: any;
}

/**
 * 前端日志收集API端点
 * 接收前端发送的日志数据并记录到服务端日志系统
 */
export const action = async ({ request }: { request: Request }) => {
  if (request.method.toLowerCase() !== "post") {
    throw new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // 解析请求体
    const logData: FrontendLogData = await request.json();
    
    // 验证日志数据格式
    if (!logData || typeof logData !== 'object') {
      throw new ParameterTypeError('logData', 'object', typeof logData);
    }

    // 记录前端日志到服务端
    Logger.info(
      'Frontend log received',
      'frontend_logs',
      {
        requestId: logData.requestId || 'unknown',
        step: logData.step || 'unknown',
        action: logData.action || 'unknown',
        timestamp: logData.timestamp || new Date().toISOString(),
        data: logData.data || {},
        error: logData.error || null,
        userAgent: request.headers.get('user-agent') || '',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
      },
      logData.requestId
    );

    // 如果是错误日志，使用错误级别记录
    if (logData.action === 'error' || logData.error) {
      Logger.error(
        'Frontend error logged',
        'frontend_error',
        {
          requestId: logData.requestId || 'unknown',
          error: logData.error || logData,
          userAgent: request.headers.get('user-agent') || '',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
        },
        logData.requestId
      );
    }

    return data({ success: true, message: 'Log recorded successfully' });
    
  } catch (error) {
    // 使用统一错误处理
    const handledError = ErrorHandler.handleError(error);
    
    Logger.error(
      'Failed to process frontend log',
      'frontend_logs_error',
      handledError,
      'unknown'
    );

    return data(
      { 
        success: false, 
        error: handledError.error.message,
        code: handledError.error.code
      }, 
      { status: 500 }
    );
  }
};

/**
 * 处理GET请求 - 返回API信息
 */
export const loader = async () => {
  return data({
    endpoint: '/api/logs/frontend',
    method: 'POST',
    description: 'Frontend log collection endpoint',
    version: '1.0.0'
  });
};