/**
 * Cloudflare Turnstile 验证组件
 * 用于未登录用户的人机验证
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

export interface TurnstileVerificationRef {
  reset: () => void;
  getToken: () => string | null;
}

export interface TurnstileVerificationProps {
  siteKey: string;
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  className?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
}

/**
 * Turnstile 验证状态类型
 */
export type VerificationState = "idle" | "loading" | "success" | "error" | "expired";

/**
 * Turnstile 验证组件
 */
export const TurnstileVerification = ({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  className = "",
  theme = "light",
  size = "normal"
}: TurnstileVerificationProps) => {
  const [state, setState] = useState<VerificationState>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const turnstileRef = useRef<any>(null);

  /**
   * 处理验证成功
   */
  const handleSuccess = useCallback((token: string) => {
    console.log("Turnstile verification successful");
    setToken(token);
    setState("success");
    setErrorMessage("");
    onSuccess?.(token);
  }, [onSuccess]);

  /**
   * 处理验证错误
   */
  const handleError = useCallback((error?: string) => {
    console.error("Turnstile verification error:", error);
    const errorMsg = error || "Verification failed. Please try again.";
    setToken(null);
    setState("error");
    setErrorMessage(errorMsg);
    onError?.(errorMsg);
  }, [onError]);

  /**
   * 处理验证过期
   */
  const handleExpire = useCallback(() => {
    console.warn("Turnstile verification expired");
    setToken(null);
    setState("expired");
    setErrorMessage("Verification expired. Please try again.");
    onExpire?.();
  }, [onExpire]);

  /**
   * 重置验证状态
   */
  const reset = useCallback(() => {
    setToken(null);
    setState("idle");
    setErrorMessage("");
    turnstileRef.current?.reset();
  }, []);

  /**
   * 获取当前token
   */
  const getToken = useCallback(() => {
    return token;
  }, [token]);

  /**
   * 处理验证开始
   */
  const handleBeforeInteractive = useCallback(() => {
    setState("loading");
    setErrorMessage("");
  }, []);

  // 状态显示文本
  const getStateText = () => {
    switch (state) {
      case "loading":
        return "Verifying...";
      case "success":
        return "✓ Verification successful";
      case "error":
        return `✗ ${errorMessage}`;
      case "expired":
        return "⚠ Verification expired";
      default:
        return "Please complete the verification";
    }
  };

  // 状态样式
  const getStateClass = () => {
    switch (state) {
      case "loading":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
      case "expired":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className={`turnstile-verification ${className}`}>
      {/* 验证状态提示 */}
      <div className={`text-sm font-medium mb-3 ${getStateClass()}`}>
        {getStateText()}
      </div>

      {/* Turnstile 组件 */}
      <div className="flex justify-center">
        <Turnstile
          ref={turnstileRef}
          siteKey={siteKey}
          onSuccess={handleSuccess}
          onError={handleError}
          onExpire={handleExpire}
          onBeforeInteractive={handleBeforeInteractive}
          options={{
            theme,
            size,
            action: "upload-image",
            cData: "image-upload-verification"
          }}
        />
      </div>

      {/* 错误重试按钮 */}
      {(state === "error" || state === "expired") && (
        <div className="mt-3 text-center">
          <button
            onClick={reset}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* 帮助文本 */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        This verification helps us prevent automated abuse
      </div>
    </div>
  );
};

/**
 * 带引用的 Turnstile 验证组件
 */
export const TurnstileVerificationWithRef = ({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  className,
  theme,
  size
}: TurnstileVerificationProps & { ref?: React.Ref<TurnstileVerificationRef> }) => {
  const [state, setState] = useState<VerificationState>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const turnstileRef = useRef<any>(null);

  const handleSuccess = useCallback((token: string) => {
    setToken(token);
    setState("success");
    setErrorMessage("");
    onSuccess?.(token);
  }, [onSuccess]);

  const handleError = useCallback((error?: string) => {
    const errorMsg = error || "Verification failed. Please try again.";
    setToken(null);
    setState("error");
    setErrorMessage(errorMsg);
    onError?.(errorMsg);
  }, [onError]);

  const handleExpire = useCallback(() => {
    setToken(null);
    setState("expired");
    setErrorMessage("Verification expired. Please try again.");
    onExpire?.();
  }, [onExpire]);

  const reset = useCallback(() => {
    setToken(null);
    setState("idle");
    setErrorMessage("");
    turnstileRef.current?.reset();
  }, []);

  const getToken = useCallback(() => {
    return token;
  }, [token]);

  return (
    <TurnstileVerification
      siteKey={siteKey}
      onSuccess={handleSuccess}
      onError={handleError}
      onExpire={handleExpire}
      className={className}
      theme={theme}
      size={size}
    />
  );
};