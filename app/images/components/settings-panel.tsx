// @ts-nocheck
"use client";

import React, { useState } from "react";
import {
  Settings,
  Zap,
  FileImage,
  Monitor,
  Smartphone,
  Camera,
} from "lucide-react";
import type { ResizeSettings, ImageFile } from "./types/image";

const PRESETS = {
  web: {
    width: 1920,
    height: 1080,
    quality: 85,
    format: "jpeg",
    name: "Web (1920×1080)",
    icon: Monitor,
  },
  social: {
    width: 1080,
    height: 1080,
    quality: 90,
    format: "jpeg",
    name: "Social (1080×1080)",
    icon: Smartphone,
  },
  thumbnail: {
    width: 400,
    height: 400,
    quality: 80,
    format: "jpeg",
    name: "Thumbnail (400×400)",
    icon: FileImage,
  },
  print: {
    width: 3000,
    height: 2000,
    quality: 95,
    format: "png",
    name: "Print (3000×2000)",
    icon: Camera,
  },
};

const QUALITY_PRESETS = {
  low: { quality: 60, name: "Low" },
  medium: { quality: 80, name: "Medium" },
  high: { quality: 90, name: "High" },
  maximum: { quality: 95, name: "Maximum" },
};

interface SettingsPanelProps {
  resizeSettings: ResizeSettings;
  setResizeSettings: React.Dispatch<React.SetStateAction<ResizeSettings>>;
  images: ImageFile[];
  processing: boolean;
  onProcessImages: () => void;
  isEmbedded?: boolean;
}

