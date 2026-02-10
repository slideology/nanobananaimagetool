import { useState, useCallback, useEffect } from 'react';

/**
 * 视频任务状态
 */
export interface VideoTask {
    task_no: string;
    status: 'pending' | 'running' | 'succeeded' | 'failed';
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
                // 如果任务不存在(404)，清除本地存储
                if (response.status === 404) {
                    localStorage.removeItem('current_video_task_no');
                    setCurrentTask(null);
                    setIsPolling(false);
                    return null;
                }
                throw new Error('Failed to fetch task status');
            }

            const data = await response.json() as any;

            // 更新当前任务
            // 尝试从 result_data 解析更多信息
            let thumbnailUrl = undefined;
            if (data.task.result_data) {
                try {
                    // Seedance 结果通常包含 coverUrls
                    const resultJson = typeof data.task.result_data === 'string'
                        ? JSON.parse(data.task.result_data)
                        : data.task.result_data;

                    // 如果 result_data 本身就是 Kie 的 result 对象 (包含 resultJson 字符串)
                    if (resultJson.resultJson) {
                        const innerResult = JSON.parse(resultJson.resultJson);
                        thumbnailUrl = innerResult.coverUrls?.[0];
                    } else if (resultJson.coverUrls) {
                        thumbnailUrl = resultJson.coverUrls?.[0];
                    }
                } catch (e) {
                    console.error('Failed to parse result data for thumbnail', e);
                }
            }

            const updatedTask: VideoTask = {
                task_no: taskNo,
                status: data.task.status,
                videoUrl: data.task.result_url,
                thumbnailUrl: thumbnailUrl,
                prompt: data.task.input_params?.prompt,
                aspectRatio: data.task.input_params?.aspect_ratio,
                resolution: data.task.input_params?.resolution,
                duration: data.task.input_params?.duration,
                progress: data.progress ? data.progress * 100 : 0,
            };

            setCurrentTask(updatedTask);

            // 如果任务完成或失败,停止轮询并清除本地存储
            if (updatedTask.status === 'succeeded' || updatedTask.status === 'failed') {
                setIsPolling(false);
                localStorage.removeItem('current_video_task_no');

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

    // 初始化：检查本地存储是否有未完成的任务
    useEffect(() => {
        const savedTaskNo = localStorage.getItem('current_video_task_no');
        if (savedTaskNo) {
            console.log('Found saved task, resuming:', savedTaskNo);
            // 立即恢复轮询状态，虽然此时 currentTask 还可能是 null
            // updateTaskStatus 会在下一次轮询填充它
            setIsPolling(true);

            // 手动触发一次以填充初始状态
            pollTaskStatus(savedTaskNo).then(task => {
                if (task) setCurrentTask(task);
            });
        }
    }, [pollTaskStatus]);

    // 开始轮询
    useEffect(() => {
        // 如果有 savedTaskNo 但 currentTask 为空，pollTaskStatus 会处理
        // 如果 isPolling 为 true，我们需要 taskNo 来轮询
        // 从 localStorage 或 currentTask 获取 taskNo
        const savedTaskNo = typeof window !== 'undefined' ? localStorage.getItem('current_video_task_no') : null;
        const targetTaskNo = currentTask?.task_no || savedTaskNo;

        if (!isPolling || !targetTaskNo) return;

        console.log('Polling for task:', targetTaskNo);
        const interval = setInterval(() => {
            pollTaskStatus(targetTaskNo);
        }, 3000); // 每3秒轮询一次

        return () => clearInterval(interval);
    }, [isPolling, currentTask?.task_no, pollTaskStatus]);

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
        // 保存到本地存储
        localStorage.setItem('current_video_task_no', taskData.task_no);
    }, []);

    // 清除当前任务
    const clearCurrentTask = useCallback(() => {
        setCurrentTask(null);
        setIsPolling(false);
        localStorage.removeItem('current_video_task_no');
    }, []);

    return {
        currentTask,
        recentTasks,
        createTask,
        clearCurrentTask,
        pollTaskStatus,
    };
}
