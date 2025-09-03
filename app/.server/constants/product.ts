export interface PRODUCT {
  price: number;
  credits: number;
  product_id: string;
  product_name: string;
  type: "once" | "monthly" | "yearly";
}

export const CREDITS_PRODUCT: PRODUCT = {
  price: 9,
  credits: 100,
  product_id: import.meta.env.PROD
    ? "prod_3q2PT9pqzfw5URK7TdIhyb"
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

export const PRODUCTS_LIST = IMAGE_GENERATION_PRODUCTS;
