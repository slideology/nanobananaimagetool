export interface PLAN {
  id: string;
  popular: boolean;
  product_id: { monthly: string; yearly: string } | null;
  price: { monthly: number; yearly: number };
  name: string;
  description: string;
  limit: {
    adblock: boolean; // 是否关闭广告
    watermarks: boolean; // 生成的结果是否显示水印
    highResolution: boolean; // 是否生成高质量图像
    fullStyles: boolean; // 是否允许使用完整风格
    credits: number; // 每月赠送积分
    private: boolean; // 是否私有化生成
    features: boolean; // 允许使用实验性功能
    imageToImage: boolean; // 是否支持图片转图片
    textToImage: boolean; // 是否支持文本转图片
    advancedStyles: boolean; // 是否支持高级样式
  };
}

export const PREMIUM_PLAN: PLAN = {
  id: "premium",
  popular: true,
  price: { monthly: 9.99, yearly: 99.9 },
  product_id: {
    monthly: "xxx", // 月订阅商品编码
    yearly: "xxx", // 年订阅商品编码
  },
  name: "Premium AI Generator",
  description:
    "Unlock unlimited AI image generation with premium features, no watermarks, and high resolution output.",
  limit: {
    adblock: true,
    watermarks: false,
    highResolution: true,
    fullStyles: true,
    credits: 500, // 更多月度积分适配图片生成
    private: true,
    features: true,
    imageToImage: true,
    textToImage: true,
    advancedStyles: true,
  },
};

// 基础计划
export const BASIC_PLAN: PLAN = {
  id: "basic",
  popular: false,
  price: { monthly: 0, yearly: 0 },
  product_id: null,
  name: "Free Trial",
  description:
    "Try our AI image generator with limited features. Perfect for getting started.",
  limit: {
    adblock: false,
    watermarks: true,
    highResolution: false,
    fullStyles: false,
    credits: 3, // 免费试用积分
    private: false,
    features: false,
    imageToImage: true,
    textToImage: true,
    advancedStyles: false,
  },
};

// 新增订阅计划（对应新定价系统）
export const BASIC_SUBSCRIPTION_PLAN: PLAN = {
  id: "basic",
  popular: false,
  price: { monthly: 9.9, yearly: 58.8 },
  product_id: {
    monthly: import.meta.env.PROD ? "prod_7c1K73uJ8fqnL5eU8L6OQt" : "prod_7c1K73uJ8fqnL5eU8L6OQt",
    yearly: import.meta.env.PROD ? "prod_1NWDRyPgyVPSFWJfuDp8pS" : "prod_1NWDRyPgyVPSFWJfuDp8pS"
  },
  name: "Basic Plan",
  description: "For individuals and hobbyists",
  limit: {
    adblock: false,
    watermarks: false,
    highResolution: true,
    fullStyles: true,
    credits: 100,
    private: false,
    features: false,
    imageToImage: true,
    textToImage: true,
    advancedStyles: false
  }
};

export const PRO_SUBSCRIPTION_PLAN: PLAN = {
  id: "pro",
  popular: true,
  price: { monthly: 13.9, yearly: 82.8 },
  product_id: {
    monthly: import.meta.env.PROD ? "prod_o8uTOr8elcWzcaNJPKpxe" : "prod_o8uTOr8elcWzcaNJPKpxe",
    yearly: import.meta.env.PROD ? "prod_5qwb7z8pqv3aseabp0myF6" : "prod_5qwb7z8pqv3aseabp0myF6"
  },
  name: "Pro Plan",
  description: "For creators and professionals",
  limit: {
    adblock: true,
    watermarks: false,
    highResolution: true,
    fullStyles: true,
    credits: 400,
    private: true,
    features: true,
    imageToImage: true,
    textToImage: true,
    advancedStyles: true
  }
};

export const ULTRA_PLAN: PLAN = {
  id: "ultra",
  popular: false,
  price: { monthly: 39.9, yearly: 238.8 },
  product_id: {
    monthly: import.meta.env.PROD ? "prod_Wa1F8nhQUn1pVTbzxX9yN" : "prod_Wa1F8nhQUn1pVTbzxX9yN",
    yearly: import.meta.env.PROD ? "prod_YATVzoRcg4Rl3RO74gDV7" : "prod_YATVzoRcg4Rl3RO74gDV7"
  },
  name: "Ultra Plan",
  description: "For teams and enterprises with advanced needs",
  limit: {
    adblock: true,
    watermarks: false,
    highResolution: true,
    fullStyles: true,
    credits: 1500,
    private: true,
    features: true,
    imageToImage: true,
    textToImage: true,
    advancedStyles: true
  }
};

export const PRICING_LIST = [BASIC_PLAN, BASIC_SUBSCRIPTION_PLAN, PRO_SUBSCRIPTION_PLAN, ULTRA_PLAN, PREMIUM_PLAN] as PLAN[];
export const PLANS = {
  basic: BASIC_SUBSCRIPTION_PLAN,
  pro: PRO_SUBSCRIPTION_PLAN,
  ultra: ULTRA_PLAN,
  premium: PREMIUM_PLAN,
} as Record<string, PLAN>;
