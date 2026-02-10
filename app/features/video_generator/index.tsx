import { useState, useRef, useCallback } from 'react';
import { Film, Upload, FileText, Image as ImageIcon, ChevronRight, ChevronDown, Check, Info } from 'lucide-react';
import type {
    VideoGeneratorProps,
    VideoMode,
    SeedanceAspectRatio,
    SeedanceResolution,
    SeedanceDuration
} from './types';

/**
 * Seedance 2.0 AI 视频生成器组件
 * 精确复原参考设计
 */
export function VideoGenerator({ product, onTaskCreated }: VideoGeneratorProps) {
    // 状态管理
    const [mode, setMode] = useState<VideoMode>('text-to-video');
    const [prompt, setPrompt] = useState('');
    const [referenceImages, setReferenceImages] = useState<File[]>([]);
    const [aspectRatio, setAspectRatio] = useState<SeedanceAspectRatio>('16:9');
    const [resolution, setResolution] = useState<SeedanceResolution>('480p');
    const [duration, setDuration] = useState<SeedanceDuration>('4');
    const [fixedLens, setFixedLens] = useState(false);
    const [generateAudio, setGenerateAudio] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string>('');
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 计算积分消耗
    const calculateCredits = useCallback(() => {
        const baseCredits: Record<SeedanceResolution, number> = {
            '480p': 2,
            '720p': 5,
            '1080p': 10
        };

        const durationMultiplier: Record<SeedanceDuration, number> = {
            '4': 1.0,
            '8': 1.5,
            '12': 2.0
        };

        const audioExtra = generateAudio ? 2 : 0;

        return Math.ceil(
            baseCredits[resolution] * durationMultiplier[duration] + audioExtra
        );
    }, [resolution, duration, generateAudio]);

    // 处理图片上传
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (files.length + referenceImages.length > 2) {
            setError('最多只能上传 2 张参考图片');
            return;
        }

        const invalidFiles = files.filter(f => f.size > 10 * 1024 * 1024);
        if (invalidFiles.length > 0) {
            setError('图片大小不能超过 10MB');
            return;
        }

        setReferenceImages(prev => [...prev, ...files]);
        setError('');
    }, [referenceImages]);

    // 移除图片
    const removeImage = useCallback((index: number) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index));
    }, []);

    // 提交生成请求
    const handleSubmit = useCallback(async () => {
        if (!prompt || prompt.length < 3 || prompt.length > 2500) {
            setError('提示词长度必须在 3-2500 字符之间');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const input_urls: string[] = [];

            if (referenceImages.length > 0) {
                for (const file of referenceImages) {
                    const formData = new FormData();
                    formData.append('image', file);

                    const uploadResponse = await fetch('/api/upload/image', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!uploadResponse.ok) {
                        throw new Error('图片上传失败');
                    }

                    const uploadData = await uploadResponse.json() as any;
                    input_urls.push(uploadData.imageUrl);
                }
            }

            const response = await fetch('/api/create/ai-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    input_urls,
                    aspect_ratio: aspectRatio,
                    resolution,
                    duration,
                    fixed_lens: fixedLens,
                    generate_audio: generateAudio,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json() as any;
                throw new Error(errorData.error?.message || '生成失败');
            }

            const data = await response.json() as any;
            console.log('视频生成任务创建成功:', data);

            // 提取任务编号 (兼顾新旧API结构)
            const taskNo = data.task_no || (data.tasks && data.tasks.length > 0 ? data.tasks[0].task_no : null);

            // 调用回调通知父组件
            if (onTaskCreated && taskNo) {
                onTaskCreated({
                    task_no: taskNo,
                    prompt,
                    aspectRatio,
                    resolution,
                    duration,
                });
            }

        } catch (err: any) {
            setError(err.message || '生成失败,请重试');
        } finally {
            setSubmitting(false);
        }
    }, [prompt, referenceImages, aspectRatio, resolution, duration, fixedLens, generateAudio]);

    const estimatedCredits = calculateCredits();

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full">
            {/* 标题 */}
            <div className="flex items-center gap-2 mb-5">
                <Film size={18} className="text-gray-700" />
                <h3 className="text-base font-semibold text-gray-900">Create Seedance 2.0 Video</h3>
            </div>

            {/* 模式切换 */}
            <div className="flex gap-2 mb-5">
                <button
                    onClick={() => setMode('text-to-video')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'text-to-video'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <FileText size={16} />
                    <span>Text to Video</span>
                </button>
                <button
                    onClick={() => setMode('image-to-video')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'image-to-video'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <ImageIcon size={16} />
                    <span>Image to Video</span>
                </button>
            </div>

            {/* 模型选择 */}
            <div className="mb-5 relative">
                <label className="block text-xs font-medium text-gray-600 mb-2">Model</label>

                {/* 触发器 */}
                <div
                    onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                    className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                >
                    <span className="text-sm font-medium text-gray-900">Seedance 1.5 Pro</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* 下拉菜单 */}
                {isModelMenuOpen && (
                    <>
                        {/* 点击遮罩 (用于关闭菜单) */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsModelMenuOpen(false)}
                        ></div>

                        {/* 菜单内容 */}
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 p-1.5 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                            {/* 选项 1: 1.5 Pro (选中) */}
                            <div
                                onClick={() => setIsModelMenuOpen(false)}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <span className="text-sm font-medium text-gray-900">Seedance 1.5 Pro</span>
                                <Check size={16} className="text-purple-600" />
                            </div>

                            {/* 选项 2: 2.0 (不可用) */}
                            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg opacity-50 cursor-not-allowed bg-gray-50/50">
                                <span className="text-sm font-medium text-gray-500">Seedance 2.0</span>
                                <span className="text-xs text-gray-400">Available Feb 24</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 图片上传区域 (仅在 image-to-video 模式) */}
            {mode === 'image-to-video' && (
                <div className="mb-5">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg py-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all"
                    >
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <ImageIcon size={20} className="text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-700">
                                    Drag & drop or <span className="font-semibold">click to upload</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">PNG, JPG, WebP</p>
                            </div>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                    />

                    {/* 已上传图片预览 */}
                    {referenceImages.length > 0 && (
                        <div className="flex gap-2 mt-3">
                            {referenceImages.map((file, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`参考图 ${index + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                    />
                                    <button
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 提示词输入 - 无边框样式 */}
            <div className="mb-5">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the scene you imagine, with details."
                    className="w-full px-3 py-3 text-sm text-gray-700 placeholder-gray-400 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none shadow-sm"
                    rows={4}
                    maxLength={2500}
                />
            </div>

            {/* 参数配置 - 三列布局 */}
            <div className="grid grid-cols-3 gap-2 mb-5">
                {/* 时长 */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Duration</label>
                    <div className="relative">
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value as SeedanceDuration)}
                            className="w-full appearance-none px-2.5 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors border-0 focus:ring-0"
                        >
                            <option value="4">4s</option>
                            <option value="8">8s</option>
                            <option value="12">12s</option>
                        </select>
                        <ChevronRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* 宽高比 */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Aspect Ratio</label>
                    <div className="relative">
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as SeedanceAspectRatio)}
                            className="w-full appearance-none px-2.5 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors border-0 focus:ring-0"
                        >
                            <option value="1:1">1:1</option>
                            <option value="16:9">16:9</option>
                            <option value="9:16">9:16</option>
                            <option value="4:3">4:3</option>
                            <option value="3:4">3:4</option>
                            <option value="21:9">21:9</option>
                        </select>
                        <ChevronRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* 分辨率 */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Resolution</label>
                    <div className="relative">
                        <select
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value as SeedanceResolution)}
                            className="w-full appearance-none px-2.5 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors border-0 focus:ring-0"
                        >
                            <option value="480p">480p</option>
                            <option value="720p">720p</option>
                            <option value="1080p">1080p</option>
                        </select>
                        <ChevronRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* 开关选项 */}
            <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-700">Fixed Lens</span>
                        <Info size={14} className="text-gray-400" />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={fixedLens}
                            onChange={(e) => setFixedLens(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-700">Audio</span>
                        <Info size={14} className="text-gray-400" />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={generateAudio}
                            onChange={(e) => setGenerateAudio(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {error}
                </div>
            )}

            {/* 生成按钮 */}
            <button
                onClick={handleSubmit}
                disabled={submitting || !prompt}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Generating...</span>
                    </span>
                ) : (
                    `Generate - ${estimatedCredits} Credits`
                )}
            </button>
        </div>
    );
}
