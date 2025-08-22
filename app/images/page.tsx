"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "./components/file-upload";
import { SettingsPanel } from "./components/settings-panel";
import { CompressionStats } from "./components/compression-stats";
import { BatchDownload } from "./components/batch-download";
import { PreviewModal } from "./components/preview-modal";
import { ThemeToggle } from "./components/theme-toggle";
import type { ImageFile, ResizeSettings } from "@/types/image";

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

  const resizeImage = async (
    file: File,
    settings: ResizeSettings,
  ): Promise<{ blob: Blob; dimensions: { width: number; height: number } }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            throw new Error("Could not get canvas context");
          }

          let { width, height } = settings;
          const originalWidth = img.naturalWidth;
          const originalHeight = img.naturalHeight;

          if (settings.maintainAspectRatio) {
            const aspectRatio = originalWidth / originalHeight;

            if (width / height > aspectRatio) {
              width = height * aspectRatio;
            } else {
              height = width / aspectRatio;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          ctx.drawImage(img, 0, 0, width, height);

          const mimeType = `image/${settings.format}`;
          const quality = settings.quality / 100;

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  blob,
                  dimensions: {
                    width: Math.round(width),
                    height: Math.round(height),
                  },
                });
              } else {
                reject(new Error("Failed to create blob"));
              }
            },
            mimeType,
            quality,
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const updateImageStatus = (id: string, updates: Partial<ImageFile>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...updates } : img)),
    );
  };

  const processImages = async () => {
    if (images.length === 0) return;

    setProcessing(true);
    setOverallProgress(0);

    try {
      const totalImages = images.length;
      let completedImages = 0;

      for (const image of images) {
        try {
          updateImageStatus(image.id, {
            status: "processing",
            progress: 0,
          });

          const { blob: processedBlob, dimensions } = await resizeImage(
            image.file,
            resizeSettings,
          );

          const processedPreview = URL.createObjectURL(processedBlob);

          updateImageStatus(image.id, {
            status: "completed",
            processedBlob,
            processedSize: processedBlob.size,
            processedPreview,
            processedDimensions: dimensions,
            progress: 100,
            selected: true,
          });

          completedImages++;
          setOverallProgress((completedImages / totalImages) * 100);
        } catch (error) {
          updateImageStatus(image.id, {
            status: "error",
            errorMessage:
              error instanceof Error ? error.message : "Processing failed",
            progress: 0,
          });

          completedImages++;
          setOverallProgress((completedImages / totalImages) * 100);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Batch processing error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePreview = (image: ImageFile) => {
    setPreviewImage(image);
  };

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

  const handleDownload = (image: ImageFile) => {
    if (!image.processedBlob) return;

    const url = URL.createObjectURL(image.processedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generateFileName(image.file.name, resizeSettings);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleSelection = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, selected: !img.selected } : img,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-background transition-colors">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <ImageIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-foreground">
                  ImageResize Pro
                </h1>
                <p className="text-sm text-muted-foreground">
                  Professional batch image resizing
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {processing && (
          <div className="mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing images...</span>
                    <span>{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-6">
          <CompressionStats images={images} />
        </div>

        <div className="mb-6">
          <BatchDownload
            images={images}
            setImages={setImages}
            resizeSettings={resizeSettings}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FileUpload
              images={images}
              setImages={setImages}
              processing={processing}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onToggleSelection={handleToggleSelection}
            />
          </div>

          <div>
            <SettingsPanel
              resizeSettings={resizeSettings}
              setResizeSettings={setResizeSettings}
              images={images}
              processing={processing}
              onProcessImages={processImages}
            />
          </div>
        </div>

        <PreviewModal
          previewImage={previewImage}
          setPreviewImage={setPreviewImage}
          resizeSettings={resizeSettings}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
}
