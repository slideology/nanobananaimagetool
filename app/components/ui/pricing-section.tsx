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
}

export default function PricingSection({
  title = "Simple, transparent pricing",
  subtitle = "Choose the perfect plan for your needs. Start with our free tier and upgrade as you grow.",
  tiers,
  onPurchase,
  onStartFree,
  loading
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
    <div className="container mx-auto px-4 py-12 md:py-18 lg:py-24 relative">
      <div id="pricing" className="absolute -top-24" />

      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          {title}
        </h2>
        <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
          {subtitle}
        </p>
      </div>

      <PaymentModeToggle value={paymentMode} onChange={setPaymentMode} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto mb-8">
        {tiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            mode={paymentMode}
            onPurchase={onPurchase}
            loading={loading}
          />
        ))}
      </div>

      <FreePlanBanner onStartFree={handleStartFree} />
    </div>
  );
}
