// @ts-nocheck
"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowLeft } from "lucide-react";
import type { Ad } from "@/types/ad";
import { FileImportExport } from "./file-import-export";

interface DashboardHeaderProps {
  heading: string;
  description?: string;
  onAddNew?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  ads?: Ad[];
  onImport?: (ads: Ad[]) => void;
  showImportExport?: boolean;
}

export function DashboardHeader({
  heading,
  description,
  onAddNew,
  showBackButton,
  onBack,
  ads,
  onImport,
  showImportExport = false,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white/50">
            {heading}
          </h1>
          {description && (
            <p className="text-muted-foreground dark:text-white/50">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showImportExport && ads && onImport && (
          <FileImportExport ads={ads} onImport={onImport} />
        )}
        {onAddNew && (
          <Button onClick={onAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Ad
          </Button>
        )}
      </div>
    </div>
  );
}
