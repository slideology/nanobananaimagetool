// 补充环境变量类型定义
// 这些变量通过 'wrangler secret put' 设置，不在 wrangler.jsonc 中定义

declare namespace Cloudflare {
  interface Env {
    // 由 wrangler secret put 设置的敏感变量
    SESSION_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    KIEAI_APIKEY: string;
    APIMART_API_KEY: string;
    APIMART_BASE_URL?: string;
    CREEM_KEY: string;
    CREEM_WEBHOOK_SECRET: string;
    CREEM_TEST_KEY: string;
    FEISHU_WEBHOOK_URL?: string;
    FEISHU_WEBHOOK_SECRET?: string;
    DAILY_REPORT_SECRET?: string;
    GA4_PROPERTY_ID?: string;
    GA4_CLIENT_EMAIL?: string;
    GA4_PRIVATE_KEY?: string;
    GA4_SERVICE_ACCOUNT_JSON?: string;
    // 由 wrangler.jsonc vars 设置的公开变量
    INITLIZE_CREDITS: string;
  }
}
