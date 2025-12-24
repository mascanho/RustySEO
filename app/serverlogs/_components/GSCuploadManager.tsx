// @ts-nocheck
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  X,
  Loader2,
  FolderOpen,
  Plus,
  ChevronDown,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { invoke } from "@tauri-apps/api/core";
import { FixedSizeList as List } from "react-window";
import { FaCalendarAlt, FaFolder, FaProjectDiagram } from "react-icons/fa";
import { SkeletonLoader } from "./SkeletonLoader";
import type { ProjectEntry } from "@/types/ProjectEntry";
import { IoPlayCircleOutline } from "react-icons/io5";
import {
  useAllProjects,
  useProjectsLogs,
  useSelectedProject,
} from "@/store/logFilterStore";
import { useLogAnalysis } from "@/store/ServerLogsStore";
import Spinner from "@/app/components/ui/Sidebar/checks/_components/Spinner";
import { listen } from "@tauri-apps/api/event";

// Main Component
export default function GSCuploadManager({ closeDialog }) {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState(new Set());
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processingFiles, setProcessingFiles] = useState<
    Record<string, boolean>
  >({});
  const [filePreview, setFilePreview] = useState(null);

  // Global store
  const { setLogData, resetAll } = useLogAnalysis();

  // Handle file upload
  const handleFileUpload = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      file, // Store the actual File object
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    console.log(uploadedFiles, "uploaded files");

    event.target.value = ""; // Reset input to allow re-upload of same file
  }, []);

  // Handle file removal
  const handleRemoveFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
    setFilePreview(null);
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i]);
  }, []);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return "No date";
    const date = new Date(timestamp);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  }, []);

  // Process Excel file
  const processExcelFile = useCallback(
    async (fileId: string) => {
      const fileToProcess = uploadedFiles.find((f) => f.id === fileId);
      if (!fileToProcess) return;

      try {
        setProcessingFiles((prev) => ({ ...prev, [fileId]: true }));
        toast.info(`Processing ${fileToProcess.name}...`);

        // Read file content as ArrayBuffer
        const arrayBuffer = await fileToProcess.file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Process file in Rust backend
        const result = await invoke("process_excel_file", {
          fileData: Array.from(uint8Array),
          fileName: fileToProcess.name,
        });

        // Handle the processed data
        if (result && result.data) {
          setFilePreview({
            fileName: fileToProcess.name,
            data: result.data,
            processedAt: new Date().toISOString(),
          });
          toast.success(`File processed successfully`);
        }
      } catch (error) {
        console.error("Processing failed:", error);
        toast.error(
          <section className="w-full">
            {error instanceof Error ? error.message : String(error)}
          </section>,
        );
      } finally {
        setProcessingFiles((prev) => ({ ...prev, [fileId]: false }));
      }
    },
    [uploadedFiles],
  );

  // Preview file content
  const previewFileContent = useCallback(
    (fileId: string) => {
      const file = uploadedFiles.find((f) => f.id === fileId);
      if (!file) return;

      setFilePreview({
        fileName: file.name,
        data: null, // Will be populated after processing
        processedAt: null,
      });
    },
    [uploadedFiles],
  );

  // Memoized file items
  const FileItem = React.memo(({ file, onRemove, onProcess, onPreview }) => {
    return (
      <div className="flex items-center justify-between p-2 rounded-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-700">
        <div className="flex flex-col space-y-0.5 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <FaFolder className="h-3 w-3 mr-1 text-blue-500 dark:text-blue-400" />
              <span className="text-xs font-medium dark:text-white truncate max-w-[120px]">
                {file.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => onPreview(file.id)}
                disabled={processingFiles[file.id]}
              >
                <FolderOpen className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => onProcess(file.id)}
                disabled={processingFiles[file.id]}
              >
                {processingFiles[file.id] ? (
                  <Spinner className="h-3 w-3 text-gray-500 dark:text-brand-bright" />
                ) : (
                  <IoPlayCircleOutline className="h-3 w-3 text-gray-500 dark:text-brand-400" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => onRemove(file.id)}
              >
                <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
            <span>{formatFileSize(file.size)}</span>
            <span>{formatTimestamp(file.lastModified)}</span>
          </div>
        </div>
      </div>
    );
  });

  FileItem.displayName = "FileItem";

  return (
    <section className="w-full max-w-5xl mx-auto h-[670px] pt-2">
      <CardContent className="grid grid-cols-1 gap-6 h-[380px]">
        <div className="space-y-4">
          <div className="rounded-md h-[580px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column - File Upload */}
              <div className="space-y-6 overflow-hidden">
                <div>
                  <h3 className="text-sm font-medium mb-2 text-left dark:text-white">
                    Upload Excel Files
                  </h3>

                  <div className="space-y-3 border rounded-md bg-muted h-[23.1rem] dark:border-brand-dark">
                    <div className="py-1 p-4">
                      <div className="space-y-2 mt-2">
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-6 h-6 mb-2 text-gray-500 dark:text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              .xlsx files only
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".xlsx"
                            onChange={handleFileUpload}
                            multiple
                          />
                        </label>
                      </div>
                    </div>

                    {/* Files List */}
                    <section className="h-full">
                      <div className="">
                        <h4 className="text-xs h-6 border-b dark:border-brand-dark shadow font-medium px-4 dark:text-white sticky bg-white dark:bg-brand-darker">
                          Uploaded Files ({uploadedFiles.length})
                        </h4>
                        <div className="space-y-2 p-3 h-[14.5em] overflow-y-auto">
                          {uploadedFiles.length > 50 ? (
                            <List
                              height={300}
                              itemCount={uploadedFiles.length}
                              itemSize={60}
                              width="100%"
                            >
                              {({ index, style }) => (
                                <div style={style}>
                                  <FileItem
                                    file={uploadedFiles[index]}
                                    onRemove={handleRemoveFile}
                                    onProcess={processExcelFile}
                                    onPreview={previewFileContent}
                                  />
                                </div>
                              )}
                            </List>
                          ) : (
                            uploadedFiles.map((file) => (
                              <FileItem
                                key={file.id}
                                file={file}
                                onRemove={handleRemoveFile}
                                onProcess={processExcelFile}
                                onPreview={previewFileContent}
                              />
                            ))
                          )}
                          {uploadedFiles.length === 0 && (
                            <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                              No files uploaded yet
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              {/* Right Column - File Preview */}
              <div>
                <h3 className="text-lg dark:text-white font-semibold text-left">
                  File Preview
                </h3>
                <div className="border dark:border-brand-dark dark:border-brand rounded-lg h-[370px] overflow-y-auto">
                  {isLoading ? (
                    <SkeletonLoader />
                  ) : filePreview ? (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {filePreview.fileName}
                          </h4>
                          {filePreview.processedAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Processed:{" "}
                              {formatTimestamp(filePreview.processedAt)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFilePreview(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {filePreview.data ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                {Object.keys(filePreview.data[0] || {}).map(
                                  (key) => (
                                    <th
                                      key={key}
                                      scope="col"
                                      className="px-2 py-1 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                      {key}
                                    </th>
                                  ),
                                )}
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                              {filePreview.data.slice(0, 10).map((row, i) => (
                                <tr key={i}>
                                  {Object.values(row).map((value, j) => (
                                    <td
                                      key={j}
                                      className="px-2 py-1 whitespace-nowrap text-gray-900 dark:text-gray-200"
                                    >
                                      {String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {filePreview.data.length > 10 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Showing first 10 rows of {filePreview.data.length}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
                          <p className="text-sm">
                            File not processed yet. Click the play button to
                            process.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <FolderOpen className="h-8 w-8 mb-2" />
                      <p className="text-xs">No file selected for preview</p>
                      <p className="text-xs px-4 text-center">
                        Upload a file and click the preview button to view its
                        contents.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end mt-8">
        <div className="flex gap-2">
          <Button
            onClick={() => setUploadedFiles([])}
            variant="secondary"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Clear All
          </Button>
        </div>
      </CardFooter>
    </section>
  );
}
