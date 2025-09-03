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

export const PRICING_LIST = [BASIC_PLAN, PREMIUM_PLAN] as PLAN[];
export const PLANS = {
  basic: BASIC_PLAN,
  premium: PREMIUM_PLAN,
} as Record<string, PLAN>;
