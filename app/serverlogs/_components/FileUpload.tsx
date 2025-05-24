// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useLogAnalysis } from "@/store/ServerLogsStore";
import { getOS } from "../util";
import { listen } from "@tauri-apps/api/event";
import { useServerLogsStore } from "@/store/ServerLogsGlobalStore";
import { FaDatabase } from "react-icons/fa";

interface FileUploadProps {
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  className?: string;
  closeDialog: () => void;
}

interface FileWithProgress {
  file: File;
  success: boolean;
  error: string | null;
}

export function FileUpload({
  maxSizeMB = 345,
  acceptedFileTypes = ["text/plain", ".log", ".txt"],
  className,
  closeDialog,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setLogData } = useLogAnalysis();
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
    filename: "",
  });
  const { storingLogs, setStoringLogs } = useServerLogsStore();

  console.log(storingLogs, "storing logs");

  useEffect(() => {
    const unlisten = listen("progress-update", (event) => {
      const payload = event.payload;
      console.log("Progress event received:", payload);

      setProgress({
        current: payload.current_file,
        total: payload.total_files,
        percent: payload.percentage,
        filename: payload.filename,
      });
    });

    return () => {
      unlisten.then((f) => f()).catch(console.error);
    };
  }, [files]);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const maxVisibleFiles = 5;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File) => {
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds the maximum limit of ${maxSizeMB}MB.`);
      return false;
    }

    const fileType = file.type || "";
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

    if (
      acceptedFileTypes.includes(fileType) ||
      acceptedFileTypes.includes(`text/${fileExtension}`) ||
      (fileExtension === "log" && acceptedFileTypes.includes("text/plain"))
    ) {
      setError(null);
      return true;
    }

    setError(
      `Unsupported file type. Supported types: ${acceptedFileTypes.join(", ")}`,
    );
    return false;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter((file) => validateFile(file));

      if (validFiles.length > 0) {
        setFiles((prev) => [
          ...prev,
          ...validFiles.map((file) => ({
            file,
            success: false,
            error: null,
          })),
        ]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter((file) => validateFile(file));

      if (validFiles.length > 0) {
        setFiles((prev) => [
          ...prev,
          ...validFiles.map((file) => ({
            file,
            success: false,
            error: null,
          })),
        ]);
      }
    }
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsText(file);
    });
  };

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleUpload = async () => {
    const os = getOS();

    if (files.length === 0) return;

    setUploading(true);
    setOverallProgress(0);
    await delay(100);

    if (os === "Windows" && files.length > 5) {
      toast.info(
        "Whoohaaaa, that is a lot of files. This might take a while, consider uploading less files on each batch.",
      );
    } else {
      toast.info("RustySEO is analysing your logs...");
    }

    if (os === "MacOS" && files.length > 10) {
      toast.info(
        "Whoohaaaa, that is a lot of files. This might take a while...",
      );
    }

    try {
      setOverallProgress(10);
      const fileContents: Array<{ filename: string; content: string }> = [];

      const batchSize = 5;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
          batch.map(async (fileWithProgress, batchIndex) => {
            const originalIndex = i + batchIndex;
            try {
              const content = await readFile(files[originalIndex].file);
              return {
                index: originalIndex,
                update: {
                  ...files[originalIndex],
                  success: true,
                },
                content: {
                  filename: files[originalIndex].file.name,
                  content,
                },
              };
            } catch (err) {
              return {
                index: originalIndex,
                update: {
                  ...files[originalIndex],
                  error: err instanceof Error ? err.message : "Upload failed",
                },
                error: err,
              };
            }
          }),
        );

        batchResults.forEach((result) => {
          if (result.status === "fulfilled") {
            if (result.value.content) {
              fileContents.push(result.value.content);
            }
          } else {
            console.error("Error processing file:", result.reason);
            setFiles((prevFiles) => {
              const newFiles = [...prevFiles];
              newFiles[result.value.index] = result.value.update;
              return newFiles;
            });
          }
        });

        const progress = 10 + (i / files.length) * 50;
        setOverallProgress(progress);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      setOverallProgress(60);
      const logContents = fileContents.map((fc) => [fc.filename, fc.content]);

      const result = await invoke("check_logs_command", {
        data: { log_contents: logContents },
        storingLogs,
      });

      // Validate result structure
      if (!result || !result.overview) {
        console.error("Invalid result structure:", result);
        throw new Error("Invalid server response: Missing overview data");
      }

      // Pass the new data to the store to append
      setLogData({
        entries: result.entries || [],
        overview: result.overview || {
          message: "",
          line_count: 0,
          unique_ips: 0,
          unique_user_agents: 0,
          crawler_count: 0,
          success_rate: 0,
          totals: {
            google: 0,
            bing: 0,
            semrush: 0,
            hrefs: 0,
            moz: 0,
            uptime: 0,
            openai: 0,
            claude: 0,
            google_bot_pages: [],
            google_bot_pages_frequency: {},
          },
          log_start_time: "",
          log_finish_time: "",
        },
      });

      setOverallProgress(95);
      await delay(300);

      setFiles((prev) => prev.map((f) => ({ ...f, success: true })));
      setOverallProgress(100);
      await delay(500);

      closeDialog();
      toast.success("Log analysis complete!");
    } catch (err) {
      console.error("Error during upload:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (files.length === 1) {
      setError(null);
    }
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {files.length === 0 ? (
        <div
          className={cn(
            "border-2 border-dashed border-brand-bright rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors dark:text-white",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/20 hover:border-primary/50",
            error && "border-destructive/50 bg-destructive/5",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="h-12 w-12 text-muted-foreground mb-2 text-brand-bright" />
          <p className="text-sm font-medium mb-1">Click to browse your files</p>
          <p className="text-xs mb-4 text-center text-black/50 dark:text-white/50">
            Supported formats: {acceptedFileTypes.join(", ")} (Max size:{" "}
            {maxSizeMB}MB)
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={acceptedFileTypes.join(",")}
            className="hidden"
            multiple
          />
          {error && (
            <div className="flex items-center text-destructive mt-2 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="border-0 rounded-lg dark:text-white">
          <div className="mb-2 flex justify-between items-center">
            <div className="flex items-center">
              <h3 className="text-sm font-medium">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveAllFiles}
              disabled={uploading}
              className="text-red-500 hover:text-red-700"
            >
              Remove all
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto mb-2 dark:bg-black/50 px-2 rounded-md">
            {files.map((fileWithProgress, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center space justify-between p-2 border mr-0.5 rounded-md dark:border-brand-dark my-2 dark:bg-slate-900",
                )}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded border-none border-r bg-muted flex items-center justify-center mr-3">
                    <span className="text-xs font-medium">
                      {fileWithProgress.file.name
                        .split(".")
                        .pop()
                        ?.toUpperCase()}
                    </span>
                  </div>
                  <div className="overflow-hidden dark:text-white">
                    <p className="text-sm font-medium truncate text-brand-bright">
                      {fileWithProgress.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(fileWithProgress.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4 text-[9px] text-red-500" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="w-full mt-2 space-y-2">
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Parsing: {progress.filename}</span>
                  <span>{progress.percent}%</span>
                </div>
                <Progress
                  value={progress.percent}
                  className="h-2 bg-gray-200 dark:bg-gray-700 [&>div]:bg-blue-500"
                />
                <div className="text-xs mt-1">
                  File {progress.current} of {progress.total}
                </div>
              </div>

              <div className="flex justify-between h-3">
                <span className="text-xs">Overall progress</span>
                <div className="text-xs">{Math.round(overallProgress)}%</div>
              </div>
              <Progress
                value={overallProgress}
                className="h-2 bg-gray-200 dark:bg-gray-700 [&>div]:bg-brand-bright"
              />
            </div>
          )}

          <Button
            onClick={handleUpload}
            className={`first-letter:w-full mt-4 bg-brand-bright text-white dark:bg-brand-bright dark:text-white hover:bg-brand-bright/90 dark:hover:bg-brand-bright/90 w-full`}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span className="flex items-center">Analysing...</span>
                <div className="border-gray-300 h-4 w-4 animate-spin rounded-full border-2 border-t-blue-600" />
              </>
            ) : (
              `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`
            )}
          </Button>

          <section className="flex mt-3 -mb-4 w-full items-center justify-center">
            <FaDatabase
              className={`text-xs ${storingLogs ? "pulse text-green-500" : "text-red-600 pulse"}`}
            />
            <span className="ml-2 text-[10px]">
              {storingLogs
                ? "Your logs will be appended to the DB"
                : "Logs will not be added to Database"}
            </span>
          </section>

          {error && (
            <div className="flex items-center text-destructive mt-2 text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
