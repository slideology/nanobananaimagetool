/**
 * 积分充值弹窗组件
 * 当用户积分不足时显示，提供快速充值功能
 */

import { useState, useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import { X, Sparkles } from "lucide-react";
import clsx from "clsx";

import { PRICING_TIERS, type PricingTier, type PaymentMode } from "~/constants";
import PricingSection from "./pricing-section";
import { useErrorHandler } from "~/hooks/use-error-handler";

export interface CreditRechargeModalRef {
  /** 打开弹窗 */
  open: (currentCredits?: number) => void;
  /** 关闭弹窗 */
  close: () => void;
}

export interface CreditRechargeModalProps {
  /** 购买成功回调 */
  onPurchaseSuccess?: () => void;
  /** 购买取消回调 */
  onCancel?: () => void;
}

export const CreditRechargeModal = forwardRef<CreditRechargeModalRef, CreditRechargeModalProps>(
  ({ onPurchaseSuccess, onCancel }, ref) => {
    const modalRef = useRef<HTMLDialogElement>(null);
    const [visible, setVisible] = useState(false);
    const [currentCredits, setCurrentCredits] = useState(0);
    const [purchasing, setPurchasing] = useState(false);

    // 错误处理
    const { handleError } = useErrorHandler({
      showToast: true,
      onError: (error) => {
        console.error("CreditRechargeModal Error:", {
          component: "CreditRechargeModal",
          error: {
            title: error.title,
            message: error.message,
            code: error.code,
            severity: error.severity
          },
          timestamp: new Date().toISOString()
        });
      }
    });

    useImperativeHandle(ref, () => ({
      open: (credits = 0) => {
        setCurrentCredits(credits);
        setVisible(true);
        modalRef.current?.showModal();
      },
      close: () => {
        setVisible(false);
        modalRef.current?.close();
      }
    }));

    /**
     * 处理弹窗关闭
     */
    const handleClose = useCallback(() => {
      setVisible(false);
      setPurchasing(false);
      onCancel?.();
    }, [onCancel]);

    /**
     * 处理立即购买
     */
    const handlePurchase = useCallback(async (tier: PricingTier, mode: PaymentMode) => {
      if (purchasing) return; // 幂等保护：进行中直接返回
      setPurchasing(true);

      try {
        const selectedPricing = tier.pricing[mode];

        // 在前端动态判断是否为测试环境
        const isTestEnv = typeof window !== "undefined" && (window.location.hostname.includes('test') || window.location.hostname.includes('localhost'));
        const targetProductId = isTestEnv ? (selectedPricing.test_product_id || selectedPricing.product_id) : selectedPricing.product_id;

        const res = await fetch("/api/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            product_id: targetProductId,
            price: mode === 'yearly' && selectedPricing.billedAmount ? selectedPricing.billedAmount : selectedPricing.price,
            credits: selectedPricing.credits,
            product_name: `${tier.name} Plan - ${mode === 'yearly' ? 'Yearly' : mode === 'monthly' ? 'Monthly' : 'One-Time'}`,
            type: mode,
            plan_id: mode !== 'once' ? tier.id : undefined // 订阅类型需要 plan_id
          }),
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

        const data = await res.json<{ checkout_url: string }>();

        // 在跳转前记录本地标记，用于回跳后展示成功提示
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("pendingPurchase", "1");
            localStorage.setItem("creditsBeforePurchase", String(currentCredits || 0));
          }
        } catch { }

        // 跳转到支付页面
        window.location.href = data.checkout_url;

        // 触发成功回调
        onPurchaseSuccess?.();

      } catch (error) {
        console.error('创建订单失败:', error);
        handleError(error);

        // 如果是401错误，可能需要重新登录
        if ((error as any)?.status === 401) {
          // 这里可以触发登录逻辑
          handleError({
            title: "Login Required",
            message: "Please log in first before purchasing credits",
            action: "Login",
            severity: "warning",
            code: "UNAUTHORIZED"
          });
        }
      } finally {
        setPurchasing(false);
      }
    }, [handleError, onPurchaseSuccess, purchasing, currentCredits]);

    return (
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={handleClose}
      >
        {visible && (
          <div className="modal-box w-11/12 !max-w-5xl p-0 overflow-visible relative">
            {/* Header */}
            <button
              className="absolute -top-12 right-0 btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20 z-50"
              onClick={() => modalRef.current?.close()}
            >
              <X size={24} />
            </button>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-2xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2">🎨 Credits Required to Continue Creating</h2>
                <p className="text-blue-100">
                  Current Credits: <span className="font-semibold">{currentCredits}</span>
                </p>
              </div>
            </div>

            {/* Content using PricingSection */}
            <div className="bg-base-100 rounded-b-2xl pb-6">
              <PricingSection
                title="Choose your package to get started"
                subtitle=""
                tiers={PRICING_TIERS}
                onPurchase={handlePurchase}
                loading={purchasing}
                isModal={true}
              />
            </div>
          </div>
        )}
      </dialog>
    );
  }
);

CreditRechargeModal.displayName = "CreditRechargeModal";