/**
 * 免费方案横幅组件
 * 显示在定价卡片下方的全宽横幅样式
 */

import { Check } from "lucide-react";

export interface FreePlanBannerProps {
    onStartFree: () => void;
}

export default function FreePlanBanner({ onStartFree }: FreePlanBannerProps) {
    return (
        <div className="mt-8 md:mt-12 w-full max-w-5xl mx-auto">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    {/* Left: Plan Info */}
                    <div className="flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                            Free
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            For personal use only with limited features and support
                        </p>

                        {/* Features */}
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <Check size={16} className="text-purple-600" />
                                <span>3 Free Trial Credits</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <Check size={16} className="text-purple-600" />
                                <span>Basic Image Generation</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <Check size={16} className="text-purple-600" />
                                <span>Standard Response Time</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <Check size={16} className="text-purple-600" />
                                <span>Community Support</span>
                            </li>
                        </ul>
                    </div>

                    {/* Right: Price & Button */}
                    <div className="flex flex-col items-start md:items-end gap-4">
                        <div className="text-4xl md:text-5xl font-bold text-gray-900">
                            $0
                        </div>
                        <button
                            onClick={onStartFree}
                            className="px-8 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-full font-semibold hover:border-gray-400 hover:shadow-md transition-all duration-200"
                        >
                            Start Free
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
