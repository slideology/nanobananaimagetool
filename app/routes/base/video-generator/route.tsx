import type { Route } from "./+types/route";
import { Fragment } from "react";
import { VideoGenerator } from "~/features/video_generator/index";
import { VideoResult } from "~/features/video_generator/VideoResult";
import { useVideoGenerator } from "~/features/video_generator/useVideoGenerator";
import { CREDITS_PRODUCT } from "~/.server/constants";
import { createCanonical } from "~/utils/meta";

export function meta({ matches }: Route.MetaArgs) {
    const canonical = createCanonical("/video-generator", matches[0].data.DOMAIN);

    return [
        { title: "AI Video Generator | Seedance 2.0 - Create Amazing Videos" },
        {
            name: "description",
            content:
                "Generate stunning AI videos with Seedance 2.0. Transform your ideas into professional videos with text prompts or reference images. Supports 1080p, native audio, and multi-shot narratives.",
        },
        canonical,
    ];
}

export function loader({ context }: Route.LoaderArgs) {
    return {
        product: CREDITS_PRODUCT,
    };
}

export default function VideoGeneratorPage({
    loaderData: { product },
}: Route.ComponentProps) {
    // 使用状态管理 Hook
    const { currentTask, recentTasks, createTask } = useVideoGenerator();
    return (
        <Fragment>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Create Amazing Videos
                            <br />
                            with AI-Powered Generation
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                            Transform your ideas into stunning videos with Seedance 2.0. Generate professional videos from text descriptions or reference images with native audio support.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Video Generator Section */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    {/* 两列网格布局 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">
                        {/* 左侧 - 视频生成器 */}
                        <div>
                            <VideoGenerator
                                product={product}
                                onTaskCreated={createTask}
                            />
                        </div>

                        {/* 右侧 - 结果预览 */}
                        <div>
                            <VideoResult
                                currentTask={currentTask}
                                recentTasks={recentTasks}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">
                            Why Choose Seedance 2.0
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-6 rounded-xl shadow-lg">
                                <div className="text-4xl mb-4">🎬</div>
                                <h3 className="text-xl font-bold mb-2">Multi-Shot Narratives</h3>
                                <p className="text-gray-600">
                                    Create coherent multi-shot videos with logical scene sequences from a single prompt.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-lg">
                                <div className="text-4xl mb-4">🔊</div>
                                <h3 className="text-xl font-bold mb-2">Native Audio Support</h3>
                                <p className="text-gray-600">
                                    Generate videos with built-in dialogue and sound effects, no post-production needed.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-lg">
                                <div className="text-4xl mb-4">⚡</div>
                                <h3 className="text-xl font-bold mb-2">Fast Generation</h3>
                                <p className="text-gray-600">
                                    Optimized rendering engine delivers high-quality 1080p videos in minutes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">
                                    What is Seedance 2.0?
                                </h3>
                                <p className="text-gray-600">
                                    Seedance 2.0 is ByteDance's advanced AI video model designed for creating coherent multi-shot videos with native audio support and high-definition output up to 1080p.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">
                                    How many credits does video generation cost?
                                </h3>
                                <p className="text-gray-600">
                                    Credits vary based on resolution and duration: 480p costs 2-4 credits, 720p costs 5-10 credits, and 1080p costs 10-20 credits. Adding audio generation costs an additional 2 credits.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">
                                    Can I use reference images?
                                </h3>
                                <p className="text-gray-600">
                                    Yes! You can upload up to 2 reference images (max 10MB each) to guide the video generation. The AI will use these images to maintain visual consistency.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">
                                    How long does it take to generate a video?
                                </h3>
                                <p className="text-gray-600">
                                    Video generation typically takes 1-5 minutes depending on the complexity, resolution, and duration. You'll receive real-time progress updates.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Fragment>
    );
}
