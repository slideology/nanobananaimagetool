export interface ApiResult<T = any> {
  code: number;
  msg: string;
  data: T;
}

export type GPT4oAspect = "3:2" | "1:1" | "2:3";

export interface Create4oTaskOptions {
  filesUrl?: string[];
  prompt: string;
  size: GPT4oAspect;
  callBackUrl?: string;
  nVariants?: "1" | "2" | "4";
}
export interface GPT4oTask {
  taskId: string;
  paramJson: string;
  completeTime: string | null;
  response: {
    resultUrls: string[];
  } | null;
  successFlag: 0 | 1;
  status: "GENERATING" | "SUCCESS" | "CREATE_TASK_FAILED" | "GENERATE_FAILED";
  errorCode: number;
  errorMessage: string;
  createTime: string;
  progress: string;
}

export type GPT4oTaskCallbackJSON = ApiResult<{
  info: { result_urls: string[] };
  taskId: string;
}>;

export type KontextAspect =
  | "21:9"
  | "16:9"
  | "4:3"
  | "1:1"
  | "3:4"
  | "9:16"
  | "16:21";

export interface CreateKontextOptions {
  prompt: string;
  inputImage?: string;
  enableTranslation?: boolean;
  aspectRatio?: KontextAspect;
  outputFormat?: "jpeg" | "png";
  promptUpsampling?: boolean;
  model?: "flux-kontext-pro" | "flux-kontext-max";
  callBackUrl?: string;
  watermark?: string;
}

export interface KontextTask {
  taskId: string;
  paramJson: string;
  completeTime: string | null;
  response: {
    originImageUrl: string;
    resultImageUrl: string;
  } | null;
  successFlag: 0 | 1 | 2 | 3; // status: "GENERATING" | "SUCCESS" | "CREATE_TASK_FAILED" | "GENERATE_FAILED";
  errorCode: number;
  errorMessage: string;
  createTime: string;
}

// ===== Nano Banana API Types =====

/**
 * Nano Banana Text-to-Image 任务创建选项
 */
export interface CreateNanoBananaTaskOptions {
  prompt: string;           // 必需：图像生成描述
  callBackUrl?: string;     // 可选：异步回调地址
}

/**
 * Nano Banana Image-to-Image 编辑任务创建选项
 */
export interface CreateNanoBananaEditTaskOptions {
  prompt: string;          // 必需：编辑指令描述
  image_urls: string[];    // 必需：输入图像URL数组，最多5张
  callBackUrl?: string;    // 可选：异步回调地址
}

/**
 * 通用的 Nano Banana 任务创建接口
 * 根据模型类型自动选择正确的参数结构
 */
export type CreateNanoBananaUnifiedOptions =
  | { mode: "text-to-image"; options: CreateNanoBananaTaskOptions }
  | { mode: "image-to-image"; options: CreateNanoBananaEditTaskOptions };

/**
 * Nano Banana 任务状态查询响应
 */
export interface NanoBananaTaskDetail {
  taskId: string;
  model: string;
  state: "waiting" | "queuing" | "generating" | "success" | "fail";
  param: string;           // 创建任务时的完整请求参数（JSON字符串）
  resultJson: string;      // 结果JSON字符串，包含生成的图像URL
  failCode: string;
  failMsg: string;
  completeTime: number;
  createTime: number;
  updateTime: number;
}

// ===== Seedance 1.5 Pro API Types =====

/**
 * Seedance 视频宽高比选项
 */
export type SeedanceAspectRatio =
  | '1:1'
  | '21:9'
  | '4:3'
  | '3:4'
  | '16:9'
  | '9:16';

/**
 * Seedance 视频分辨率选项
 */
export type SeedanceResolution = '480p' | '720p' | '1080p';

/**
 * Seedance 视频时长选项(秒)
 */
export type SeedanceDuration = '4' | '8' | '12';

/**
 * Seedance 视频生成任务创建选项
 */
export interface CreateSeedanceTaskOptions {
  prompt: string;                      // 必需：视频描述 (3-2500字符)
  input_urls?: string[];               // 可选：参考图片URL (0-2张, 最大10MB)
  aspect_ratio: SeedanceAspectRatio;   // 必需：宽高比
  resolution?: SeedanceResolution;     // 可选：分辨率，默认 720p
  duration: SeedanceDuration;          // 必需：视频时长
  fixed_lens?: boolean;                // 可选：固定镜头
  generate_audio?: boolean;            // 可选：生成音频
  callBackUrl?: string;                // 可选：异步回调地址
}

/**
 * Seedance 任务状态查询响应
 */
export interface SeedanceTaskDetail {
  taskId: string;
  model: string;                       // "bytedance/seedance-1.5-pro"
  state: 'waiting' | 'success' | 'fail';
  param: string;                       // 创建任务时的完整请求参数（JSON字符串）
  resultJson: string | null;           // 结果JSON字符串，包含视频URL: {"resultUrls":["https://...mp4"]}
  failCode: string | null;
  failMsg: string | null;
  costTime: number | null;             // 任务耗时(毫秒)
  completeTime: number | null;         // 完成时间戳
  createTime: number;                  // 创建时间戳
}

/**
 * Seedance 视频结果 JSON 结构
 */
export interface SeedanceResultJson {
  resultUrls: string[];                // 生成的视频URL数组
}
