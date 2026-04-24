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
  <div className="flex items-center justify-between py-2 px-1 group max-w-lg">
    <div className="flex-1 mr-4 min-w-0">
      <span className="text-[12.5px] font-semibold text-gray-700 dark:text-gray-200 leading-tight block truncate">
        {label}
      </span>
      {description && (
        <p className="text-[10.5px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug truncate">
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
        const v =
          step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
        if (!isNaN(v) && v >= min && v <= max) onChange(v);
      }}
      min={min}
      max={max}
      step={step}
      className={`${width} h-7 px-2 text-[12px] font-mono rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-bright/50 focus:border-brand-bright/50 transition-all text-right`}
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
    className={`relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-bright/30 ring-offset-1 ring-offset-transparent ${
      checked ? "bg-brand-bright" : "bg-gray-200 dark:bg-white/10"
    }`}
  >
    <span
      className={`inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
        checked ? "translate-x-[20px]" : "translate-x-[3px]"
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
    {icon && <span className="text-brand-bright/80">{icon}</span>}
    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
      {title}
    </span>
  </div>
);

interface ArrayInputProps {
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

export const ArrayInput = ({
  value,
  onChange,
  placeholder = "Add item",
  suggestions = [],
}: ArrayInputProps) => {
  const [text, setText] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleAdd = () => {
    if (text.trim() && !value.includes(text.trim())) {
      onChange([...value, text.trim()]);
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addSuggestion = (suggestion: string) => {
    if (!value.includes(suggestion)) {
      onChange([...value, suggestion]);
    }
    setShowSuggestions(false);
    setText("");
  };

  const availableSuggestions = suggestions.filter(
    (s) => !value.includes(s) && s.toLowerCase().includes(text.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-1 w-full overflow-hidden">
      {/* Input Row */}
      <div className="flex items-center gap-1.5 w-full">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              text && setShowSuggestions(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            placeholder={value.length === 0 ? placeholder : ""}
            className="w-full h-7 px-2.5 text-[11px] rounded-md border border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-1.5 focus:ring-brand-bright focus:border-brand-bright transition-all"
          />

          {/* Inline Suggestions Dropdown */}
          {showSuggestions && availableSuggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 p-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/20 shadow-lg max-h-[140px] overflow-y-auto">
              {availableSuggestions.slice(0, 8).map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addSuggestion(suggestion)}
                  className="w-full px-2 py-1 text-left text-[11px] rounded hover:bg-brand-bright/10 hover:text-brand-bright text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!text.trim()}
          className="h-7 px-2.5 shrink-0 rounded-md bg-brand-bright text-white text-[10px] font-semibold uppercase tracking-wide hover:bg-brand-bright/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          + Add
        </button>
      </div>

      {/* Selected Chips - wrapped, no overflow */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 w-full overflow-hidden">
          {value.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-brand-bright/10 dark:bg-brand-bright/20 rounded px-1.5 py-0.5 border border-brand-bright/30 group hover:bg-brand-bright/20 transition-colors shrink-0"
            >
              <span className="text-[10px] text-brand-bright font-medium whitespace-nowrap">
                {item}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-brand-bright/50 hover:text-white hover:bg-red-500 rounded p-0.5 transition-all shrink-0"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State Hint */}
      {value.length === 0 && (
        <p className="text-[9px] text-gray-400 dark:text-gray-500">
          {isFocused
            ? "Choose from suggestions or type a custom name"
            : "Start typing to see suggestions"}
        </p>
      )}
    </div>
  );
};
