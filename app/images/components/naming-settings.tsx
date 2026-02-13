import React from "react";
import { Type, FileText, Hash, Percent, Image } from "lucide-react";
import type { ResizeSettings } from "./types/image";

interface NamingSettingsProps {
  resizeSettings: ResizeSettings;
  setResizeSettings: React.Dispatch<React.SetStateAction<ResizeSettings>>;
  processing: boolean;
}

const TOKEN_TOKENS = [
  {
    token: "{name}",
    label: "Name",
    icon: FileText,
    description: "Original filename",
  },
  { token: "{width}", label: "Width", icon: Hash, description: "Target width" },
  {
    token: "{height}",
    label: "Height",
    icon: Hash,
    description: "Target height",
  },
  {
    token: "{quality}",
    label: "Quality",
    icon: Percent,
    description: "Quality setting",
  },
  {
    token: "{format}",
    label: "Format",
    icon: Image,
    description: "Output format",
  },
];

export function NamingSettings({
  resizeSettings,
  setResizeSettings,
  processing,
}: NamingSettingsProps) {
  const generateFileName = (originalName: string, settings: ResizeSettings) => {
    const nameWithoutExt = originalName.split(".")[0];
    const width = settings.width ?? 1920;
    const height = settings.height ?? 1080;
    const quality = settings.quality ?? 80;
    let fileName = settings.fileNamePattern
      .replace("{name}", nameWithoutExt)
      .replace("{width}", width.toString())
      .replace("{height}", height.toString())
      .replace("{quality}", quality.toString())
      .replace("{format}", settings.format);

    if (settings.addPrefix && settings.prefix) {
      fileName = `${settings.prefix}_${fileName}`;
    }

    if (settings.addSuffix && settings.suffix) {
      fileName = `${fileName}_${settings.suffix}`;
    }

    return `${fileName}.${settings.format}`;
  };

  const insertToken = (token: string) => {
    setResizeSettings((prev) => ({
      ...prev,
      fileNamePattern: prev.fileNamePattern + token,
    }));
  };

  const clearPattern = () => {
    setResizeSettings((prev) => ({
      ...prev,
      fileNamePattern: "{name}",
    }));
  };

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Pattern
          </label>
          <button
            onClick={clearPattern}
            disabled={processing}
            className="text-[9px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-wider"
          >
            Reset
          </button>
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Type className="w-4 h-4" />
          </div>
          <input
            value={resizeSettings.fileNamePattern}
            onChange={(e) =>
              setResizeSettings((prev) => ({
                ...prev,
                fileNamePattern: e.target.value,
              }))
            }
            disabled={processing}
            placeholder="{name}"
            className="w-full h-9 pl-10 pr-3 bg-slate-50 dark:bg-brand-darker border border-slate-200 dark:border-white/10 rounded-lg font-mono text-xs dark:text-white outline-none focus:ring-2 focus:ring-brand-bright focus:border-transparent shadow-inner transition-all"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          Insert Token
        </label>
        <div className="flex flex-wrap gap-1">
          {TOKEN_TOKENS.map(({ token, label, icon: Icon }) => (
            <button
              key={token}
              onClick={() => insertToken(token)}
              disabled={processing}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-bold text-slate-600 dark:text-slate-300 hover:bg-brand-bright/10 hover:border-brand-bright/30 hover:text-brand-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <button
            onClick={() =>
              !processing &&
              setResizeSettings((prev) => ({
                ...prev,
                addPrefix: !prev.addPrefix,
              }))
            }
            className={`w-full flex items-center justify-between p-2 rounded-lg border text-[9px] font-black uppercase transition-all ${
              resizeSettings.addPrefix
                ? "bg-brand-bright border-brand-bright text-white shadow-md"
                : "bg-slate-50 dark:bg-brand-darker border-slate-200 dark:border-white/10 text-slate-400 hover:border-brand-bright/50"
            }`}
          >
            <span>Prefix</span>
            <div
              className={`w-2.5 h-2.5 rounded-sm border transition-all ${
                resizeSettings.addPrefix
                  ? "bg-white border-white"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            />
          </button>
          {resizeSettings.addPrefix && (
            <input
              value={resizeSettings.prefix}
              onChange={(e) =>
                setResizeSettings((prev) => ({
                  ...prev,
                  prefix: e.target.value,
                }))
              }
              disabled={processing}
              placeholder="myprefix"
              className="w-full h-8 px-2.5 bg-slate-50 dark:bg-brand-darker border border-slate-200 dark:border-white/10 rounded-md text-xs dark:text-white outline-none focus:ring-2 focus:ring-brand-bright focus:border-transparent font-mono"
            />
          )}
        </div>
        <div className="space-y-1.5">
          <button
            onClick={() =>
              !processing &&
              setResizeSettings((prev) => ({
                ...prev,
                addSuffix: !prev.addSuffix,
              }))
            }
            className={`w-full flex items-center justify-between p-2 rounded-lg border text-[9px] font-black uppercase transition-all ${
              resizeSettings.addSuffix
                ? "bg-brand-bright border-brand-bright text-white shadow-md"
                : "bg-slate-50 dark:bg-brand-darker border-slate-200 dark:border-white/10 text-slate-400 hover:border-brand-bright/50"
            }`}
          >
            <span>Suffix</span>
            <div
              className={`w-2.5 h-2.5 rounded-sm border transition-all ${
                resizeSettings.addSuffix
                  ? "bg-white border-white"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            />
          </button>
          {resizeSettings.addSuffix && (
            <input
              value={resizeSettings.suffix}
              onChange={(e) =>
                setResizeSettings((prev) => ({
                  ...prev,
                  suffix: e.target.value,
                }))
              }
              disabled={processing}
              placeholder="resized"
              className="w-full h-8 px-2.5 bg-slate-50 dark:bg-brand-darker border border-slate-200 dark:border-white/10 rounded-md text-xs dark:text-white outline-none focus:ring-2 focus:ring-brand-bright focus:border-transparent font-mono"
            />
          )}
        </div>
      </div>

      <div className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-bright animate-pulse" />
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Preview
          </p>
        </div>
        <p className="text-[11px] font-mono dark:text-white break-all leading-relaxed">
          {generateFileName("photo.jpg", resizeSettings)}
        </p>
      </div>
    </div>
  );
}
