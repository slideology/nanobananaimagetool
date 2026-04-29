import type { Route } from "./+types/route";

import { runDailyReport } from "~/.server/services/daily-report";

const getBearerToken = (request: Request) => {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || request.headers.get("x-daily-report-secret") || "";
};

export const loader = async () => {
  return Response.json({
    endpoint: "/api/internal/daily-report",
    method: "POST",
    auth: "Authorization: Bearer <DAILY_REPORT_SECRET>",
    dryRun: "append ?dry_run=1 to render without sending to Feishu",
  });
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  if (request.method.toLowerCase() !== "post") {
    return Response.json({ message: "Method Not Allowed" }, { status: 405 });
  }

  const secret = context.cloudflare.env.DAILY_REPORT_SECRET;
  if (!secret) {
    return Response.json(
      { message: "DAILY_REPORT_SECRET is not configured" },
      { status: 503 }
    );
  }

  if (getBearerToken(request) !== secret) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun =
    url.searchParams.get("dry_run") === "1" ||
    url.searchParams.get("dryRun") === "true";
  const result = await runDailyReport(context.cloudflare.env, {
    dryRun,
    trigger: "manual",
  });

  return Response.json(result);
};
