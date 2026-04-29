import {
  fetchGa4DailyMetrics,
  getGa4ConfigFromEnv,
  type Ga4DailyMetrics,
} from "./ga4-data";

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface DailyReportWindow {
  labelDate: string;
  timezone: "Asia/Shanghai";
  startEpochSeconds: number;
  endEpochSeconds: number;
  startIso: string;
  endIso: string;
}

export interface DailyReportMetrics {
  newRegisteredUsers: number;
  loginUsers: number;
  loginEvents: number;
  checkoutUsers: number;
  checkoutOrders: number;
  paidUsers: number;
  paidOrders: number;
  paidAmountCents: number;
  aiUsers: number;
  aiTasks: number;
  traffic?: Ga4DailyMetrics;
}

export interface DailyReport {
  projectName: string;
  generatedAt: string;
  window: DailyReportWindow;
  metrics: DailyReportMetrics;
  notes: string[];
}

export interface DailyReportResult {
  report: DailyReport;
  message: string;
  sent: boolean;
  dryRun: boolean;
}

interface DailyReportRow {
  new_registered_users?: number;
  login_users?: number;
  login_events?: number;
  checkout_users?: number;
  checkout_orders?: number;
  paid_users?: number;
  paid_orders?: number;
  paid_amount_cents?: number;
  ai_users?: number;
  ai_tasks?: number;
}

interface FeishuResponse {
  code?: number;
  StatusCode?: number;
  msg?: string;
  message?: string;
}

type DailyReportEnv = Pick<Env, "DB"> &
  Partial<
    Pick<
      Env,
      | "FEISHU_WEBHOOK_URL"
      | "FEISHU_WEBHOOK_SECRET"
      | "DAILY_REPORT_SECRET"
      | "GA4_PROPERTY_ID"
      | "GA4_CLIENT_EMAIL"
      | "GA4_PRIVATE_KEY"
      | "GA4_SERVICE_ACCOUNT_JSON"
    >
  >;

const DAILY_REPORT_SQL = `
SELECT
  (SELECT COUNT(*) FROM users WHERE created_at >= ? AND created_at < ?) AS new_registered_users,
  (SELECT COUNT(DISTINCT user_id) FROM signin_logs WHERE created_at >= ? AND created_at < ?) AS login_users,
  (SELECT COUNT(*) FROM signin_logs WHERE created_at >= ? AND created_at < ?) AS login_events,
  (SELECT COUNT(DISTINCT user_id) FROM orders WHERE created_at >= ? AND created_at < ?) AS checkout_users,
  (SELECT COUNT(*) FROM orders WHERE created_at >= ? AND created_at < ?) AS checkout_orders,
  (SELECT COUNT(DISTINCT user_id) FROM orders WHERE paid_at IS NOT NULL AND status != 'refunded' AND paid_at >= ? AND paid_at < ?) AS paid_users,
  (SELECT COUNT(*) FROM orders WHERE paid_at IS NOT NULL AND status != 'refunded' AND paid_at >= ? AND paid_at < ?) AS paid_orders,
  (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE paid_at IS NOT NULL AND status != 'refunded' AND paid_at >= ? AND paid_at < ?) AS paid_amount_cents,
  (SELECT COUNT(DISTINCT user_id) FROM ai_tasks WHERE created_at >= ? AND created_at < ?) AS ai_users,
  (SELECT COUNT(*) FROM ai_tasks WHERE created_at >= ? AND created_at < ?) AS ai_tasks
`;

const toNumber = (value: unknown) => Number(value || 0);

