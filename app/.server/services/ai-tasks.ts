import { nanoid } from "nanoid";
import currency from "currency.js";

import type { CreateAiImageDTO } from "~/.server/schema/task";

import {
  insertAiTaskBatch,
  getAiTaskByTaskNo,
  updateAiTask,
  getAiTaskByTaskId,
} from "~/.server/model/ai_tasks";
import type { InsertAiTask, AiTask, User } from "~/.server/libs/db";
import { consumptionsCredits } from "./credits";
import { uploadFiles, downloadFilesToBucket } from "./r2-bucket";
import {
  KieAI,
  type CreateKontextOptions,
  type Create4oTaskOptions,
} from "~/.server/aisdk";
import { Logger } from "~/.server/utils/logger";
import { BusinessLogicLogger, KieAiApiLogger } from "~/.server/utils/step-loggers";
import {
  BaseError,
  CreditInsufficientError,
  R2UploadError,
  KieParameterError,
  RequiredParameterMissingError,
  ParameterTypeError,
  ParameterRangeError,
  UnsupportedFileFormatError,
  TaskNotFoundError,
  TaskStatusError,
  TaskScheduleError,
  UnsupportedProviderError
} from "../types/errors";

// 移除发型相关的提示词导入

export type AiTaskResult = Pick<
  AiTask,
  | "task_no"
  | "task_id"
  | "created_at"
  | "status"
  | "completed_at"
  | "aspect"
  | "result_url"
  | "fail_reason"
  | "ext"
>;
const transformResult = (value: AiTask): AiTaskResult => {
  const {
    task_no,
    task_id,
    created_at,
    status,
    completed_at,
    aspect,
    result_url,
    fail_reason,
    ext,
  } = value;

  return {
    task_no,
    task_id,
    created_at,
    status,
    completed_at,
    aspect,
    result_url,
    fail_reason,
    ext,
  };
};

export const createAiTask = async (payload: InsertAiTask | InsertAiTask[]) => {
  const values = Array.isArray(payload) ? Array.from(payload) : [payload];
  const results = await insertAiTaskBatch(values);

  return results.map(transformResult);
};

// 移除createAiHairstyle函数 - 简化版本不支持发型生成功能

