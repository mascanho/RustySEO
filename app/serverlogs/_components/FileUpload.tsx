// @ts-nocheck
"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useLogAnalysis } from "@/store/ServerLogsStore";

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
    if (files.length === 0) return;

    setUploading(true);
    setOverallProgress(0);
    await delay(100); // Small delay to ensure state updates

    if (files.length > 10) {
      toast.info(
        "Whoohaaaa, that is a lot of files. This might take a while...",
      );
    }

    try {
      // Initial progress
      setOverallProgress(10);
      await delay(200);

      // Process all files with progress updates
      const fileContents = await Promise.all(
        files.map(async (fileWithProgress, index) => {
          try {
            const content = await readFile(fileWithProgress.file);
            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === index ? { ...f, success: true } : f,
              ),
            );

            // Update progress incrementally for each file
            const progressIncrement = 30 / files.length;
            setOverallProgress((prev) =>
              Math.min(prev + progressIncrement, 40),
            );

            return { filename: fileWithProgress.file.name, content };
          } catch (err) {
            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === index
                  ? {
                      ...f,
                      error:
                        err instanceof Error ? err.message : "Upload failed",
                    }
                  : f,
              ),
            );
            throw err;
          }
        }),
      );

      // Update progress to indicate processing
      setOverallProgress(60);
      await delay(300);

      // Prepare data for backend
      const logContents = fileContents.map((fc) => [fc.filename, fc.content]);

      // Update progress to indicate backend processing
      setOverallProgress(80);
      await delay(300);

      const result = await invoke("check_logs_command", {
        data: { log_contents: logContents },
      });

      setLogData(result);
      console.log(result, "This is the result");

      // Mark all files as successfully uploaded
      setFiles((prev) => prev.map((f) => ({ ...f, success: true })));

      // Final progress update
      setOverallProgress(100);
      await delay(500);

      closeDialog();
      toast.success("Upload complete!");
    } catch (err) {
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
            <h3 className="text-sm font-medium">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </h3>
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

          <div className="max-h-60 overflow-y-auto mb-2">
            {files.map((fileWithProgress, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-2 border rounded-md dark:border-brand-dark mb-2",
                )}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded border-none bg-muted flex items-center justify-center mr-3">
                    <span className="text-xs font-medium">
                      {fileWithProgress.file.name
                        .split(".")
                        .pop()
                        ?.toUpperCase()}
                    </span>
                  </div>
                  <div className="overflow-hidden dark:text-white">
                    <p className="text-sm font-medium truncate">
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
            <div className="w-full mt-2">
              <Progress
                value={overallProgress}
                className="h-2 bg-gray-200 dark:bg-gray-700 [&>div]:bg-brand-bright"
              />
              <div className="flex justify-between items-center text-xs mt-1">
                <div className="flex items-center">
                  {overallProgress === 100 ? (
                    "Upload complete"
                  ) : (
                    <>
                      <span className="flex items-center">
                        {overallProgress < 40
                          ? "Reading files"
                          : overallProgress < 60
                            ? "Processing files"
                            : overallProgress < 80
                              ? "Preparing data"
                              : "Uploading data"}
                        <span className="flex items-center mx-2">
                          <span className="animate-bounce [animation-delay:-0.3s]">
                            .
                          </span>
                          <span className="animate-bounce [animation-delay:-0.15s]">
                            .
                          </span>
                          <span className="animate-bounce">.</span>
                        </span>
                        {Math.round(overallProgress)}%
                      </span>
                    </>
                  )}
                </div>
                {overallProgress === 100 && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleUpload}
            className="w-full mt-2 bg-brand-bright text-white dark:bg-brand-bright dark:text-white hover:bg-brand-bright/90 dark:hover:bg-brand-bright/90"
            disabled={uploading}
          >
            {uploading ? (
              <span className="flex items-center">
                Uploading... {Math.round(overallProgress)}%
              </span>
            ) : (
              `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`
            )}
          </Button>

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
