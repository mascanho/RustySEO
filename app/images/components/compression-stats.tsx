// @ts-nocheck
"use client";

import { TrendingDown, Info, Zap } from "lucide-react";
import type { ImageFile } from "./types/image";

interface CompressionStatsProps {
  images: ImageFile[];
}

export function CompressionStats({ images }: CompressionStatsProps) {
  const completedImages = images.filter((img) => img.status === "completed");

  if (completedImages.length === 0) {
    return (
      <div className="bg-white dark:bg-brand-darker rounded-2xl p-4 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-3 shadow-md">
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5">
          <Info className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic text-center">
          Metrics pending processing
        </p>
      </div>
    );
  }

  const originalTotal = completedImages.reduce(
    (acc, img) => acc + img.originalSize,
    0,
  );
  const processedTotal = completedImages.reduce(
    (acc, img) => acc + (img.processedSize || 0),
    0,
  );
  const totalSaved = originalTotal - processedTotal;
  const reductionPercentage = ((totalSaved / originalTotal) * 100).toFixed(1);

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    return (
      (bytes < 0 ? "-" : "") +
      Number.parseFloat((Math.abs(bytes) / Math.pow(k, i)).toFixed(1)) +
      " " +
      sizes[i]
    );
  };

  const stats = [
    {
      label: "Optimization",
      value: `${reductionPercentage}%`,
      sub: "Net Reduction",
      icon: TrendingDown,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Relieved",
      value: formatSize(totalSaved),
      sub: "Storage Saved",
      icon: Zap,
      color: "text-brand-bright",
      bg: "bg-brand-bright/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 ">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white dark:bg-brand-darker rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-md flex items-center gap-4 group hover:border-brand-bright transition-all duration-300"
        >
          <div
            className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:rotate-12`}
          >
            <stat.icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              {stat.label}
            </p>
            <h4 className="text-base font-black dark:text-white leading-none mb-1">
              {stat.value}
            </h4>
            <p className="text-[9px] font-bold text-slate-400 italic">
              {stat.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
