import { forwardRef, useImperativeHandle } from "react";
import { useGoogleOneTapLogin, useGoogleLogin } from "@react-oauth/google";

export interface GoogleOAuthBtnRef {
  login: () => void;
}

interface GoogleOAuthBtnProps {
  loading?: boolean;
  useOneTap?: boolean;
  onSuccess: (value: { access_token?: string; credential?: string }) => void;
}

export const GoogleOAuthBtn = forwardRef<
  GoogleOAuthBtnRef,
  GoogleOAuthBtnProps
>(({ loading, onSuccess, useOneTap }, ref) => {
  // ✅ Google One Tap：页面加载后自动在右上角显示 Google 账号卡片
  // 用户点卡片即可完成登录，完全不需要离开当前页面
  useGoogleOneTapLogin({
    onSuccess: ({ credential }) => {
      console.log("[OneTap] credential received");
      onSuccess({ credential });
    },
    onError: () => {
      console.warn("[OneTap] One Tap login failed or was suppressed");
    },
    cancel_on_tap_outside: false,
    disabled: !useOneTap,
    use_fedcm_for_prompt: true,
  });

  // ✅ Sign In 按钮：弹出 Google OAuth 小窗口，不打开新标签页
  // 用户在小窗口里选择账号，选完后窗口自动关闭，停留在当前页
  const login = useGoogleLogin({
    onSuccess: ({ access_token }) => {
      console.log("[Login] access_token received");
      onSuccess({ access_token });
    },
    flow: "implicit",
    ux_mode: "popup", // 明确指定弹出小窗口模式（非新标签页，非重定向）
    onError: (error) => {
      console.warn("[Login] OAuth error:", error);
    },
  });

  useImperativeHandle(ref, () => ({
    login: () => login(),
  }));

  return (
    <button
      id="google-oauth-btn"
      className="btn btn-primary max-md:btn-sm data-[loading=true]:cursor-not-allowed"
      onClick={() => {
        if (loading) return;
        login();
      }}
      data-loading={loading}
    >
      <span
        className="loading loading-spinner hidden data-[loading=true]:block"
        data-loading={loading}
      />
      Sign In
    </button>
  );
});
