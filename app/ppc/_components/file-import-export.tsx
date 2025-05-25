// @ts-nocheck
"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Upload, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import type { Ad } from "@/types/ad";
import { adsToCsv, adsToJson, downloadFile } from "./utils/file-utils";

interface FileImportExportProps {
  ads: Ad[];
  onImport: (ads: Ad[]) => void;
}

export function FileImportExport({ ads, onImport }: FileImportExportProps) {
  const { toast } = useToast();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (format: "json" | "csv") => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      if (format === "json") {
        const jsonContent = adsToJson(ads);
        downloadFile(
          jsonContent,
          `google-ads-export-${timestamp}.json`,
          "application/json",
        );
      } else {
        const csvContent = adsToCsv(ads);
        downloadFile(
          csvContent,
          `google-ads-export-${timestamp}.csv`,
          "text/csv",
        );
      }

      toast({
        title: "Export successful",
        description: `Your ads have been exported as ${format.toUpperCase()}`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let importedAds: Ad[];

        if (file.name.endsWith(".json")) {
          importedAds = jsonToAds(content);
        } else if (file.name.endsWith(".csv")) {
          importedAds = csvToAds(content);
        } else {
          throw new Error(
            "Unsupported file format. Please use JSON or CSV files.",
          );
        }

        onImport(importedAds);
        setIsImportDialogOpen(false);

        toast({
          title: "Import successful",
          description: `${importedAds.length} ads have been imported`,
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    };

    reader.onerror = () => {
      toast({
        title: "Import failed",
        description: "Error reading file",
        variant: "destructive",
      });
    };

    if (file.name.endsWith(".json") || file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      toast({
        title: "Import failed",
        description: "Unsupported file format. Please use JSON or CSV files.",
        variant: "destructive",
      });
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="dark:text-white/50 dark:bg-brand-darker border-0"
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="dark:bg-brand-darker dark:border-brand-dark dark:text-white"
          align="end"
        >
          <DropdownMenuItem
            className="hover:text-white"
            onClick={() => handleExport("json")}
          >
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:text-white"
            onClick={() => handleExport("csv")}
          >
            Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="dark:text-white/50 dark:bg-brand-darker dark:border-0 "
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent className="dark:bg-brand-darker dark:text-white">
          <DialogHeader>
            <DialogTitle>Import Ads</DialogTitle>
            <DialogDescription>
              Upload a JSON or CSV file containing your ads data.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-8">
              <Upload className="h-8 w-8 mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
