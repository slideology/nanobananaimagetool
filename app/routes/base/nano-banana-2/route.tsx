import type { Route } from "./+types/route";
import { Fragment } from "react";
import { ImageGenerator } from "~/features/image_generator";
import { createCanonical } from "~/utils/meta";
import { PRICING_TIERS } from "~/.server/constants";

export function meta({ matches }: Route.MetaArgs) {
    const canonical = createCanonical("/nano-banana-2", matches[0].data.DOMAIN);

    return [
        { title: "Nano Banana 2 | Next-Gen AI Image Editor — Coming Soon" },
        {
            name: "description",
            content:
                "Nano Banana 2 is the next generation AI photo editor. Transform your images with enhanced intelligence, faster generation, and even better creative control. Coming Soon.",
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
                        {/* Coming Soon Badge */}
                        <span className="inline-block mb-4 px-4 py-1.5 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-full border border-yellow-200">
                            🚀 Coming Soon
                        </span>
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
                        {/* Coming Soon Notice */}
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                            <p className="text-sm text-yellow-700 font-medium">
                                ⚡ <strong>Nano Banana 2</strong> is under development. Try the current version below — upgrades are coming soon!
                            </p>
                        </div>
                        <div className="py-4">
                            <ImageGenerator
                                styles={[]}
                                promptCategories={[]}
                                inline={true}
                                product={product}
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
                                <h3 className="text-lg font-bold mb-2">
                                    When will Nano Banana 2 be available?
                                </h3>
                                <p className="text-gray-600">
                                    We're actively developing Nano Banana 2 and plan to release it soon. In the meantime, you can use the current Nano Banana model which already produces stunning results.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">
                                    How many credits does image generation cost?
                                </h3>
                                <p className="text-gray-600">
                                    Each image generation (text-to-image or image-to-image) costs 30 credits. New users receive 60 free credits upon sign-up to get started right away.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">
                                    Will Nano Banana 2 cost more credits?
                                </h3>
                                <p className="text-gray-600">
                                    We haven't finalized pricing for Nano Banana 2 yet. Our goal is to keep it accessible while reflecting the improved quality. We'll announce pricing closer to launch.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-lg font-bold mb-2">
                                    Can I use both Nano Banana and Nano Banana 2?
                                </h3>
                                <p className="text-gray-600">
                                    Yes! Once Nano Banana 2 launches, you'll be able to choose between both models directly from the image generator dropdown.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Fragment>
    );
}
