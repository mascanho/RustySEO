// @ts-nocheck
"use client";

import type React from "react";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile, WriteFileOptions } from "@tauri-apps/plugin-fs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Archive, Download, CheckSquare, Square } from "lucide-react";
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
    <section className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Batch Download
          </CardTitle>
          <CardDescription>
            Select images to download individually or as a ZIP file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllSelection}
                className="flex items-center gap-2 bg-transparent"
              >
                {completedImages.every((img) => img.selected) ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {completedImages.every((img) => img.selected)
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedImages.length} of {completedImages.length} selected
              </span>
            </div>
            <Button
              onClick={downloadSelectedImages}
              disabled={selectedImages.length === 0 || downloadingZip}
              className="flex items-center gap-2"
            >
              {downloadingZip ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating ZIP...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download {selectedImages.length > 1 ? "as ZIP" : "Selected"} (
                  {selectedImages.length})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
