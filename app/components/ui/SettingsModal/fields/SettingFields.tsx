// @ts-nocheck
"use client";

import React from "react";
import { AppSettings } from "../useSettings";

interface SettingFieldProps {
    label: string;
    description?: string;
    children: React.ReactNode;
}

export const SettingField = ({
    label,
    description,
    children,
}: SettingFieldProps) => (
    <div className="flex items-center justify-between py-2.5 px-1 group">
        <div className="flex-1 mr-4">
            <span className="text-[12.5px] font-semibold text-gray-700 dark:text-gray-200 leading-tight">
                {label}
            </span>
            {description && (
                <p className="text-[10.5px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                    {description}
                </p>
            )}
        </div>
        <div className="flex-shrink-0">{children}</div>
    </div>
);

interface NumberInputProps {
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    width?: string;
}

export const NumberInput = ({
    value,
    onChange,
    min = 0,
    max = 99999999,
    step = 1,
    unit,
    width = "w-[90px]",
}: NumberInputProps) => (
    <div className="flex items-center gap-1.5">
        <input
            type="number"
            value={value}
            onChange={(e) => {
                const v = step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= min && v <= max) onChange(v);
            }}
            min={min}
            max={max}
            step={step}
            className={`${width} h-[30px] px-2 text-[12px] font-mono rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-bright/50 focus:border-brand-bright/50 transition-all text-right`}
        />
        {unit && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono min-w-[18px]">
                {unit}
            </span>
        )}
    </div>
);

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (val: boolean) => void;
}

export const ToggleSwitch = ({ checked, onChange }: ToggleSwitchProps) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-bright/30 ring-offset-1 ring-offset-transparent ${checked
                ? "bg-brand-bright"
                : "bg-gray-200 dark:bg-white/10"
            }`}
    >
        <span
            className={`inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${checked ? "translate-x-[20px]" : "translate-x-[3px]"
                }`}
        />
    </button>
);

interface SectionHeaderProps {
    title: string;
    icon?: React.ReactNode;
}

export const SectionHeader = ({ title, icon }: SectionHeaderProps) => (
    <div className="flex items-center gap-2 pt-3 pb-1.5 mb-1 border-b border-gray-100 dark:border-white/5">
        {icon && (
            <span className="text-brand-bright/80">{icon}</span>
        )}
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {title}
        </span>
    </div>
);
