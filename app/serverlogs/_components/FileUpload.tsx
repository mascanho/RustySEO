"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  className?: string;
}

export function FileUpload({
  maxSizeMB = 245,
  acceptedFileTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
    "text",
  ],
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: any) => {
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds the maximum limit of ${maxSizeMB}MB.`);
      return false;
    }

    const fileType = file.type || "";
    const fileExtension = file.name.split(".").pop().toLowerCase();

    // Check if the file type or extension is accepted
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
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        console.log("Selected file:", droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        console.log("Selected file:", selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(0);

      // Convert File to Uint8Array for Tauri
      const arrayBuffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuffer));

      console.log("Uploading file:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // Simulate progress (replace with actual progress events if supported by your backend)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            // Stop at 90% until completion
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);

      // Call Tauri backend command
      const result = await invoke("handle_file_upload", {
        fileName: file.name,
        fileType: file.type,
        fileBytes: bytes,
      });

      console.log("Upload result:", result);

      // Complete the progress
      setProgress(100);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setProgress(0);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {!file ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors dark:text-white",
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
          <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm font-medium mb-1">
            Drag & drop your file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Supported formats: {acceptedFileTypes.join(", ")} (Max size:{" "}
            {maxSizeMB}MB)
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={acceptedFileTypes.join(",")}
            className="hidden"
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
          <div className="flex items-center justify-between mb-2 border rounded-md dark:border-x-brand-highlight">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center mr-3">
                <span className="text-xs font-medium">
                  {file.name.split(".").pop()?.toUpperCase()}
                </span>
              </div>
              <div className="overflow-hidden dark:text-white">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              disabled={uploading}
            >
              <X className="h-4 w-4 text-[9px] text-red-500" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>

          {uploading || success ? (
            <div className="space-y-2 dark:text-white">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between items-center text-xs">
                <span>
                  {success ? "Upload complete" : `Uploading... ${progress}%`}
                </span>
                {success && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
            </div>
          ) : (
            <Button onClick={handleUpload} className="w-full mt-2">
              Upload File
            </Button>
          )}

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
