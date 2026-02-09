import { useState, useCallback, useEffect } from 'react';

/**
 * 视频任务状态
 */
export interface VideoTask {
    task_no: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    videoUrl?: string;
    thumbnailUrl?: string;
    prompt?: string;
    aspectRatio?: string;
    resolution?: string;
    duration?: string;
    createdAt?: Date;
    estimatedTime?: string;
    progress?: number;
}

/**
 * 视频生成器状态管理 Hook
 */
export function useVideoGenerator() {
    const [currentTask, setCurrentTask] = useState<VideoTask | null>(null);
    const [recentTasks, setRecentTasks] = useState<VideoTask[]>([]);
    const [isPolling, setIsPolling] = useState(false);

    // 轮询任务状态
    const pollTaskStatus = useCallback(async (taskNo: string) => {
        try {
            const response = await fetch(`/api/task/${taskNo}`);
            if (!response.ok) {
                throw new Error('Failed to fetch task status');
            }

            const data = await response.json() as any;

            // 更新当前任务
            const updatedTask: VideoTask = {
                task_no: taskNo,
                status: data.task.status,
                videoUrl: data.task.result_data?.video_url,
                thumbnailUrl: data.task.result_data?.thumbnail_url,
                prompt: data.task.input_params?.prompt,
                aspectRatio: data.task.input_params?.aspect_ratio,
                resolution: data.task.input_params?.resolution,
                duration: data.task.input_params?.duration,
                progress: data.progress * 100,
            };

            setCurrentTask(updatedTask);

            // 如果任务完成或失败,停止轮询
            if (updatedTask.status === 'completed' || updatedTask.status === 'failed') {
                setIsPolling(false);

                // 添加到历史记录
                setRecentTasks(prev => {
                    const filtered = prev.filter(t => t.task_no !== taskNo);
                    return [updatedTask, ...filtered].slice(0, 10);
                });
            }

            return updatedTask;
        } catch (error) {
            console.error('轮询任务状态失败:', error);
            return null;
        }
    }, []);

    // 开始轮询
    useEffect(() => {
        if (!isPolling || !currentTask) return;

        const interval = setInterval(() => {
            pollTaskStatus(currentTask.task_no);
        }, 3000); // 每3秒轮询一次

        return () => clearInterval(interval);
    }, [isPolling, currentTask, pollTaskStatus]);

    // 创建新任务
    const createTask = useCallback((taskData: {
        task_no: string;
        prompt: string;
        aspectRatio: string;
        resolution: string;
        duration: string;
    }) => {
        const newTask: VideoTask = {
            task_no: taskData.task_no,
            status: 'pending',
            prompt: taskData.prompt,
            aspectRatio: taskData.aspectRatio,
            resolution: taskData.resolution,
            duration: taskData.duration,
            estimatedTime: '1 min',
            progress: 0,
        };

        setCurrentTask(newTask);
        setIsPolling(true);
    }, []);

    // 清除当前任务
    const clearCurrentTask = useCallback(() => {
        setCurrentTask(null);
        setIsPolling(false);
    }, []);

    return {
        currentTask,
        recentTasks,
        createTask,
        clearCurrentTask,
        pollTaskStatus,
    };
}
