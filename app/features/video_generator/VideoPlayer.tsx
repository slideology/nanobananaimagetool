import { Download, Play } from 'lucide-react';

/**
 * 视频播放器组件属性
 */
export interface VideoPlayerProps {
    videoUrl: string;
    taskNo: string;
    aspectRatio?: string;
    onDownload?: () => void;
}

/**
 * 视频播放器组件
 * 用于预览和下载生成的视频
 */
export function VideoPlayer({
    videoUrl,
    taskNo,
    aspectRatio = '16:9',
    onDownload
}: VideoPlayerProps) {

    // 根据宽高比计算样式
    const getAspectRatioClass = () => {
        switch (aspectRatio) {
            case '1:1':
                return 'aspect-square';
            case '16:9':
                return 'aspect-video';
            case '9:16':
                return 'aspect-[9/16]';
            case '4:3':
                return 'aspect-[4/3]';
            case '3:4':
                return 'aspect-[3/4]';
            case '21:9':
                return 'aspect-[21/9]';
            default:
                return 'aspect-video';
        }
    };

    // 处理下载
    const handleDownload = async () => {
        if (onDownload) {
            onDownload();
            return;
        }

        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `video-${taskNo}.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('下载失败:', error);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* 视频播放区域 */}
            <div className={`relative bg-black ${getAspectRatioClass()}`}>
                <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                >
                    您的浏览器不支持视频播放
                </video>
            </div>

            {/* 操作按钮 */}
            <div className="p-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-600">
                    任务编号: <span className="font-mono">{taskNo}</span>
                </div>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Download size={18} />
                    <span>下载视频</span>
                </button>
            </div>
        </div>
    );
}
