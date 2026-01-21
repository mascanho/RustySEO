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
  DisplayPreview,
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
    "search" | "youtube" | "mobile" | "display"
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
    setCurrentAdIndex(allAds.findIndex((a) => a.id === ad?.id));

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
      <Card className="w-full h-full bg-white/70 dark:bg-brand-darker/70 backdrop-blur-xl border-none rounded-2xl shadow-xl overflow-hidden flex flex-col border border-white/20 dark:border-white/5 max-h-full">
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between p-3 border-b border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-brand-dark/20">
          <div className="flex gap-2.5 items-center">
            <div className="p-1.5 bg-blue-600 rounded-lg shadow-sm">
              <Monitor className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
                Creative Studio
              </CardTitle>
              <div className="flex items-center gap-2 mt-0">
                <Badge
                  variant="secondary"
                  className="bg-blue-100/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none px-1.5 py-0 text-[8px] uppercase font-bold tracking-wider shrink-0"
                >
                  Live
                </Badge>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-muted-foreground font-bold truncate max-w-[120px]">
                    {ad.name}
                  </span>
                  <span className="text-[9px] font-black text-gray-400/80 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full tabular-nums">
                    AD {currentAdIndex + 1} OF {allAds.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "single" && (
              <div className="flex bg-gray-100 dark:bg-brand-dark p-0.5 rounded-lg border border-gray-200 dark:border-white/5">
                {[
                  { id: "search", icon: Monitor, label: "Search" },
                  { id: "display", icon: Target, label: "Display" },
                  { id: "mobile", icon: Smartphone, label: "Mobile" },
                  { id: "youtube", icon: Youtube, label: "YouTube" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPreviewType(item.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all duration-200 ${previewType === item.id
                      ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                  >
                    <item.icon className="h-3 w-3" />
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
              className="rounded-lg h-7 w-7 bg-gray-100 dark:bg-brand-dark hover:bg-white dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-white/5"
            >
              {viewMode === "single" ? (
                <Grid3X3 className="h-3.5 w-3.5" />
              ) : (
                <LayoutList className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 border-none flex-1 relative flex flex-col group/container overflow-hidden">
          {/* Main Carousel Controls */}
          <div className="absolute inset-y-0 left-4 z-40 flex items-center pointer-events-none">
            <Button
              variant="outline"
              size="icon"
              onClick={prevAd}
              disabled={allAds.length <= 1}
              className="h-12 w-12 rounded-full bg-white/80 dark:bg-brand-darker/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl opacity-0 group-hover/container:opacity-100 pointer-events-auto transition-all duration-300 -translate-x-4 group-hover/container:translate-x-0 disabled:hidden hover:scale-110 active:scale-95 text-blue-600 dark:text-blue-400"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </div>
          <div className="absolute inset-y-0 right-4 z-40 flex items-center pointer-events-none">
            <Button
              variant="outline"
              size="icon"
              onClick={nextAd}
              disabled={allAds.length <= 1}
              className="h-12 w-12 rounded-full bg-white/80 dark:bg-brand-darker/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl opacity-0 group-hover/container:opacity-100 pointer-events-auto transition-all duration-300 translate-x-4 group-hover/container:translate-x-0 disabled:hidden hover:scale-110 active:scale-95 text-blue-600 dark:text-blue-400"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {viewMode === "single" ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 p-4 md:p-12 flex items-center justify-center bg-gray-50/50 dark:bg-brand-dark/10 border-none overflow-hidden relative">
                <div className="w-full h-full flex items-center justify-center transition-all duration-300 transform">
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
                  {previewType === "display" && (
                    <DisplayPreview
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
            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto">
              {allAds.map((adItem) => (
                <div
                  key={adItem.id}
                  className={`cursor-pointer transition-all duration-300 rounded-xl p-0.5 h-fit ${adItem.id === ad.id ? "bg-blue-500 shadow-lg scale-[1.02]" : "hover:scale-[1.01]"}`}
                  onClick={() => onSelectAd(adItem)}
                >
                  <div className="bg-white dark:bg-brand-darker rounded-[0.65rem] h-full overflow-hidden">
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
