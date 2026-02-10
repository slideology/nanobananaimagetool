/**
 * 增强版定价卡片组件
 * 支持：Pro 卡片紫色高亮、功能列表对比、动态价格显示
 */

import { Check, X } from "lucide-react";
import clsx from "clsx";
import type { PricingTier, PaymentMode } from "~/.server/constants/product";

export interface PricingCardProps {
    tier: PricingTier;
    mode: PaymentMode;
    onPurchase: (tier: PricingTier, mode: PaymentMode) => void;
    loading?: boolean;
}

export default function PricingCard({ tier, mode, onPurchase, loading }: PricingCardProps) {
    const pricing = tier.pricing[mode];

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

    return (
        <div
            className={clsx(
                "rounded-2xl p-6 md:p-8 h-full flex flex-col transition-all duration-200",
                tier.isPopular
                    ? "bg-purple-50 border-2 border-purple-200 shadow-lg scale-105"
                    : "bg-white border border-gray-200 hover:shadow-md"
            )}
        >
            {/* Badge */}
            {tier.badge && (
                <div
                    className={clsx(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 w-fit",
                        tier.badgeColor === "purple"
                            ? "bg-purple-600 text-white"
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
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-bold text-gray-900">
                        ${pricing.price}
                    </span>
                    <span className="text-base text-gray-600">{getModeLabel()}</span>
                </div>
                {getBillingNote() && (
                    <p className="text-sm text-gray-500 mt-1">{getBillingNote()}</p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                    {pricing.credits} Credits {mode !== "once" && "/ Month"}
                </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3 mb-8 flex-grow">
                {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                        {feature.included ? (
                            <Check size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
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
                        ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg"
                        : "bg-white text-gray-900 border-2 border-gray-300 hover:border-gray-400 hover:shadow-md"
                )}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="loading loading-spinner loading-sm"></span>
                        Processing...
                    </span>
                ) : (
                    tier.buttonText
                )}
            </button>
        </div>
    );
}
