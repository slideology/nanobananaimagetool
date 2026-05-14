/**
 * 视频生成器组件的类型定义
 */

export type VideoMode =
    | 'text-to-video'
    | 'image-to-video'
    | 'reference-image-to-video'
    | 'video-edit';

export type VideoModel =
    | 'seedance-1.5-pro'
    | 'doubao-seedance-2.0'
    | 'doubao-seedance-2.0-fast'
    | 'doubao-seedance-2.0-face'
    | 'doubao-seedance-2.0-fast-face'
    | 'happyhorse-1.0';

export type SeedanceAspectRatio = '1:1' | '21:9' | '4:3' | '3:4' | '16:9' | '9:16';
export type SeedanceResolution = '480p' | '720p' | '1080p';
export type SeedanceDuration =
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '11'
    | '12'
    | '13'
    | '14'
    | '15';

export interface VideoGeneratorProps {
    initialModel?: VideoModel;
    initialMode?: VideoMode;
    onTaskCreated?: (taskData: {
        task_no: string;
        model?: VideoModel;
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
        model?: VideoModel;
    };
}
