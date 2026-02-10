export interface PRODUCT {
  price: number;
  credits: number;
  product_id: string;
  product_name: string;
  type: "once" | "monthly" | "yearly";
}

export const CREDITS_PRODUCT: PRODUCT = {
  price: 9.9,
  credits: 100,
  product_id: import.meta.env.PROD
    ? "prod_tMa1e6wOR5SnpYzLKUVaP" // For Test Env Deployment (PROD=true)
    : "prod_tMa1e6wOR5SnpYzLKUVaP",
  product_name: "AI Image Generation Credits",
  type: "once",
};

// 新的产品配置适配图片生成
export const IMAGE_GENERATION_PRODUCTS = [
  {
    ...CREDITS_PRODUCT,
    description: "Generate amazing AI artwork with 100 credits",
    features: [
      "100 AI image generations",
      "Image-to-image transformation",
      "Text-to-image creation",
      "Multiple art styles",
      "High resolution output"
    ]
  }
];


// ============ 新定价系统 ============

export type PaymentMode = "yearly" | "monthly" | "once";

export interface PricingMode {
  price: number; // 显示价格（月付显示月价，年付显示月均价）
  credits: number; // 积分数量
  product_id: string; // Stripe 产品 ID
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
    badge: "Perfect for individuals",
    badgeColor: "primary",
    description: "For individuals and hobbyists",
    pricing: {
      monthly: {
        price: 9.9,
        credits: 100,
        product_id: import.meta.env.PROD ? "prod_7c1K73uJ8fqnL5eU8L6OQt" : "prod_7c1K73uJ8fqnL5eU8L6OQt"
      },
      yearly: {
        price: 4.9,
        credits: 100,
        product_id: import.meta.env.PROD ? "prod_1NWDRyPgyVPSFWJfuDp8pS" : "prod_1NWDRyPgyVPSFWJfuDp8pS",
        billedAmount: 58.8,
        savingPercent: 50
      },
      once: {
        price: 17.9,
        credits: 200,
        product_id: import.meta.env.PROD ? "prod_9CgN0oI7dzK79zDY4C65X" : "prod_9CgN0oI7dzK79zDY4C65X"
      }
    },
    features: [
      { text: "100 Credits / Month", included: true },
      { text: "Basic Image Generation", included: true },
      { text: "Standard Response Time", included: true },
      { text: "Email Support", included: true },
      { text: "Unlimited Upscale", included: true },
      { text: "Priority Support", included: false },
      { text: "Batch Generation", included: false },
      { text: "No Captcha/Turnstile", included: false }
    ],
    buttonText: "Purchase"
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
        price: 13.9,
        credits: 400,
        product_id: import.meta.env.PROD ? "prod_o8uTOr8elcWzcaNJPKpxe" : "prod_o8uTOr8elcWzcaNJPKpxe"
      },
      yearly: {
        price: 6.9,
        credits: 400,
        product_id: import.meta.env.PROD ? "prod_5qwb7z8pqv3aseabp0myF6" : "prod_5qwb7z8pqv3aseabp0myF6",
        billedAmount: 82.8,
        savingPercent: 50
      },
      once: {
        price: 24.9,
        credits: 800,
        product_id: import.meta.env.PROD ? "prod_7Ue9GgnBYS0HpB4sTOTdEq" : "prod_7Ue9GgnBYS0HpB4sTOTdEq"
      }
    },
    features: [
      { text: "400 Credits / Month", included: true },
      { text: "Everything in Basic, and:", included: true },
      { text: "Premium Image Generation", included: true },
      { text: "Unlimited Dimensions", included: true },
      { text: "Fast Response", included: true },
      { text: "Priority Support", included: true },
      { text: "Batch Generation", included: true },
      { text: "No Captcha/Turnstile", included: false }
    ],
    buttonText: "Purchase"
  },
  {
    id: "ultra",
    name: "Ultra",
    badge: "Best Value",
    badgeColor: "accent",
    isPopular: false,
    description: "For teams and enterprises with advanced needs",
    pricing: {
      monthly: {
        price: 39.9,
        credits: 1500,
        product_id: import.meta.env.PROD ? "prod_Wa1F8nhQUn1pVTbzxX9yN" : "prod_Wa1F8nhQUn1pVTbzxX9yN"
      },
      yearly: {
        price: 19.9,
        credits: 1500,
        product_id: import.meta.env.PROD ? "prod_YATVzoRcg4Rl3RO74gDV7" : "prod_YATVzoRcg4Rl3RO74gDV7",
        billedAmount: 238.8,
        savingPercent: 50
      },
      once: {
        price: 69.9,
        credits: 3000,
        product_id: import.meta.env.PROD ? "prod_67pU5p7n8uwvw3IXdAVZaw" : "prod_67pU5p7n8uwvw3IXdAVZaw"
      }
    },
    features: [
      { text: "1500 Credits / Month", included: true },
      { text: "Everything in Pro, and:", included: true },
      { text: "No Captcha/Turnstile Verification", included: true },
      { text: "Fastest Response Time", included: true },
      { text: "Premium Priority Support", included: true },
      { text: "Advanced Batch Generation", included: true }
    ],
    buttonText: "Purchase"
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
      product_name: `${tier.name} Plan - Monthly Subscription`,
      type: "monthly"
    });

    // Yearly subscription
    products.push({
      price: tier.pricing.yearly.billedAmount || tier.pricing.yearly.price * 12,
      credits: tier.pricing.yearly.credits,
      product_id: tier.pricing.yearly.product_id,
      product_name: `${tier.name} Plan - Yearly Subscription`,
      type: "yearly"
    });

    // One-time purchase
    products.push({
      price: tier.pricing.once.price,
      credits: tier.pricing.once.credits,
      product_id: tier.pricing.once.product_id,
      product_name: `${tier.name} Plan - One-Time Purchase`,
      type: "once"
    });
  });

  return products;
}

// 合并旧产品和新产品，确保向后兼容
export const PRODUCTS_LIST = [
  ...IMAGE_GENERATION_PRODUCTS, // 保留旧产品 ID，向后兼容
  ...flattenPricingTiers()      // 添加新定价系统的所有产品
];
