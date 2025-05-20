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

  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-lg font-medium">No ads created yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first ad to get started
        </p>
      </div>
    );
  }

  // Filter ads by type
  const filteredAds =
    adTypeFilter === "all" ? ads : ads.filter((ad) => ad.type === adTypeFilter);

  // Count ads by type
  const searchAdsCount = ads.filter((ad) => ad.type === "search").length;
  const pmaxAdsCount = ads.filter((ad) => ad.type === "pmax").length;
  const displayAdsCount = ads.filter((ad) => ad.type === "display").length;

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
          <TabsTrigger value="all">All Ads ({ads.length})</TabsTrigger>
          <TabsTrigger value="search">Search ({searchAdsCount})</TabsTrigger>
          <TabsTrigger value="pmax">
            Performance Max ({pmaxAdsCount})
          </TabsTrigger>
          <TabsTrigger value="display">Display ({displayAdsCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredAds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium">No {adTypeFilter} ads found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new ad or switch to a different category
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
          {filteredAds.map((ad) => (
            <Card key={ad.id} className="overflow-hidden">
              <CardHeader className="pb-2 pt-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{ad.name}</CardTitle>
                    <CardDescription>
                      {ad.headlines.filter((h) => h.trim()).length} headlines,{" "}
                      {ad.descriptions.filter((d) => d.trim()).length}{" "}
                      descriptions
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      ad.type === "search"
                        ? "default"
                        : ad.type === "pmax"
                          ? "secondary"
                          : "outline"
                    }
                    className="capitalize"
                  >
                    {ad.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2 px-6">
                <div className="space-y-2">
                  <div>
                    <h4 className="text-sm font-medium">Headlines:</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {ad.headlines
                        .filter((h) => h.trim())
                        .slice(0, 3)
                        .join(" | ")}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Keywords:</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ad.keywords.slice(0, 3).map((keyword, i) => (
                        <Badge key={i} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                      {ad.keywords.length > 3 && (
                        <Badge variant="outline">
                          +{ad.keywords.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 pb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(ad)}
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onClone(ad);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Clone</span>
                  </Button>
                  <Button
                    variant={confirmDelete === ad.id ? "destructive" : "ghost"}
                    size="sm"
                    onClick={(e) => handleDeleteClick(ad.id, e)}
                  >
                    <Trash className="h-4 w-4" />
                    <span
                      className={confirmDelete === ad.id ? "ml-1" : "sr-only"}
                    >
                      {confirmDelete === ad.id ? "Confirm" : "Delete"}
                    </span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
