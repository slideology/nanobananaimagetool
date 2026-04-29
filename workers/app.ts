import { createRequestHandler } from "react-router";

import { runDailyReport } from "~/.server/services/daily-report";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ) {
    ctx.waitUntil(
      runDailyReport(env, { trigger: "scheduled" })
        .then((result) => {
          console.log(
            `[daily-report] completed date=${result.report.window.labelDate} sent=${result.sent}`
          );
        })
        .catch((error) => {
          console.error("[daily-report] failed", error);
        })
    );
  },
} satisfies ExportedHandler<Env>;
