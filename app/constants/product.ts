export interface PRODUCT {
  price: number;
  credits: number;
  product_id: string;
  test_product_id?: string;
  product_name: string;
  type: "once" | "monthly" | "yearly";
}


// ============ 新定价系统 ============

export type PaymentMode = "yearly" | "monthly" | "once";

export interface PricingMode {
  price: number; // 显示价格（月付显示月价，年付显示月均价）
  credits: number; // 积分数量
  product_id: string; // Stripe 产品 ID
  test_product_id?: string; // 测试环境专用的产品 ID
  billedAmount?: number; // 实际账单金额（年付时使用）
  savingPercent?: number; // 节省百分比
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

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "basic",
    name: "Basic",
    badge: "Perfect for hobbyists",
    badgeColor: "primary",
    description: "Perfect for hobbyists and beginners",
    pricing: {
      monthly: {
        price: 9.99,
        credits: 4000,
        product_id: "prod_3mlkgk9ZckjfOsia2nrYn4",
        test_product_id: "prod_7c1K73uJ8fqnL5eU8L6OQt"
      },
      yearly: {
        price: 8.99,
        credits: 4000,
        product_id: "prod_6mfspjIbfsLo7wNzWGTrun",
        test_product_id: "prod_1NWDRyPgyVPSFWJfuDp8pS",
        billedAmount: 107.88,
        savingPercent: 10
      },
      once: {
        price: 9.99,
        credits: 3000,
        product_id: "prod_1Zl2095dq4EGjfNpKCepNo",
        test_product_id: "prod_9CgN0oI7dzK79zDY4C65X"
      }
    },
    // 注意：首条 Credits 文案由 PricingCard 根据 mode 动态渲染
    features: [
      { text: "High quality AI image generation", included: true },
      { text: "Text-to-image & image-to-image", included: true },
      { text: "All art styles available", included: true },
      { text: "Standard processing speed", included: true },
      { text: "Email support", included: true },
      { text: "Commercial usage rights", included: true },
      { text: "Priority processing", included: false },
      { text: "No Captcha verification", included: false }
    ],
    buttonText: "Get Started"
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most Popular",
    badgeColor: "purple",
    isPopular: true,
    description: "For creators and professionals",
    pricing: {
      monthly: {
        price: 19.99,
        credits: 9000,
        product_id: "prod_d1TVcAaMuggDkGREVqIhG",
        test_product_id: "prod_o8uTOr8elcWzcaNJPKpxe"
      },
      yearly: {
        price: 14.99,
        credits: 8000,
        product_id: "prod_7Pbprhm0TqipTa0CFUzfbe",
        test_product_id: "prod_5qwb7z8pqv3aseabp0myF6",
        billedAmount: 179.88,
        savingPercent: 25
      },
      once: {
        price: 39.99,
        credits: 14000,
        product_id: "prod_67A1jDLQeXMgg5TRRmdfBM",
        test_product_id: "prod_7Ue9GgnBYS0HpB4sTOTdEq"
      }
    },
    features: [
      { text: "Everything in Basic, and:", included: true },
      { text: "Premium AI image generation", included: true },
      { text: "Unlimited image dimensions", included: true },
      { text: "Fastest processing speed", included: true },
      { text: "Priority support", included: true },
      { text: "Batch generation", included: true },
      { text: "Commercial usage rights", included: true },
      { text: "No Captcha verification", included: false }
    ],
    buttonText: "Get Started"
  },
  {
    id: "ultra",
    name: "Ultra",
    badge: "Best Value",
    badgeColor: "accent",
    isPopular: false,
    description: "For power users and teams",
    pricing: {
      monthly: {
        price: 39.99,
        credits: 16000,
        product_id: "prod_3BUTvTKGHVCkRT9NofrZmP",
        test_product_id: "prod_Wa1F8nhQUn1pVTbzxX9yN"
      },
      yearly: {
        price: 29.99,
        credits: 15000,
        product_id: "prod_4yDKGwwqMqUPwzOz33LLTP",
        test_product_id: "prod_YATVzoRcg4Rl3RO74gDV7",
        billedAmount: 359.88,
        savingPercent: 25
      },
      once: {
        price: 99.99,
        credits: 40000,
        product_id: "prod_5KEqomw5RDaHLxpCPEQtq5",
        test_product_id: "prod_67pU5p7n8uwvw3IXdAVZaw"
      }
    },
    features: [
      { text: "Everything in Pro, and:", included: true },
      { text: "No Captcha verification", included: true },
      { text: "Fastest processing & priority queue", included: true },
      { text: "Advanced batch generation", included: true },
      { text: "Premium priority support", included: true },
      { text: "Commercial usage rights", included: true }
    ],
    buttonText: "Get Started"
  }
];

export const FREE_PLAN = {
  name: "Free",
  description: "For personal use only with limited features and support",
  features: [
    { text: "3 Free Trial Credits", included: true },
    { text: "Basic Image Generation", included: true },
    { text: "Standard Response Time", included: true },
    { text: "Community Support", included: true }
  ],
  buttonText: "Start Free"
};

// ============ 将 PRICING_TIERS 转换为 PRODUCTS_LIST 格式 ============

/**
 * 将多档定价系统转换为产品列表格式
 * 用于 /api/create-order 接口验证 product_id
 */
function flattenPricingTiers(): PRODUCT[] {
  const products: PRODUCT[] = [];

  PRICING_TIERS.forEach(tier => {
    // Monthly subscription
    products.push({
      price: tier.pricing.monthly.price,
      credits: tier.pricing.monthly.credits,
      product_id: tier.pricing.monthly.product_id,
      test_product_id: tier.pricing.monthly.test_product_id,
      product_name: `${tier.name} Plan - Monthly Subscription`,
      type: "monthly"
    });

    // Yearly subscription
    products.push({
      price: tier.pricing.yearly.billedAmount || tier.pricing.yearly.price * 12,
      credits: tier.pricing.yearly.credits,
      product_id: tier.pricing.yearly.product_id,
      test_product_id: tier.pricing.yearly.test_product_id,
      product_name: `${tier.name} Plan - Yearly Subscription`,
      type: "yearly"
    });

    // One-time purchase
    products.push({
      price: tier.pricing.once.price,
      credits: tier.pricing.once.credits,
      product_id: tier.pricing.once.product_id,
      test_product_id: tier.pricing.once.test_product_id,
      product_name: `${tier.name} Plan - One-Time Purchase`,
      type: "once"
    });
  });

  return products;
}

// 新定价系统的所有产品
export const PRODUCTS_LIST = [
  ...flattenPricingTiers()
];
