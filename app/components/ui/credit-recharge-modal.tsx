/**
 * 积分充值弹窗组件
 * 当用户积分不足时显示，提供快速充值功能
 */

import { useState, useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import { X, CreditCard, Zap, Shield, Sparkles } from "lucide-react";
import clsx from "clsx";

import type { PRODUCT } from "~/.server/constants/product";
import { useErrorHandler } from "~/hooks/use-error-handler";

export interface CreditRechargeModalRef {
  /** 打开弹窗 */
  open: (currentCredits?: number) => void;
  /** 关闭弹窗 */
  close: () => void;
}

export interface CreditRechargeModalProps {
  /** 产品配置信息 */
  product: PRODUCT;
  /** 购买成功回调 */
  onPurchaseSuccess?: () => void;
  /** 购买取消回调 */
  onCancel?: () => void;
}

export const CreditRechargeModal = forwardRef<CreditRechargeModalRef, CreditRechargeModalProps>(
  ({ product, onPurchaseSuccess, onCancel }, ref) => {
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
    const handlePurchase = useCallback(async () => {
      if (purchasing) return; // 幂等保护：进行中直接返回
      setPurchasing(true);

      try {
        const res = await fetch("/api/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            product_id: product.product_id,
            price: product.price,
            credits: product.credits,
            product_name: product.product_name,
            type: product.type
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
        } catch {}
        
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
    }, [product, handleError, onPurchaseSuccess, purchasing]);

    return (
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={handleClose}
      >
        {visible && (
          <div className="modal-box max-w-md w-full p-0 overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <button
                className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
                onClick={() => modalRef.current?.close()}
              >
                <X size={20} />
              </button>
              
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

            {/* Content */}
            <div className="p-6">
              {/* 推荐充值套餐 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">💳 Recommended Recharge Package</h3>
                
                <div className="border-2 border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
                  {/* 推荐标签 */}
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Recommended
                  </div>
                  
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-gray-800 flex items-center">
                        🍌 Nano Banana Credits Package
                      </h4>
                      <div className="flex items-baseline mt-1">
                        <span className="text-2xl font-bold text-blue-600">${product.price}</span>
                        <span className="text-gray-500 ml-2">({product.credits} Credits)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Average per Credit</div>
                      <div className="font-semibold text-green-600">
                        ${(product.price / product.credits).toFixed(3)}
                      </div>
                    </div>
                  </div>

                  {/* 功能特性 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <Zap size={16} className="mr-2 text-yellow-500" />
                      <span>Can generate {product.credits} AI images</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <CreditCard size={16} className="mr-2 text-blue-500" />
                      <span>Supports text-to-image and image-to-image generation</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <Shield size={16} className="mr-2 text-green-500" />
                      <span>High-quality output • Never expires</span>
                    </div>
                  </div>

                  {/* 购买按钮 */}
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className={clsx(
                      "w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2",
                      purchasing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    )}
                  >
                    {purchasing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={20} />
                        <span>Buy Now ${product.price}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 温馨提示 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-amber-600 text-sm">💡</span>
                    </div>
                  </div>
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Reminder</p>
                    <p>After purchase, credits will be automatically added to your account. Credits never expire and are always available.</p>
                  </div>
                </div>
              </div>

              {/* 底部按钮 */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => modalRef.current?.close()}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    );
  }
);

CreditRechargeModal.displayName = "CreditRechargeModal";