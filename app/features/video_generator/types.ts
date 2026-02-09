/**
 * 视频生成器组件的类型定义
 */

export type VideoMode = 'text-to-video' | 'image-to-video';

export type SeedanceAspectRatio = '1:1' | '21:9' | '4:3' | '3:4' | '16:9' | '9:16';
export type SeedanceResolution = '480p' | '720p' | '1080p';
export type SeedanceDuration = '4' | '8' | '12';

export interface VideoGeneratorProps {
    product?: {
        price: number;
        credits: number;
        product_id: string;
        product_name: string;
        type: "once" | "monthly" | "yearly";
    };
    onTaskCreated?: (taskData: {
        task_no: string;
        prompt: string;
        aspectRatio: string;
        resolution: string;
        duration: string;
    }) => void;
}

export interface VideoTask {
    task_no: string;
    status: 'pending' | 'running' | 'succeeded' | 'failed';
    estimated_start_at: Date;
    result_url?: string;
    fail_reason?: string;
    ext?: {
        generation_mode?: string;
        credits_consumed?: number;
    };
}
