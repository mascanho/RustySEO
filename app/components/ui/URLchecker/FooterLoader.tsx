// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useLoaderStore from "@/store/loadersStore";
import { useVisibilityStore } from "@/store/VisibilityStore";

interface FooterLoaderProps {
  loaderName?: string;
  featureName?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

const FooterLoader = ({
  loaderName = "httpChecker",
  featureName = "HTTP Checker running in the background",
  description = "HTTP requests are being monitored.",
  size = "md",
  className,
  showLabel = true,
}: FooterLoaderProps) => {
  const { loaders, toggleLoader } = useLoaderStore();
  const { showUrlChecker } = useVisibilityStore();
  const [isFlashing, setIsFlashing] = useState(false);

  const isActive = loaders[loaderName] || false;

  // Control the flashing animation
  useEffect(() => {
    if (!isActive) {
      setIsFlashing(false);
      return;
    }

    // Start flashing animation
    const interval = setInterval(() => {
      setIsFlashing((prev) => !prev);
    }, 500); // Flash every 500ms

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={showUrlChecker}
            className="flex items-center space-x-3 px-3 py-1 bg-white/40 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10 ml-4 backdrop-blur-sm transition-all hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer active:scale-95"
          >
            {/* Status Dot */}
            <div className="relative flex items-center justify-center">
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-500",
                  isActive
                    ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                    : "bg-gray-300 dark:bg-gray-600"
                )}
              />
              {isActive && (
                <div className="absolute h-2 w-2 rounded-full bg-red-400/50 animate-ping" />
              )}
            </div>

            {/* Label */}
            <div className="flex flex-col -space-y-0.5">
              <span className="text-[8px] uppercase font-bold text-gray-400 dark:text-white/40 tracking-widest leading-none">
                Background Engine
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold tracking-tight transition-colors leading-none",
                  isActive ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-500",
                )}
              >
                HTTP MONITOR
              </span>
            </div>
          </div>
        </TooltipTrigger>

        {/* Tooltip content shown on hover */}
        <TooltipContent
          side="top"
          align="center"
          className="bg-brand-dark/95 backdrop-blur-md text-white border-brand-dark shadow-2xl p-3"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{featureName}</p>
              <div
                className={cn(
                  "h-2 w-2 rounded-full ml-2",
                  isActive ? "bg-red-500 animate-pulse" : "bg-gray-500",
                )}
              />
            </div>
            <p className="text-sm text-gray-300">{description}</p>
            <div className="pt-1 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                Status:{" "}
                <span className={isActive ? "text-red-400" : "text-gray-400"}>
                  {isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider >
  );
};

export default FooterLoader;
