import { nanoid } from "nanoid";
import currency from "currency.js";

import type { CreateAiHairstyleDTO, CreateAiImageDTO } from "~/.server/schema/task";

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

import { createAiHairstyleChangerPrompt } from "~/.server/prompt/ai-hairstyle";
import { createAiHairstyleChangerPrompt as createHairstyleChangerKontext } from "~/.server/prompt/ai-hairstyle-kontext";

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

/**
 * 创建AI发型变换任务
 * @param env - Cloudflare环境变量
 * @param value - 发型变换参数
 * @param user - 用户信息
 * @returns 创建的任务列表和消费的积分信息
 */
export const createAiHairstyle = async (
  env: Env,
  value: CreateAiHairstyleDTO,
  user: User
) => {
  const { photo, hair_color, hairstyle, detail, type } = value;

  const taskCredits = hairstyle.length;

  // 进行 Credits 扣除
  const consumptionResult = await consumptionsCredits(user, {
    credits: taskCredits,
  });

  const extName = photo.name.split(".").pop()!;
  const newFileName = `${nanoid()}.${extName}`;
  const file = new File([photo], newFileName);
  const [R2Object] = await uploadFiles(env, file);

  const fileUrl = new URL(R2Object.key, env.CDN_URL).toString();

  let insertPayloads: InsertAiTask[] = [];
  if (type === "gpt-4o") {
    const aspect = "2:3";
    const callbakUrl = new URL("/webhooks/kie-image", env.DOMAIN).toString();

    insertPayloads = hairstyle.map<InsertAiTask>((style) => {
      const inputParams = {
        photo: fileUrl,
        hair_color,
        hairstyle: style,
        detail,
      };
      const ext = {
        hairstyle: style.name,
        haircolor: hair_color.value ? hair_color.name : undefined,
      };

      const filesUrl = [fileUrl];
      if (style.cover) filesUrl.push(style.cover);
      if (hair_color.cover) filesUrl.push(hair_color.cover);

      const params: Create4oTaskOptions = {
        filesUrl: filesUrl,
        prompt: createAiHairstyleChangerPrompt({
          hairstyle: style.name,
          haircolor: hair_color.name,
          haircolorHex: hair_color.value,
          withStyleReference: !!style.cover,
          withColorReference: !!hair_color.cover,
          detail: detail,
        }),
        size: aspect,
        nVariants: "4",
        callBackUrl: import.meta.env.PROD ? callbakUrl : undefined,
      };

      return {
        user_id: user.id,
        status: "pending",
        estimated_start_at: new Date(),
        input_params: inputParams,
        ext,
        aspect: aspect,
        provider: "kie_4o",
        request_param: params,
      };
    });
  } else if (type === "kontext") {
    const aspect = "3:4";
    const callbakUrl = new URL("/webhooks/kie-image", env.DOMAIN).toString();

    insertPayloads = hairstyle.map<InsertAiTask>((style) => {
      const inputParams = {
        photo: fileUrl,
        hair_color,
        hairstyle: style,
        detail,
      };
      const ext = {
        hairstyle: style.name,
        haircolor: hair_color.value ? hair_color.name : undefined,
      };

      const filesUrl = [fileUrl];
      if (style.cover) filesUrl.push(style.cover);
      if (hair_color.cover) filesUrl.push(hair_color.cover);

      const params: CreateKontextOptions = {
        inputImage: fileUrl,
        prompt: createHairstyleChangerKontext({
          hairstyle: style.name,
          haircolor: hair_color.name,
          detail: detail,
        }),
        aspectRatio: aspect,
        model: "flux-kontext-pro",
        outputFormat: "png",
        callBackUrl: import.meta.env.PROD ? callbakUrl : undefined,
      };

      return {
        user_id: user.id,
        status: "pending",
        estimated_start_at: new Date(),
        input_params: inputParams,
        ext,
        aspect: aspect,
        provider: "kie_kontext",
        request_param: params,
      };
    });
  }

  const tasks = await createAiTask(insertPayloads);
  return { tasks, consumptionCredits: consumptionResult };
};

