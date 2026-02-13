
import React from "react";
import type { ResizeSettings } from "./types/image";

interface NamingSettingsProps {
    resizeSettings: ResizeSettings;
    setResizeSettings: React.Dispatch<React.SetStateAction<ResizeSettings>>;
    processing: boolean;
}

export function NamingSettings({
    resizeSettings,
    setResizeSettings,
    processing,
}: NamingSettingsProps) {

    const generateFileName = (originalName: string, settings: ResizeSettings) => {
        const nameWithoutExt = originalName.split(".")[0];
        let fileName = settings.fileNamePattern
            .replace("{name}", nameWithoutExt)
            .replace("{width}", settings.width.toString())
            .replace("{height}", settings.height.toString())
            .replace("{quality}", settings.quality.toString())
            .replace("{format}", settings.format);

        if (settings.addPrefix && settings.prefix) {
            fileName = `${settings.prefix}_${fileName}`;
        }

        if (settings.addSuffix && settings.suffix) {
            fileName = `${fileName}_${settings.suffix}`;
        }

        return `${fileName}.${settings.format}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Pattern
                </label>
                <input
                    value={resizeSettings.fileNamePattern}
                    onChange={(e) =>
                        setResizeSettings((prev) => ({
                            ...prev,
                            fileNamePattern: e.target.value,
                        }))
                    }
                    disabled={processing}
                    placeholder="resized_{name}"
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-brand-darker border border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs dark:text-white outline-none focus:ring-1 focus:ring-brand-bright shadow-inner"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <button
                        onClick={() =>
                            !processing &&
                            setResizeSettings((prev) => ({
                                ...prev,
                                addPrefix: !prev.addPrefix,
                            }))
                        }
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-[9px] font-black uppercase transition-all ${resizeSettings.addPrefix
                            ? "bg-brand-bright border-brand-bright text-white shadow-md font-black"
                            : "bg-slate-50 dark:bg-brand-darker border-slate-200 dark:border-white/10 text-slate-400"
                            }`}
                    >
                        Prefix
                        <div
                            className={`w-2.5 h-2.5 rounded-sm border ${resizeSettings.addPrefix ? "bg-white border-white" : "border-slate-300"}`}
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
                            placeholder="prefix"
                            className="w-full h-9 px-3 bg-slate-50 dark:bg-brand-darker border border-slate-200 dark:border-white/10 rounded-lg text-xs dark:text-white outline-none focus:ring-1 focus:ring-brand-bright font-bold"
                        />
                    )}
                </div>
                <div className="space-y-2">
                    <button
                        onClick={() =>
                            !processing &&
                            setResizeSettings((prev) => ({
                                ...prev,
                                addSuffix: !prev.addSuffix,
                            }))
                        }
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-[9px] font-black uppercase transition-all ${resizeSettings.addSuffix
                            ? "bg-brand-bright border-brand-bright text-white shadow-md font-black"
                            : "bg-slate-50 dark:bg-brand-darker border-slate-200 dark:border-white/10 text-slate-400"
                            }`}
                    >
                        Suffix
                        <div
                            className={`w-2.5 h-2.5 rounded-sm border ${resizeSettings.addSuffix ? "bg-white border-white" : "border-slate-300"}`}
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
                            placeholder="suffix"
                            className="w-full h-9 px-3 bg-slate-50 dark:bg-brand-darker border border-slate-200 dark:border-white/10 rounded-lg text-xs dark:text-white outline-none focus:ring-1 focus:ring-brand-bright font-bold"
                        />
                    )}
                </div>
            </div>

            <div className="p-4 bg-brand-bright/10 rounded-xl border border-brand-bright/20">
                <p className="text-[9px] font-black text-brand-bright uppercase tracking-widest mb-1">
                    Preview
                </p>
                <p className="text-[11px] font-bold dark:text-white truncate">
                    {generateFileName("asset.jpg", resizeSettings)}
                </p>
            </div>
        </div>
    );
}