const formatDate = (utcLikeDate: Date) => {
  const year = utcLikeDate.getUTCFullYear();
  const month = `${utcLikeDate.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${utcLikeDate.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getYesterdayBeijingWindow = (
  now = new Date()
): DailyReportWindow => {
  const beijingNow = new Date(now.getTime() + BEIJING_OFFSET_MS);
  const reportDateAtBeijingMidnight = Date.UTC(
    beijingNow.getUTCFullYear(),
    beijingNow.getUTCMonth(),
    beijingNow.getUTCDate() - 1
  );
  const startMs = reportDateAtBeijingMidnight - BEIJING_OFFSET_MS;
  const endMs = startMs + ONE_DAY_MS;

  return {
    labelDate: formatDate(new Date(reportDateAtBeijingMidnight)),
    timezone: "Asia/Shanghai",
    startEpochSeconds: Math.floor(startMs / 1000),
    endEpochSeconds: Math.floor(endMs / 1000),
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
  };
};

export const formatUsdFromCents = (cents: number) => {
  return `$${(cents / 100).toFixed(2)}`;
};

export const collectDailyReport = async (
  db: D1Database,
  now = new Date(),
  options: {
    env?: DailyReportEnv;
  } = {}
): Promise<DailyReport> => {
  const window = getYesterdayBeijingWindow(now);
  const args = Array.from({ length: 10 }).flatMap(() => [
    window.startEpochSeconds,
    window.endEpochSeconds,
  ]);
  const row = await db.prepare(DAILY_REPORT_SQL).bind(...args).first<DailyReportRow>();
  const notes: string[] = [];
  let traffic: Ga4DailyMetrics | undefined;

  const ga4 = options.env ? getGa4ConfigFromEnv(options.env) : { missing: [] };
  if (options.env && ga4.config) {
    try {
      traffic = await fetchGa4DailyMetrics(ga4.config, {
        startDate: window.labelDate,
        endDate: window.labelDate,
      });
      notes.push("访问用户数来自 GA4 Data API 的 activeUsers 指标。");
    } catch (error) {
      notes.push(
        `GA4 Data API 拉取失败，访问用户数暂未纳入：${(error as Error).message}`
      );
    }
  } else if (options.env) {
    notes.push(
      `GA4 未配置，访问用户数暂未纳入自动日报。缺少：${ga4.missing.join(", ")}`
    );
  } else {
    notes.push(
      "访问用户数暂未纳入自动日报：当前未传入 GA4 配置。"
    );
  }

  return {
    projectName: "Nano Banana",
    generatedAt: now.toISOString(),
    window,
    metrics: {
      newRegisteredUsers: toNumber(row?.new_registered_users),
      loginUsers: toNumber(row?.login_users),
      loginEvents: toNumber(row?.login_events),
      checkoutUsers: toNumber(row?.checkout_users),
      checkoutOrders: toNumber(row?.checkout_orders),
      paidUsers: toNumber(row?.paid_users),
      paidOrders: toNumber(row?.paid_orders),
      paidAmountCents: toNumber(row?.paid_amount_cents),
      aiUsers: toNumber(row?.ai_users),
      aiTasks: toNumber(row?.ai_tasks),
      traffic,
    },
    notes,
  };
};

export const buildDailyReportMarkdown = (report: DailyReport) => {
  const { metrics, window } = report;

  return [
    `**${report.projectName} 每日数据日报**`,
    `统计日期：${window.labelDate}（${window.timezone}）`,
    "",
    `访问用户数：${metrics.traffic?.activeUsers ?? "未配置"}`,
    `访问总用户数：${metrics.traffic?.totalUsers ?? "未配置"}`,
    `访问会话数：${metrics.traffic?.sessions ?? "未配置"}`,
    `浏览量：${metrics.traffic?.screenPageViews ?? "未配置"}`,
    "",
    `新注册用户数：${metrics.newRegisteredUsers}`,
    `登录用户数：${metrics.loginUsers}`,
    `登录次数：${metrics.loginEvents}`,
    `AI 使用用户数：${metrics.aiUsers}`,
    `AI 任务数：${metrics.aiTasks}`,
    "",
    `发起付费用户数：${metrics.checkoutUsers}`,
    `发起付费订单数：${metrics.checkoutOrders}`,
    `实际付费用户数：${metrics.paidUsers}`,
    `实际付费订单数：${metrics.paidOrders}`,
    `实际付费金额：${formatUsdFromCents(metrics.paidAmountCents)}`,
    "",
    `备注：${report.notes.join(" ")}`,
  ].join("\n");
};

export const buildFeishuCard = (report: DailyReport) => ({
  msg_type: "interactive",
  card: {
    config: {
      wide_screen_mode: true,
    },
    header: {
      template: "blue",
      title: {
        tag: "plain_text",
        content: `${report.projectName} 日报 ${report.window.labelDate}`,
      },
    },
    elements: [
      {
        tag: "markdown",
        content: buildDailyReportMarkdown(report),
      },
    ],
  },
});

const createFeishuSign = async (timestamp: string, secret: string) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${timestamp}\n${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new Uint8Array());
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

export const sendFeishuWebhook = async (
  webhookUrl: string,
  report: DailyReport,
  options: {
    secret?: string;
    fetcher?: typeof fetch;
  } = {}
) => {
  const fetcher = options.fetcher || fetch;
  const payload: Record<string, unknown> = buildFeishuCard(report);

  if (options.secret) {
    const timestamp = `${Math.floor(Date.now() / 1000)}`;
    payload.timestamp = timestamp;
    payload.sign = await createFeishuSign(timestamp, options.secret);
  }

  const response = await fetcher(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Feishu webhook failed with HTTP ${response.status}`);
  }

  const body = (await response.json().catch(() => ({}))) as FeishuResponse;
  const code = body.code ?? body.StatusCode ?? 0;
  if (code !== 0) {
    throw new Error(body.msg || body.message || `Feishu webhook returned code ${code}`);
  }

  return body;
};

export const runDailyReport = async (
  env: DailyReportEnv,
  options: {
    now?: Date;
    dryRun?: boolean;
    trigger?: "scheduled" | "manual";
  } = {}
): Promise<DailyReportResult> => {
  const report = await collectDailyReport(env.DB, options.now || new Date(), {
    env,
  });
  const message = buildDailyReportMarkdown(report);
  const shouldSend = !options.dryRun && !!env.FEISHU_WEBHOOK_URL;

  if (shouldSend && env.FEISHU_WEBHOOK_URL) {
    await sendFeishuWebhook(env.FEISHU_WEBHOOK_URL, report, {
      secret: env.FEISHU_WEBHOOK_SECRET,
    });
  } else {
    console.log(`[daily-report] ${options.dryRun ? "Dry run" : "Skipped send"}`);
    console.log(message);
  }

  return {
    report,
    message,
    sent: shouldSend,
    dryRun: !!options.dryRun,
  };
};