export function SettingsPanel({
  resizeSettings,
  setResizeSettings,
  images,
  processing,
  onProcessImages,
  isEmbedded = false,
}: SettingsPanelProps) {

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setResizeSettings((prev) => ({
      ...prev,
      width: preset.width,
      height: preset.height,
      quality: preset.quality,
      format: preset.format,
    }));
  };

  const applyQualityPreset = (presetKey: keyof typeof QUALITY_PRESETS) => {
    const preset = QUALITY_PRESETS[presetKey];
    setResizeSettings((prev) => ({
      ...prev,
      quality: preset.quality,
    }));
  };

  const isPresetActive = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    return (
      resizeSettings.width === preset.width &&
      resizeSettings.height === preset.height &&
      resizeSettings.quality === preset.quality &&
      resizeSettings.format === preset.format
    );
  };

  const isQualityPresetActive = (presetKey: keyof typeof QUALITY_PRESETS) => {
    const preset = QUALITY_PRESETS[presetKey];
    return resizeSettings.quality === preset.quality;
  };

  const containerClasses = isEmbedded
    ? "flex flex-col h-full bg-white dark:bg-brand-darker overflow-hidden"
    : "flex flex-col h-full bg-white dark:bg-brand-darker rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl";

  return (
    <div className={containerClasses}>
      {!isEmbedded && (
        <div className="pb-4 pt-5 px-6 border-b border-slate-100 dark:border-white/10 flex-shrink-0 bg-white dark:bg-brand-darker">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black dark:text-white flex items-center gap-2 uppercase tracking-tight">
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5">
                <Settings className="w-4 h-4 text-sky-500" />
              </div>
              Engine Config
            </h2>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-brand-darker">

        <div
          className={`flex-1 ${isEmbedded ? "" : ""} overflow-y-auto min-h-0 p-5 pt-4 space-y-8 custom-scrollbar`}
        >
          {/* PRESETS SECTION */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Global Presets
                </label>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => {
                  const IconComponent = preset.icon;
                  const isActive = isPresetActive(
                    key as keyof typeof PRESETS,
                  );
                  return (
                    <button
                      key={key}
                      onClick={() => applyPreset(key as keyof typeof PRESETS)}
                      disabled={processing}
                      className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border text-left ${isActive
                        ? "bg-sky-500 border-sky-600 shadow-lg shadow-sky-500/20"
                        : "bg-slate-50 dark:bg-brand-darker border-slate-200 dark:border-white/5 hover:border-sky-300"
                        }`}
                    >
                      <div
                        className={`p-2 rounded-lg transition-colors ${isActive
                          ? "bg-white/20"
                          : "bg-white dark:bg-brand-dark group-hover:bg-sky-50 border border-slate-100 dark:border-white/5"
                          }`}
                      >
                        <IconComponent
                          className={`w-4 h-4 ${isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-sky-500"
                            }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div
                          className={`text-xs font-black ${isActive ? "text-white" : "dark:text-white"}`}
                        >
                          {preset.name}
                        </div>
                        <div
                          className={`text-[9px] font-bold ${isActive ? "text-white/70" : "text-slate-400"}`}
                        >
                          {preset.quality}% Optim •{" "}
                          {preset.format.toUpperCase()}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-bright" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Directives
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(QUALITY_PRESETS).map(([key, preset]) => {
                  const isActive = isQualityPresetActive(
                    key as keyof typeof QUALITY_PRESETS,
                  );
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        applyQualityPreset(
                          key as keyof typeof QUALITY_PRESETS,
                        )
                      }
                      disabled={processing}
                      className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${isActive
                        ? "bg-brand-bright border-sky-600 text-white shadow-md font-black"
                        : "bg-slate-50 dark:bg-brand-darker border-slate-200 dark:border-white/10 hover:border-sky-300 dark:text-slate-400"
                        }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CUSTOM SETTINGS SECTION */}
          <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-sky-500" />
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Custom Parameters
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Width
                </label>
                <input
                  type="number"
                  value={resizeSettings.width}
                  onChange={(e) =>
                    setResizeSettings((prev) => ({
                      ...prev,
                      width: parseInt(e.target.value) || 0,
                    }))
                  }
                  disabled={processing}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-brand-darker border border-slate-200 dark:border-white/10 rounded-xl font-black focus:ring-1 focus:ring-sky-500 outline-none text-xs dark:text-white transition-all shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Height
                </label>
                <input
                  type="number"
                  value={resizeSettings.height}
                  onChange={(e) =>
                    setResizeSettings((prev) => ({
                      ...prev,
                      height: parseInt(e.target.value) || 0,
                    }))
                  }
                  disabled={processing}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-brand-darker border border-slate-200 dark:border-white/10 rounded-xl font-black focus:ring-1 focus:ring-sky-500 outline-none text-xs dark:text-white transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Quality
                </label>
                <span className="text-xs font-black text-sky-500">
                  {resizeSettings.quality}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={resizeSettings.quality}
                onChange={(e) =>
                  setResizeSettings((prev) => ({
                    ...prev,
                    quality: parseInt(e.target.value) || 80,
                  }))
                }
                disabled={processing}
                className="w-full accent-sky-500 h-2 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Format
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10">
                {["jpeg", "png", "webp"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() =>
                      setResizeSettings((prev) => ({ ...prev, format: fmt }))
                    }
                    disabled={processing}
                    className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${resizeSettings.format === fmt
                      ? "bg-white dark:bg-brand-dark text-sky-500 shadow-md border border-slate-100 dark:border-white/5"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div
              onClick={() =>
                !processing &&
                setResizeSettings((prev) => ({
                  ...prev,
                  maintainAspectRatio: !prev.maintainAspectRatio,
                }))
              }
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-brand-darker border border-slate-200 dark:border-white/10 cursor-pointer hover:border-sky-500 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Smartphone
                  className={`w-3.5 h-3.5 ${resizeSettings.maintainAspectRatio ? "text-sky-500" : "text-slate-400"}`}
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Lock Aspect
                </span>
              </div>
              <div
                className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${resizeSettings.maintainAspectRatio
                  ? "bg-sky-500"
                  : "bg-slate-300 dark:bg-white/20"
                  }`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 ${resizeSettings.maintainAspectRatio
                    ? "left-4.5"
                    : "left-0.5"
                    }`}
                />
              </div>
            </div>
          </div>

        </div>

        <div className="p-4 pt-2 border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/60 flex-shrink-0">
          <button
            onClick={onProcessImages}
            disabled={images.length === 0 || processing}
            className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-black uppercase tracking-widest text-[10px] relative overflow-hidden group shadow-lg ${images.length === 0 || processing
              ? "bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-white/10"
              : "bg-sky-500 text-white hover:bg-sky-600 hover:shadow-sky-500/40 active:scale-[0.98] border border-sky-600"
              }`}
          >
            {processing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Streaming...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 group-hover:animate-bounce" />
                Initialize Engine ({images.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