export const startTask = async (env: Env, params: AiTask["task_no"] | AiTask) => {
  let task: AiTask;
  if (typeof params === "string") {
    const result = await getAiTaskByTaskNo(params);
    if (!result) throw new TaskNotFoundError(params);
    task = result;
  } else task = params;

  if (task.status !== "pending") {
    throw new TaskStatusError(task.status, "pending");
  }

  const startAt = task.estimated_start_at.valueOf();
  if (startAt > new Date().valueOf()) {
    throw new TaskScheduleError("任务尚未到达预定开始时间");
  }

  const kie = new KieAI({ accessKey: env.KIEAI_APIKEY });
  let newTask: AiTask;
  
  try {
    if (task.provider === "kie_nano_banana") {
       // Nano Banana 任务处理逻辑在 createAiImage 中已完成
       // 这里不需要额外处理
       newTask = task;
     } else {
       throw new UnsupportedProviderError(task.provider || "unknown", ["kie_nano_banana"]);
     }
  } catch (error) {
    // 如果是我们定义的错误类型，直接重新抛出
    if (error instanceof BaseError) {
      throw error;
    }
    // 如果是其他错误，包装为KieParameterError
    throw new KieParameterError(
      `AI服务调用失败: ${error instanceof Error ? error.message : String(error)}`,
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }

  return transformResult(newTask);
};

/**
 * 更新生成任务的状态，依据 status 处理
 * - pending: 尝试 startTask
 * - running: 尝试更新 task detail
 * - 其他值: 返回处理后的 task 内容
 */
export const updateTaskStatus = async (env: Env, taskNo: AiTask["task_no"] | AiTask) => {
  let task: AiTask | undefined | null;
  if (typeof taskNo === "string") {
    task = await getAiTaskByTaskNo(taskNo);
  } else task = taskNo;

  if (!task) throw new TaskNotFoundError(typeof taskNo === "string" ? taskNo : (taskNo.task_no ?? "unknown"));
  if (task.status === "pending") {
    try {
      const result = await startTask(env, task);
      return {
        task: result,
        progress: 0,
      };
    } catch (error) {
      // 如果是标准化错误，重新抛出
      if (error instanceof BaseError) {
        throw error;
      }
      // 否则返回任务状态，但记录错误
      console.error("启动任务失败:", error);
      return { task: transformResult(task), progress: 0 };
    }
  }
  if (task.status !== "running") {
    return {
      task: transformResult(task),
      progress: 1,
    };
  }

  if (!task.task_id) throw new TaskStatusError("missing_task_id", "valid_task_id", { taskNo: task.task_no ?? "unknown", reason: "任务ID缺失" });

  const kie = new KieAI({ accessKey: env.KIEAI_APIKEY });

  if (task.provider === "kie_nano_banana") {
     if (!task.task_id) {
       throw new Error("Task ID is required for querying Nano Banana task");
     }
     // Nano Banana 任务状态查询
     const result = await kie.queryNanoBananaTask(task.task_id);
    
    if (result.state === "generating" || result.state === "queuing" || result.state === "waiting") {
      // 任务还在进行中，返回进度
      const progress = (() => {
        switch (result.state) {
          case "waiting": return 10;
          case "queuing": return 30;
          case "generating": return 70;
          default: return 10;
        }
      })();
      
      return {
         task: transformResult(task),
         progress,
       };
    } else if (result.state === "success") {
      // 任务成功完成
      let resultUrl: string | undefined;
      
      try {
        const resultData = JSON.parse(result.resultJson);
        resultUrl = resultData.resultUrls?.[0];
      } catch (e) {
        console.error("Failed to parse Nano Banana result JSON:", e);
      }
      
      let newTask: AiTask;
      if (!resultUrl) {
        const [aiTask] = await updateAiTask(task.task_no, {
          status: "failed",
          completed_at: new Date(result.completeTime || Date.now()),
          result_data: result,
          fail_reason: "Result URL not found in response",
        });
        newTask = aiTask;
      } else {
        // 生产环境下下载到本地存储
        if (import.meta.env.PROD) {
          try {
            const [file] = await downloadFilesToBucket(
              env,
              [{ src: resultUrl, fileName: task.task_no, ext: "png" }],
              "result/ai-image"
            );
            if (file) resultUrl = new URL(file.key, env.CDN_URL).toString();
          } catch (e) {
            console.error("Failed to download Nano Banana result to bucket:", e);
          }
        }

        const [aiTask] = await updateAiTask(task.task_no, {
          status: "succeeded",
          completed_at: new Date(result.completeTime || Date.now()),
          result_data: result,
          result_url: resultUrl,
        });
        newTask = aiTask;
      }

      return { task: transformResult(newTask), progress: 100 };
     } else {
       // 任务失败
       const [newTask] = await updateAiTask(task.task_no, {
         status: "failed",
         completed_at: new Date(result.completeTime || Date.now()),
         fail_reason: result.failMsg || "Nano Banana generation failed",
         result_data: result,
       });

       return { task: transformResult(newTask), progress: 100 };
     }
  } else {
    throw new UnsupportedProviderError(task.provider || "unknown", ["kie_nano_banana"]);
  }
};

export const updateTaskStatusByTaskId = async (env: Env, taskId: AiTask["task_id"]) => {
  const result = await getAiTaskByTaskId(taskId);
  if (!result || result.status !== "running") {
    throw Error("Unvalid Task ID");
  }

  await updateTaskStatus(env, result);
};

// New AI Image Generation Function
/**
 * 创建AI图像生成任务
 * @param env - Cloudflare环境变量
 * @param value - 图像生成参数
 * @param user - 用户信息
 * @returns 创建的任务列表和消费的积分信息
 */
export const createAiImage = async (
  env: Env,
  value: CreateAiImageDTO,
  user: User
) => {
  // 生成请求ID用于日志追踪
  const requestId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 记录业务逻辑处理开始
  BusinessLogicLogger.logProcessingStart(requestId, {
    userId: user.id.toString(),
    mode: value.mode,
    type: value.type
  });
  
  // 创建日志上下文
  const logger = Logger.createContext();
  
  logger.info("开始处理AI图像生成请求", "createAiImage", {
    requestId,
    userId: user.id,
    userEmail: user.email,
    requestParams: {
      mode: value.mode,
      type: value.type,
      hasImage: !!value.image,
      promptLength: (value.prompt || '').length,
      width: value.width,
      height: value.height
    },
    environment: import.meta.env.PROD ? 'production' : 'development',
    envConfig: {
      hasKieApiKey: !!env.KIEAI_APIKEY,
      kieApiKeyPreview: env.KIEAI_APIKEY ? `${env.KIEAI_APIKEY.substring(0, 8)}...` : "未设置",
      domain: env.DOMAIN,
      cdnUrl: env.CDN_URL
    }
  });
  const { mode, image, prompt, type, width, height } = value;

  // 图片生成固定消耗1个积分（Nano Banana模型）
  const taskCredits = 1;

  // 🔥 重要优化：提前验证积分但不扣除，避免API失败后积分已被消耗
  BusinessLogicLogger.logCreditValidation(requestId, {
    userId: user.id.toString(),
    requiredCredits: taskCredits,
    isValid: false // 还在检查中
  });
  
  const { balance } = await import("./credits").then(m => m.getUserCredits(user));
  if (balance < taskCredits) {
    BusinessLogicLogger.logProcessingError(requestId, new CreditInsufficientError(balance, taskCredits));
    throw new CreditInsufficientError(balance, taskCredits);
  }
  
  BusinessLogicLogger.logCreditValidation(requestId, {
    userId: user.id.toString(),
    currentCredits: balance,
    requiredCredits: taskCredits,
    isValid: true
  });

  let fileUrl: string | undefined;
  
  // 如果是 image-to-image 模式，直接使用传入的图片URL
  if (mode === "image-to-image" && image) {
    fileUrl = image; // 现在image是URL字符串
    
    BusinessLogicLogger.logImageUploadToR2(requestId, {
      fileName: "external_image",
      fileSize: 0, // 外部URL无法获取文件大小
      uploadUrl: fileUrl,
      success: true
    });
  }

  const aspect = "1:1"; // 默认正方形
  const callbakUrl = new URL("/webhooks/kie-image", env.DOMAIN).toString();

  let insertPayload: InsertAiTask;
  let kieResponse: any; // 存储API调用结果

  if (type === "nano-banana" || type === "nano-banana-edit") {
    // Nano Banana 模型处理 - 在业务层进行参数验证
    if (type === "nano-banana-edit") {
      // Image-to-Image 模式验证
      if (!fileUrl) {
        throw new RequiredParameterMissingError("image", "Image is required for nano-banana-edit model");
      }
      // 验证图片数量限制（虽然当前只支持1张，但为未来扩展做准备）
      const imageUrls = [fileUrl];
      if (imageUrls.length > 5) {
        throw new ParameterRangeError("image_urls", imageUrls.length, "1-5 images");
      }
    }

    // 使用原始提示词（简化版本不处理样式和负面提示词）
    const fullPrompt = prompt;

    console.log("🚀 开始调用 Kie AI API...");
    console.log("📋 API配置:", {
      baseURL: "https://api.kie.ai",
      endpoint: "/api/v1/jobs/createTask",
      model: type === "nano-banana" ? "google/nano-banana" : "google/nano-banana-edit",
      hasApiKey: !!env.KIEAI_APIKEY,
      apiKeyPreview: env.KIEAI_APIKEY ? `${env.KIEAI_APIKEY.substring(0, 8)}...` : "未设置"
    });
    
    // 记录Kie AI API调用开始
    const apiStartTime = Date.now();
    KieAiApiLogger.logApiCallStart(requestId, {
      endpoint: "/api/v1/jobs/createTask",
      method: "POST",
      taskType: type
    });
    
    // 记录API请求参数
    KieAiApiLogger.logApiParameters(requestId, {
      prompt: fullPrompt,
      hasImageUrls: !!fileUrl,
      callbackUrl: import.meta.env.PROD ? callbakUrl : "development-mode"
    });
    
    const kieAI = new KieAI({ accessKey: env.KIEAI_APIKEY });

    try {
      if (type === "nano-banana") {
        // Text-to-Image 模式
        console.log("💭 调用 Text-to-Image API...");
        kieResponse = await kieAI.createNanoBananaTask({
          prompt: fullPrompt,
          callBackUrl: import.meta.env.PROD ? callbakUrl : undefined,
        });
      } else {
        // Image-to-Image 模式（参数已在上面验证）
        console.log("🖼️ 调用 Image-to-Image API...", { imageUrl: fileUrl });
        if (!fileUrl) {
          throw new RequiredParameterMissingError("image", "Image is required for nano-banana-edit model");
        }
        
        // 🔧 时序优化：验证图片URL在Kie AI调用前是否可访问
        console.log("📋 后端验证图片URL可访问性:", fileUrl);
        try {
          const imageCheckResponse = await fetch(fileUrl, { 
            method: 'HEAD',
            // 添加超时设置，避免长时间等待
            signal: AbortSignal.timeout(5000)
          });
          
          if (!imageCheckResponse.ok) {
            console.warn(`⚠️ 图片URL返回状态码 ${imageCheckResponse.status}，但继续尝试调用Kie AI`);
          } else {
            console.log("✅ 图片URL验证成功，继续调用Kie AI");
          }
        } catch (error) {
          console.warn("⚠️ 图片URL验证失败，但继续尝试调用Kie AI:", error instanceof Error ? error.message : String(error));
        }
        
        kieResponse = await kieAI.createNanoBananaEditTask({
          prompt: fullPrompt,
          image_urls: [fileUrl],
          callBackUrl: import.meta.env.PROD ? callbakUrl : undefined,
        });
      }
      
      console.log("✅ API调用成功:", { taskId: kieResponse.taskId });
      
      // 记录API调用成功
      const responseTime = Date.now() - apiStartTime;
      KieAiApiLogger.logApiCallComplete(requestId, {
        taskId: kieResponse.taskId,
        status: "success",
        responseTime: responseTime
      });
      
    } catch (error) {
      console.error("❌ Kie AI API调用失败:");
      console.error("错误详情:", {
        message: error instanceof Error ? error.message : String(error),
        type: typeof error,
        errorObject: error
      });
      
      // 记录API调用失败
      KieAiApiLogger.logApiCallError(requestId, error instanceof Error ? error : new Error(String(error)));
      
      // 重新抛出错误，让上层处理
      throw new KieParameterError(
         `AI服务调用失败: ${error instanceof Error ? error.message : String(error)}`,
         { originalError: error instanceof Error ? error.message : String(error) }
       );
    }

    // 🔥 只有在API调用成功后才扣除积分
    console.log("💰 API调用成功，开始扣除积分...");
    const consumptionResult = await consumptionsCredits(user, {
      credits: taskCredits,
      source_type: "ai_image",
      source_id: kieResponse.taskId,
      reason: `${type} 图像生成`,
    });

    const inputParams = {
      mode,
      image: fileUrl,
      prompt,
      width,
      height,
    };

    const ext = {
      mode,
      prompt_preview: (prompt || '').substring(0, 100),
    };

    insertPayload = {
      user_id: user.id,
      status: "running", // 🔧 修复：任务已提交给Kie AI，应该是running状态
      estimated_start_at: new Date(),
      input_params: inputParams,
      ext,
      aspect: aspect,
      provider: "kie_nano_banana",
      task_id: kieResponse.taskId,
      request_param: {
        model: type === "nano-banana" ? "google/nano-banana" : "google/nano-banana-edit",
        prompt: fullPrompt,
        ...(fileUrl ? { image_urls: [fileUrl] } : {}),
        callBackUrl: import.meta.env.PROD ? callbakUrl : undefined,
      },
    };
    
    const tasks = await createAiTask([insertPayload]);
    
    // 记录业务逻辑处理完成
    BusinessLogicLogger.logProcessingComplete(requestId, {
      taskId: kieResponse.taskId,
      fileUrl: fileUrl
    });
    
    return { tasks, consumptionCredits: consumptionResult };
  }
  
  // 如果不是nano-banana模型，抛出错误
  throw new UnsupportedFileFormatError(type, ["nano-banana", "nano-banana-edit"]);
};

/**
 * 为未登录用户创建AI图像生成任务（不涉及积分扣除）
 * @param env - Cloudflare环境变量
 * @param value - 图像生成参数
 * @returns 创建的任务列表（不包含积分信息）
 */
export const createAiImageForGuest = async (
  env: Env,
  value: CreateAiImageDTO
) => {
  // 生成请求ID用于日志追踪
  const requestId = `guest_img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 记录业务逻辑处理开始
  BusinessLogicLogger.logProcessingStart(requestId, {
    userId: "guest",
    mode: value.mode,
    type: value.type
  });
  
  // 创建日志上下文
  const logger = Logger.createContext();
  
  logger.info("开始处理未登录用户AI图像生成请求", "createAiImageForGuest", {
    requestId,
    requestParams: {
      mode: value.mode,
      type: value.type,
      hasImage: !!value.image,
      promptLength: (value.prompt || '').length,
      width: value.width,
      height: value.height
    },
    environment: import.meta.env.PROD ? 'production' : 'development',
  });
  
  const { mode, image, prompt, type, width, height } = value;

  let fileUrl: string | undefined;
  
  // 如果是 image-to-image 模式，直接使用传入的图片URL
  if (mode === "image-to-image" && image) {
    fileUrl = image;
    
    BusinessLogicLogger.logImageUploadToR2(requestId, {
      fileName: "external_image",
      fileSize: 0,
      uploadUrl: fileUrl,
      success: true
    });
  }

  const aspect = "1:1";
  const callbakUrl = new URL("/webhooks/kie-image", env.DOMAIN).toString();

  let kieResponse: any;

  if (type === "nano-banana" || type === "nano-banana-edit") {
    // 验证参数
    if (type === "nano-banana-edit" && !fileUrl) {
      throw new RequiredParameterMissingError("image", "Image is required for nano-banana-edit model");
    }

    const fullPrompt = prompt;

    console.log("🚀 开始调用 Kie AI API (Guest User)...");
    
    // 记录Kie AI API调用开始
    const apiStartTime = Date.now();
    KieAiApiLogger.logApiCallStart(requestId, {
      endpoint: "/api/v1/jobs/createTask",
      method: "POST",
      taskType: type
    });
    
    const kieAI = new KieAI({ accessKey: env.KIEAI_APIKEY });

    try {
      if (type === "nano-banana") {
        // Text-to-Image 模式
        kieResponse = await kieAI.createNanoBananaTask({
          prompt: fullPrompt,
          callBackUrl: import.meta.env.PROD ? callbakUrl : undefined,
        });
      } else {
        // Image-to-Image 模式
        kieResponse = await kieAI.createNanoBananaEditTask({
          prompt: fullPrompt,
          image_urls: [fileUrl!],
          callBackUrl: import.meta.env.PROD ? callbakUrl : undefined,
        });
      }

      // 记录API调用成功
      KieAiApiLogger.logApiCallComplete(requestId, {
        taskId: kieResponse.taskId,
        status: "success",
        responseTime: Date.now() - apiStartTime
      });

      console.log("✅ Kie AI API调用成功:", kieResponse);
    } catch (error) {
      // 记录API调用失败
      KieAiApiLogger.logApiCallError(requestId, error instanceof Error ? error : new Error(String(error)), {
        statusCode: 0,
        responseBody: error instanceof Error ? error.message : String(error)
      });

      console.error("❌ Kie AI API调用失败:", error);
      throw error;
    }

    // 为未登录用户创建临时任务记录（不存储到数据库）
    const guestTask = {
      task_no: `guest_${nanoid()}`,
      task_id: kieResponse.taskId,
      created_at: new Date(),
      status: "running" as const,
      completed_at: null,
      aspect: aspect,
      result_url: null,
      fail_reason: null,
      ext: {
        mode,
        prompt_preview: (prompt || '').substring(0, 100),
      },
    };
    
    // 记录业务逻辑处理完成
    BusinessLogicLogger.logProcessingComplete(requestId, {
      taskId: kieResponse.taskId,
      fileUrl: fileUrl
    });
    
    // 返回格式与正常用户一致，但不包含积分信息
    return { 
      tasks: [guestTask], 
      consumptionCredits: { 
        consumed: 0, 
        consumptionRecords: 0, 
        remainingBalance: 0 
      } 
    };
  }
  
  throw new UnsupportedFileFormatError(type, ["nano-banana", "nano-banana-edit"]);
};
