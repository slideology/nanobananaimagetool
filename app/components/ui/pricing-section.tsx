import { useState, useCallback } from "react";
import PaymentModeToggle from "./payment-mode-toggle";
import PricingCard from "./pricing-card";
import FreePlanBanner from "./free-plan-banner";

export type PaymentMode = "yearly" | "monthly" | "once";

export interface PricingMode {
  price: number;
  credits: number;
  product_id: string;
  billedAmount?: number;
  savingPercent?: number;
}

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: "primary" | "accent" | "purple";
  isPopular?: boolean;
  description?: string;
  pricing: {
    monthly: PricingMode;
    yearly: PricingMode;
    once: PricingMode;
  };
  features: PricingFeature[];
  buttonText: string;
}

export interface PricingSectionProps {
  title?: string;
  subtitle?: string;
  tiers: PricingTier[];
  onPurchase: (tier: PricingTier, mode: PaymentMode) => void;
  onStartFree?: () => void;
  loading?: boolean;
  isModal?: boolean;
}

export default function PricingSection({
  title = "Simple, transparent pricing",
  subtitle = "Choose the perfect plan for your needs. Start with our free tier and upgrade as you grow.",
  tiers,
  onPurchase,
  onStartFree,
  loading,
  isModal
}: PricingSectionProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("yearly");

  const handleStartFree = useCallback(() => {
    if (onStartFree) {
      onStartFree();
    } else {
      window?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [onStartFree]);

  return (
    <div className={`container mx-auto px-4 relative ${isModal ? 'py-6 md:py-8 lg:py-10' : 'py-12 md:py-18 lg:py-24'}`}>
      {!isModal && <div id="pricing" className="absolute -top-24" />}

      {(title || subtitle) && (
        <div className="text-center mb-8 md:mb-12">
          {title && (
            <h2 className={`font-bold text-gray-900 mb-4 ${isModal ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl lg:text-5xl'}`}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {!isModal && (
        <div className="mx-auto mb-8 grid max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm md:grid-cols-[1fr_auto]">
          <div className="p-5 md:p-6">
            <div className="mb-2 inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
              Launch offer
            </div>
            <h3 className="text-2xl font-bold text-slate-950">Save up to 25% on yearly credits</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Credits work across image and video generators. Upgrade when a prompt is ready, then keep creating without losing momentum.
            </p>
          </div>
          <div className="flex items-center border-t border-amber-200 bg-white/70 p-5 md:border-l md:border-t-0 md:p-6">
            <a
              href="#plans"
              className="w-full rounded-full bg-slate-950 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800 md:w-auto"
            >
              Compare plans
            </a>
          </div>
        </div>
      )}

      <PaymentModeToggle value={paymentMode} onChange={setPaymentMode} />

      {/* 模式提示文案 */}
      <div className="flex justify-center mb-8 -mt-6">
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-full px-4 py-1.5">
          {paymentMode === "once"
            ? "💳 Pay as you go — credits never expire"
            : "✓ Cancel anytime, no commitment"
          }
        </span>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto mb-8">
        {!isModal && <div id="plans" className="absolute -top-24" />}
        {tiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            mode={paymentMode}
            onPurchase={onPurchase}
            loading={loading}
            compact={isModal}
          />
        ))}
      </div>

      {!isModal && <FreePlanBanner onStartFree={handleStartFree} />}
    </div>
  );
}
