export type ApiMartSeedanceModel =
  | "doubao-seedance-2.0"
  | "doubao-seedance-2.0-fast"
  | "doubao-seedance-2.0-face"
  | "doubao-seedance-2.0-fast-face";

export type ApiMartHappyHorseModel = "happyhorse-1.0";

export type ApiMartVideoGenerationModel =
  | ApiMartSeedanceModel
  | ApiMartHappyHorseModel;

export type ApiMartSeedanceResolution = "480p" | "720p" | "1080p";

export type ApiMartSeedanceSize =
  | "16:9"
  | "9:16"
  | "1:1"
  | "4:3"
  | "3:4"
  | "21:9"
  | "adaptive";

export interface ApiMartSeedanceImageWithRole {
  url: string;
  role: "first_frame" | "last_frame" | "reference_image";
}

export interface CreateApiMartSeedanceTaskOptions {
  model: ApiMartSeedanceModel;
  prompt?: string;
  size?: ApiMartSeedanceSize;
  resolution?: ApiMartSeedanceResolution;
  duration?: number;
  generateAudio?: boolean;
  imageUrls?: string[];
  imageWithRoles?: ApiMartSeedanceImageWithRole[];
  videoUrls?: string[];
  audioUrls?: string[];
  seed?: number;
  returnLastFrame?: boolean;
  webSearch?: boolean;
}

export type ApiMartHappyHorseResolution = "720P" | "1080P";
export type ApiMartHappyHorseSize = "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
export type ApiMartHappyHorseAudioSetting = "origin" | "mute" | "generate";

export interface CreateApiMartHappyHorseTaskOptions {
  model: ApiMartHappyHorseModel;
  prompt?: string;
  size?: ApiMartHappyHorseSize;
  resolution?: ApiMartHappyHorseResolution;
  duration?: number;
  firstFrameImage?: string;
  imageUrls?: string[];
  videoUrl?: string;
  audioSetting?: ApiMartHappyHorseAudioSetting;
  watermark?: boolean;
  seed?: number;
}

export interface ApiMartSeedanceTaskCreateResult {
  taskId: string;
  status: "submitted";
  model: ApiMartVideoGenerationModel;
  request: Record<string, unknown>;
}

export type ApiMartSeedanceAvatarAssetType = "Image" | "Video" | "Audio";

export interface ApiMartAvatarAsset {
  url: string;
  name: string;
}

export interface CreateApiMartPrivateAvatarOptions {
  group?: {
    name?: string;
    description?: string;
  };
  groupId?: string;
  projectName?: string;
  assetType?: ApiMartSeedanceAvatarAssetType;
  assets?: ApiMartAvatarAsset[];
  url?: string;
  name?: string;
}

export type ApiMartRealAvatarAction =
  | "create_session"
  | "query_auth"
  | "submit_assets";

export interface CreateApiMartRealAvatarOptions {
  action: ApiMartRealAvatarAction;
  callbackUrl?: string;
  bytedToken?: string;
  groupId?: string;
  projectName?: string;
  assetType?: "Image" | "Video";
  assets?: ApiMartAvatarAsset[];
}

export interface ApiMartResponse<T> {
  code: number;
  data: T;
  message?: string;
  msg?: string;
  error?: {
    message?: string;
    code?: string | number;
  };
}

export interface ApiMartAvatarTaskResult {
  id: string;
  object?: "seedance.avatar.asset.task" | string;
  status: "processing" | "completed" | "failed" | string;
  progress?: number;
  model?: ApiMartSeedanceModel | string;
}

export interface ApiMartVideoTaskStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress?: number;
  result?: {
    images?: Array<{
      url?: string | string[];
      expires_at?: number;
    }>;
    videos?: Array<
      | string
      | {
          url?: string | string[];
          video_url?: string | string[];
          urls?: string[];
          expires_at?: number;
        }
    >;
    thumbnail_url?: string;
    assets?: Array<{
      asset_id?: string;
      asset_url?: string;
      status?: string;
    }>;
    usable_assets?: Array<{
      asset_id?: string;
      asset_url?: string;
      status?: string;
    }>;
    failed_assets?: Array<{
      asset_id?: string;
      asset_url?: string;
      status?: string;
    }>;
    asset_url?: string;
    byted_token?: string;
    h5_link?: string;
    raw_response?: unknown;
    [key: string]: unknown;
  };
  fail_reason?: string;
  error?: string | { message?: string };
  created?: number;
  completed?: number;
  estimated_time?: number;
  actual_time?: number;
}
