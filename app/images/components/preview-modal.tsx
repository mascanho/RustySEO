// @ts-nocheck
"use client";

import { useState } from "react";
import { ArrowLeftRight, Download, X } from "lucide-react";
import type { ImageFile, ResizeSettings } from "./types/image";

interface PreviewModalProps {
  previewImage: ImageFile | null;
  setPreviewImage: (image: ImageFile | null) => void;
  resizeSettings: ResizeSettings;
  onDownload: (image: ImageFile) => void;
}

export function PreviewModal({
  previewImage,
  setPreviewImage,
  resizeSettings,
  onDownload,
}: PreviewModalProps) {
  const [previewMode, setPreviewMode] = useState<
    "side-by-side" | "before" | "after"
  >("side-by-side");

  if (!previewImage) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const processedUrl = previewImage.processedBlob
    ? URL.createObjectURL(previewImage.processedBlob)
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-brand-darker w-full max-w-6xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/10">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-black/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-bright">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-black dark:text-white truncate max-w-md uppercase tracking-tight">
              {previewImage.file.name}
            </h2>
          </div>
          <button
            onClick={() => setPreviewImage(null)}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-brand-dark transition-colors text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-brand-darker">
          <div className="space-y-8">
            {previewImage.status === "completed" && (
              <div className="space-y-6">
                {/* Custom Tabs */}
                <div className="flex p-1 bg-slate-100 dark:bg-black p-1.5 rounded-[1.25rem] w-full max-w-md mx-auto border border-slate-200 dark:border-white/10">
                  {[
                    { id: "side-by-side", label: "Comparison", icon: ArrowLeftRight },
                    { id: "before", label: "Original" },
                    { id: "after", label: "Optimized" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setPreviewMode(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl border ${previewMode === tab.id
                        ? "bg-white dark:bg-brand-dark text-brand-bright shadow-xl border-slate-100 dark:border-white/10"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-white border-transparent"
                        }`}
                    >
                      {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {previewMode === "side-by-side" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center italic">Source Asset</p>
                      <div className="aspect-video bg-slate-50 dark:bg-black/40 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 flex items-center justify-center p-6 shadow-inner">
                        <img
                          src={previewImage.preview}
                          alt="Original"
                          className="max-w-full max-h-full object-contain shadow-2xl rounded-xl border border-white/10"
                        />
                      </div>
                      <div className="p-5 bg-slate-50 dark:bg-black/40 rounded-2xl flex justify-around border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mass</p>
                          <p className="text-sm font-black dark:text-white">{formatFileSize(previewImage.originalSize)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Canvas</p>
                          <p className="text-sm font-black dark:text-white">{previewImage.originalDimensions?.width}×{previewImage.originalDimensions?.height}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-brand-bright uppercase tracking-[0.2em] text-center italic">Optimized Target</p>
                      <div className="aspect-video bg-brand-bright/5 dark:bg-brand-bright/10 rounded-3xl overflow-hidden border border-brand-bright/20 dark:border-brand-bright/20 flex items-center justify-center p-6 shadow-inner">
                        <img
                          src={processedUrl}
                          alt="Processed"
                          className="max-w-full max-h-full object-contain shadow-2xl rounded-xl border border-white/10"
                        />
                      </div>
                      <div className="p-5 bg-brand-bright/10 rounded-2xl flex justify-around border border-brand-bright/20 shadow-sm shadow-brand-bright/5">
                        <div className="text-center">
                          <p className="text-[9px] font-black text-brand-bright uppercase tracking-widest mb-1">New Mass</p>
                          <p className="text-sm font-black dark:text-white">{formatFileSize(previewImage.processedSize || 0)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-black text-brand-bright uppercase tracking-widest mb-1">Resolution</p>
                          <p className="text-sm font-black dark:text-white">{previewImage.processedDimensions?.width}×{previewImage.processedDimensions?.height}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(previewMode === "before" || previewMode === "after") && (
                  <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                    <div className="w-full max-w-4xl bg-slate-50 dark:bg-black/40 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/10 flex items-center justify-center p-10 shadow-inner">
                      <img
                        src={previewMode === "before" ? previewImage.preview : processedUrl}
                        alt="Preview"
                        className="max-w-full max-h-[50vh] object-contain shadow-2xl rounded-2xl border border-white/5"
                      />
                    </div>
                    <div className="px-10 py-5 bg-slate-50 dark:bg-black/60 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 flex gap-16">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Mass</p>
                        <p className="text-2xl font-black dark:text-white">
                          {formatFileSize(previewMode === "before" ? previewImage.originalSize : (previewImage.processedSize || 0))}
                        </p>
                      </div>
                      <div className="text-center border-l border-slate-200 dark:border-white/10 pl-16">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Canvas Resolution</p>
                        <p className="text-2xl font-black dark:text-white">
                          {previewMode === "before"
                            ? `${previewImage.originalDimensions?.width}×${previewImage.originalDimensions?.height}`
                            : `${previewImage.processedDimensions?.width}×${previewImage.processedDimensions?.height}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {previewImage.status !== "completed" && (
              <div className="flex flex-col items-center gap-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center italic">Source Preview</p>
                <div className="w-full max-w-4xl bg-slate-50 dark:bg-black/40 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/10 flex items-center justify-center p-10 shadow-inner">
                  <img
                    src={previewImage.preview}
                    alt="Original"
                    className="max-w-full max-h-[50vh] object-contain shadow-2xl rounded-2xl border border-white/5"
                  />
                </div>
                <div className="px-10 py-5 bg-slate-50 dark:bg-black/60 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 flex gap-16">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Mass</p>
                    <p className="text-2xl font-black dark:text-white">{formatFileSize(previewImage.originalSize)}</p>
                  </div>
                  <div className="text-center border-l border-slate-200 dark:border-white/10 pl-16">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resolution</p>
                    <p className="text-2xl font-black dark:text-white">
                      {previewImage.originalDimensions?.width}×{previewImage.originalDimensions?.height}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        {previewImage.status === "completed" && (
          <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/60 flex justify-end">
            <button
              onClick={() => onDownload(previewImage)}
              className="h-14 px-10 bg-brand-bright hover:bg-brand-bright/90 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-3 transition-all shadow-xl shadow-brand-bright/40 active:scale-[0.98] border border-brand-bright"
            >
              <Download className="w-5 h-5" />
              Export Optimised Asset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
