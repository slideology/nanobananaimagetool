/**
 * Cloudflare Turnstile 验证服务
 * 用于验证前端提交的 Turnstile token
 */

/**
 * 验证 Turnstile token 的有效性
 * @param token - 前端提交的 Turnstile response token
 * @param secretKey - Cloudflare Turnstile 密钥
 * @param remoteIP - 可选的客户端IP地址
 * @returns Promise<boolean> - 验证是否成功
 */
export async function verifyTurnstile(
  token: string, 
  secretKey: string,
  remoteIP?: string
): Promise<boolean> {
  try {
    // 构建验证请求数据
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    // 如果提供了IP地址，添加到验证请求中
    if (remoteIP) {
      formData.append('remoteip', remoteIP);
    }

    // 调用 Cloudflare Turnstile 验证 API
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Turnstile verification request failed:', response.status, response.statusText);
      return false;
    }

    const result = await response.json() as TurnstileVerificationResult;
    
    // 记录验证结果（用于调试）
    if (!result.success) {
      console.warn('Turnstile verification failed:', {
        'error-codes': result['error-codes'],
        token: token.substring(0, 10) + '...' // 只记录token的前10个字符
      });
    }

    return result.success;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

/**
 * 验证 Turnstile token 并返回详细结果
 * @param token - 前端提交的 Turnstile response token
 * @param secretKey - Cloudflare Turnstile 密钥
 * @param remoteIP - 可选的客户端IP地址
 * @returns Promise<TurnstileVerificationResult> - 详细的验证结果
 */
export async function verifyTurnstileDetailed(
  token: string, 
  secretKey: string,
  remoteIP?: string
): Promise<TurnstileVerificationResult> {
  try {
    // 构建验证请求数据
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    if (remoteIP) {
      formData.append('remoteip', remoteIP);
    }

    // 调用 Cloudflare Turnstile 验证 API
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      return {
        success: false,
        'error-codes': ['network-error'],
        challenge_ts: undefined,
        hostname: undefined
      };
    }

    const result = await response.json() as TurnstileVerificationResult;
    return result;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return {
      success: false,
      'error-codes': ['internal-error'],
      challenge_ts: undefined,
      hostname: undefined
    };
  }
}

/**
 * Turnstile 验证结果类型定义
 */
export interface TurnstileVerificationResult {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string; // ISO 8601 timestamp
  hostname?: string;
}

/**
 * 常见的 Turnstile 错误代码说明
 */
export const TURNSTILE_ERROR_CODES = {
  'missing-input-secret': 'The secret parameter is missing.',
  'invalid-input-secret': 'The secret parameter is invalid or malformed.',
  'missing-input-response': 'The response parameter is missing.',
  'invalid-input-response': 'The response parameter is invalid or malformed.',
  'bad-request': 'The request is invalid or malformed.',
  'timeout-or-duplicate': 'The response is no longer valid: either is too old or has been used previously.',
  'internal-error': 'An internal error happened while validating the response. The request can be retried.',
} as const;

/**
 * 获取错误代码的友好描述
 * @param errorCode - Turnstile 错误代码
 * @returns 错误描述
 */
export function getTurnstileErrorDescription(errorCode: string): string {
  return TURNSTILE_ERROR_CODES[errorCode as keyof typeof TURNSTILE_ERROR_CODES] || 'Unknown error';
}