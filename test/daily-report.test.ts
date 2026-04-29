import { describe, expect, it, vi } from "vitest";

import {
  buildDailyReportMarkdown,
  getYesterdayBeijingWindow,
  sendFeishuWebhook,
  type DailyReport,
} from "../app/.server/services/daily-report";

const createReport = (override: Partial<DailyReport> = {}): DailyReport => ({
  projectName: "Nano Banana",
  generatedAt: "2026-04-29T00:00:00.000Z",
  window: {
    labelDate: "2026-04-28",
    timezone: "Asia/Shanghai",
    startEpochSeconds: 1777305600,
    endEpochSeconds: 1777392000,
    startIso: "2026-04-27T16:00:00.000Z",
    endIso: "2026-04-28T16:00:00.000Z",
  },
  metrics: {
    newRegisteredUsers: 3,
    loginUsers: 2,
    loginEvents: 5,
    checkoutUsers: 2,
    checkoutOrders: 4,
    paidUsers: 1,
    paidOrders: 1,
    paidAmountCents: 1234,
    aiUsers: 2,
    aiTasks: 9,
    traffic: {
      activeUsers: 8,
      totalUsers: 10,
      sessions: 12,
      screenPageViews: 34,
    },
  },
  notes: [
    "访问用户数来自 GA4 Data API 的 activeUsers 指标。",
  ],
  ...override,
});

describe("daily report", () => {
  it("uses the previous Beijing calendar day as the report window", () => {
    const window = getYesterdayBeijingWindow(
      new Date("2026-04-29T00:00:00.000Z")
    );

    expect(window).toEqual({
      labelDate: "2026-04-28",
      timezone: "Asia/Shanghai",
      startEpochSeconds: Date.parse("2026-04-27T16:00:00.000Z") / 1000,
      endEpochSeconds: Date.parse("2026-04-28T16:00:00.000Z") / 1000,
      startIso: "2026-04-27T16:00:00.000Z",
      endIso: "2026-04-28T16:00:00.000Z",
    });
  });

  it("renders the report metrics and GA4 traffic data", () => {
    const message = buildDailyReportMarkdown(createReport());

    expect(message).toContain("Nano Banana 每日数据日报");
    expect(message).toContain("统计日期：2026-04-28（Asia/Shanghai）");
    expect(message).toContain("访问用户数：8");
    expect(message).toContain("访问会话数：12");
    expect(message).toContain("浏览量：34");
    expect(message).toContain("新注册用户数：3");
    expect(message).toContain("实际付费金额：$12.34");
    expect(message).toContain("访问用户数来自 GA4 Data API");
  });

  it("renders traffic fields as unconfigured when GA4 data is unavailable", () => {
    const message = buildDailyReportMarkdown(
      createReport({
        metrics: {
          ...createReport().metrics,
          traffic: undefined,
        },
        notes: ["GA4 未配置，访问用户数暂未纳入自动日报。"],
      })
    );

    expect(message).toContain("访问用户数：未配置");
    expect(message).toContain("GA4 未配置");
  });

  it("sends an interactive Feishu card", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 0, msg: "success" }), {
        status: 200,
      })
    );

    await sendFeishuWebhook("https://example.com/feishu", createReport(), {
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://example.com/feishu",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.msg_type).toBe("interactive");
    expect(body.card.header.title.content).toBe("Nano Banana 日报 2026-04-28");
    expect(body.timestamp).toBeUndefined();
  });

  it("throws when Feishu returns an error response", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 19001, msg: "bad sign" }), {
        status: 200,
      })
    );

    await expect(
      sendFeishuWebhook("https://example.com/feishu", createReport(), {
        fetcher,
      })
    ).rejects.toThrow("bad sign");
  });

  it("throws when the Feishu webhook HTTP request fails", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("fail", { status: 500 }));

    await expect(
      sendFeishuWebhook("https://example.com/feishu", createReport(), {
        fetcher,
      })
    ).rejects.toThrow("HTTP 500");
  });
});
