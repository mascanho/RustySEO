// @ts-nocheck
"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Edit, Trash } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Ad, AdType } from "@/types/ad";
import { Badge } from "@/components/ui/badge";

interface AdListProps {
  ads: Ad[];
  onSelect: (ad: Ad) => void;
  onClone: (ad: Ad) => void;
  onDelete: (adId: string) => void;
}

export function AdList({ ads, onSelect, onClone, onDelete }: AdListProps) {
  const [adTypeFilter, setAdTypeFilter] = useState<AdType | "all">("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const processedAds = ads.map(ad => ({
    ...ad,
    headlines: Array.isArray(ad.headlines) ? ad.headlines : (typeof ad.headlines === 'string' ? ad.headlines.split('\n') : []),
    descriptions: Array.isArray(ad.descriptions) ? ad.descriptions : (typeof ad.descriptions === 'string' ? ad.descriptions.split('\n') : []),
    keywords: Array.isArray(ad.keywords) ? ad.keywords : (typeof ad.keywords === 'string' ? ad.keywords.split('\n') : []),
  }));

  if (processedAds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-lg font-medium dark:text-white/50">
          No ads created yet
        </h3>
        <p className="text-sm text-muted-foreground mt-1 dark:text-white/50">
          Create your first ad to get started
        </p>
      </div>
    );
  }

  // Filter ads by type
  const filteredAds =
    adTypeFilter === "all" ? processedAds : processedAds.filter((ad) => ad.type === adTypeFilter);

  // Count ads by type
  const searchAdsCount = processedAds.filter((ad) => ad.type === "search").length;
  const pmaxAdsCount = processedAds.filter((ad) => ad.type === "pmax").length;
  const displayAdsCount = processedAds.filter((ad) => ad.type === "display").length;

  const handleDeleteClick = (adId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (confirmDelete === adId) {
      // User confirmed deletion
      console.log("Deleting ad:", adId);
      onDelete(adId);
      setConfirmDelete(null);
    } else {
      // First click - ask for confirmation
      setConfirmDelete(adId);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={adTypeFilter}
        onValueChange={(v) => setAdTypeFilter(v as any)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="all">All Ads ({processedAds.length})</TabsTrigger>
          <TabsTrigger value="search">Search ({searchAdsCount})</TabsTrigger>
          <TabsTrigger value="pmax">
            Performance Max ({pmaxAdsCount})
          </TabsTrigger>
          <TabsTrigger value="display">Display ({displayAdsCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredAds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <h3 className="text-base font-bold">No {adTypeFilter} ads found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Create a new ad or switch to a different category
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
          {filteredAds.map((ad) => (
            <div
              key={ad.id}
              className="group relative bg-white dark:bg-brand-darker border border-gray-200 dark:border-white/5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
            >
              {/* Type Badge */}
              <div className="absolute top-3 right-3 z-10">
                <Badge
                  className={`capitalize px-2 py-0.5 text-[9px] font-bold tracking-wider rounded border-none shadow-sm ${ad.type === "search"
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : ad.type === "pmax"
                      ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}
                >
                  {ad.type}
                </Badge>
              </div>

              <div className="p-5 flex-1">
                <div className="mb-3">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate pr-14">
                    {ad.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Updated {new Date(parseInt(ad.id)).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-1.5">
                      Primary Headline
                    </div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-1 italic">
                      "{(ad.headlines || []).find(h => h.trim()) || 'No headlines'}"
                    </p>
                  </div>

                  <div>
                    <div className="text-[9px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-1.5">
                      Assets
                    </div>
                    <div className="flex gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{(ad.headlines || []).filter(h => h.trim()).length}</span>
                        <span className="text-[9px] text-gray-500">Headlines</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{(ad.descriptions || []).filter(d => d.trim()).length}</span>
                        <span className="text-[9px] text-gray-500">Descs</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{(ad.keywords || []).length}</span>
                        <span className="text-[9px] text-gray-500">Keywords</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 mt-auto border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/30 dark:bg-black/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(ad)}
                  className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold text-[11px] h-8 px-3 rounded-lg"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit Ad
                </Button>

                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onClone(ad);
                    }}
                    className="h-7 w-7 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md"
                    title="Clone ad"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDeleteClick(ad.id, e)}
                    className={`h-7 w-7 rounded-md ${confirmDelete === ad.id
                      ? "bg-red-50 text-red-600 dark:bg-red-900/20 shadow-inner"
                      : "text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      }`}
                    title={confirmDelete === ad.id ? "Click to confirm deletion" : "Delete ad"}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
