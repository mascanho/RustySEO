// @ts-nocheck
"use client";

import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { Download, CheckSquare, Square } from "lucide-react";
import type { ImageFile, ResizeSettings } from "./types/image";

export function useBatchDownload(
  images: ImageFile[],
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  resizeSettings: ResizeSettings,
) {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const completedImages = images.filter((img) => img.status === "completed");
  const selectedImages = images.filter(
    (img) => img.selected && img.status === "completed",
  );

  const generateFileName = (originalName: string, settings: ResizeSettings) => {
    const nameWithoutExt = originalName.split(".")[0];
    const width = settings.width ?? 1920;
    const height = settings.height ?? 1080;
    const quality = settings.quality ?? 80;
    let fileName = settings.fileNamePattern
      .replace("{name}", nameWithoutExt)
      .replace("{width}", width.toString())
      .replace("{height}", height.toString())
      .replace("{quality}", quality.toString())
      .replace("{format}", settings.format);

    if (settings.addPrefix && settings.prefix) {
      fileName = `${settings.prefix}_${fileName}`;
    }

    if (settings.addSuffix && settings.suffix) {
      fileName = `${fileName}_${settings.suffix}`;
    }

    return `${fileName}.${settings.format}`;
  };

  const toggleAllSelection = () => {
    const allSelected = completedImages.every((img) => img.selected);
    setImages((prev) =>
      prev.map((img) =>
        img.status === "completed" ? { ...img, selected: !allSelected } : img,
      ),
    );
  };

  const downloadImage = async (image: ImageFile) => {
    if (!image.processedBlob) return;

    try {
      const fileName = generateFileName(image.file.name, resizeSettings);
      const savePath = await save({
        filters: [
          {
            name: "Image",
            extensions: [resizeSettings.format.toLowerCase()],
          },
        ],
        defaultPath: fileName,
      });

      if (savePath) {
        const arrayBuffer = await image.processedBlob.arrayBuffer();
        await writeFile(savePath, new Uint8Array(arrayBuffer));
        toast.success("Image saved successfully!");
      } else {
        toast.info("Download cancelled");
      }
    } catch (error) {
      console.error("Failed to save image:", error);
      toast.error("Failed to save image. Please try again.");
    }
  };

  const createZipFile = async (
    imagesToDownload: ImageFile[],
  ): Promise<Blob> => {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    setZipProgress(0);

    for (let i = 0; i < imagesToDownload.length; i++) {
      const image = imagesToDownload[i];
      if (image.processedBlob) {
        const fileName = generateFileName(image.file.name, resizeSettings);
        zip.file(fileName, image.processedBlob);
      }
      setZipProgress(((i + 1) / imagesToDownload.length) * 100);
    }

    return await zip.generateAsync({ type: "blob" });
  };

  const downloadSelectedImages = async () => {
    if (selectedImages.length === 0) return;

    if (selectedImages.length === 1) {
      downloadImage(selectedImages[0]);
      return;
    }

    setDownloadingZip(true);
    try {
      const zipBlob = await createZipFile(selectedImages);
      const savePath = await save({
        filters: [
          {
            name: "ZIP Archive",
            extensions: ["zip"],
          },
        ],
        defaultPath: `resized_images_${new Date().toISOString().split("T")[0]}.zip`,
      });

      if (savePath) {
        const arrayBuffer = await zipBlob.arrayBuffer();
        await writeFile(savePath, new Uint8Array(arrayBuffer));
        toast.success(
          `Successfully downloaded ${selectedImages.length} images as ZIP!`,
        );
      } else {
        toast.info("Download cancelled");
      }
    } catch (error) {
      console.error("Error creating ZIP file:", error);
      toast.error("Failed to create ZIP file. Please try again.");
    } finally {
      setDownloadingZip(false);
      setZipProgress(0);
    }
  };

  return {
    downloadingZip,
    zipProgress,
    downloadSelectedImages,
    toggleAllSelection,
    completedImages,
    selectedImages,
  };
}

interface BatchSelectionProps {
  completedImages: ImageFile[];
  selectedImages: ImageFile[];
  toggleAllSelection: () => void;
  downloadingZip: boolean;
  zipProgress: number;
}

export function BatchSelection({
  completedImages,
  selectedImages,
  toggleAllSelection,
  downloadingZip,
  zipProgress,
}: BatchSelectionProps) {
  if (completedImages.length === 0) return null;

  return (
    <>
      <div className="bg-white dark:bg-brand-darker p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleAllSelection}
            disabled={downloadingZip}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 border ${
              completedImages.every((img) => img.selected)
                ? "bg-brand-bright border-brand-bright text-white shadow-lg shadow-brand-bright/20"
                : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 font-bold"
            }`}
          >
            {completedImages.every((img) => img.selected) ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Status
            </p>
            <p className="text-sm font-black dark:text-white leading-none">
              {selectedImages.length}{" "}
              <span className="text-slate-400 font-bold">
                / {completedImages.length}
              </span>{" "}
              Ready
            </p>
          </div>
        </div>
      </div>

      {downloadingZip && (
        <div className="space-y-1.5 animate-in fade-in zoom-in duration-300 p-1.5">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-brand-bright italic">
            <span>Compiling Bundle</span>
            <span>{Math.round(zipProgress)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden border border-slate-300 dark:border-white/10">
            <div
              className="h-full bg-gradient-to-r from-brand-bright to-brand-bright/80 transition-all duration-300"
              style={{ width: `${zipProgress}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}

interface BatchDownloadButtonProps {
  selectedImages: ImageFile[];
  downloadingZip: boolean;
  downloadSelectedImages: () => void;
  processing: boolean;
}

export function BatchDownloadButton({
  selectedImages,
  downloadingZip,
  downloadSelectedImages,
  processing,
}: BatchDownloadButtonProps) {
  const isDisabled =
    selectedImages.length === 0 || downloadingZip || processing;

  const buttonText = () => {
    if (processing) return "Processing...";
    if (downloadingZip) return "Building ZIP...";
    if (selectedImages.length === 0) return "No Selection";
    return selectedImages.length > 1 ? "Download Bundle" : "Download Asset";
  };

  return (
    <button
      onClick={downloadSelectedImages}
      disabled={isDisabled}
      className={`w-full h-9 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 font-black uppercase tracking-widest text-[10px] relative overflow-hidden group shadow-lg border ${
        isDisabled
          ? "bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10 cursor-not-allowed opacity-60"
          : "bg-brand-bright text-white hover:bg-brand-bright/90 hover:shadow-brand-bright/40 active:scale-[0.98] border-brand-bright"
      }`}
    >
      {processing || downloadingZip ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{buttonText()}</span>
        </>
      ) : (
        <>
          <span>{buttonText()}</span>
        </>
      )}
    </button>
  );
}

// Keep the original component for backward compatibility if needed, but composed
export function BatchDownload(props: any) {
  const {
    downloadingZip,
    zipProgress,
    downloadSelectedImages,
    toggleAllSelection,
    completedImages,
    selectedImages,
  } = useBatchDownload(props.images, props.setImages, props.resizeSettings);

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-500">
      <BatchSelection
        completedImages={completedImages}
        selectedImages={selectedImages}
        toggleAllSelection={toggleAllSelection}
        downloadingZip={downloadingZip}
        zipProgress={zipProgress}
      />
      <BatchDownloadButton
        selectedImages={selectedImages}
        downloadingZip={downloadingZip}
        downloadSelectedImages={downloadSelectedImages}
        processing={false}
      />
    </div>
  );
}
