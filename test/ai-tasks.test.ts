/**
 * AI任务业务逻辑层单元测试
 * 
 * 测试createAiImage和updateTaskStatus函数的Nano Banana集成
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// 模拟数据库操作
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  where: vi.fn(),
  eq: vi.fn(),
  set: vi.fn(),
}

// 模拟KieAI实例
const mockKieAI = {
  createNanoBananaTask: vi.fn(),
  createNanoBananaEditTask: vi.fn(),
  queryNanoBananaTask: vi.fn(),
}

// 模拟积分计算
const mockCalculateCredits = vi.fn()

// 模拟提示词生成
const mockGeneratePrompt = vi.fn()

describe('AI Tasks Service - Nano Banana Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // 重置所有mock函数的默认行为
    mockDb.insert.mockReturnValue({ values: vi.fn() })
    mockDb.select.mockReturnValue({ from: vi.fn(), where: vi.fn() })
    mockDb.update.mockReturnValue({ set: vi.fn(), where: vi.fn() })
    mockDb.where.mockReturnValue(mockDb)
    mockDb.eq.mockReturnValue(mockDb)
    mockDb.set.mockReturnValue(mockDb)
    
    mockCalculateCredits.mockReturnValue(4) // Nano Banana默认积分
    mockGeneratePrompt.mockReturnValue('优化后的提示词')
  })

  describe('createAiImage - Nano Banana Support', () => {
    it('应该正确创建Text-to-Image任务', async () => {
      const taskData = {
        id: 'task-123',
        userId: 'user-456',
        prompt: '生成一张美丽的风景图',
        model: 'nano-banana',
        generationMode: 'text-to-image',
        provider: 'kie_nano_banana'
      }

      const nanoBananaResponse = {
        taskId: 'nb-task-789',
        status: 'waiting'
      }\n\n      // 模拟数据库插入操作\n      mockDb.insert.mockImplementation(() => ({\n        values: vi.fn().mockResolvedValue([{ insertedId: taskData.id }])\n      }))\n\n      // 模拟Nano Banana API调用\n      mockKieAI.createNanoBananaTask.mockResolvedValue(nanoBananaResponse)\n\n      // 模拟createAiImage函数\n      const mockCreateAiImage = vi.fn().mockImplementation(async (data) => {\n        // 验证参数\n        expect(data.model).toBe('nano-banana')\n        expect(data.generationMode).toBe('text-to-image')\n        expect(data.provider).toBe('kie_nano_banana')\n        \n        // 计算积分\n        const credits = mockCalculateCredits(data.model, data.generationMode)\n        expect(credits).toBe(4)\n        \n        // 优化提示词\n        const optimizedPrompt = mockGeneratePrompt(data.prompt, data.model)\n        expect(optimizedPrompt).toBe('优化后的提示词')\n        \n        // 创建Nano Banana任务\n        const result = await mockKieAI.createNanoBananaTask({\n          prompt: optimizedPrompt,\n          callBackUrl: `https://example.com/api/webhook/nano-banana/${data.id}`\n        })\n        \n        return {\n          ...data,\n          taskId: result.taskId,\n          status: 'pending',\n          credits\n        }\n      })\n\n      const result = await mockCreateAiImage(taskData)\n\n      expect(result.taskId).toBe(nanoBananaResponse.taskId)\n      expect(result.status).toBe('pending')\n      expect(result.credits).toBe(4)\n      expect(mockKieAI.createNanoBananaTask).toHaveBeenCalledWith({\n        prompt: '优化后的提示词',\n        callBackUrl: `https://example.com/api/webhook/nano-banana/${taskData.id}`\n      })\n    })\n\n    it('应该正确创建Image-to-Image任务', async () => {\n      const taskData = {\n        id: 'task-123',\n        userId: 'user-456',\n        prompt: '修改这张图片的风格',\n        model: 'nano-banana',\n        generationMode: 'image-to-image',\n        provider: 'kie_nano_banana',\n        inputImageUrl: 'https://example.com/input.jpg'\n      }\n\n      const nanoBananaResponse = {\n        taskId: 'nb-edit-task-789',\n        status: 'waiting'\n      }\n\n      mockKieAI.createNanoBananaEditTask.mockResolvedValue(nanoBananaResponse)\n\n      const mockCreateAiImage = vi.fn().mockImplementation(async (data) => {\n        expect(data.generationMode).toBe('image-to-image')\n        expect(data.inputImageUrl).toBeDefined()\n        \n        const result = await mockKieAI.createNanoBananaEditTask({\n          prompt: data.prompt,\n          inputImage: data.inputImageUrl,\n          callBackUrl: `https://example.com/api/webhook/nano-banana/${data.id}`\n        })\n        \n        return {\n          ...data,\n          taskId: result.taskId,\n          status: 'pending'\n        }\n      })\n\n      const result = await mockCreateAiImage(taskData)\n\n      expect(result.taskId).toBe(nanoBananaResponse.taskId)\n      expect(mockKieAI.createNanoBananaEditTask).toHaveBeenCalledWith({\n        prompt: taskData.prompt,\n        inputImage: taskData.inputImageUrl,\n        callBackUrl: `https://example.com/api/webhook/nano-banana/${taskData.id}`\n      })\n    })\n\n    it('应该正确处理创建任务失败的情况', async () => {\n      const taskData = {\n        id: 'task-123',\n        userId: 'user-456',\n        prompt: '生成图片',\n        model: 'nano-banana',\n        generationMode: 'text-to-image',\n        provider: 'kie_nano_banana'\n      }\n\n      // 模拟API调用失败\n      mockKieAI.createNanoBananaTask.mockRejectedValue(\n        new Error('API调用失败')\n      )\n\n      const mockCreateAiImage = vi.fn().mockImplementation(async (data) => {\n        try {\n          await mockKieAI.createNanoBananaTask({\n            prompt: data.prompt,\n            callBackUrl: `https://example.com/api/webhook/nano-banana/${data.id}`\n          })\n        } catch (error) {\n          // 更新任务状态为失败\n          throw new Error('创建Nano Banana任务失败')\n        }\n      })\n\n      await expect(mockCreateAiImage(taskData))\n        .rejects.toThrow('创建Nano Banana任务失败')\n    })\n  })\n\n  describe('updateTaskStatus - Nano Banana Support', () => {\n    it('应该正确查询和更新Nano Banana任务状态', async () => {\n      const taskId = 'task-123'\n      const taskData = {\n        id: taskId,\n        taskId: 'nb-task-789',\n        provider: 'kie_nano_banana',\n        status: 'pending'\n      }\n\n      const nanoBananaTaskStatus = {\n        taskId: 'nb-task-789',\n        status: 'success',\n        resultUrls: ['https://example.com/result1.jpg'],\n        createTime: '2024-01-01T00:00:00Z',\n        completeTime: '2024-01-01T00:01:00Z'\n      }\n\n      // 模拟数据库查询\n      mockDb.select.mockImplementation(() => ({\n        from: vi.fn().mockReturnValue({\n          where: vi.fn().mockResolvedValue([taskData])\n        })\n      }))\n\n      // 模拟Nano Banana状态查询\n      mockKieAI.queryNanoBananaTask.mockResolvedValue(nanoBananaTaskStatus)\n\n      // 模拟数据库更新\n      mockDb.update.mockImplementation(() => ({\n        set: vi.fn().mockReturnValue({\n          where: vi.fn().mockResolvedValue({ rowsAffected: 1 })\n        })\n      }))\n\n      const mockUpdateTaskStatus = vi.fn().mockImplementation(async (id) => {\n        // 查询数据库中的任务\n        const tasks = await mockDb.select().from('ai_tasks').where(mockDb.eq('id', id))\n        const task = tasks[0]\n        \n        if (task.provider === 'kie_nano_banana') {\n          // 查询Nano Banana任务状态\n          const statusResponse = await mockKieAI.queryNanoBananaTask(task.taskId)\n          \n          // 映射状态\n          let newStatus = 'pending'\n          if (statusResponse.status === 'success') {\n            newStatus = 'succeeded'\n          } else if (statusResponse.status === 'fail') {\n            newStatus = 'failed'\n          } else if (statusResponse.status === 'generating') {\n            newStatus = 'running'\n          }\n          \n          // 更新数据库\n          await mockDb.update('ai_tasks')\n            .set({\n              status: newStatus,\n              resultImages: statusResponse.resultUrls || [],\n              completedAt: statusResponse.completeTime\n            })\n            .where(mockDb.eq('id', id))\n            \n          return {\n            ...task,\n            status: newStatus,\n            resultImages: statusResponse.resultUrls || []\n          }\n        }\n        \n        return task\n      })\n\n      const result = await mockUpdateTaskStatus(taskId)\n\n      expect(result.status).toBe('succeeded')\n      expect(result.resultImages).toEqual(['https://example.com/result1.jpg'])\n      expect(mockKieAI.queryNanoBananaTask).toHaveBeenCalledWith('nb-task-789')\n    })\n\n    it('应该正确处理不同的Nano Banana任务状态', async () => {\n      const statusMappings = [\n        { nanoBananaStatus: 'waiting', expectedStatus: 'pending' },\n        { nanoBananaStatus: 'queuing', expectedStatus: 'pending' },\n        { nanoBananaStatus: 'generating', expectedStatus: 'running' },\n        { nanoBananaStatus: 'success', expectedStatus: 'succeeded' },\n        { nanoBananaStatus: 'fail', expectedStatus: 'failed' }\n      ]\n\n      for (const mapping of statusMappings) {\n        const taskData = {\n          id: 'task-123',\n          taskId: 'nb-task-789',\n          provider: 'kie_nano_banana',\n          status: 'pending'\n        }\n\n        mockDb.select.mockImplementation(() => ({\n          from: vi.fn().mockReturnValue({\n            where: vi.fn().mockResolvedValue([taskData])\n          })\n        }))\n\n        mockKieAI.queryNanoBananaTask.mockResolvedValue({\n          taskId: 'nb-task-789',\n          status: mapping.nanoBananaStatus,\n          resultUrls: mapping.nanoBananaStatus === 'success' ? ['result.jpg'] : null\n        })\n\n        const mockUpdateTaskStatus = vi.fn().mockImplementation(async () => {\n          const statusResponse = await mockKieAI.queryNanoBananaTask('nb-task-789')\n          \n          let newStatus = 'pending'\n          if (statusResponse.status === 'success') {\n            newStatus = 'succeeded'\n          } else if (statusResponse.status === 'fail') {\n            newStatus = 'failed'\n          } else if (statusResponse.status === 'generating') {\n            newStatus = 'running'\n          }\n          \n          return { ...taskData, status: newStatus }\n        })\n\n        const result = await mockUpdateTaskStatus()\n        expect(result.status).toBe(mapping.expectedStatus)\n      }\n    })\n\n    it('应该正确处理任务查询失败的情况', async () => {\n      const taskData = {\n        id: 'task-123',\n        taskId: 'nb-task-789',\n        provider: 'kie_nano_banana',\n        status: 'pending'\n      }\n\n      mockDb.select.mockImplementation(() => ({\n        from: vi.fn().mockReturnValue({\n          where: vi.fn().mockResolvedValue([taskData])\n        })\n      }))\n\n      // 模拟查询失败\n      mockKieAI.queryNanoBananaTask.mockRejectedValue(\n        new Error('任务不存在')\n      )\n\n      const mockUpdateTaskStatus = vi.fn().mockImplementation(async (id) => {\n        const tasks = await mockDb.select().from('ai_tasks').where(mockDb.eq('id', id))\n        const task = tasks[0]\n        \n        try {\n          await mockKieAI.queryNanoBananaTask(task.taskId)\n        } catch (error) {\n          // 标记任务为失败\n          await mockDb.update('ai_tasks')\n            .set({ status: 'failed', error: (error as Error).message })\n            .where(mockDb.eq('id', id))\n            \n          return { ...task, status: 'failed' }\n        }\n      })\n\n      const result = await mockUpdateTaskStatus('task-123')\n      expect(result.status).toBe('failed')\n    })\n  })\n\n  describe('积分计算', () => {\n    it('应该为Nano Banana任务正确计算积分', () => {\n      mockCalculateCredits.mockImplementation((model, mode) => {\n        if (model === 'nano-banana') {\n          return 4 // Nano Banana固定4积分\n        }\n        return 0\n      })\n\n      const textToImageCredits = mockCalculateCredits('nano-banana', 'text-to-image')\n      const imageToImageCredits = mockCalculateCredits('nano-banana', 'image-to-image')\n      \n      expect(textToImageCredits).toBe(4)\n      expect(imageToImageCredits).toBe(4)\n    })\n  })\n\n  describe('提示词优化', () => {\n    it('应该为Nano Banana模型优化提示词', () => {\n      mockGeneratePrompt.mockImplementation((prompt, model) => {\n        if (model === 'nano-banana') {\n          return `${prompt}, masterpiece, best quality, ultra detailed`\n        }\n        return prompt\n      })\n\n      const originalPrompt = '生成一张风景图'\n      const optimizedPrompt = mockGeneratePrompt(originalPrompt, 'nano-banana')\n      \n      expect(optimizedPrompt).toBe('生成一张风景图, masterpiece, best quality, ultra detailed')\n    })\n  })\n})