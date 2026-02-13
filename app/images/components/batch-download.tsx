// @ts-nocheck
"use client";

import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { Download, CheckSquare, Square } from "lucide-react";
import type { ImageFile, ResizeSettings } from "./types/image";

interface BatchDownloadProps {
  images: ImageFile[];
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  resizeSettings: ResizeSettings;
}

export function BatchDownload({
  images,
  setImages,
  resizeSettings,
}: BatchDownloadProps) {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const completedImages = images.filter((img) => img.status === "completed");
  const selectedImages = images.filter(
    (img) => img.selected && img.status === "completed",
  );

  if (completedImages.length === 0) return null;

  const generateFileName = (originalName: string, settings: ResizeSettings) => {
    const nameWithoutExt = originalName.split(".")[0];
    let fileName = settings.fileNamePattern
      .replace("{name}", nameWithoutExt)
      .replace("{width}", settings.width.toString())
      .replace("{height}", settings.height.toString())
      .replace("{quality}", settings.quality.toString())
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

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Selection Control Card */}
      <div className="bg-white dark:bg-brand-darker p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAllSelection}
            disabled={downloadingZip}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border ${
              completedImages.every((img) => img.selected)
                ? "bg-brand-bright border-brand-bright text-white shadow-lg shadow-brand-bright/20"
                : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 font-bold"
            }`}
          >
            {completedImages.every((img) => img.selected) ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
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

      {/* Compile Progress */}
      {!downloadingZip && (
        <div className="space-y-2 animate-in fade-in zoom-in duration-300 p-2">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-brand-bright italic">
            <span>Compiling Bundle</span>
            <span>{Math.round(zipProgress)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden border border-slate-300 dark:border-white/10">
            <div
              className="h-full bg-brand-bright transition-all duration-300"
              style={{ width: `${zipProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Export Action */}
      <button
        onClick={downloadSelectedImages}
        disabled={selectedImages.length === 0 || downloadingZip}
        className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 font-black uppercase tracking-widest text-xs relative overflow-hidden group shadow-xl ${
          selectedImages.length === 0 || downloadingZip
            ? "bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-white/10"
            : "bg-brand-bright text-white hover:bg-brand-bright/90 hover:scale-[1.02] active:scale-[0.98] shadow-brand-bright/40 border border-brand-bright"
        }`}
      >
        {downloadingZip ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Building ZIP...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            <span>
              {selectedImages.length > 1 ? "Download Bundle" : "Download Asset"}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
