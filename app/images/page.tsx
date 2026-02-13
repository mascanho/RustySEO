// @ts-nocheck
"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { FileUpload } from "./components/file-upload";
import { SettingsPanel } from "./components/settings-panel";
import { CompressionStats } from "./components/compression-stats";
import { BatchDownload } from "./components/batch-download";
import { PreviewModal } from "./components/preview-modal";
import { ThemeToggle } from "./components/theme-toggle"; // Keeping import but unused in render
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
        let imageData: number[] | undefined;
        if (!img.path) {
          const arrayBuffer = await img.file.arrayBuffer();
          imageData = Array.from(new Uint8Array(arrayBuffer));
        }

        const resultBytes = await invoke<number[]>("process_single_image", {
          imageData,
          path: img.path,
          width: resizeSettings.width,
          height: resizeSettings.height,
          quality: resizeSettings.quality,
          format: resizeSettings.format,
          maintainAspectRatio: resizeSettings.maintainAspectRatio,
        });

        const u8Array = new Uint8Array(resultBytes);
        const mimeType = `image/${resizeSettings.format === "jpeg" ? "jpeg" : resizeSettings.format}`;
        const processedBlob = new Blob([u8Array], { type: mimeType });
        const bitmap = await createImageBitmap(processedBlob);

        updatedImages[i] = {
          ...img,
          status: "completed",
          progress: 100,
          processedSize: processedBlob.size,
          processedBlob: processedBlob,
          processedDimensions: { width: bitmap.width, height: bitmap.height },
        };
      } catch (error) {
        console.error("Processing failed for", img.file.name, error);
        updatedImages[i] = {
          ...img,
          status: "error",
          progress: 0,
          errorMessage: String(error),
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-slate-50 dark:bg-brand-darker">
          {/* Progress Monitor */}
          {processing && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-white dark:bg-brand-darker rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-bright" />
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-brand-bright uppercase tracking-widest italic">
                      Live Processing
                    </p>
                    <span className="text-xs font-black dark:text-white">
                      {Math.round(overallProgress)}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-brand-bright transition-all duration-500 ease-out"
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
          <div className="space-y-3 dark:bg-brand-darke">
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
