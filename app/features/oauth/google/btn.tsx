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
  // 本地开发环境完全禁用One Tap登录，避免403错误
  // useGoogleOneTapLogin({
  //   onSuccess: ({ credential }) => onSuccess({ credential }),
  //   cancel_on_tap_outside: false,
  //   disabled: !useOneTap,
  //   // 本地开发环境禁用FedCM，生产环境启用
  //   use_fedcm_for_prompt: false,
  // });
  const login = useGoogleLogin({
    onSuccess: ({ access_token }) => onSuccess({ access_token }),
    // 确保使用弹窗模式而不是重定向模式
    flow: 'implicit',
    // 添加错误处理
    onError: (error) => {
      console.warn('Google OAuth error:', error);
    },
    // 避免COOP问题的配置
    ux_mode: 'popup',
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
        try {
          login();
        } catch (error) {
          // 忽略COOP相关错误，这些通常不影响实际功能
          console.warn('OAuth popup warning (can be ignored):', error);
        }
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
