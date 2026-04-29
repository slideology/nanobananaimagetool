import { describe, expect, it, vi } from "vitest";

import {
  fetchGa4DailyMetrics,
  getGa4ConfigFromEnv,
  parseGa4DailyMetrics,
} from "../app/.server/services/ga4-data";

describe("GA4 Data API", () => {
  it("reads service account credentials from split env vars", () => {
    const result = getGa4ConfigFromEnv({
      GA4_PROPERTY_ID: "123456",
      GA4_CLIENT_EMAIL: "reporter@example.iam.gserviceaccount.com",
      GA4_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----",
    });

    expect(result.missing).toEqual([]);
    expect(result.config).toMatchObject({
      propertyId: "123456",
      clientEmail: "reporter@example.iam.gserviceaccount.com",
    });
  });

  it("reads service account credentials from JSON env var", () => {
    const result = getGa4ConfigFromEnv({
      GA4_PROPERTY_ID: "123456",
      GA4_SERVICE_ACCOUNT_JSON: JSON.stringify({
        client_email: "reporter@example.iam.gserviceaccount.com",
        private_key: "secret-key",
      }),
    });

    expect(result.missing).toEqual([]);
    expect(result.config?.privateKey).toBe("secret-key");
  });

  it("reports missing GA4 configuration", () => {
    const result = getGa4ConfigFromEnv({});

    expect(result.config).toBeUndefined();
    expect(result.missing).toEqual([
      "GA4_PROPERTY_ID",
      "GA4_CLIENT_EMAIL",
      "GA4_PRIVATE_KEY",
    ]);
  });

  it("parses GA4 runReport metrics by header name", () => {
    expect(
      parseGa4DailyMetrics({
        metricHeaders: [
          { name: "activeUsers" },
          { name: "totalUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
        rows: [
          {
            metricValues: [
              { value: "8" },
              { value: "10" },
              { value: "12" },
              { value: "34" },
            ],
          },
        ],
      })
    ).toEqual({
      activeUsers: 8,
      totalUsers: 10,
      sessions: 12,
      screenPageViews: 34,
    });
  });

  it("calls GA4 runReport with the expected metrics", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          metricHeaders: [{ name: "activeUsers" }],
          rows: [{ metricValues: [{ value: "5" }] }],
        }),
        { status: 200 }
      )
    );

    const result = await fetchGa4DailyMetrics(
      {
        propertyId: "123456",
        clientEmail: "reporter@example.iam.gserviceaccount.com",
        privateKey: "unused",
      },
      { startDate: "2026-04-28", endDate: "2026-04-28" },
      { fetcher, accessToken: "test-token" }
    );

    expect(result.activeUsers).toBe(5);
    expect(fetcher).toHaveBeenCalledWith(
      "https://analyticsdata.googleapis.com/v1beta/properties/123456:runReport",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
      })
    );

    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.dateRanges).toEqual([
      { startDate: "2026-04-28", endDate: "2026-04-28" },
    ]);
    expect(body.metrics).toEqual([
      { name: "activeUsers" },
      { name: "totalUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
    ]);
  });
});
