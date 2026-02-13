// @ts-nocheck
"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { FileUpload } from "./components/file-upload";
import { SettingsPanel } from "./components/settings-panel";
import { CompressionStats } from "./components/compression-stats";
import { BatchDownload } from "./components/batch-download";
import { PreviewModal } from "./components/preview-modal";
import { ThemeToggle } from "./components/theme-toggle";
import { NamingSettings } from "./components/naming-settings";
import type { ImageFile, ResizeSettings } from "./components/types/image";

export default function ImageResizerApp() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);
  const [resizeSettings, setResizeSettings] = useState<ResizeSettings>({
    width: 1920,
    height: 1080,
    quality: 80,
    format: "jpeg",
    maintainAspectRatio: true,
    fileNamePattern: "resized_{name}",
    addPrefix: false,
    addSuffix: true,
    prefix: "",
    suffix: "resized",
  });

  const handleDownload = async (image: ImageFile) => {
    if (!image.processedBlob) return;

    try {
      const fileName = `${image.file.name.split(".")[0]}.${resizeSettings.format}`;
      const savePath = await save({
        filters: [
          {
            name: "Image",
            extensions: [resizeSettings.format],
          },
        ],
        defaultPath: fileName,
      });

      if (savePath) {
        const arrayBuffer = await image.processedBlob.arrayBuffer();
        await writeFile(savePath, new Uint8Array(arrayBuffer));
        toast.success("Image saved successfully!");
      }
    } catch (error) {
      console.error("Failed to save image:", error);
      toast.error("Failed to save image");
    }
  };

  const processImages = async () => {
    if (images.length === 0) return;

    setProcessing(true);
    setOverallProgress(0);

    const updatedImages = [...images];
    let completedCount = 0;

    for (let i = 0; i < updatedImages.length; i++) {
      const img = updatedImages[i];
      if (img.status === "completed") {
        completedCount++;
        continue;
      }

      updatedImages[i] = { ...img, status: "processing", progress: 0 };
      setImages([...updatedImages]);

      try {
        const response = await fetch(img.preview);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);

        let targetWidth = resizeSettings.width;
        let targetHeight = resizeSettings.height;

        if (resizeSettings.maintainAspectRatio) {
          const ratio = Math.min(
            resizeSettings.width / bitmap.width,
            resizeSettings.height / bitmap.height,
          );
          targetWidth = Math.round(bitmap.width * ratio);
          targetHeight = Math.round(bitmap.height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context failed");

        ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

        const quality = resizeSettings.quality / 100;
        const mimeType = `image/${resizeSettings.format === "jpeg" ? "jpeg" : resizeSettings.format}`;

        const processedBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), mimeType, quality);
        });

        updatedImages[i] = {
          ...img,
          status: "completed",
          progress: 100,
          processedSize: processedBlob.size,
          processedBlob: processedBlob,
          processedDimensions: { width: targetWidth, height: targetHeight },
        };
      } catch (error) {
        console.error("Processing failed for", img.file.name, error);
        updatedImages[i] = {
          ...img,
          status: "error",
          progress: 0,
          errorMessage: error.message,
        };
      }

      completedCount++;
      setOverallProgress((completedCount / updatedImages.length) * 100);
      setImages([...updatedImages]);
    }

    setProcessing(false);
    toast.success("Batch processing complete!");
  };

  const handlePreview = (image: ImageFile) => {
    setPreviewImage(image);
  };

  const handleToggleSelection = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, selected: !img.selected } : img,
      ),
    );
  };

  return (
    <div className="flex h-full bg-slate-100 dark:bg-brand-darker transition-colors duration-500 overflow-hidden">
      {/* Background Decorative Elements Removed for solid look */}

      {/* LEFT SIDEBAR: CONFIGURATION */}
      <aside className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-brand-darker flex flex-col h-full overflow-hidden relative z-20 shadow-xl">


        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-slate-50 dark:bg-brand-dark">
          <SettingsPanel
            resizeSettings={resizeSettings}
            setResizeSettings={setResizeSettings}
            images={images}
            processing={processing}
            onProcessImages={processImages}
            isEmbedded={true}
          />
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/10 text-center bg-white dark:bg-brand-darker">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            v2.4 Core
          </p>
        </div>
      </aside>

      {/* CENTER: ASSET WORKSPACE */}
      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar p-8 bg-slate-100 dark:bg-brand-dark">
        <div className="max-w-5xl mx-auto">
          <FileUpload
            images={images}
            setImages={setImages}
            processing={processing}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onToggleSelection={handleToggleSelection}
          />
        </div>

        <PreviewModal
          previewImage={previewImage}
          setPreviewImage={setPreviewImage}
          resizeSettings={resizeSettings}
          onDownload={handleDownload}
        />
      </main>

      {/* RIGHT SIDEBAR: EXECUTION & STATUS */}
      <aside className="w-80 flex-shrink-0 border-l border-slate-200 dark:border-white/5 bg-white dark:bg-brand-darker flex flex-col h-full overflow-hidden relative z-20 shadow-xl">
        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center gap-3 bg-white dark:bg-brand-darker">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Global Output Channel
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-slate-50 dark:bg-brand-dark">
          {/* Progress Monitor */}
          {processing && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-white dark:bg-brand-darker rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest italic">
                      Live Processing
                    </p>
                    <span className="text-xs font-black dark:text-white">
                      {Math.round(overallProgress)}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-sky-500 transition-all duration-500 ease-out"
                      style={{ width: `${overallProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:15px_15px] animate-[progress-bar-stripes_1s_linear_infinite]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              Optimization Metrics
            </h3>
            <CompressionStats images={images} />
          </div>

          {/* Naming Configuration */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              File Naming Schema
            </h3>
            <NamingSettings
              resizeSettings={resizeSettings}
              setResizeSettings={setResizeSettings}
              processing={processing}
            />
          </div>

          {/* Export Pipeline */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              Export Bundle
            </h3>
            <BatchDownload
              images={images}
              setImages={setImages}
              resizeSettings={resizeSettings}
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/10 text-center bg-white dark:bg-brand-darker">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Ready for Batch
          </p>
        </div>
      </aside>
    </div>
  );
}
