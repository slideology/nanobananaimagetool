import { env } from "cloudflare:workers";
import { CreemApiClient } from "./client";

export const createCreem = (contextEnv?: any) => {
  // 优先从传入的 Context Env 中获取，其次尝试全局 env
  const apiKey = contextEnv?.CREEM_TEST_KEY || env?.CREEM_TEST_KEY;

  if (apiKey) {
    console.log("[createCreem] Using Test Environment (Key present)");
    return new CreemApiClient(
      "https://test-api.creem.io",
      apiKey
    );
  }

  console.log("[createCreem] Using Production Environment");
  return new CreemApiClient();
};
