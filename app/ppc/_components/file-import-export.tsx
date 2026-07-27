// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
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
import { readTextFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { save } from "@tauri-apps/plugin-dialog";
import { adsToJson, jsonToAds, adsToCsv, csvToAds } from "./utils/file-utils";

// Parse a file's contents into ads based on its extension.
const parseAds = (content: string, filename: string): Ad[] => {
  const name = filename.toLowerCase();
  if (name.endsWith(".json")) return jsonToAds(content);
  if (name.endsWith(".csv")) return csvToAds(content);
  throw new Error("Unsupported file format. Please use a JSON or CSV file.");
};

const saveToDisk = async (content: string, filename: string) => {
  try {
    // Use Tauri API if available
    if (window.__TAURI__) {
      const filePath = await save({
        defaultPath: filename,
        filters: [
          {
            name: filename.endsWith(".json") ? "JSON" : "CSV",
            extensions: [filename.split(".").pop() || ""],
          },
        ],
      });

      if (filePath) {
        await writeTextFile(filePath, content);
        return filePath;
      }
      return null;
    } else {
      // Fallback for web environment
      const blob = new Blob([content], {
        type: filename.endsWith(".json") ? "application/json" : "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return filename;
    }
  } catch (error) {
    console.error("Error saving file:", error);
    throw error;
  }
};

interface FileImportExportProps {
  ads: Ad[];
  onImport: (ads: Ad[]) => void;
}

export function FileImportExport({ ads, onImport }: FileImportExportProps) {
  const { toast } = useToast();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug mount
  useEffect(() => {
    console.log("Tauri environment:", window.__TAURI__ !== undefined);
  }, []);

  const handleExport = async (format: "json" | "csv") => {
    if (!ads || ads.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Create at least one ad before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `ads-export-${timestamp}.${format}`;

      const content = format === "json" ? adsToJson(ads) : adsToCsv(ads);

      // Wait for the file to actually be written before notifying the user.
      const savedPath = await saveToDisk(content, filename);

      // User dismissed the native save dialog — nothing was written.
      if (!savedPath) {
        toast({
          title: "Export cancelled",
          description: "No file was saved.",
        });
        return;
      }

      toast({
        title: "Export successful",
        description: `Exported ${ads.length} ad${ads.length === 1 ? "" : "s"} as ${format.toUpperCase()}${
          typeof savedPath === "string" && savedPath.includes("/")
            ? ` to ${savedPath}`
            : ""
        }`,
        variant: "success",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = async () => {
    try {
      let content: string;
      let filename: string;

      if (window.__TAURI__) {
        // Native file picker.
        const selected = await open({
          multiple: false,
          filters: [{ name: "Ads Data", extensions: ["json", "csv"] }],
        });

        // User dismissed the picker — leave quietly, no error.
        if (!selected) return;

        filename = selected as string;
        content = await readTextFile(filename);
      } else {
        // Web fallback.
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        filename = file.name;
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsText(file);
        });
      }

      // Parse, validate and normalise. The parent reports the final result
      // (added vs. skipped) so the message reflects what actually landed.
      const importedAds = parseAds(content, filename);
      onImport(importedAds);
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description:
          error instanceof Error
            ? error.message
            : "The file could not be read or parsed.",
        variant: "destructive",
      });
    } finally {
      // Reset the input so re-selecting the same file fires onChange again.
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex gap-2">
      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="dark:text-white/50 dark:bg-brand-darker border"
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

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="dark:text-white/50 dark:bg-brand-darker dark:border-0"
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
              <Button variant="secondary" onClick={handleFileChange}>
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
