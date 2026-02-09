import { Play, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * 视频任务状态
 */
interface VideoTask {
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
}

/**
 * 视频结果预览组件属性
 */
export interface VideoResultProps {
    currentTask?: VideoTask | null;
    recentTasks?: VideoTask[];
}

/**
 * Seedance 2.0 AI Video Result 组件
 * 显示当前生成任务的状态和最近的视频历史
 */
export function VideoResult({ currentTask, recentTasks = [] }: VideoResultProps) {
    const [progress, setProgress] = useState(0);

    // 模拟进度更新
    useEffect(() => {
        if (currentTask?.status === 'running') {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) return prev;
                    return prev + Math.random() * 5;
                });
            }, 1000);
            return () => clearInterval(interval);
        } else if (currentTask?.status === 'completed') {
            setProgress(100);
        } else {
            setProgress(0);
        }
    }, [currentTask?.status]);

    // 下载视频
    const handleDownload = async (videoUrl: string, taskNo: string) => {
        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `seedance-${taskNo}.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('下载失败:', error);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md mx-auto">
            {/* 标题 */}
            <div className="mb-5">
                <h3 className="text-base font-semibold text-gray-900">Seedance 2.0 AI Video Result</h3>
                {currentTask?.status === 'running' && (
                    <p className="text-xs text-gray-500 mt-1">
                        Generation takes 2~3 min. <span className="text-red-500">Please don't close this tab.</span>
                    </p>
                )}
            </div>

            {/* 当前任务预览 */}
            {currentTask ? (
                <div className="mb-6">
                    {/* 视频预览区域 */}
                    <div className="relative bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl overflow-hidden aspect-video mb-3">
                        {currentTask.status === 'completed' && currentTask.videoUrl ? (
                            // 已完成 - 显示视频
                            <>
                                <video
                                    src={currentTask.videoUrl}
                                    poster={currentTask.thumbnailUrl}
                                    controls
                                    className="w-full h-full object-cover"
                                >
                                    您的浏览器不支持视频播放
                                </video>
                                {/* Preview Example 标签 */}
                                <div className="absolute top-3 left-3">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full">
                                        <Play size={12} className="text-white" />
                                        <span className="text-xs font-medium text-white">Preview Example</span>
                                    </div>
                                </div>
                            </>
                        ) : currentTask.status === 'running' ? (
                            // 生成中 - 显示进度
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 mb-4">
                                    <svg className="animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Generating Video...</p>
                                <div className="w-48 h-2 bg-white/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-600 transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-600 mt-2">{Math.round(progress)}%</p>
                            </div>
                        ) : currentTask.status === 'pending' ? (
                            // 等待中
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <Clock size={32} className="text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-600">Waiting in Queue...</p>
                                <p className="text-xs text-gray-500 mt-1">Estimated start: {currentTask.estimatedTime || '1 min'}</p>
                            </div>
                        ) : currentTask.status === 'failed' ? (
                            // 失败
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <AlertCircle size={32} className="text-red-500 mb-2" />
                                <p className="text-sm font-medium text-gray-700">Generation Failed</p>
                                <p className="text-xs text-gray-500 mt-1">Please try again</p>
                            </div>
                        ) : null}
                    </div>

                    {/* 任务信息 */}
                    {currentTask.status === 'completed' && (
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-3">
                                Fill in the form on the left and click "Generate" to create your own video.
                            </p>
                            <button
                                onClick={() => currentTask.videoUrl && handleDownload(currentTask.videoUrl, currentTask.task_no)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                            >
                                <Download size={16} />
                                <span>Download Video</span>
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                // 无任务 - 显示占位内容
                <div className="mb-6">
                    <div className="relative bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl overflow-hidden aspect-video mb-3">
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Play size={48} className="text-gray-400 mb-3" />
                            <p className="text-sm font-medium text-gray-600">No video yet</p>
                            <p className="text-xs text-gray-500 mt-1">Generate your first video to see results here</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Fill in the form on the left and click "Generate" to create your own video.
                        </p>
                    </div>
                </div>
            )}

            {/* 视频历史链接 */}
            <div className="text-center">
                <a
                    href="#"
                    className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                    <span>View My Video History</span>
                    <span>→</span>
                </a>
            </div>

            {/* 最近的视频历史 (可选) */}
            {recentTasks.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Videos</h4>
                    <div className="space-y-2">
                        {recentTasks.slice(0, 3).map((task) => (
                            <div
                                key={task.task_no}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                {/* 缩略图 */}
                                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                    {task.thumbnailUrl ? (
                                        <img
                                            src={task.thumbnailUrl}
                                            alt="Video thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Play size={20} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* 信息 */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-900 font-medium truncate">
                                        {task.prompt || 'Untitled Video'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500">{task.resolution}</span>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-gray-500">{task.duration}</span>
                                    </div>
                                </div>

                                {/* 状态 */}
                                <div className="flex-shrink-0">
                                    {task.status === 'completed' ? (
                                        <CheckCircle size={16} className="text-green-500" />
                                    ) : task.status === 'running' ? (
                                        <Clock size={16} className="text-blue-500" />
                                    ) : task.status === 'failed' ? (
                                        <AlertCircle size={16} className="text-red-500" />
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
