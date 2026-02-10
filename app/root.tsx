import type { Route } from "./+types/root";
import stylesUrl from "~/app.css?url";

import {
  isRouteErrorResponse,
  Outlet,
  data,
  useLoaderData,
} from "react-router";

import { useEffect, useState } from "react";
import { useUser } from "~/store";
import { useErrorHandler } from "~/hooks/use-error-handler";

import { Document } from "~/features/document";

import "@fontsource/libre-baskerville/400.css";
import "@fontsource/libre-baskerville/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";

export const links: Route.LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export const loader = async ({ context }: Route.LoaderArgs) => {
  return data({
    DOMAIN: context.cloudflare.env.DOMAIN,
    CDN_URL: context.cloudflare.env.CDN_URL,
    GOOGLE_ANALYTICS_ID: context.cloudflare.env.GOOGLE_ANALYTICS_ID,
    GOOGLE_ADS_ID: context.cloudflare.env.GOOGLE_ADS_ID,
    GOOGLE_CLIENT_ID: context.cloudflare.env.GOOGLE_CLIENT_ID,
    MICROSOFT_CLARITY_ID: context.cloudflare.env.MICROSOFT_CLARITY_ID,
    THIRD_PARTY_ADS_ID: context.cloudflare.env.THIRD_PARTY_ADS_ID,
  });
};

export const Layout = ({ children }: React.PropsWithChildren) => {
  let data;
  try {
    data = useLoaderData<typeof loader>();
  } catch (error) {
    // 在错误边界中时，loader数据可能不可用
    data = null;
  }

  return (
    <Document
      lang="en"
      theme="cupcake"
      DOMAIN={data?.DOMAIN}
      GOOGLE_ADS_ID={data?.GOOGLE_ADS_ID} // 控制是否加载 AdSense 的自动广告
      GOOGLE_ANALYTICS_ID={data?.GOOGLE_ANALYTICS_ID}
      MICROSOFT_CLARITY_ID={data?.MICROSOFT_CLARITY_ID}
    // THIRD_PARTY_ADS_ID={data?.THIRD_PARTY_ADS_ID} // 临时禁用第三方广告
    >
      {children}
    </Document>
  );
};
export default function App({ }: Route.ComponentProps) {
  const setUser = useUser((state) => state.setUser);
  const setCredits = useUser((state) => state.setCredits);
  const credits = useUser((state) => state.credits);
  const initGuestCredits = useUser((state) => state.initGuestCredits);
  const [toastLocked, setToastLocked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 错误处理钩子
  const { handleError } = useErrorHandler({
    showToast: false, // 初始化时不显示错误提示
    onError: (errorInfo) => {
      console.error('App Initialization Error:', {
        component: 'App',
        title: errorInfo.title,
        message: errorInfo.message,
        code: errorInfo.code,
        severity: errorInfo.severity,
        timestamp: new Date().toISOString()
      });
    }
  });

  useEffect(() => {
    // 初始化临时积分状态
    initGuestCredits();

    const initializeAuth = async () => {
      try {
        const res = await fetch("/api/auth");

        if (res.ok) {
          const data = await res.json<{
            profile: UserInfo | null;
            credits: number;
          }>();
          setUser(data.profile);
          setCredits(data.credits);
          // 检测是否需要展示购买成功提示（英文，3s）
          try {
            const pending = typeof window !== 'undefined' ? localStorage.getItem('pendingPurchase') : null;
            const before = typeof window !== 'undefined' ? Number(localStorage.getItem('creditsBeforePurchase') || '0') : 0;
            if (!toastLocked && pending === '1' && data.credits > before) {
              setToast('Purchase successful. Credits added to your account.');
              setTimeout(() => setToast(null), 3000);
              setToastLocked(true);
            }
            if (typeof window !== 'undefined') {
              localStorage.removeItem('pendingPurchase');
              localStorage.removeItem('creditsBeforePurchase');
            }
          } catch { }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('初始化用户状态失败:', error);
        handleError(error);
        setUser(null);
      }
    };

    initializeAuth();
  }, [handleError, setUser, setCredits, initGuestCredits]);

  return (
    <>
      <Outlet />
      {toast && (
        <div className="toast toast-end">
          <div className="alert alert-success">
            <span>{toast}</span>
          </div>
        </div>
      )}
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
