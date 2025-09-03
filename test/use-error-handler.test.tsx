/**
 * 前端错误处理Hook单元测试 (简化版)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { 
  useErrorHandler, 
  useFileValidation, 
  usePromptValidation 
} from '../app/hooks/use-error-handler'

// Mock console functions
const originalConsoleError = console.error
const originalAlert = window.alert

describe('useErrorHandler', () => {
  beforeEach(() => {
    console.error = vi.fn()
    window.alert = vi.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
    window.alert = originalAlert
    vi.clearAllMocks()
  })

  it('应该正确初始化状态', () => {
    const { result } = renderHook(() => useErrorHandler())

    expect(result.current.error).toBeNull()
    expect(result.current.isRetrying).toBe(false)
    expect(result.current.retryCount).toBe(0)
    expect(result.current.canRetry).toBe(true)
  })

  it('应该正确处理错误并更新状态', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.handleError(new Error('测试错误'))
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.error?.title).toBe('操作失败')
    expect(result.current.error?.message).toBe('测试错误')
    expect(result.current.error?.code).toBe('UNKNOWN_ERROR')
  })

  it('应该正确清除错误状态', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.handleError(new Error('测试错误'))
    })

    expect(result.current.error).not.toBeNull()

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.retryCount).toBe(0)
  })

  it('应该正确处理HTTP状态码', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.handleError({ status: 400, message: 'HTTP 400' })
    })

    expect(result.current.error?.code).toBe('INVALID_REQUEST')
    expect(result.current.error?.title).toBe('请求参数错误')
  })

  it('应该正确处理网络连接错误', () => {
    const { result } = renderHook(() => useErrorHandler())

    const networkError = new TypeError('fetch failed')
    
    act(() => {
      result.current.handleError(networkError)
    })

    expect(result.current.error?.code).toBe('NETWORK_ERROR')
    expect(result.current.error?.title).toBe('网络连接错误')
    expect(result.current.error?.severity).toBe('error')
  })
})

describe('useFileValidation', () => {
  beforeEach(() => {
    console.error = vi.fn()
    window.alert = vi.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
    window.alert = originalAlert
  })

  it('应该通过有效文件的验证', () => {
    const { result } = renderHook(() => useFileValidation())

    const validFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }) // 1MB

    let isValid: boolean
    act(() => {
      isValid = result.current.validateFile(validFile)
    })

    expect(isValid!).toBe(true)
  })

  it('应该拒绝不支持的文件格式', () => {
    const { result } = renderHook(() => useFileValidation())

    const invalidFile = new File(['test content'], 'test.gif', { type: 'image/gif' })

    let isValid: boolean
    act(() => {
      isValid = result.current.validateFile(invalidFile)
    })

    expect(isValid!).toBe(false)
  })

  it('应该拒绝过大的文件', () => {
    const { result } = renderHook(() => useFileValidation())

    const largeFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 }) // 15MB

    let isValid: boolean
    act(() => {
      isValid = result.current.validateFile(largeFile)
    })

    expect(isValid!).toBe(false)
  })
})

describe('usePromptValidation', () => {
  beforeEach(() => {
    console.error = vi.fn()
    window.alert = vi.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
    window.alert = originalAlert
  })

  it('应该通过有效提示词的验证', () => {
    const { result } = renderHook(() => usePromptValidation())

    let isValid: boolean
    act(() => {
      isValid = result.current.validatePrompt('生成一张美丽的风景图')
    })

    expect(isValid!).toBe(true)
  })

  it('应该拒绝空提示词', () => {
    const { result } = renderHook(() => usePromptValidation())

    let isValid: boolean
    act(() => {
      isValid = result.current.validatePrompt('')
    })

    expect(isValid!).toBe(false)
  })

  it('应该拒绝过长的提示词', () => {
    const { result } = renderHook(() => usePromptValidation())

    const longPrompt = 'a'.repeat(5001) // 超过5000字符限制

    let isValid: boolean
    act(() => {
      isValid = result.current.validatePrompt(longPrompt)
    })

    expect(isValid!).toBe(false)
  })

  it('应该处理边界情况', () => {
    const { result } = renderHook(() => usePromptValidation())

    // 测试正好在限制边界的情况
    const boundaryPrompt = 'a'.repeat(5000) // 正好5000字符

    let isValid: boolean
    act(() => {
      isValid = result.current.validatePrompt(boundaryPrompt)
    })

    expect(isValid!).toBe(true)
  })
})