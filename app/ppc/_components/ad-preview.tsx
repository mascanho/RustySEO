// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Monitor,
  Youtube,
  Pause,
  Play,
  Target,
  Zap,
  Grid3X3,
  LayoutList,
} from "lucide-react";
import {
  AdThumbnail,
  MobilePreview,
  SearchPreview,
  YoutubePreview,
} from "./ad-preview-examples";

import type { Ad } from "@/types/ad";

interface AdPreviewProps {
  ad: Ad | null;
  allAds: Ad[];
  onSelectAd: (ad: Ad) => void;
  isLive?: boolean;
}

export function AdPreview({ ad, allAds, onSelectAd }: AdPreviewProps) {
  // All hooks must be declared at the top
  const [currentAdIndex, setCurrentAdIndex] = useState(
    allAds.findIndex((a) => a.id === ad?.id),
  );
  const [previewType, setPreviewType] = useState<
    "search" | "youtube" | "mobile"
  >("search");
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [descriptionIndex, setDescriptionIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [viewMode, setViewMode] = useState<"single" | "grid">("single");
  const autoRotateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset indices and start auto-rotation when ad changes
  useEffect(() => {
    if (!ad || allAds.length === 0) return;

    setHeadlineIndex(0);
    setDescriptionIndex(0);

    const validHeadlines = ad.headlines.filter((h) => h.trim());
    const validDescriptions = ad.descriptions.filter((d) => d.trim());

    // Calculate max indices for cycling
    const maxHeadlineIndex = Math.max(
      0,
      Math.ceil(validHeadlines.length / 4) - 1,
    );
    const maxDescriptionIndex = Math.max(0, validDescriptions.length - 1);

    // Should auto-rotate headlines? Only if there are more than 4
    const shouldAutoRotateHeadlines = validHeadlines.length > 4;

    // Start auto-rotation of headlines and descriptions
    const startAutoRotation = () => {
      if (autoRotateTimerRef.current) {
        clearInterval(autoRotateTimerRef.current);
      }

      if (!shouldAutoRotateHeadlines && validDescriptions.length <= 1) {
        return; // No need to rotate if there aren't enough headlines/descriptions
      }

      autoRotateTimerRef.current = setInterval(() => {
        if (shouldAutoRotateHeadlines) {
          setHeadlineIndex((prev) => (prev < maxHeadlineIndex ? prev + 1 : 0));
        }

        if (validDescriptions.length > 1) {
          setDescriptionIndex((prev) =>
            prev < maxDescriptionIndex ? prev + 1 : 0,
          );
        }
      }, 3000); // Rotate every 3 seconds
    };

    if (shouldAutoRotateHeadlines) {
      startAutoRotation();
    }

    return () => {
      if (autoRotateTimerRef.current) {
        clearInterval(autoRotateTimerRef.current);
      }
    };
  }, [ad?.id]);

  // Early return only after all hooks are declared
  if (!ad || allAds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-lg font-medium dark:text-white/50">
          No ads available
        </h3>
        <p className="text-sm text-muted-foreground mt-1 dark:text-white/50">
          Create an ad to preview it here
        </p>
      </div>
    );
  }

  // Now safe to use ad and allAds since we've returned early if they're invalid
  const validHeadlines = ad.headlines
    ? (Array.isArray(ad.headlines)
        ? ad.headlines
        : typeof ad.headlines === "string"
          ? ad.headlines.split("\n")
          : []
      ).filter((h) => h.trim())
    : [];
  const validDescriptions = ad.descriptions
    ? (Array.isArray(ad.descriptions)
        ? ad.descriptions
        : typeof ad.descriptions === "string"
          ? ad.descriptions.split("\n")
          : []
      ).filter((d) => d.trim())
    : [];
  const validKeywords = ad.keywords
    ? (Array.isArray(ad.keywords)
        ? ad.keywords
        : typeof ad.keywords === "string"
          ? ad.keywords.split("\n")
          : []
      ).filter((k) => k.trim())
    : [];

  // Calculate max indices for cycling
  const maxHeadlineIndex = Math.max(
    0,
    Math.ceil(validHeadlines.length / 4) - 1,
  );
  const maxDescriptionIndex = Math.max(0, validDescriptions.length - 1);

  // Format the display URL
  const displayUrl = ad.displayPath || ad.finalUrl.replace(/^https?:\/\//, "");

  // Should auto-rotate headlines? Only if there are more than 4
  const shouldAutoRotateHeadlines = validHeadlines.length > 4;

  // Toggle auto-rotation
  const toggleAutoRotation = () => {
    if (isAutoRotating) {
      if (autoRotateTimerRef.current) {
        clearInterval(autoRotateTimerRef.current);
      }
    } else {
      startAutoRotation();
    }
    setIsAutoRotating(!isAutoRotating);
  };

  const nextAd = () => {
    const nextIndex = (currentAdIndex + 1) % allAds.length;
    setCurrentAdIndex(nextIndex);
    onSelectAd(allAds[nextIndex]);
  };

  const prevAd = () => {
    const prevIndex = (currentAdIndex - 1 + allAds.length) % allAds.length;
    setCurrentAdIndex(prevIndex);
    onSelectAd(allAds[prevIndex]);
  };

  const nextHeadlineSet = () => {
    setHeadlineIndex((prev) => (prev < maxHeadlineIndex ? prev + 1 : 0));
  };

  const prevHeadlineSet = () => {
    setHeadlineIndex((prev) => (prev > 0 ? prev - 1 : maxHeadlineIndex));
  };

  const nextDescription = () => {
    setDescriptionIndex((prev) => (prev < maxDescriptionIndex ? prev + 1 : 0));
  };

  const prevDescription = () => {
    setDescriptionIndex((prev) => (prev > 0 ? prev - 1 : maxDescriptionIndex));
  };

  // Get current headlines to display (4 at a time)
  const currentHeadlines = validHeadlines.slice(
    headlineIndex * 4,
    headlineIndex * 4 + 4,
  );

  // Get current description to display
  const currentDescription = validDescriptions[descriptionIndex] || "";

  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="w-full h-full bg-white/70 dark:bg-brand-darker/70 backdrop-blur-xl border-none rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 dark:border-white/5 max-h-full">
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between p-4 border-b border-gray-100/50 dark:border-white/5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
          <div className="flex gap-3 items-center">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                Creative Studio
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="secondary"
                  className="bg-blue-100/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none px-1.5 py-0 text-[9px] uppercase font-bold tracking-widest"
                >
                  Live
                </Badge>
                <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">
                  • {ad.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {viewMode === "single" && (
              <div className="flex bg-gray-200/50 dark:bg-brand-dark p-1 rounded-xl border border-gray-100 dark:border-white/5">
                {[
                  { id: "search", icon: Monitor, label: "Search" },
                  { id: "mobile", icon: Smartphone, label: "Mobile" },
                  { id: "youtube", icon: Youtube, label: "YouTube" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPreviewType(item.id as any)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                      previewType === item.id
                        ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-white shadow-md scale-105"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setViewMode(viewMode === "single" ? "grid" : "single")
              }
              className="rounded-xl h-9 w-9 bg-gray-100 dark:bg-brand-dark hover:bg-white dark:hover:bg-gray-700 shadow-sm border border-gray-100 dark:border-white/5"
            >
              {viewMode === "single" ? (
                <Grid3X3 className="h-4 w-4" />
              ) : (
                <LayoutList className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 border-none overflow-hidden bg-transparent flex-1 relative flex flex-col">
          {viewMode === "single" ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 p-6 md:p-10 flex items-center justify-center bg-gradient-to-b from-gray-50/50 to-transparent dark:from-brand-dark/20 border-none overflow-hidden">
                <div className="w-full h-full flex items-center justify-center transition-all duration-500 transform hover:scale-[1.01]">
                  {previewType === "search" && (
                    <SearchPreview
                      ad={ad}
                      currentHeadlines={currentHeadlines}
                      currentDescription={currentDescription}
                      displayUrl={displayUrl}
                    />
                  )}
                  {previewType === "youtube" && (
                    <YoutubePreview
                      ad={ad}
                      currentHeadlines={currentHeadlines}
                      currentDescription={currentDescription}
                      displayUrl={displayUrl}
                    />
                  )}
                  {previewType === "mobile" && (
                    <MobilePreview
                      ad={ad}
                      currentHeadlines={currentHeadlines}
                      currentDescription={currentDescription}
                      displayUrl={displayUrl}
                    />
                  )}
                </div>
              </div>

              {/* Ultra-Compact Rotator Dock */}
              <div className="flex-shrink-0 p-4 border-t border-gray-100/50 dark:border-white/5 bg-white/30 dark:bg-black/10 backdrop-blur-md">
                <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                          Headlines
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md tabular-nums">
                          {headlineIndex + 1}/{maxHeadlineIndex + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg hover:bg-white dark:hover:bg-gray-800"
                          onClick={prevHeadlineSet}
                          disabled={maxHeadlineIndex === 0}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg hover:bg-white dark:hover:bg-gray-800"
                          onClick={nextHeadlineSet}
                          disabled={maxHeadlineIndex === 0}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                        {shouldAutoRotateHeadlines && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 rounded-lg ml-0.5 ${isAutoRotating ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""}`}
                            onClick={toggleAutoRotation}
                          >
                            {isAutoRotating ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentHeadlines.map((h, i) => (
                        <div
                          key={i}
                          className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5 rounded-lg text-[11px] font-semibold text-gray-600 dark:text-gray-400 shadow-sm truncate max-w-[140px]"
                        >
                          {h || "Empty"}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex-[0.8] border-l border-gray-100 dark:border-white/5 md:pl-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                          Description
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md tabular-nums">
                          {descriptionIndex + 1}/{maxDescriptionIndex + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg hover:bg-white dark:hover:bg-gray-800"
                          onClick={prevDescription}
                          disabled={maxDescriptionIndex === 0}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg hover:bg-white dark:hover:bg-gray-800"
                          onClick={nextDescription}
                          disabled={maxDescriptionIndex === 0}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5 rounded-lg shadow-sm text-[11px] font-medium text-gray-500 dark:text-gray-400 italic line-clamp-1">
                      "{currentDescription || "No description available"}"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
              {allAds.map((adItem) => (
                <div
                  key={adItem.id}
                  className={`cursor-pointer transition-all duration-500 rounded-[2rem] p-1 h-fit ${adItem.id === ad.id ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl scale-[1.03] rotate-1" : "hover:scale-[1.02]"}`}
                  onClick={() => onSelectAd(adItem)}
                >
                  <div className="bg-white dark:bg-brand-darker rounded-[1.8rem] h-full overflow-hidden">
                    <AdThumbnail ad={adItem} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
