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
    <div className="flex items-center justify-between py-4 border-b dark:border-brand-dark mb-6">
      {" "}
      {/* Added padding and bottom border */}
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-muted-foreground hover:bg-gray-100 dark:hover:bg-brand-dark"
          >
            <ArrowLeft className="h-5 w-5 dark:text-white" />{" "}
            {/* Adjusted icon size */}
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-medium text-gray-800 dark:text-white">
            {" "}
            {/* Adjusted font size and weight */}
            {heading}
          </h1>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {" "}
              {/* Adjusted font size and color */}
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
          <Button
            onClick={onAddNew}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 dark:text-white text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800" // Google Ads-like primary button
          >
            <PlusCircle className="mr-2 h-4 w-4 dark:text-white" />
            Add New Ad
          </Button>
        )}
      </div>
    </div>
  );
}
