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
import { useSelectedProject } from "@/store/logFilterStore";
import { open } from "@tauri-apps/plugin-dialog";
// import { stat } from "@tauri-apps/plugin-fs";

interface FileUploadProps {
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  className?: string;
  closeDialog: () => void;
}

interface SelectedFilePath {
  name: string;
  path: string;
  size?: number;
  success: boolean;
  error: string | null;
}

interface ProgressUpdate {
  current_file: number;
  total_files: number;
  percentage: number;
  filename: string;
  phase: string;
}

export function FileUpload({
  acceptedFileTypes = ["text/plain", ".log", ".txt"],
  className,
  closeDialog,
}: FileUploadProps) {
  const [files, setFiles] = useState<SelectedFilePath[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const { setLogData } = useLogAnalysis();
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
    filename: "",
    phase: "",
  });
  const { uploadedLogFiles, setUploadedLogFiles } = useServerLogsStore();
  const { selectedProject } = useSelectedProject();
  const [storingLogs, setStoringLogs] = useState(false);

  // Get the initial state of storing logs from the localStorage
  useEffect(() => {
    const storedValue = localStorage.getItem("logsStorage");
    if (
      !storedValue ||
      storedValue === "false" ||
      storedValue === false ||
      storedValue === null
    ) {
      setStoringLogs(false);
    } else {
      setStoringLogs(true);
    }
  }, []);

  useEffect(() => {
    const unlisten = listen("progress-update", (event) => {
      const payload = event.payload as ProgressUpdate;

      setProgress((prev) => ({
        ...prev,
        current: payload.current_file,
        total: payload.total_files,
        percent: payload.percentage,
        filename: payload.filename,
        phase: payload.phase,
      }));

      if (payload.phase === "started") {
        toast.info(`Starting to process ${payload.filename}`);
      }
    });

    return () => {
      unlisten.then((f) => f()).catch(console.error);
    };
  }, []);

  // Use Tauri's dialog to select files — returns file paths, never loading content into JS memory
  const handleSelectFiles = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Log Files",
            extensions: ["log", "txt"],
          },
        ],
      });

      if (!selected) return;

      // open() returns string | string[] | null
      const paths = Array.isArray(selected) ? selected : [selected];

      const newFiles: SelectedFilePath[] = await Promise.all(
        paths.map(async (filePath) => {
          const name = filePath.split("/").pop()?.split("\\").pop() || filePath;
          let size = 0;
          try {
            size = await invoke<number>("get_file_size", { path: filePath });
          } catch (e) {
            console.error("Failed to get file size via backend:", e);
          }
          return {
            name,
            path: filePath,
            size,
            success: false,
            error: null,
          };
        }),
      );

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
        setError(null);
      }
    } catch (err) {
      console.error("File selection error:", err);
      setError("Failed to open file dialog");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return "Unknown";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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
      setOverallProgress(5);

      const filesUploaded = files.map((f) => f.name);
      const timeUploaded = new Date().toISOString();
      const individualSizes = files.map((f) => f.size || 0);
      const totalSize = individualSizes.reduce((a, b) => a + b, 0);

      const logEntry = {
        names: filesUploaded,
        time: timeUploaded,
        individualSizes: individualSizes,
        totalSize: totalSize,
        totalBatchSize: totalSize,
      };

      // Set the state for the popup modal
      setUploadedLogFiles(logEntry);
      const project = selectedProject;

      // Collect all file paths
      const allPaths = files.map((f) => f.path);

      // Send ALL file paths to the backend in one call — Rust reads them with BufReader
      // No file content in JS memory, no IPC serialization of file content
      setProgress((prev) => ({
        ...prev,
        filename: `${files.length} file(s)`,
        percent: 0,
      }));

      await invoke("check_logs_from_paths_command", {
        filePaths: allPaths,
        storingLogs,
        project: project || "",
      });

      // Mark all files as success
      setFiles((prev) => prev.map((f) => ({ ...f, success: true })));

      setOverallProgress(100);
      await delay(300);
      toast.success("Log analysis complete!");
      closeDialog();
    } catch (err) {
      console.error("Error during upload:", err);
      setError(err instanceof Error ? err.message : String(err));
      toast.error("Upload failed: " + (err instanceof Error ? err.message : String(err)));
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
  };

  const totalSelectionSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <div className={cn("w-full", className)}>
      {files.length === 0 ? (
        <div
          className={cn(
            "border-2 border-dashed  border-brand-bright rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors dark:text-white",
            error && "border-destructive/50 bg-destructive/5",
          )}
          onClick={handleSelectFiles}
        >
          <UploadCloud className="h-12 w-12 text-muted-foreground mb-2 text-brand-bright" />
          <p className="text-sm font-medium mb-1">Click to browse your files</p>
          <p className="text-xs mb-4 text-center text-black/50 dark:text-white/50">
            Supported formats: .log, .txt
          </p>
          {error && (
            <div className="flex items-center text-destructive mt-2 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="border-0 rounded-lg dark:text-white">
          <div className="mb-2 flex justify-between items-center ">
            <div className="flex items-center">
              <h3 className="text-sm font-medium">
                {files.length} file{files.length !== 1 ? "s" : ""} selected •{" "}
                {formatFileSize(totalSelectionSize)}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectFiles}
                disabled={uploading}
                className="text-brand-bright hover:text-brand-bright/80 text-xs"
              >
                Add more
              </Button>
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
          </div>

          <div className="max-h-60 overflow-y-auto mb-2 px-2 rounded-md border dark:border-brand-dark">
            {files.map((fileInfo, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center space justify-between p-2 border mr-0.5 rounded-md dark:border-brand-dark my-2 dark:bg-slate-900 border-brand-bright/30 bg-brand-bright/20",
                )}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded border-none border-r bg-muted flex items-center justify-center mr-3">
                    <span className="text-xs font-medium">
                      {fileInfo.name.split(".").pop()?.toUpperCase()}
                    </span>
                  </div>
                  <div className="overflow-hidden dark:text-white">
                    <p className="text-sm font-medium truncate text-brand-bright">
                      {fileInfo.name}
                    </p>
                    <div className="flex flex-col">
                      <p className="text-[10px] text-muted-foreground truncate max-w-[250px] opacity-70">
                        {fileInfo.path}
                      </p>
                      <p className="text-xs font-semibold text-brand-bright/80">
                        {formatFileSize(fileInfo.size)}
                      </p>
                    </div>
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
                  <span>
                    Processing: {progress.filename}{" "}
                    {files.find((f) => f.name === progress.filename) && (
                      <span className="text-brand-bright font-medium">
                        ({formatFileSize(files.find((f) => f.name === progress.filename)?.size)})
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-brand-bright">{Math.round(progress.percent)}%</span>
                </div>
                <Progress
                  value={progress.percent}
                  className="h-2 bg-gray-200 dark:bg-gray-700 [&>div]:bg-blue-500"
                />
              </div>
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
              `Analyze ${files.length} File${files.length !== 1 ? "s" : ""} (${formatFileSize(totalSelectionSize)})`
            )}
          </Button>

          <section className="flex mt-3 -mb-4 w-full items-center justify-center">
            <FaDatabase
              className={`text-xs ${storingLogs ? "text-green-500" : "text-red-600"}`}
            />
            <span className="ml-2 text-[10px]">
              {storingLogs
                ? "Your logs will be appended to the DB"
                : "Logs will not be added to Database"}
            </span>
          </section>

          {error && (
            <div className="flex items-center text-destructive mt-4 text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
