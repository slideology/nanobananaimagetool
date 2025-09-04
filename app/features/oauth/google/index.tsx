import { useState, forwardRef, useEffect } from "react";
import { useMatches } from "react-router";
import { useUser } from "~/store";
import { useErrorHandler } from "~/hooks/use-error-handler";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleOAuthBtn, type GoogleOAuthBtnRef } from "./btn";

export { type GoogleOAuthBtnRef };

interface GoogleOAuthProps {
  useOneTap?: boolean;
  onSuccess?: () => void;
}
export const GoogleOAuth = forwardRef<GoogleOAuthBtnRef, GoogleOAuthProps>(
  ({ useOneTap = false, onSuccess }, ref) => {
    const matches = useMatches();
    const rootMatch = matches[0].data as { GOOGLE_CLIENT_ID: string };
    const clientId = rootMatch.GOOGLE_CLIENT_ID;

    const setUser = useUser((state) => state.setUser);
    const setCredits = useUser((state) => state.setCredits);
    const [signing, setSigning] = useState(false);

    // 错误处理钩子
    const { handleError } = useErrorHandler({
      showToast: true,
      onError: (errorInfo) => {
        console.error('OAuth Error:', {
          component: 'GoogleOAuth',
          title: errorInfo.title,
          message: errorInfo.message,
          code: errorInfo.code,
          severity: errorInfo.severity,
          timestamp: new Date().toISOString()
        });
      }
    });

    const handleSuccess = async (value: {
      access_token?: string;
      credential?: string;
    }) => {
      const values = {
        type: "google",
        data: value,
      };

      setSigning(true);
      try {
        const res = await fetch("/api/auth", {
          method: "post",
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          // 解析后端返回的标准化错误响应
          const errorData = await res.json().catch(() => ({ message: "Unknown error" })) as any;
          throw {
            status: res.status,
            data: errorData,
            message: errorData.error?.message || errorData.message || errorData.error || `HTTP ${res.status}`,
            details: errorData
          };
        }

        const { profile, credits } = await res.json<{
          profile: UserInfo;
          credits: number;
        }>();

        setUser(profile);
        setCredits(credits);

        setTimeout(() => {
          onSuccess?.();
        }, 16);
      } catch (error) {
        console.error('Google OAuth登录失败:', error);
        handleError(error);
      } finally {
        setSigning(false);
      }
    };
    return (
      <GoogleOAuthProvider clientId={clientId}>
        <GoogleOAuthBtn
          ref={ref}
          loading={signing}
          onSuccess={handleSuccess}
          useOneTap={false}
        />
      </GoogleOAuthProvider>
    );
  }
);
