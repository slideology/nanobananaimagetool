export interface ImageStyle {
  name: string;
  value: string;
  cover: string;
  type: string;
  description: string;
}

export interface PromptCategory {
  name: string;
  value: string;
  prompts: string[];
}

export interface GenerationMode {
  id: "image-to-image" | "text-to-image";
  name: string;
  icon: React.ReactNode;
  description: string;
}

export interface ImageGeneratorRef {
  open: (file?: File) => void;
  close: () => void;
}

export interface ImageTask {
  task_no: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  prompt?: string;
  images?: string[];
  created_at?: Date | string;
  updated_at?: Date | string;
  error?: string;
  progress?: number;
  result_url?: string | null;
  fail_reason?: string | null;
}

