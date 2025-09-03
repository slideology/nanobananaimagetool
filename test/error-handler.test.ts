/**
 * 错误处理工具类单元测试
 * 
 * 测试ErrorHandler类的各种错误处理场景
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  ErrorHandler, 
  NanoBananaError, 
  ERROR_CODES, 
  ERROR_MESSAGES,
  RetryHandler
} from '../app/.server/utils/error-handler'

describe('ErrorHandler', () => {
  beforeEach(() => {
    // 清除控制台模拟
    vi.clearAllMocks()
    // 模拟console.error以避免测试输出中的错误信息
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('NanoBananaError', () => {
    it('应该正确创建NanoBananaError实例', () => {
      const error = new NanoBananaError(
        ERROR_CODES.INVALID_REQUEST,
        400,
        '请求参数错误',
        { field: 'prompt' }
      )

      expect(error.name).toBe('NanoBananaError')
      expect(error.code).toBe(ERROR_CODES.INVALID_REQUEST)
      expect(error.status).toBe(400)
      expect(error.message).toBe('请求参数错误')
      expect(error.details).toEqual({ field: 'prompt' })
    })
  })

  describe('handleHttpError', () => {
    it('应该正确处理JSON响应的HTTP错误', async () => {
      const mockResponse = {
        status: 400,
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        },
        json: vi.fn().mockResolvedValue({
          message: '请求参数无效',
          error: 'INVALID_PARAMS'
        })
      } as any

      await expect(ErrorHandler.handleHttpError(mockResponse))
        .rejects
        .toThrow(NanoBananaError)

      try {
        await ErrorHandler.handleHttpError(mockResponse)
      } catch (error) {
        expect(error).toBeInstanceOf(NanoBananaError)
        expect((error as NanoBananaError).code).toBe(ERROR_CODES.INVALID_REQUEST)
        expect((error as NanoBananaError).status).toBe(400)
        expect((error as NanoBananaError).message).toBe('请求参数无效')
      }
    })

    it('应该正确处理文本响应的HTTP错误', async () => {
      const mockResponse = {
        status: 500,
        headers: {
          get: vi.fn().mockReturnValue('text/plain')
        },
        text: vi.fn().mockResolvedValue('内部服务器错误')
      } as any

      try {
        await ErrorHandler.handleHttpError(mockResponse)
      } catch (error) {
        expect(error).toBeInstanceOf(NanoBananaError)
        expect((error as NanoBananaError).code).toBe(ERROR_CODES.UNKNOWN_ERROR)
        expect((error as NanoBananaError).status).toBe(500)
        expect((error as NanoBananaError).message).toBe('内部服务器错误')
      }
    })

    it('应该正确处理无法解析响应体的HTTP错误', async () => {
      const mockResponse = {
        status: 429,
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        },
        json: vi.fn().mockRejectedValue(new Error('解析失败'))
      } as any

      try {
        await ErrorHandler.handleHttpError(mockResponse)
      } catch (error) {
        expect(error).toBeInstanceOf(NanoBananaError)
        expect((error as NanoBananaError).code).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED)
        expect((error as NanoBananaError).status).toBe(429)
      }
    })
  })

  describe('handleNetworkError', () => {
    it('应该直接抛出NanoBananaError实例', () => {
      const nanoBananaError = new NanoBananaError(
        ERROR_CODES.INVALID_REQUEST,
        400,
        '已存在的错误'
      )

      expect(() => ErrorHandler.handleNetworkError(nanoBananaError))
        .toThrow(nanoBananaError)
    })

    it('应该正确处理网络连接错误', () => {
      const networkError = new TypeError('fetch is not defined')

      expect(() => ErrorHandler.handleNetworkError(networkError))
        .toThrow(NanoBananaError)

      try {
        ErrorHandler.handleNetworkError(networkError)
      } catch (error) {
        expect((error as NanoBananaError).code).toBe(ERROR_CODES.NETWORK_ERROR)
        expect((error as NanoBananaError).message).toBe('无法连接到服务器')
      }
    })

    it('应该正确处理超时错误', () => {
      const timeoutError = { name: 'TimeoutError', message: '请求超时' }

      try {
        ErrorHandler.handleNetworkError(timeoutError)
      } catch (error) {
        expect((error as NanoBananaError).code).toBe(ERROR_CODES.TIMEOUT)
        expect((error as NanoBananaError).message).toBe('请求超时')
      }
    })
  })

  describe('validateFile', () => {
    it('应该通过有效文件的验证', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }) // 1MB

      expect(() => ErrorHandler.validateFile(validFile)).not.toThrow()
    })

    it('应该拒绝不支持的文件格式', () => {
      const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' })

      expect(() => ErrorHandler.validateFile(invalidFile))
        .toThrow(NanoBananaError)

      try {
        ErrorHandler.validateFile(invalidFile)
      } catch (error) {
        expect((error as NanoBananaError).code).toBe(ERROR_CODES.INVALID_FILE_FORMAT)
      }
    })

    it('应该拒绝过大的文件', () => {
      const largeFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 }) // 15MB

      expect(() => ErrorHandler.validateFile(largeFile))
        .toThrow(NanoBananaError)

      try {
        ErrorHandler.validateFile(largeFile)
      } catch (error) {
        expect((error as NanoBananaError).code).toBe(ERROR_CODES.FILE_TOO_LARGE)
      }
    })
  })

  describe('validatePrompt', () => {
    it('应该通过有效提示词的验证', () => {
      const validPrompt = '生成一张美丽的风景图'

      expect(() => ErrorHandler.validatePrompt(validPrompt)).not.toThrow()
    })

    it('应该拒绝空提示词', () => {
      const emptyPrompt = '   '

      expect(() => ErrorHandler.validatePrompt(emptyPrompt))
        .toThrow(NanoBananaError)

      try {
        ErrorHandler.validatePrompt(emptyPrompt)
      } catch (error) {
        expect((error as NanoBananaError).code).toBe(ERROR_CODES.MISSING_REQUIRED_PARAM)
      }
    })

    it('应该拒绝过长的提示词', () => {
      const longPrompt = 'a'.repeat(5001)

      expect(() => ErrorHandler.validatePrompt(longPrompt))
        .toThrow(NanoBananaError)

      try {
        ErrorHandler.validatePrompt(longPrompt)
      } catch (error) {
        expect((error as NanoBananaError).code).toBe(ERROR_CODES.PROMPT_TOO_LONG)
      }
    })
  })

  describe('getErrorInfo', () => {
    it('应该正确格式化NanoBananaError', () => {
      const error = new NanoBananaError(
        ERROR_CODES.INSUFFICIENT_CREDITS,
        402,
        '积分不足',
        { required: 10, current: 5 }
      )

      const errorInfo = ErrorHandler.getErrorInfo(error)

      expect(errorInfo.code).toBe(ERROR_CODES.INSUFFICIENT_CREDITS)
      expect(errorInfo.title).toBe(ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_CREDITS].title)
      expect(errorInfo.severity).toBe('info')
      expect(errorInfo.details).toEqual({ required: 10, current: 5 })
      expect(errorInfo.originalMessage).toBe('积分不足')
    })

    it('应该正确处理未知错误', () => {
      const unknownError = new Error('未知的错误')

      const errorInfo = ErrorHandler.getErrorInfo(unknownError)

      expect(errorInfo.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(errorInfo.title).toBe(ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR].title)
      expect(errorInfo.originalMessage).toBe('未知的错误')
    })
  })

  describe('handle', () => {
    it('应该记录错误并返回错误信息', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = new Error('测试错误')

      const result = ErrorHandler.handle(error)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error occurred:', error)
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(result.title).toBe(ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR].title)
    })
  })
})

describe('RetryHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('withRetry', () => {
    it('应该在第一次尝试成功时返回结果', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')

      const result = await RetryHandler.withRetry(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('应该在失败后进行重试', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('第一次失败'))
        .mockRejectedValueOnce(new Error('第二次失败'))
        .mockResolvedValue('最终成功')

      // 使用较短的延迟以加快测试
      const result = await RetryHandler.withRetry(mockFn, {
        maxRetries: 3,
        delay: 10,
        backoff: false
      })

      expect(result).toBe('最终成功')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('应该在达到最大重试次数后抛出最后一个错误', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('持续失败'))

      await expect(RetryHandler.withRetry(mockFn, {
        maxRetries: 2,
        delay: 10
      })).rejects.toThrow('持续失败')

      expect(mockFn).toHaveBeenCalledTimes(3) // 初始尝试 + 2次重试
    })

    it('应该在不满足重试条件时立即抛出错误', async () => {
      const authError = { status: 401, message: '未授权' }
      const mockFn = vi.fn().mockRejectedValue(authError)

      await expect(RetryHandler.withRetry(mockFn, {
        maxRetries: 3,
        retryCondition: (error) => error.status !== 401
      })).rejects.toEqual(authError)

      expect(mockFn).toHaveBeenCalledTimes(1) // 不应该重试
    })

    it('应该使用指数退避算法计算延迟时间', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('失败1'))
        .mockRejectedValueOnce(new Error('失败2'))
        .mockResolvedValue('成功')

      const startTime = Date.now()
      
      await RetryHandler.withRetry(mockFn, {
        maxRetries: 2,
        delay: 100,
        backoff: true
      })

      const endTime = Date.now()
      const elapsed = endTime - startTime

      // 指数退避：100ms + 200ms = 300ms (允许一些误差)
      expect(elapsed).toBeGreaterThan(250)
      expect(mockFn).toHaveBeenCalledTimes(3)
    })
  })
})