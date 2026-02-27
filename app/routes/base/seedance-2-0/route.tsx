import type { Route } from "./+types/route";
import { Fragment } from "react";
import { VideoGenerator } from "~/features/video_generator/index";
import { VideoResult } from "~/features/video_generator/VideoResult";
import { useVideoGenerator } from "~/features/video_generator/useVideoGenerator";
import { createCanonical } from "~/utils/meta";

export function meta({ matches }: Route.MetaArgs) {
    const canonical = createCanonical("/seedance-2-0", matches[0].data.DOMAIN);

    return [
        { title: "Seedance 2.0: AI Video with Perfect Character Consistency" },
        {
            name: "description",
            content:
                "Master your video workflow with Seedance 2.0. Features 12 multimodal inputs, native lip-sync, AI storyboarding, and perfect cross-shot character consistency.",
        },
        {
            name: "keywords",
            content:
                "Seedance 2.0, AI video generator, multimodal AI video, native lip-sync, AI storyboarding, character consistency AI, AI director tool, continuous AI video",
        },
        canonical,
    ];
}

export function loader({ context }: Route.LoaderArgs) {
    return {};
}

export default function VideoGeneratorPage() {
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
                                <h3 className="text-lg font-bold mb-2">How does the Seedance 2.0 multimodal reference system work?</h3>
                                <p className="text-gray-600">
                                    Seedance 2.0 replaces random generation with a highly controllable workflow. It supports mixing up to <strong>12 references</strong> (text, images, video, and audio). Using intuitive "@" tags (e.g., "@Image1 for character design"), creators can precisely assign each element to guide the final output.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">Can Seedance 2.0 generate videos with native lip-sync and audio?</h3>
                                <p className="text-gray-600">
                                    Yes. Built on a dual-branch diffusion transformer architecture, the model natively synchronizes audio and visual signals from the ground up — ensuring precise lip-syncing for dialogue and perfectly aligned sound effects down to the millisecond.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">Is it suitable for storyboarding and directing narrative series?</h3>
                                <p className="text-gray-600">
                                    Absolutely. Seedance 2.0 acts as an AI director assistant. From a single text prompt, it automatically plans camera language — from wide shots to close-ups — and generates seamless montage sequences, making it ideal for continuous drama production.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">How well does it maintain character consistency across different shots?</h3>
                                <p className="text-gray-600">
                                    Exceptionally well. Using proprietary character-environment perception technology, Seedance 2.0 locks onto facial features, clothing textures, and lighting across scene transitions — pushing cross-shot usability rates <strong>above 90%</strong> and eliminating the common "face-changing" issue.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">How realistic are the physics and complex movements?</h3>
                                <p className="text-gray-600">
                                    Highly realistic. The model accurately reproduces complex physical rules — such as human interactions, collision inertia, and the natural gravity of clothing in the wind — resulting in <strong>live-action-level realism</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Fragment>
    );
}
