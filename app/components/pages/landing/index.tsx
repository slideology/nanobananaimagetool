import { Fragment, useRef } from "react";
import HowItWorksSection, { type HowItWorksSectionProps } from "./how-it-works";
import FeaturesGrid, { type FeaturesGridProps } from "./features";
import PricingCards, { type PricingCardsProps } from "./pricing";
import AlternatingContentSection, {
  type AlternatingContentSectionProps,
} from "./alternating-content";
import CTASection, { type CTASectionProps } from "./cta";
import TestimonialsSection, {
  type TestimonialsSectionProps,
} from "./testimonials";
import FAQSection, { type FAQSectionProps } from "./faqs";
import { ThirdPartyAd } from "~/components/common";

export interface LandingProps {
  howItWorks: HowItWorksSectionProps;
  features: FeaturesGridProps;
  pricing: PricingCardsProps;
  alternatingContent: AlternatingContentSectionProps;
  cta?: CTASectionProps; // 可选，因为已注释掉
  testimonials?: TestimonialsSectionProps; // 可选，因为已注释掉
  faqs: FAQSectionProps;
  onCTAClick?: () => void;
  thirdPartyAdsId?: string; // 第三方广告ID
}

export default function Landing({
  howItWorks,
  features,
  pricing,
  alternatingContent,
  cta,
  testimonials,
  faqs,
  onCTAClick,
  thirdPartyAdsId,
}: LandingProps) {
  return (
    <Fragment>
      <HowItWorksSection {...howItWorks} />
      
      {/* 第三方广告位 - 临时禁用 */}
      {/* {thirdPartyAdsId && (
        <section className="py-4 bg-gray-50/50">
          <div className="container mx-auto px-4">
            <ThirdPartyAd 
              adId={thirdPartyAdsId} 
              className="max-w-4xl mx-auto"
            />
          </div>
        </section>
      )} */}
      
      <FeaturesGrid {...features} />
      <PricingCards {...pricing} />
      <AlternatingContentSection {...alternatingContent} />
      {/* CTA 模块 - 已注释掉 */}
      {/* <CTASection {...cta} onButtonClick={onCTAClick} /> */}
      {/* Testimonials 模块 - 已注释掉 */}
      {/* <TestimonialsSection {...testimonials} /> */}
      <FAQSection {...faqs} />
    </Fragment>
  );
}
