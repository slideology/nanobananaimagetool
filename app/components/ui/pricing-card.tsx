/**
 * 增强版定价卡片组件
 * 支持：Pro 卡片紫色高亮、功能列表对比、动态价格显示
 */

import { Check, X } from "lucide-react";
import clsx from "clsx";
import type { PricingTier, PaymentMode } from "~/constants/product";

export interface PricingCardProps {
    tier: PricingTier;
    mode: PaymentMode;
    onPurchase: (tier: PricingTier, mode: PaymentMode) => void;
    loading?: boolean;
    compact?: boolean;
}

export default function PricingCard({ tier, mode, onPurchase, loading, compact }: PricingCardProps) {
    const pricing = tier.pricing[mode];
    const monthlyPrice = tier.pricing.monthly.price;
    const originalYearlyPrice = mode === "yearly" ? monthlyPrice : null;
    const imageEstimate = Math.max(1, Math.floor(pricing.credits / 50));

    // 价格标签计算
    const getModeLabel = () => {
        if (mode === "yearly") return "/ Month";
        if (mode === "monthly") return "/ Month";
        return "One-Time";
    };

    const getBillingNote = () => {
        if (mode === "yearly" && pricing.billedAmount) {
            return `Billed as $${pricing.billedAmount}/year`;
        }
        return null;
    };

    const getButtonLabel = () => {
        if (mode === "once") return `Buy ${tier.name} credits`;
        return `Buy ${tier.name}`;
    };

    return (
        <div
            className={clsx(
                "rounded-2xl p-6 md:p-8 h-full flex flex-col transition-all duration-200",
                tier.isPopular
                    ? "bg-amber-50 border-2 border-amber-200 shadow-lg shadow-amber-900/10 scale-105 relative z-10"
                    : "bg-white border border-gray-200 hover:shadow-md"
            )}
        >
            {/* Badge */}
            {tier.badge && (
                <div
                    className={clsx(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 w-fit",
                        tier.badgeColor === "purple"
                            ? "bg-slate-950 text-white"
                            : tier.badgeColor === "accent"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                    )}
                >
                    {tier.isPopular && <span>⭐</span>}
                    {tier.badge}
                </div>
            )}

            {/* Plan Name */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>

            {/* Description */}
            {tier.description && (
                <p className="text-sm text-gray-600 mb-6">{tier.description}</p>
            )}

            {/* Price */}
            <div className="mb-6">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-4xl md:text-5xl font-bold text-gray-900">
                        ${pricing.price}
                    </span>
                    <span className="text-base text-gray-600">{getModeLabel()}</span>
                    {originalYearlyPrice && originalYearlyPrice > pricing.price && (
                        <span className="text-sm text-gray-400 line-through">
                            ${originalYearlyPrice}/ Month
                        </span>
                    )}
                </div>
                {getBillingNote() && (
                    <p className="text-sm text-gray-500 mt-1">{getBillingNote()}</p>
                )}
                {pricing.savingPercent ? (
                    <p className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        Save {pricing.savingPercent}% with annual billing
                    </p>
                ) : null}
            </div>

            {!compact && (
                <div className="mb-6 rounded-xl border border-gray-200 bg-white/80 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                        What this covers
                    </div>
                    <div className="mt-2 text-sm font-semibold text-gray-900">
                        About {imageEstimate.toLocaleString()} Nano Banana 2 images
                    </div>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                        Or use the same credits on GPT Image 2, Seedance 2.0, and HappyHorse video generations.
                    </p>
                </div>
            )}

            {/* Features List */}
            <ul className="space-y-3 mb-8 flex-grow">
                {/* 动态首条：根据付费模式显示不同积分描述 */}
                <li className="flex items-start gap-2">
                    <Check size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold text-gray-900">
                        {mode === "once"
                            ? `${pricing.credits} Credits — Never Expire`
                            : mode === "yearly"
                                ? `${pricing.credits} Credits / Yearly Billing Cycle`
                                : `${pricing.credits} Credits / Monthly Billing Cycle`
                        }
                    </span>
                </li>
                {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                        {feature.included ? (
                            <Check size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
                        ) : (
                            <X size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                            className={clsx(
                                "text-sm",
                                feature.included ? "text-gray-700" : "text-gray-400 line-through"
                            )}
                        >
                            {feature.text}
                        </span>
                    </li>
                ))}
            </ul>

            {/* Purchase Button */}
            <button
                onClick={() => onPurchase(tier, mode)}
                disabled={loading}
                className={clsx(
                    "w-full py-3 px-6 rounded-full font-semibold transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    tier.isPopular
                        ? "bg-slate-950 text-white hover:bg-slate-800 shadow-md hover:shadow-lg"
                        : "bg-white text-gray-900 border-2 border-gray-300 hover:border-gray-400 hover:shadow-md"
                )}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="loading loading-spinner loading-sm"></span>
                        Processing...
                    </span>
                ) : (
                    getButtonLabel()
                )}
            </button>
        </div>
    );
}
