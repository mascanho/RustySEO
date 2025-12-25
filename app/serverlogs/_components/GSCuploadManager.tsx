// @ts-nocheck
"use client";

import React, { useState, useCallback } from "react";
import {
  X,
  Loader2,
  FolderOpen,
  Upload,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/core";
import { IoPlayCircleOutline } from "react-icons/io5";
import * as XLSX from "xlsx";
import useGSCUploadStore from "@/store/GSCUploadStore";

export default function GSCuploadManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Use global store
  const {
    uploadedFile,
    workbook,
    sheets,
    selectedSheet,
    filePreview,
    setUploadedFile,
    setWorkbook,
    setSheets,
    setSelectedSheet,
    setFilePreview,
    reset,
  } = useGSCUploadStore();

  const handleFileUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".csv")) {
        toast.error("Please upload a .xlsx or .csv file");
        return;
      }

      try {
        setIsLoading(true);
        // Store serializable info
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.name.endsWith(".csv") ? "csv" : "xlsx",
          lastModified: file.lastModified,
        });

        const arrayBuffer = await file.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: "array" });

        setWorkbook(wb);
        setSheets(wb.SheetNames);

        console.log(wb, "Sheet stuff");

        if ("Pages" in wb.Sheets) {
          toast.success(
            "Google Sheets file detected. Please select a sheet to process",
          );
        } else {
          toast.error("No Pages data found in this file");
        }

        if (wb.SheetNames.length === 1) {
          handleSheetSelect(wb.SheetNames[0], wb, file.name);
        } else {
          setSelectedSheet(null);
          setFilePreview(null);
        }
      } catch (error) {
        console.error("Error reading file:", error);
        toast.error(
          `Error reading file: ${error instanceof Error ? error.message : String(error)}`,
        );
        reset();
      } finally {
        setIsLoading(false);
        event.target.value = "";
      }
    },
    [
      setUploadedFile,
      setWorkbook,
      setSheets,
      setSelectedSheet,
      setFilePreview,
      reset,
    ],
  );

  const handleSheetSelect = (
    sheetName: string,
    wbInstance = workbook,
    fileName = uploadedFile?.name,
  ) => {
    if (!wbInstance) return;

    setSelectedSheet(sheetName);
    const sheet = wbInstance.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    setFilePreview({
      fileName: fileName || "File",
      data: jsonData,
      processedAt: null,
    });
  };

  const handleProcessFile = useCallback(async () => {
    if (!filePreview?.data) return;

    try {
      setIsProcessing(true);

      // Step 1: Save data to database
      await invoke("save_gsc_data", {
        data: filePreview.data,
      });

      // Step 2: Update local state
      setFilePreview({
        ...filePreview,
        processedAt: new Date().toISOString(),
      });

      // Step 3: Load into Rust memory
      await loadGscIntoMemory();

      toast.success("File processed and loaded successfully");
    } catch (error) {
      console.error("Processing failed:", error);
      toast.error(
        `Processing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsProcessing(false);
    }
  }, [filePreview, setFilePreview]);

  // Separate function for loading into memory
  const loadGscIntoMemory = async () => {
    try {
      const result = await invoke("load_gsc_from_database");

      // Handle different response formats
      let message = "GSC data loaded into memory";

      if (typeof result === "string") {
        message = result;
      } else if (result && result.message === "Loaded") {
        message = `Loaded ${result.count} GSC entries into memory`;
      } else if (typeof result === "number") {
        message = `Loaded ${result} GSC entries into memory`;
      }

      toast.success(message);
      console.log("GSC memory load successful:", result);

      return result;
    } catch (error) {
      console.error("Failed to load GSC into memory:", error);
      toast.error(`Failed to load into memory: ${error}`);
      throw error; // Re-throw to be caught by parent
    }
  };

  const handleRemoveFile = useCallback(() => {
    reset();
  }, [reset]);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i]);
  }, []);

  return (
    <section className="w-full max-w-5xl mx-auto h-[670px]  dark:ring-0">
      <CardContent className="grid grid-cols-1 gap-6 h-[580px] max-h-[560px]">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Left Column - Upload & Settings */}
          <div className="col-span-4 flex flex-col gap-4 h-full dark:text-white">
            <div className="h-full border dark:border-white/30 rounded-lg bg-muted/30 dark:bg-muted/10 p-4 flex flex-col gap-4">
              <h3 className="text-sm font-medium text-foreground">
                File Upload
              </h3>

              {!uploadedFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent/50 transition-colors border-muted-foreground/25 hover:border-brand-bright">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      .xlsx or .csv
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.csv"
                    onChange={handleFileUpload}
                  />
                </label>
              ) : (
                <div className="w-full border dark:border-white/30 rounded-md bg-background p-3 relative group">
                  <button
                    onClick={handleRemoveFile}
                    className="absolute bottom-1 right-1 p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 dark:text-red-600" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-bright/10 rounded-md">
                      <FileSpreadsheet className="w-5 h-5 text-brand-bright" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span
                        className="text-xs font-medium truncate w-40"
                        title={uploadedFile.name}
                      >
                        {uploadedFile.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(uploadedFile.size)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {uploadedFile && sheets.length > 0 && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Select Sheet
                  </span>
                  <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-1">
                    {sheets.map((sheet) => (
                      <button
                        key={sheet}
                        onClick={() => handleSheetSelect(sheet)}
                        className={`text-left text-sm px-3 py-2 rounded-md transition-all flex items-center justify-between ${
                          selectedSheet === sheet
                            ? "bg-brand-bright text-white shadow-md shadow-brand-bright/20"
                            : "hover:bg-accent text-foreground"
                        }`}
                      >
                        <span className="truncate">{sheet}</span>
                        {selectedSheet === sheet && (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto">
                <Button
                  className="w-full"
                  onClick={handleProcessFile}
                  disabled={!selectedSheet || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <IoPlayCircleOutline className="mr-2 h-4 w-4" />
                      Process Data
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="col-span-8 h-full max-h-[560px] border dark:border-white/30 rounded-lg bg-background flex flex-col overflow-hidden">
            <div className="p-3 border-b dark:border-b-white/30 bg-muted/30 dark:bg-muted/10 flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2 dark:text-white">
                <FolderOpen className="w-4 h-4 text-brand-bright" />
                Data Preview
              </h3>
              {filePreview && (
                <span className="text-xs text-muted-foreground dark:text-white">
                  Loaded {filePreview.data?.length || 0} rows
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto bg-white dark:bg-zinc-950/30">
              {filePreview?.data ? (
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-muted/50 text-muted-foreground font-medium z-10 shadow-sm backdrop-blur-sm">
                    <tr>
                      {Object.keys(filePreview.data[0] || {}).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 whitespace-nowrap border-b border-border/50"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filePreview.data.map((row, i) => (
                      <tr
                        key={i}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {Object.values(row).map((value, j) => (
                          <td
                            key={j}
                            className="px-3 py-1.5 whitespace-nowrap text-foreground/90"
                          >
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                  <div className="p-4 bg-muted/30 dark:text-white/50 rounded-full">
                    <FileSpreadsheet className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-sm dark:text-white/40">
                    Select a file and sheet to preview data
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </section>
  );
}
