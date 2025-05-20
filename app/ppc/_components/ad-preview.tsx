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

  // If no ad is provided or allAds is empty, show a message
  if (!ad || allAds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-lg font-medium">No ads available</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create an ad to preview it here
        </p>
      </div>
    );
  }

  // Filter out empty headlines and descriptions
  const validHeadlines = ad.headlines.filter((h) => h.trim());
  const validDescriptions = ad.descriptions.filter((d) => d.trim());

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

  // Reset indices and start auto-rotation when ad changes
  useEffect(() => {
    setHeadlineIndex(0);
    setDescriptionIndex(0);

    if (shouldAutoRotateHeadlines) {
      startAutoRotation();
    }

    return () => {
      if (autoRotateTimerRef.current) {
        clearInterval(autoRotateTimerRef.current);
      }
    };
  }, [ad?.id, shouldAutoRotateHeadlines]);

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
      <Card className="w-full flex-1 flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Ad Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setViewMode(viewMode === "single" ? "grid" : "single")
              }
              title={viewMode === "single" ? "Show all ads" : "Show single ad"}
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
              >
                <TabsList>
                  <TabsTrigger value="search">
                    <Monitor className="h-4 w-4 mr-2" />
                    Search
                  </TabsTrigger>
                  <TabsTrigger value="youtube">
                    <Youtube className="h-4 w-4 mr-2" />
                    YouTube
                  </TabsTrigger>
                  <TabsTrigger value="mobile">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "single" ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevAd}
                  disabled={allAds.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous Ad
                </Button>
                <div className="text-sm font-medium">
                  {ad.name} ({currentAdIndex + 1}/{allAds.length})
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextAd}
                  disabled={allAds.length <= 1}
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
                    <div className="text-sm font-medium">Headlines</div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={prevHeadlineSet}
                        disabled={maxHeadlineIndex === 0}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs">
                        {headlineIndex + 1}/{maxHeadlineIndex + 1}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={nextHeadlineSet}
                        disabled={maxHeadlineIndex === 0}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                      {shouldAutoRotateHeadlines && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 ml-1"
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
                      <div key={i} className="p-2 bg-gray-50 rounded">
                        {headline}
                      </div>
                    ))}
                    {currentHeadlines.length === 0 && (
                      <div className="p-2 bg-gray-50 rounded text-gray-400">
                        No headlines to display
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Description</div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={prevDescription}
                        disabled={maxDescriptionIndex === 0}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs">
                        {descriptionIndex + 1}/{maxDescriptionIndex + 1}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={nextDescription}
                        disabled={maxDescriptionIndex === 0}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm">
                    {currentDescription ? (
                      <div className="p-2 bg-gray-50 rounded">
                        {currentDescription}
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded text-gray-400">
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
                  className={`cursor-pointer ${adItem.id === ad.id ? "ring-2 ring-primary" : ""}`}
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
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Ad Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">Ad Type:</h3>
                <span className="text-sm capitalize">{ad.type}</span>
              </div>

              <div>
                <h3 className="text-sm font-medium">
                  Headlines ({validHeadlines.length}/15)
                </h3>
                {validHeadlines.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {validHeadlines.map((headline, i) => (
                      <li key={i} className="text-sm">
                        {i + 1}. {headline}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    No headlines added
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium">
                  Descriptions ({validDescriptions.length}/4)
                </h3>
                {validDescriptions.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {validDescriptions.map((desc, i) => (
                      <li key={i} className="text-sm">
                        {i + 1}. {desc}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    No descriptions added
                  </p>
                )}
              </div>

              {ad.type === "search" &&
                ad.sitelinks &&
                ad.sitelinks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium">
                      Sitelinks ({ad.sitelinks.length})
                    </h3>
                    <ul className="mt-1 space-y-1">
                      {ad.sitelinks.map((sitelink, i) => (
                        <li key={i} className="text-sm">
                          {i + 1}. {sitelink.title} - {sitelink.url}
                          {(sitelink.description1 || sitelink.description2) && (
                            <ul className="ml-4 text-xs text-gray-500">
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
                <h3 className="text-sm font-medium">Keywords</h3>
                {ad.keywords.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {ad.keywords.map((keyword, i) => (
                      <li key={i} className="text-sm">
                        • {keyword}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
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
