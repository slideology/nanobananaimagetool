import { useEffect, useRef } from "react";

interface ThirdPartyAdProps {
  adId: string;
  className?: string;
}

/**
 * 第三方广告位组件
 * 用于显示第三方广告网络的广告内容
 */
export function ThirdPartyAd({ adId, className = "" }: ThirdPartyAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 确保只在生产环境加载广告
    if (!import.meta.env.PROD) return;
    
    // 确保容器存在
    if (!containerRef.current) return;

    // 清空容器内容
    containerRef.current.innerHTML = "";

    // 检查全局广告脚本是否已加载
    if (typeof window !== "undefined" && (window as any).AdProvider) {
      try {
        // 调用广告提供商的初始化函数
        (window as any).AdProvider.renderAd(adId);
      } catch (error) {
        console.warn("Failed to load third-party ad:", error);
      }
    }
  }, [adId]);

  return (
    <div
      ref={containerRef}
      id={`container-${adId}`}
      className={`third-party-ad-container ${className}`}
      style={{
        minHeight: "90px", // 最小高度，防止布局跳动
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "1rem 0",
      }}
    >
      {/* 加载指示器或占位符 */}
      {!import.meta.env.PROD && (
        <div className="text-sm text-gray-400 p-4 border border-dashed border-gray-300 rounded">
          [第三方广告位 - 仅在生产环境显示]
        </div>
      )}
    </div>
  );
}

export default ThirdPartyAd;
