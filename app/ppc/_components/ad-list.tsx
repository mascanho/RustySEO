// @ts-nocheck
"use client";

import type React from "react";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Edit, Trash, Search, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Ad, AdType } from "@/types/ad";
import { Badge } from "@/components/ui/badge";
import { AdStrengthBadge } from "./ad-strength";
import { computeAdStrength } from "./utils/ad-strength";

type SortKey = "recent" | "name" | "strength";

interface AdListProps {
  ads: Ad[];
  onSelect: (ad: Ad) => void;
  onClone: (ad: Ad) => void;
  onDelete: (adId: string) => void;
}

export function AdList({ ads, onSelect, onClone, onDelete }: AdListProps) {
  const [adTypeFilter, setAdTypeFilter] = useState<AdType | "all">("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent");

  const processedAds = ads.map((ad) => ({
    ...ad,
    headlines: Array.isArray(ad.headlines)
      ? ad.headlines
      : typeof ad.headlines === "string"
        ? ad.headlines.split("\n")
        : [],
    descriptions: Array.isArray(ad.descriptions)
      ? ad.descriptions
      : typeof ad.descriptions === "string"
        ? ad.descriptions.split("\n")
        : [],
    keywords: Array.isArray(ad.keywords)
      ? ad.keywords
      : typeof ad.keywords === "string"
        ? ad.keywords.split("\n")
        : [],
  }));

  // Precompute ad strength once per ad (used for badges and sorting).
  const strengthById = useMemo(() => {
    const map: Record<string, ReturnType<typeof computeAdStrength>> = {};
    for (const ad of processedAds) map[ad.id] = computeAdStrength(ad);
    return map;
  }, [processedAds]);

  // Filter by type, then by free-text search, then sort.
  const filteredAds = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = processedAds.filter(
      (ad) => adTypeFilter === "all" || ad.type === adTypeFilter,
    );

    if (q) {
      list = list.filter((ad) => {
        const haystack = [
          ad.name,
          ...(ad.headlines || []),
          ...(ad.descriptions || []),
          ...(ad.keywords || []),
          ad.finalUrl,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    const sorted = [...list];
    if (sortBy === "name") {
      sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "strength") {
      sorted.sort(
        (a, b) =>
          (strengthById[b.id]?.score || 0) - (strengthById[a.id]?.score || 0),
      );
    } else {
      // recent — ids are timestamp-based, newest first
      sorted.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
    }
    return sorted;
  }, [processedAds, adTypeFilter, query, sortBy, strengthById]);

  // Count ads by type
  const searchAdsCount = processedAds.filter(
    (ad) => ad.type === "search",
  ).length;
  const pmaxAdsCount = processedAds.filter((ad) => ad.type === "pmax").length;
  const displayAdsCount = processedAds.filter(
    (ad) => ad.type === "display",
  ).length;

  // Safe to early-return now that all hooks have run.
  if (processedAds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-lg font-medium dark:text-white/50">
          No ads created yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create your first ad to get started
        </p>
      </div>
    );
  }

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
    <div className="flex flex-col h-full min-h-0 gap-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-shrink-0">
        <Tabs
          value={adTypeFilter}
          onValueChange={(v) => setAdTypeFilter(v as any)}
          className="flex-shrink-0"
        >
          <TabsList>
            <TabsTrigger value="all">
              All Ads ({processedAds.length})
            </TabsTrigger>
            <TabsTrigger value="search">Search ({searchAdsCount})</TabsTrigger>
            <TabsTrigger value="pmax">
              Performance Max ({pmaxAdsCount})
            </TabsTrigger>
            <TabsTrigger value="display">
              Display ({displayAdsCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search + sort */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ads, keywords…"
              className="w-full sm:w-56 h-8 pl-8 pr-7 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            title="Sort ads"
          >
            <option value="recent">Most recent</option>
            <option value="strength">Ad strength</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
      </div>

      {filteredAds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <h3 className="text-base font-bold">
            {query.trim()
              ? `No ads match "${query.trim()}"`
              : `No ${adTypeFilter} ads found`}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {query.trim()
              ? "Try a different search term or clear the search."
              : "Create a new ad or switch to a different category"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full content-start overflow-auto pr-4 flex-1 min-h-0 mt-2">
          {filteredAds.map((ad) => (
            <div
              key={ad.id}
              className="group relative bg-white dark:bg-brand-darker  border border-gray-200 dark:border-white/5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200  flex flex-col h-full"
            >
              {/* Type Badge */}
              <div className="absolute top-3 right-3 z-10">
                <Badge
                  className={`capitalize px-2 py-0.5 text-[9px] font-bold tracking-wider rounded border-none shadow-sm ${
                    ad.type === "search"
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
                  <div className="flex items-center gap-2 mt-1.5">
                    <AdStrengthBadge result={strengthById[ad.id]} />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {new Date(parseInt(ad.id)).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-1.5">
                      Primary Headline
                    </div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-1 italic">
                      "
                      {(ad.headlines || []).find((h) => h.trim()) ||
                        "No headlines"}
                      "
                    </p>
                  </div>

                  <div>
                    <div className="text-[9px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-1.5">
                      Assets
                    </div>
                    <div className="flex gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {(ad.headlines || []).filter((h) => h.trim()).length}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          Headlines
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {
                            (ad.descriptions || []).filter((d) => d.trim())
                              .length
                          }
                        </span>
                        <span className="text-[9px] text-gray-500">Descs</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {(ad.keywords || []).length}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          Keywords
                        </span>
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
                    className={`h-7 w-7 rounded-md ${
                      confirmDelete === ad.id
                        ? "bg-red-50 text-red-600 dark:bg-red-900/20 shadow-inner"
                        : "text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    }`}
                    title={
                      confirmDelete === ad.id
                        ? "Click to confirm deletion"
                        : "Delete ad"
                    }
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
