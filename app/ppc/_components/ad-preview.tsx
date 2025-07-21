// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Monitor,
  Youtube,
  Pause,
  Play,
  Grid3X3,
  LayoutList,
} from "lucide-react";
import {
  AdThumbnail,
  MobilePreview,
  SearchPreview,
  YoutubePreview,
} from "./ad-preview-examples";

interface AdPreviewProps {
  ad: Ad | null;
  allAds: Ad[];
  onSelectAd: (ad: Ad) => void;
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
  const validHeadlines = ad.headlines ? (Array.isArray(ad.headlines) ? ad.headlines : (typeof ad.headlines === 'string' ? ad.headlines.split('\n') : [])).filter((h) => h.trim()) : [];
  const validDescriptions = ad.descriptions ? (Array.isArray(ad.descriptions) ? ad.descriptions : (typeof ad.descriptions === 'string' ? ad.descriptions.split('\n') : [])).filter((d) => d.trim()) : [];
  const validKeywords = ad.keywords ? (Array.isArray(ad.keywords) ? ad.keywords : (typeof ad.keywords === 'string' ? ad.keywords.split('\n') : [])).filter((k) => k.trim()) : [];

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
    <div className="space-y-6 w-full">
      <Card className="w-full flex-1 flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm h-[calc(100vh-40vh)] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Ad Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setViewMode(viewMode === "single" ? "grid" : "single")
              }
              title={viewMode === "single" ? "Show all ads" : "Show single ad"}
              className="h-8 w-8 text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {viewMode === "single" ? (
                <Grid3X3 className="h-4 w-4" />
              ) : (
                <LayoutList className="h-4 w-4" />
              )}
            </Button>

            {viewMode === "single" && (
              <Tabs
                value={previewType}
                onValueChange={(v) => setPreviewType(v as any)}
                className="bg-gray-100 rounded-md p-1 dark:bg-gray-700"
              >
                <TabsList className="bg-transparent p-0">
                  <TabsTrigger
                    value="search"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Search
                  </TabsTrigger>
                  <TabsTrigger
                    value="youtube"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300"
                  >
                    <Youtube className="h-4 w-4 mr-2" />
                    YouTube
                  </TabsTrigger>
                  <TabsTrigger
                    value="mobile"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300"
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {viewMode === "single" ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevAd}
                  disabled={allAds.length <= 1}
                  className="h-8 px-3 text-sm text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous Ad
                </Button>
                <div className="text-base font-medium text-gray-800 dark:text-white">
                  {ad.name} ({currentAdIndex + 1}/{allAds.length})
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextAd}
                  disabled={allAds.length <= 1}
                  className="h-8 px-3 text-sm text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Next Ad <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="py-4">
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

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Headlines</div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
                        onClick={prevHeadlineSet}
                        disabled={maxHeadlineIndex === 0}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {headlineIndex + 1}/{maxHeadlineIndex + 1}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
                        onClick={nextHeadlineSet}
                        disabled={maxHeadlineIndex === 0}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                      {shouldAutoRotateHeadlines && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 ml-1 text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
                          onClick={toggleAutoRotation}
                          title={
                            isAutoRotating
                              ? "Pause auto-rotation"
                              : "Start auto-rotation"
                          }
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
                  <div className="text-sm space-y-1">
                    {currentHeadlines.map((headline, i) => (
                      <div
                        key={i}
                        className="p-2 bg-gray-50 rounded-md dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      >
                        {headline}
                      </div>
                    ))}
                    {currentHeadlines.length === 0 && (
                      <div className="p-2 bg-gray-50 rounded-md text-gray-400 dark:bg-gray-700">
                        No headlines to display
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
                        onClick={prevDescription}
                        disabled={maxDescriptionIndex === 0}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {descriptionIndex + 1}/{maxDescriptionIndex + 1}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
                        onClick={nextDescription}
                        disabled={maxDescriptionIndex === 0}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm">
                    {currentDescription ? (
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md">
                        {currentDescription}
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded-md text-gray-400 dark:bg-gray-700">
                        No description to display
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allAds.map((adItem) => (
                <div
                  key={adItem.id}
                  className={`cursor-pointer p-2 rounded-lg transition-all duration-200 ${adItem.id === ad.id ? "border-2 border-blue-500 shadow-md" : "border border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"}`}
                  onClick={() => onSelectAd(adItem)}
                >
                  <AdThumbnail ad={adItem} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {viewMode === "single" && (
        <Card className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <CardHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Ad Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto h-96">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ad Type:</h3>
                <span className="text-sm capitalize text-gray-800 dark:text-gray-200">{ad.type}</span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Headlines ({validHeadlines.length}/15)
                </h3>
                {validHeadlines.length > 0 ? (
                  <ul className="mt-1 space-y-1 list-disc list-inside text-gray-800 dark:text-gray-200">
                    {validHeadlines.map((headline, i) => (
                      <li key={i} className="text-sm">
                        {i + 1}. {headline}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    No headlines added
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descriptions ({validDescriptions.length}/4)
                </h3>
                {validDescriptions.length > 0 ? (
                  <ul className="mt-1 space-y-1 list-disc list-inside text-gray-800 dark:text-gray-200">
                    {validDescriptions.map((desc, i) => (
                      <li key={i} className="text-sm">
                        {i + 1}. {desc}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    No descriptions added
                  </p>
                )}
              </div>

              {ad.type === "search" &&
                ad.sitelinks &&
                ad.sitelinks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sitelinks ({ad.sitelinks.length})
                    </h3>
                    <ul className="mt-1 space-y-1 list-disc list-inside text-gray-800 dark:text-gray-200">
                      {ad.sitelinks.map((sitelink, i) => (
                        <li key={i} className="text-sm">
                          {i + 1}. {sitelink.title} - {sitelink.url}
                          {(sitelink.description1 || sitelink.description2) && (
                            <ul className="ml-4 text-xs text-gray-500 list-none">
                              {sitelink.description1 && (
                                <li>{sitelink.description1}</li>
                              )}
                              {sitelink.description2 && (
                                <li>{sitelink.description2}</li>
                              )}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Keywords</h3>
                {validKeywords.length > 0 ? (
                  <ul className="mt-1 space-y-1 list-disc list-inside text-gray-800 dark:text-gray-200">
                    {validKeywords.map((keyword, i) => (
                      <li key={i} className="text-sm">
                        • {keyword}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    No keywords added
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
