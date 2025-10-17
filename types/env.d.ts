// 补充环境变量类型定义
// 这些变量通过 'wrangler secret put' 设置，不在 wrangler.jsonc 中定义

declare namespace Cloudflare {
  interface Env {
    // 由 wrangler secret put 设置的敏感变量
    SESSION_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    KIEAI_APIKEY: string;
    CREEM_KEY: string;
    CREEM_WEBHOOK_SECRET: string;
    CREEM_TEST_KEY: string;
    // 由 wrangler.jsonc vars 设置的公开变量
    INITLIZE_CREDITS: string;
  }
}
