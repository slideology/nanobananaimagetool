export type ApiMartImageProductModel =
  | "nano-banana"
  | "nano-banana-edit"
  | "nano-banana-2"
  | "nano-banana-pro"
  | "gpt-image-2";

export type ApiMartImageModel =
  | "gemini-2.5-flash-image-preview"
  | "gemini-3.1-flash-image-preview"
  | "gemini-3-pro-image-preview"
  | "gpt-image-2";

export type ApiMartImageResolution = "1K" | "2K" | "4K";
export type ApiMartImageProviderResolution = ApiMartImageResolution | "1k" | "2k" | "4k";

export interface CreateApiMartImageTaskOptions {
  productModel: ApiMartImageProductModel;
  prompt: string;
  imageUrls?: string[];
  size?: string;
  resolution?: ApiMartImageResolution;
  googleSearch?: boolean;
}

export interface ApiMartTaskCreateResult {
  taskId: string;
  status: "submitted";
  model: ApiMartImageModel;
  request: {
    model: ApiMartImageModel;
    prompt: string;
    size: string;
    n: number;
    official_fallback: false;
    image_urls?: string[];
    resolution?: ApiMartImageProviderResolution;
    google_search?: boolean;
  };
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

export interface ApiMartTaskStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress?: number;
  result?: {
    images?: Array<{
      url?: string | string[];
      expires_at?: number;
    }>;
    videos?: unknown[];
    thumbnail_url?: string;
  };
  fail_reason?: string;
  error?: string | { message?: string };
  created?: number;
  completed?: number;
  estimated_time?: number;
  actual_time?: number;
}
