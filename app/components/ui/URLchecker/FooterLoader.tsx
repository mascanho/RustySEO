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

  // Size configurations
  const sizeClasses = {
    md: "h-3 w-3",
  };

  const textSizes = {
    sm: "text-xs",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="m-auto flex items-center gap-2 cursor-pointer select-none ">
            {/* Flashing indicator - maintains your original styling */}
            <div
              className={cn(
                "rounded-full flex items-center m-auto transition-all duration-300  text-xs",
                sizeClasses[size],
                className,
                isActive
                  ? isFlashing
                    ? "bg-red-500 ring-4 ring-red-500/30 text-xs"
                    : "bg-red-500 text-xs"
                  : "bg-white",
                isActive && "animate-pulse",
              )}
            />

            {/* Feature name with conditional styling */}
            {showLabel && (
              <span
                className={cn(
                  "font-medium transition-colors",
                  textSizes[size],
                  isActive ? "text-red-600" : "text-gray-400",
                )}
              >
                {featureName}
              </span>
            )}

            {/* Info icon - only show when active */}
          </div>
        </TooltipTrigger>

        {/* Tooltip content shown on hover */}
        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs bg-gray-900 text-white border border-gray-700"
        >
          <div className="space-y-2 p-1">
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
    </TooltipProvider>
  );
};

export default FooterLoader;
