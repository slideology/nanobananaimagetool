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

export interface LandingProps {
  howItWorks: HowItWorksSectionProps;
  features: FeaturesGridProps;
  pricing: PricingCardsProps;
  alternatingContent: AlternatingContentSectionProps;
  cta: CTASectionProps;
  testimonials: TestimonialsSectionProps;
  faqs: FAQSectionProps;
  onCTAClick?: () => void;
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
}: LandingProps) {
  return (
    <Fragment>
      <HowItWorksSection {...howItWorks} />
      <FeaturesGrid {...features} />
      <PricingCards {...pricing} />
      <AlternatingContentSection {...alternatingContent} />
      <CTASection {...cta} onButtonClick={onCTAClick} />
      <TestimonialsSection {...testimonials} />
      <FAQSection {...faqs} />
    </Fragment>
  );
}
