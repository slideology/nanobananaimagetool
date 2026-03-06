import type { Route } from "./+types/route";
import { PROMPTS_DATA, type PromptItem } from "~/constants/prompts_data";
import { Copy, CheckCircle2, ArrowLeft, X, Sparkles, ImageIcon, Video } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";

/* ========== SEO 元信息 ========== */
export function meta() {
    return [
        { title: "Prompt Gallery | AI Art Inspiration | Nano Banana" },
        {
            name: "description",
            content:
                "Browse our curated gallery of AI-generated images. Discover creative prompts and get inspired for your next AI art creation with Nano Banana.",
        },
    ];
}

/* ========== 详情弹窗组件（对标原站 Modal） ========== */
function PromptDetailModal({
    item,
    onClose,
}: {
    item: PromptItem;
    onClose: () => void;
}) {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    // 复制提示词到剪贴板
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(item.alt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [item.alt]);

    // ESC 键关闭弹窗
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEsc);
        // 打开弹窗时禁止背景滚动
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    // "Try This Prompt" → 跳转到编辑器并自动填入 prompt
    const handleTryPrompt = () => {
        const params = new URLSearchParams({ prompt: item.alt });
        navigate(`/?${params.toString()}`);
    };

    // "Remix Image" → 跳转到 image-to-image 模式
    const handleRemixImage = () => {
        const params = new URLSearchParams({
            mode: "image-to-image",
            image: item.src,
        });
        navigate(`/?${params.toString()}`);
    };

    // "Image to Video" → 跳转到视频生成页面
    const handleImageToVideo = () => {
        const params = new URLSearchParams({ image: item.src });
        navigate(`/seedance-2-0?${params.toString()}`);
    };

    return (
        /* 全屏遮罩层 */
        <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
            onClick={onClose}
        >
            {/* 弹窗主体容器 */}
            <div
                className="bg-base-100 w-full max-w-5xl mx-4 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ===== 顶部导航栏 ===== */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 shrink-0">
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-sm gap-2 text-base-content/70 hover:text-base-content"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Gallery
                    </button>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-sm btn-circle"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ===== 内容主体：左图 + 右信息 ===== */}
                <div className="flex flex-col md:flex-row overflow-hidden flex-1 min-h-0">
                    {/* 左侧大图 */}
                    <div className="md:w-1/2 flex items-center justify-center bg-base-200/50 p-4 md:p-6 overflow-auto">
                        <img
                            src={item.src}
                            alt={item.alt}
                            className="max-w-full max-h-[60vh] object-contain rounded-lg"
                        />
                    </div>

                    {/* 右侧信息面板（可滚动） */}
                    <div className="md:w-1/2 overflow-y-auto p-6 space-y-6">
                        {/* Prompt 标题 + Copy 按钮 */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-base-content">
                                Prompt
                            </h3>
                            <button
                                onClick={handleCopy}
                                className="btn btn-ghost btn-sm gap-2 text-primary"
                            >
                                {copied ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>

                        {/* Prompt 文本块 */}
                        <div className="bg-base-200 rounded-xl p-4 text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                            {item.alt}
                        </div>

                        {/* Basic Information 元信息标签区 */}
                        <div>
                            <h4 className="text-base font-semibold text-base-content mb-3">
                                Basic Information
                            </h4>
                            <div className="space-y-2.5">
                                {[
                                    { label: "Model", value: item.model },
                                    { label: "Type", value: item.type },
                                    { label: "Ratio", value: item.ratio },
                                    { label: "Resolution", value: item.resolution },
                                ].map((info) => (
                                    <div key={info.label} className="flex items-center gap-3">
                                        <span className="text-sm text-base-content/60 w-24 shrink-0">
                                            {info.label}:
                                        </span>
                                        <span className="badge badge-outline badge-sm">
                                            {info.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 操作按钮组 */}
                        <div className="space-y-3 pt-2">
                            {/* Try This Prompt — 主按钮 */}
                            <button
                                onClick={handleTryPrompt}
                                className="btn btn-primary w-full gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 border-none text-white hover:from-purple-700 hover:to-indigo-700"
                            >
                                <Sparkles className="w-4 h-4" />
                                Try This Prompt
                            </button>

                            {/* Remix Image — 次要按钮 */}
                            <button
                                onClick={handleRemixImage}
                                className="btn btn-outline w-full gap-2"
                            >
                                <ImageIcon className="w-4 h-4" />
                                Remix Image
                            </button>

                            {/* Image to Video — 次要按钮 */}
                            <button
                                onClick={handleImageToVideo}
                                className="btn btn-outline w-full gap-2"
                            >
                                <Video className="w-4 h-4" />
                                Image to Video
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ========== 页面主组件 ========== */
export default function PromptsGallery() {
    // 当前选中的 Prompt 条目（用于弹窗）
    const [selectedItem, setSelectedItem] = useState<PromptItem | null>(null);

    return (
        <div className="min-h-screen bg-base-200/50 pb-20">
            {/* ===== Hero Section ===== */}
            <div className="bg-base-100 border-b border-base-300 py-16 px-6 sm:px-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">
                    Nano Banana Prompt | AI Art Gallery
                </h1>
                <p className="text-base-content/70 max-w-2xl mx-auto text-lg">
                    Explore stunning AI-generated images and discover the prompts behind
                    them. Get inspired and create your own masterpieces.
                </p>
            </div>

            {/* ===== Masonry 瀑布流画廊 ===== */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                    {PROMPTS_DATA.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => setSelectedItem(item)}
                            className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-base-100 shadow-sm border border-base-300 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                        >
                            <img
                                src={item.src}
                                alt={item.alt}
                                loading="lazy"
                                className="w-full object-cover"
                            />
                        </div>
                    ))}
                </div>

                {/* ===== 底部提示语（对标原站） ===== */}
                <div className="text-center mt-16 text-base-content/50 text-sm">
                    <p>✨ You've seen all the images ✨</p>
                </div>
            </div>

            {/* ===== 详情弹窗 ===== */}
            {selectedItem && (
                <PromptDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    );
}
