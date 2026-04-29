const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GA4_RUN_REPORT_URL = "https://analyticsdata.googleapis.com/v1beta";

export interface Ga4ReportConfig {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
}

export interface Ga4DailyMetrics {
  activeUsers: number;
  totalUsers: number;
  sessions: number;
  screenPageViews: number;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface Ga4RunReportResponse {
  metricHeaders?: Array<{ name?: string }>;
  rows?: Array<{
    metricValues?: Array<{ value?: string }>;
  }>;
}

const textEncoder = new TextEncoder();

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const stringToBase64Url = (value: string) => {
  return bytesToBase64Url(textEncoder.encode(value));
};

const normalizePrivateKey = (privateKey: string) => {
  return privateKey.replace(/\\n/g, "\n").trim();
};

const privateKeyToArrayBuffer = (privateKey: string) => {
  const normalized = normalizePrivateKey(privateKey);
  const pemBody = normalized
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(pemBody);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
};

export const getGa4ConfigFromEnv = (
  env: Partial<
    Pick<
      Env,
      | "GA4_PROPERTY_ID"
      | "GA4_CLIENT_EMAIL"
      | "GA4_PRIVATE_KEY"
      | "GA4_SERVICE_ACCOUNT_JSON"
    >
  >
): { config?: Ga4ReportConfig; missing: string[] } => {
  let clientEmail = env.GA4_CLIENT_EMAIL;
  let privateKey = env.GA4_PRIVATE_KEY;

  if ((!clientEmail || !privateKey) && env.GA4_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(env.GA4_SERVICE_ACCOUNT_JSON) as {
        client_email?: string;
        private_key?: string;
      };
      clientEmail = clientEmail || parsed.client_email;
      privateKey = privateKey || parsed.private_key;
    } catch {
      return {
        missing: ["valid GA4_SERVICE_ACCOUNT_JSON"],
      };
    }
  }

  const missing = [
    !env.GA4_PROPERTY_ID ? "GA4_PROPERTY_ID" : "",
    !clientEmail ? "GA4_CLIENT_EMAIL" : "",
    !privateKey ? "GA4_PRIVATE_KEY" : "",
  ].filter(Boolean);

  if (missing.length > 0) {
    return { missing };
  }

  return {
    config: {
      propertyId: env.GA4_PROPERTY_ID!,
      clientEmail: clientEmail!,
      privateKey: privateKey!,
    },
    missing: [],
  };
};

export const createGoogleServiceAccountJwt = async (
  config: Ga4ReportConfig,
  now = new Date()
) => {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const claims = {
    iss: config.clientEmail,
    scope: GA4_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: issuedAt + 3600,
    iat: issuedAt,
  };
  const signingInput = `${stringToBase64Url(JSON.stringify(header))}.${stringToBase64Url(
    JSON.stringify(claims)
  )}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyToArrayBuffer(config.privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    textEncoder.encode(signingInput)
  );
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;
};

export const requestGoogleAccessToken = async (
  config: Ga4ReportConfig,
  fetcher: typeof fetch = fetch
) => {
  const assertion = await createGoogleServiceAccountJwt(config);
  const response = await fetcher(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as GoogleTokenResponse;

  if (!response.ok || !body.access_token) {
    throw new Error(
      body.error_description || body.error || `Google token request failed with HTTP ${response.status}`
    );
  }

  return body.access_token;
};

export const parseGa4DailyMetrics = (
  response: Ga4RunReportResponse
): Ga4DailyMetrics => {
  const headers = response.metricHeaders || [];
  const values = response.rows?.[0]?.metricValues || [];
  const metrics: Record<string, number> = {};

  headers.forEach((header, index) => {
    if (!header.name) return;
    metrics[header.name] = Number(values[index]?.value || 0);
  });

  return {
    activeUsers: metrics.activeUsers || 0,
    totalUsers: metrics.totalUsers || 0,
    sessions: metrics.sessions || 0,
    screenPageViews: metrics.screenPageViews || 0,
  };
};

export const fetchGa4DailyMetrics = async (
  config: Ga4ReportConfig,
  dateRange: { startDate: string; endDate: string },
  options: {
    fetcher?: typeof fetch;
    accessToken?: string;
  } = {}
) => {
  const fetcher = options.fetcher || fetch;
  const accessToken =
    options.accessToken || (await requestGoogleAccessToken(config, fetcher));
  const response = await fetcher(
    `${GA4_RUN_REPORT_URL}/properties/${config.propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [
          {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          },
        ],
        metrics: [
          { name: "activeUsers" },
          { name: "totalUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
      }),
    }
  );

  const body = (await response.json().catch(() => ({}))) as Ga4RunReportResponse & {
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(
      body.error?.message || `GA4 runReport failed with HTTP ${response.status}`
    );
  }

  return parseGa4DailyMetrics(body);
};
