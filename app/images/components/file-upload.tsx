// @ts-nocheck
"use client";

import React, { useCallback } from "react";
import { Upload, X, Eye, Download, CheckSquare, Square } from "lucide-react";
import type { ImageFile } from "./types/image";

interface FileUploadProps {
  images: ImageFile[];
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  processing: boolean;
  onPreview: (image: ImageFile) => void;
  onDownload: (image: ImageFile) => void;
  onToggleSelection: (id: string) => void;
}

export function FileUpload({
  images,
  setImages,
  processing,
  onPreview,
  onDownload,
  onToggleSelection,
}: FileUploadProps) {
  const [dragActive, setDragActive] = React.useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    addImages(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addImages(files);
    }
  };

  const addImages = (files: File[]) => {
    const newImages: ImageFile[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
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

  return (
    <div className="shadow-xl bg-white dark:bg-brand-darker rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black dark:text-white uppercase tracking-tight">Assets Studio</h2>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-1">
            Media optimization pipeline
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
          <Upload className="w-6 h-6 text-sky-500" />
        </div>
      </div>

      <div className="space-y-6">
        <div
          className={`relative ${images.length > 0 ? 'h-32' : 'h-64'} border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-300 group ${dragActive
            ? "border-sky-500 bg-sky-50 dark:bg-sky-500/5 scale-[0.99]"
            : "border-slate-200 dark:border-white/10 hover:border-sky-400 dark:hover:border-sky-500/50 hover:bg-slate-50 dark:hover:bg-white/5"
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
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {images.length === 0 ? (
              <div className="space-y-4 flex flex-col items-center">
                <div className="p-4 rounded-full bg-white dark:bg-brand-dark group-hover:bg-sky-50 dark:group-hover:bg-sky-500/10 transition-all duration-300 shadow-sm border border-slate-100 dark:border-white/10">
                  <Upload className="w-10 h-10 text-slate-300 group-hover:text-sky-500 transition-colors" />
                </div>
                <div>
                  <h3 className="text-lg font-black dark:text-white transition-colors group-hover:text-sky-500">
                    {dragActive ? "DROP ASSETS NOW" : "IMPORT ASSETS"}
                  </h3>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                    Drag & Drop or <span className="text-sky-500">Source local files</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-sky-500">
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
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Active Pipeline</h4>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black font-black text-[9px] uppercase tracking-widest">
                  {images.length} Units
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="h-7 text-[9px] font-black uppercase tracking-wider text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg px-3 transition-all border border-rose-500/20"
                  onClick={() => setImages([])}
                  disabled={processing}
                >
                  Terminate Sequence
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar min-h-[100px]">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`group relative flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 border ${image.selected && image.status === "completed"
                    ? "bg-slate-50 dark:bg-white/5 border-sky-500/50 shadow-md"
                    : "bg-white dark:bg-brand-dark border-slate-100 dark:border-white/10 hover:border-sky-500"
                    }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={image.preview || "/placeholder.svg"}
                      alt="Preview"
                      className={`w-14 h-14 object-cover rounded-xl shadow-lg transition-all duration-500 group-hover:scale-105 cursor-pointer ${image.selected && image.status === "completed" ? "ring-2 ring-sky-500" : ""
                        }`}
                      onClick={() => onPreview(image)}
                    />
                    {image.status === "completed" && (
                      <button
                        onClick={() => onToggleSelection(image.id)}
                        className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-lg flex items-center justify-center shadow-xl transition-all border ${image.selected
                          ? "bg-sky-500 border-sky-600 text-white"
                          : "bg-white dark:bg-brand-darker border-slate-200 dark:border-white/20 text-slate-400"
                          }`}
                      >
                        {image.selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-black dark:text-white truncate pr-4 uppercase tracking-tight">
                        {image.file.name}
                      </p>
                      <span
                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-sm border ${image.status === "completed"
                          ? "bg-emerald-500 border-emerald-600 text-white"
                          : image.status === "processing"
                            ? "bg-sky-500 border-sky-600 text-white animate-pulse"
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
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Mass</span>
                        <span className="text-[9px] font-black dark:text-white">
                          {formatFileSize(image.originalSize)}
                          {image.processedSize && (
                            <span className="text-sky-500 ml-1">
                              → {formatFileSize(image.processedSize)}
                            </span>
                          )}
                        </span>
                      </div>

                      {image.originalDimensions && (
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Res</span>
                          <span className="text-[9px] font-black dark:text-white">
                            {image.originalDimensions.width}×{image.originalDimensions.height}
                            {image.processedDimensions && (
                              <span className="text-sky-500 ml-1">
                                → {image.processedDimensions.width}×{image.processedDimensions.height}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {image.status === "processing" && image.progress !== undefined && (
                      <div className="mt-2 relative h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/5">
                        <div
                          className="absolute top-0 left-0 h-full bg-sky-500 transition-all duration-300"
                          style={{ width: `${image.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {image.status === "completed" && (
                      <button
                        className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-400 hover:text-sky-500 hover:border-sky-500/50 flex items-center justify-center transition-all shadow-sm"
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
