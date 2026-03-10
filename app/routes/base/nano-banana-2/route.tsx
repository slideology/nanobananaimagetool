import type { Route } from "./+types/route";
import { Fragment } from "react";
import { ImageGenerator } from "~/features/image_generator";
import { createCanonical } from "~/utils/meta";
import { PRICING_TIERS, type PricingTier, type PaymentMode } from "~/constants";

export function meta({ matches }: Route.MetaArgs) {
    const canonical = createCanonical("/nano-banana-2", matches[0].data.DOMAIN);

    return [
        { title: "Nano Banana 2: Fast 4K AI Image Generator" },
        {
            name: "description",
            content:
                "Discover Google Nano Banana 2 (Gemini 3.1 Flash Image). Generate 4K AI images in seconds with perfect character consistency and 50% lower API costs.",
        },
        {
            name: "keywords",
            content:
                "Nano Banana 2, Gemini 3.1 Flash Image, AI image generator, consistent AI characters, fast AI image generation, 4K AI art, Google AI image model",
        },
        canonical,
    ];
}

export function loader({ context }: Route.LoaderArgs) {
    return {
        pricingTiers: PRICING_TIERS,
    };
}

export default function NanoBanana2Page({ loaderData: { pricingTiers } }: Route.ComponentProps) {
    const product = pricingTiers[0]?.pricing?.monthly
        ? {
            price: pricingTiers[0].pricing.monthly.price,
            credits: pricingTiers[0].pricing.monthly.credits,
            product_id: pricingTiers[0].pricing.monthly.product_id,
            product_name: `${pricingTiers[0].name} Plan - Monthly`,
            type: "monthly" as const,
        }
        : undefined;

    return (
        <Fragment>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-yellow-400/10 to-orange-500/10 py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                            Nano Banana 2
                            <br />
                            Next-Gen AI Image Editor
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                            The next generation of Nano Banana is here. Faster, smarter, and more creative — redefining what AI image generation can do.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Generator Section — 当前使用 Nano Banana 1.x 版本（Nano Banana 2 即将上线） */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="py-4">
                            <ImageGenerator
                                styles={[]}
                                promptCategories={[]}
                                inline={true}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* What's New Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">
                            What's New in Nano Banana 2
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100">
                                <div className="text-4xl mb-4">⚡</div>
                                <h3 className="text-xl font-bold mb-2">2× Faster Generation</h3>
                                <p className="text-gray-600">
                                    Nano Banana 2 delivers results in half the time with our optimized inference engine and upgraded GPU cluster.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100">
                                <div className="text-4xl mb-4">🎨</div>
                                <h3 className="text-xl font-bold mb-2">Superior Image Quality</h3>
                                <p className="text-gray-600">
                                    Enhanced detail preservation, richer color accuracy, and more realistic textures across every artistic style.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100">
                                <div className="text-4xl mb-4">🧠</div>
                                <h3 className="text-xl font-bold mb-2">Smarter Prompt Understanding</h3>
                                <p className="text-gray-600">
                                    Better natural language comprehension means your vision becomes reality more accurately than ever before.
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
                                <h3 className="text-lg font-bold mb-2">What is Nano Banana 2?</h3>
                                <p className="text-gray-600">
                                    Nano Banana 2 (officially known as <strong>Gemini 3.1 Flash Image</strong>) is Google's latest high-speed AI image generation model, released in February 2026. It is designed to deliver Pro-level image quality at Flash-level speeds, striking an optimal balance between high resolution, fast generation, and low operational costs.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">How fast can Nano Banana 2 generate images?</h3>
                                <p className="text-gray-600">
                                    Extremely fast. It produces standard-resolution images in <strong>under 2 seconds</strong> (p50 latency of just 0.86 seconds). For native <strong>4K (3840×2160)</strong> outputs, generation completes within 10 seconds.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">Can it maintain character consistency across multiple images?</h3>
                                <p className="text-gray-600">
                                    Yes — a major breakthrough for comic creation and storyboards. Nano Banana 2 maintains up to <strong>95% visual consistency</strong> across up to 5 distinct characters and 14 specific objects within a single workflow.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">How does the model handle text rendering and multiple languages?</h3>
                                <p className="text-gray-600">
                                    It features highly accurate text rendering — including complex scripts like Chinese — directly onto images. Built-in localization lets you render translated text into various languages, perfect for global marketing materials.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">Is it cost-effective for high-volume SaaS applications?</h3>
                                <p className="text-gray-600">
                                    Absolutely. Nano Banana 2 reduces generation costs by approximately <strong>50%</strong> compared to the previous Pro model. Combined with lightning-fast speed, it is ideal for platforms requiring high-frequency API calls with healthy profit margins.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">Can the model generate real-time, factually accurate content?</h3>
                                <p className="text-gray-600">
                                    Yes. Integrated with Gemini's real-world knowledge base and real-time web image search, it can generate images based on live data — such as rendering a window view reflecting the current weather of a specific location.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Fragment>
    );
}
