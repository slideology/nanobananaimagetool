/**
 * 付费模式切换器组件
 * 3段式 Pill 样式切换器：年付（节省50%）| 月付 | 一次性购买
 */

import { useState } from "react";
import clsx from "clsx";
import type { PaymentMode } from "~/.server/constants/product";

export interface PaymentModeToggleProps {
    value: PaymentMode;
    onChange: (mode: PaymentMode) => void;
}

const MODE_OPTIONS: Array<{ value: PaymentMode; label: string }> = [
    { value: "yearly", label: "Year (Save 50%)" },
    { value: "monthly", label: "Subscription" },
    { value: "once", label: "One-Time" }
];

export default function PaymentModeToggle({ value, onChange }: PaymentModeToggleProps) {
    return (
        <div className="flex justify-center mb-8 md:mb-12">
            <div className="inline-flex bg-gray-100 rounded-full p-1 gap-1">
                {MODE_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={clsx(
                            "px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm md:text-base font-medium transition-all duration-200",
                            value === option.value
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
