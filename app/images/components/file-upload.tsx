// @ts-nocheck
"use client";

import React, { useCallback } from "react";
import { Upload, X, Eye, Download, CheckSquare, Square } from "lucide-react";
import type { ImageFile } from "./types/image";
import { listen } from "@tauri-apps/api/event";
import { readFile } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";

interface FileUploadProps {
  images: ImageFile[];
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  processing: boolean;
  onPreview: (image: ImageFile) => void;
  onDownload: (image: ImageFile) => void;
  onToggleSelection: (id: string) => void;
  onTerminate?: () => void;
}

export function FileUpload({
  images,
  setImages,
  processing,
  onPreview,
  onDownload,
  onToggleSelection,
  onTerminate,
}: FileUploadProps) {
  const [dragActive, setDragActive] = React.useState(false);

  const addImages = useCallback(
    (items: { file: File; path?: string }[]) => {
      const newImages: ImageFile[] = items.map(({ file, path }) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        path,
        preview: URL.createObjectURL(file),
        originalSize: file.size,
        status: "pending",
        progress: 0,
        selected: true,
      }));

      setImages((prev) => [...prev, ...newImages]);

      newImages.forEach((imageFile) => {
        const imgElement = new Image();
        imgElement.onload = () => {
          setImages((prev) =>
            prev.map((item) =>
              item.id === imageFile.id
                ? {
                    ...item,
                    originalDimensions: {
                      width: imgElement.naturalWidth,
                      height: imgElement.naturalHeight,
                    },
                  }
                : item,
            ),
          );
        };
        imgElement.src = imageFile.preview;
      });
    },
    [setImages],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (files.length > 0) {
        addImages(files.map((file) => ({ file })));
      }
    },
    [addImages],
  );

  // Listen for Tauri file drop
  React.useEffect(() => {
    const unlisteners: (() => void)[] = [];

    async function setupListeners() {
      const unlistenDrop = await listen("tauri://file-drop", async (event) => {
        setDragActive(false);
        const paths = event.payload as string[];

        if (paths && paths.length > 0) {
          toast.info(`Processing ${paths.length} file(s)...`);
          const items: { file: File; path: string }[] = [];

          for (const path of paths) {
            try {
              const contents = await readFile(path);
              const name = path.split(/[/\\]/).pop() || "unknown";
              const ext = name.split(".").pop()?.toLowerCase() || "";

              let type = "image/jpeg"; // Default to jpeg to be permissive

              if (["jpg", "jpeg"].includes(ext)) type = "image/jpeg";
              else if (ext === "png") type = "image/png";
              else if (ext === "webp") type = "image/webp";
              else if (ext === "gif") type = "image/gif";
              else if (ext === "svg") type = "image/svg+xml";
              else if (ext === "bmp") type = "image/bmp";
              else if (ext === "ico") type = "image/x-icon";
              else if (["tif", "tiff"].includes(ext)) type = "image/tiff";
              else if (["heic", "heif"].includes(ext)) type = "image/heic";

              const file = new File([contents], name, { type });
              items.push({ file, path });
            } catch (err) {
              console.error(`Failed to read dropped file: ${path}`, err);
              toast.error(`Could not read file: ${path}`);
            }
          }

          if (items.length > 0) {
            addImages(items);
            toast.success(`Successfully imported ${items.length} image(s)`);
          }
        }
      });
      unlisteners.push(unlistenDrop);

      const unlistenHover = await listen("tauri://file-drop-hover", () => {
        setDragActive(true);
      });
      unlisteners.push(unlistenHover);

      const unlistenCancelled = await listen(
        "tauri://file-drop-cancelled",
        () => {
          setDragActive(false);
        },
      );
      unlisteners.push(unlistenCancelled);

      // toast.info("Drag & drop initialized");
    }

    setupListeners().catch((err) => {
      console.error("Failed to setup drag listeners", err);
      toast.error("Failed to initialize drag & drop system");
    });

    return () => {
      unlisteners.forEach((fn) => fn());
    };
  }, [addImages]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addImages(files.map((file) => ({ file })));
      e.target.value = "";
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  // Prevent default drag behavior globally to ensure drops works
  React.useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", handleGlobalDragOver);
    window.addEventListener("drop", handleGlobalDrop);
    return () => {
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("drop", handleGlobalDrop);
    };
  }, []);

  const handleManualDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      // Handle standard generic drop (for when dragDropEnabled is false or web fallback)
      if (
        e.dataTransfer &&
        e.dataTransfer.files &&
        e.dataTransfer.files.length > 0
      ) {
        const files = Array.from(e.dataTransfer.files).filter((file) =>
          file.type.startsWith("image/"),
        );
        if (files.length > 0) {
          addImages(files.map((file) => ({ file })));
          toast.success(`Dropped ${files.length} images`);
        }
      }
    },
    [addImages],
  );

  return (
    <div className=" bg-white dark:bg-brand-darker rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 pl-2  pt-4 pb-2  h-full">
      <div className="flex items-center justify-between mb-4 pr-5">
        <div className="mx-4">
          <h2 className="text-2xl font-black dark:text-white uppercase tracking-tight">
            Image Studio
          </h2>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-1">
            Media optimization pipeline
          </p>
        </div>
      </div>

      <div className="space-y-6 mx-4 ">
        <div
          className={`relative ${images.length > 0 ? "h-32" : "h-[calc(100vh-240px)]"} border-2 border-dashed rounded-2xl p-4 text-center transition-all max-h-[calc(100vh-240px)] mr-2 duration-300 group ${
            dragActive
              ? "border-brand-bright bg-brand-bright/10 dark:bg-brand-bright/5 scale-[0.99]"
              : "border-slate-200 dark:border-white/10 hover:border-brand-bright dark:hover:border-brand-bright/50 hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            onDrop={handleManualDrop} // Explicitly handle drops on the input
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none ">
            {images.length === 0 ? (
              <div className="space-y-4 flex flex-col items-center">
                <div className="p-4 rounded-full bg-white dark:bg-brand-dark group-hover:bg-brand-bright/10 dark:group-hover:bg-brand-bright/10 transition-all duration-300 shadow-sm border border-slate-100 dark:border-white/10">
                  <Upload className="w-10 h-10 text-slate-300 group-hover:text-brand-bright transition-colors" />
                </div>
                <div>
                  <h3 className="text-lg font-black dark:text-white transition-colors group-hover:text-brand-bright">
                    {dragActive ? "DROP ASSETS NOW" : "IMPORT ASSETS"}
                  </h3>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                    Drag & Drop or{" "}
                    <span className="text-brand-bright">
                      Source local files
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-brand-bright">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-black dark:text-white uppercase tracking-widest">
                  APPEND MORE ASSETS TO QUEUE
                </span>
              </div>
            )}
          </div>
        </div>

        {images.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between pr-1">
              <div className="flex items-center gap-3">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                  Active Pipeline
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black font-black text-[9px] uppercase tracking-widest">
                  {images.length} Units
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="h-7 text-[9px] font-black uppercase tracking-wider text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg px-3 transition-all border border-rose-500/20"
                  onClick={() => (onTerminate ? onTerminate() : setImages([]))}
                  disabled={processing}
                >
                  Clear Queue
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[calc(100vh-26.5rem)] overflow-y-auto pr-2 custom-scrollbar min-h-[100px]">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`group relative flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 border ${
                    image.selected && image.status === "completed"
                      ? "bg-slate-50 dark:bg-white/5 border-brand-bright/50 shadow-md"
                      : "bg-white dark:bg-brand-dark border-slate-100 dark:border-white/10 hover:border-brand-bright"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={image.preview || "/placeholder.svg"}
                      alt="Preview"
                      className={`w-14 h-14 object-cover rounded-xl shadow-lg transition-all duration-500 group-hover:scale-105 cursor-pointer ${
                        image.selected && image.status === "completed"
                          ? "ring-2 ring-brand-bright"
                          : ""
                      }`}
                      onClick={() => onPreview(image)}
                    />
                    {image.status === "completed" && (
                      <button
                        onClick={() => onToggleSelection(image.id)}
                        className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-lg flex items-center justify-center shadow-xl transition-all border ${
                          image.selected
                            ? "bg-brand-bright border-brand-bright text-white"
                            : "bg-white dark:bg-brand-darker border-slate-200 dark:border-white/20 text-slate-400"
                        }`}
                      >
                        {image.selected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 mb-1">
                      <p className="text-[11px] font-black dark:text-white truncate uppercase tracking-tight">
                        {image.file.name}
                      </p>
                      <span
                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-sm border shrink-0 ${
                          image.status === "completed"
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : image.status === "processing"
                              ? "bg-brand-bright border-brand-bright text-white animate-pulse"
                              : image.status === "error"
                                ? "bg-rose-500 border-rose-600 text-white"
                                : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
                        }`}
                      >
                        {image.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                          Mass
                        </span>
                        <span className="text-[9px] font-black dark:text-white">
                          {formatFileSize(image.originalSize)}
                          {image.processedSize && (
                            <span className="text-brand-bright ml-1">
                              → {formatFileSize(image.processedSize)}
                            </span>
                          )}
                        </span>
                      </div>

                      {image.originalDimensions && (
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                            Res
                          </span>
                          <span className="text-[9px] font-black dark:text-white">
                            {image.originalDimensions.width}×
                            {image.originalDimensions.height}
                            {image.processedDimensions && (
                              <span className="text-brand-bright ml-1">
                                → {image.processedDimensions.width}×
                                {image.processedDimensions.height}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {image.status === "processing" && (
                      <div className="mt-2 relative h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/5">
                        <div className="absolute top-0 left-0 h-full w-[30%] bg-brand-bright rounded-full animate-[processing-bar-slide_1s_ease-in-out_infinite]" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {image.status === "completed" && (
                      <button
                        className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-400 hover:text-brand-bright hover:border-brand-bright/50 flex items-center justify-center transition-all shadow-sm"
                        onClick={() => onPreview(image)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-400 hover:text-rose-500 hover:border-rose-500/50 flex items-center justify-center transition-all shadow-sm"
                      onClick={() => removeImage(image.id)}
                      disabled={processing}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