export const startTask = async (params: AiTask["task_no"] | AiTask) => {
  let task: AiTask;
  if (typeof params === "string") {
    const result = await getAiTaskByTaskNo(params);
    if (!result) throw Error("Unvalid Task No");
    task = result;
  } else task = params;

  if (task.status !== "pending") {
    throw Error("Task is not in Pending");
  }

  const startAt = task.estimated_start_at.valueOf();
  if (startAt > new Date().valueOf()) {
    throw Error("Not Allow to Start");
  }

  const kie = new KieAI();
  let newTask: AiTask;
  if (task.provider === "kie_4o") {
    const result = await kie.create4oTask(
      task.request_param as Create4oTaskOptions
    );
    const res = await updateAiTask(task.task_no, {
      task_id: result.taskId,
      status: "running",
      started_at: new Date(),
    });
    newTask = res[0];
  } else if (task.provider === "kie_kontext") {
    const result = await kie.createKontextTask(
      task.request_param as CreateKontextOptions
    );
    const res = await updateAiTask(task.task_no, {
      task_id: result.taskId,
      status: "running",
      started_at: new Date(),
    });
    newTask = res[0];
  } else {
    throw Error("Unvalid Task Provider");
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

  if (!task) throw Error("Unvalid Task No");
  if (task.status === "pending") {
    try {
      const result = await startTask(task);
      return {
        task: result,
        progress: 0,
      };
    } catch {
      return { task: transformResult(task), progress: 0 };
    }
  }
  if (task.status !== "running") {
    return {
      task: transformResult(task),
      progress: 1,
    };
  }

  if (!task.task_id) throw Error("Unvalid Task ID");

  const kie = new KieAI();

  if (task.provider === "kie_4o") {
    const result = await kie.query4oTaskDetail({ taskId: task.task_id });
    if (result.status === "GENERATING") {
      return {
        task: transformResult(task),
        progress: currency(result.progress).intValue,
      };
    } else if (result.status === "SUCCESS") {
      let resultUrl = result.response?.resultUrls[0];
      let newTask: AiTask;
      if (!resultUrl) {
        const [aiTask] = await updateAiTask(task.task_no, {
          status: "failed",
          completed_at: new Date(),
          result_data: result,
          result_url: resultUrl,
          fail_reason: "Result url not retrieved",
        });
        newTask = aiTask;
      } else {
        if (import.meta.env.PROD) {
          try {
            const [file] = await downloadFilesToBucket(
              env,
              [{ src: resultUrl, fileName: task.task_no, ext: "png" }],
              "result/hairstyle"
            );
            if (file) resultUrl = new URL(file.key, env.CDN_URL).toString();
          } catch {}
        }

        const [aiTask] = await updateAiTask(task.task_no, {
          status: "succeeded",
          completed_at: new Date(),
          result_data: result,
          result_url: resultUrl,
        });
        newTask = aiTask;
      }

      return { task: transformResult(newTask), progress: 1 };
    } else {
      const [newTask] = await updateAiTask(task.task_no, {
        status: "failed",
        completed_at: new Date(),
        fail_reason: result.errorMessage,
        result_data: result,
      });

      return { task: transformResult(newTask), progress: 1 };
    }
  } else if (task.provider === "kie_kontext") {
    const result = await kie.queryKontextTask({ taskId: task.task_id });
    if (result.successFlag === 0) {
      return {
        task: transformResult(task),
        progress: 0,
      };
    } else if (result.successFlag === 1) {
      let resultUrl =
        result.response?.resultImageUrl ?? result.response?.originImageUrl;
      let newTask: AiTask;
      if (!resultUrl) {
        const [aiTask] = await updateAiTask(task.task_no, {
          status: "failed",
          completed_at: new Date(),
          result_data: result,
          result_url: resultUrl,
          fail_reason: "Result url not retrieved",
        });
        newTask = aiTask;
      } else {
        if (import.meta.env.PROD) {
          try {
            const [file] = await downloadFilesToBucket(
              env,
              [{ src: resultUrl, fileName: task.task_no, ext: "png" }],
              "result/hairstyle"
            );
            if (file) resultUrl = new URL(file.key, env.CDN_URL).toString();
          } catch {}
        }

        const [aiTask] = await updateAiTask(task.task_no, {
          status: "succeeded",
          completed_at: new Date(),
          result_data: result,
          result_url: resultUrl,
        });
        newTask = aiTask;
      }

      return { task: transformResult(newTask), progress: 1 };
    } else {
      const [newTask] = await updateAiTask(task.task_no, {
        status: "failed",
        completed_at: new Date(),
        fail_reason: result.errorMessage,
        result_data: result,
      });

      return { task: transformResult(newTask), progress: 1 };
    }
  } else if (task.provider === "kie_nano_banana") {
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
  }

  return {
    task: transformResult(task),
    progress: 1,
  };
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
  const { mode, image, prompt, negative_prompt, style, type, width, height, steps, cfg_scale } = value;

  // 图片生成固定消耗1个积分
  const taskCredits = 1;

  // 进行 Credits 扣除
  const consumptionResult = await consumptionsCredits(user, {
    credits: taskCredits,
  });

  let fileUrl: string | undefined;
  
  // 如果是 image-to-image 模式，上传参考图片
  if (mode === "image-to-image" && image) {
    const extName = image.name.split(".").pop()!;
    const newFileName = `${nanoid()}.${extName}`;
    const file = new File([image], newFileName);
    const [R2Object] = await uploadFiles(env, file);
    fileUrl = new URL(R2Object.key, env.CDN_URL).toString();
  }

  const aspect = "1:1"; // 默认正方形
  const callbakUrl = new URL("/webhooks/kie-image", env.DOMAIN).toString();

  let insertPayload: InsertAiTask;

  if (type === "gpt-4o") {
    const inputParams = {
      mode,
      image: fileUrl,
      prompt,
      negative_prompt,
      style,
      width,
      height,
    };

    const ext = {
      mode,
      style: style || "default",
      prompt_preview: prompt.substring(0, 100),
    };

    const filesUrl = fileUrl ? [fileUrl] : [];

    // 构建完整的提示词
    let fullPrompt = prompt;
    if (style) {
      fullPrompt = `${prompt}, ${style} style`;
    }
    if (negative_prompt) {
      fullPrompt += `. Negative: ${negative_prompt}`;
    }

    const params: Create4oTaskOptions = {
      filesUrl: filesUrl,
      prompt: fullPrompt,
      size: aspect,
      nVariants: "1",
      callBackUrl: import.meta.env.PROD ? callbakUrl : undefined,
    };

    insertPayload = {
      user_id: user.id,
      status: "pending",
      estimated_start_at: new Date(),
      input_params: inputParams,
      ext,
      aspect: aspect,
      provider: "kie_4o",
      request_param: params,
    };
  } else if (type === "kontext") {
    const inputParams = {
      mode,
      image: fileUrl,
      prompt,
      negative_prompt,
      style,
      width,
      height,
    };

    const ext = {
      mode,
      style: style || "default",
      prompt_preview: prompt.substring(0, 100),
    };

    // 构建完整的提示词
    let fullPrompt = prompt;
    if (style) {
      fullPrompt = `${prompt}, ${style} style`;
    }

    const params: CreateKontextOptions = {
      inputImage: fileUrl,
      prompt: fullPrompt,
      aspectRatio: aspect,
      model: "flux-kontext-pro",
      outputFormat: "png",
      callBackUrl: import.meta.env.PROD ? callbakUrl : undefined,
    };

    insertPayload = {
      user_id: user.id,
      status: "pending",
      estimated_start_at: new Date(),
      input_params: inputParams,
      ext,
      aspect: aspect,
      provider: "kie_kontext",
      request_param: params,
    };
  } else {
    throw new Error("Invalid AI provider type");
  }

  const tasks = await createAiTask([insertPayload]);
  return { tasks, consumptionCredits: consumptionResult };
};
