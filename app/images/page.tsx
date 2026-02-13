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
import {
  useBatchDownload,
  BatchSelection,
  BatchDownloadButton,
} from "./components/batch-download";
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

  const {
    downloadingZip,
    zipProgress,
    downloadSelectedImages,
    toggleAllSelection,
    completedImages,
    selectedImages,
  } = useBatchDownload(images, setImages, resizeSettings);

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

    const updatedImages = images.map((img) => ({
      ...img,
      status: "processing" as const,
      progress: 0,
      processedBlob: undefined,
      processedSize: undefined,
      processedDimensions: undefined,
    }));
    setImages(updatedImages);

    let completedCount = 0;

    for (let i = 0; i < updatedImages.length; i++) {
      const img = updatedImages[i];

      try {
        let imageData: number[] | undefined;
        if (!img.path) {
          const arrayBuffer = await img.file.arrayBuffer();
          imageData = Array.from(new Uint8Array(arrayBuffer));
        }

        const resultBytes = await invoke<number[]>("process_single_image", {
          imageData,
          path: img.path,
          width: Math.max(1, resizeSettings.width || 1920),
          height: Math.max(1, resizeSettings.height || 1080),
          quality: Math.min(100, Math.max(1, resizeSettings.quality || 80)),
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
    toast.success("Processing complete!");
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

  const handleTerminate = () => {
    setImages((prevImages) => {
      prevImages.forEach((img) => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
      return [];
    });
    setProcessing(false);
    setOverallProgress(0);
  };

  return (
    <div className="flex h-[calc(100vh-5.8rem)] bg-slate-100 dark:bg-brand-darker transition-colors duration-500 overflow-hidden rounded-xl border border-slate-200 dark:border-white/5 shadow-2xl">
      {/* Background Decorative Elements Removed for solid look */}

      {/* LEFT SIDEBAR: CONFIGURATION */}
      <aside className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-brand-darker flex flex-col h-full overflow-hidden relative z-20">
        <div className="flex-1 overflow-hidden">
          <SettingsPanel
            resizeSettings={resizeSettings}
            setResizeSettings={setResizeSettings}
            images={images}
            processing={processing}
            onProcessImages={processImages}
            isEmbedded={true}
            onTerminate={handleTerminate}
          />
        </div>
      </aside>

      {/* CENTER: ASSET WORKSPACE */}
      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar p-4 bg-slate-100 dark:bg-brand-dark h-full -mt-1">
        <div className="max-w-7xl mx-auto h-full">
          <FileUpload
            images={images}
            setImages={setImages}
            processing={processing}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onToggleSelection={handleToggleSelection}
            onTerminate={handleTerminate}
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
      <aside className="w-80 mb-1 flex-shrink-0 border-l border-slate-200 dark:border-white/5 bg-white dark:bg-brand-darker flex flex-col  overflow-hidden relative z-20 shadow-xl">
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 dark:bg-brand-darker">
          <div className="flex-1 overflow-hidden custom-scrollbar p-4 space-y-4">
            {/* Progress Monitor */}
            {overallProgress > 0 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-white dark:bg-brand-darker rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-bright" />
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-brand-bright uppercase tracking-widest italic">
                        Global Progress
                      </p>
                      <span className="text-xs font-black dark:text-white">
                        {Math.round(overallProgress)}%
                      </span>
                    </div>
                    <div className="relative h-2.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-bright to-brand-bright/80 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${overallProgress}%` }}
                      >
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/20" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Section */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Optimization Metrics
              </h3>
              <CompressionStats images={images} />
            </div>

            {/* Naming Configuration */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                File Naming Schema
              </h3>
              <NamingSettings
                resizeSettings={resizeSettings}
                setResizeSettings={setResizeSettings}
                processing={processing}
              />
            </div>

            {/* Export Bundle Selection */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Export Bundle
              </h3>
              <BatchSelection
                completedImages={completedImages}
                selectedImages={selectedImages}
                toggleAllSelection={toggleAllSelection}
                downloadingZip={downloadingZip}
                zipProgress={zipProgress}
              />
            </div>
          </div>

          {/* Action Button: Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/60 flex-shrink-0">
            <BatchDownloadButton
              selectedImages={selectedImages}
              downloadingZip={downloadingZip}
              downloadSelectedImages={downloadSelectedImages}
              processing={processing}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
