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

// Utility functions
const adsToJson = (ads: Ad[]): string => JSON.stringify(ads, null, 2);

const adsToCsv = (ads: Ad[]): string => {
  if (ads.length === 0) return "";

  const headers = Object.keys(ads[0]).join(",");
  const rows = ads.map((ad) =>
    Object.values(ad)
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );

  return [headers, ...rows].join("\n");
};

const csvToAds = (csv: string): Ad[] => {
  const lines = csv.split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const ad = {} as Ad;
    headers.forEach((header, i) => {
      ad[header as keyof Ad] = values[i] ? values[i].replace(/^"|"$/g, "") : "";
    });
    return ad;
  });
};

const downloadFile = async (content: string, filename: string) => {
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

  const handleExport = (format: "json" | "csv") => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `ads-export-${timestamp}.${format}`;

      if (format === "json") {
        const content = adsToJson(ads);
        downloadFile(content, filename, "application/json");
      } else {
        const content = adsToCsv(ads);
        downloadFile(content, filename, "text/csv");
      }

      toast({
        title: "Export successful",
        description: `Exported ${ads.length} ads as ${format.toUpperCase()}`,
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
    console.log("File input changed");

    try {
      // Use Tauri API if available
      if (window.__TAURI__) {
        console.log("Using Tauri filesystem API");
        const selected = await open({
          multiple: false,
          filters: [
            {
              name: "Data Files",
              extensions: ["json", "csv"],
            },
          ],
        });

        if (!selected) {
          throw new Error("No file selected");
        }

        const content = await readTextFile(selected as string);
        console.log("File content length:", content.length);

        let importedAds: Ad[];
        if ((selected as string).endsWith(".json")) {
          importedAds = JSON.parse(content);
        } else if ((selected as string).endsWith(".csv")) {
          importedAds = csvToAds(content);
        } else {
          throw new Error("Unsupported file format. Please use JSON or CSV.");
        }

        console.log("Imported ads count:", importedAds.length);
        onImport(importedAds);
        setIsImportDialogOpen(false);

        toast({
          title: "Import successful",
          description: `Imported ${importedAds.length} ads`,
          variant: "success",
        });
      } else {
        // Fallback for web environment
        if (!fileInputRef.current?.files?.[0]) {
          console.log("No file selected");
          return;
        }

        const file = fileInputRef.current.files[0];
        console.log("Selected file:", file.name);

        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsText(file);
        });

        console.log("File content length:", content.length);

        let importedAds: Ad[];
        if (file.name.endsWith(".json")) {
          importedAds = JSON.parse(content);
        } else if (file.name.endsWith(".csv")) {
          importedAds = csvToAds(content);
        } else {
          throw new Error("Unsupported file format. Please use JSON or CSV.");
        }

        console.log("Imported ads count:", importedAds.length);
        onImport(importedAds);
        setIsImportDialogOpen(false);

        toast({
          title: "Import successful",
          description: `Imported ${importedAds.length} ads`,
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      // Reset input
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
