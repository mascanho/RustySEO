"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImageFile } from "./types/image";

interface CompressionStatsProps {
  images: ImageFile[];
}

export function CompressionStats({ images }: CompressionStatsProps) {
  const completedImages = images.filter((img) => img.status === "completed");

  if (completedImages.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const totalOriginalSize = completedImages.reduce(
    (sum, img) => sum + img.originalSize,
    0,
  );
  const totalProcessedSize = completedImages.reduce(
    (sum, img) => sum + (img.processedSize || 0),
    0,
  );
  const compressionRatio =
    ((totalOriginalSize - totalProcessedSize) / totalOriginalSize) * 100;
  const savedSpace = totalOriginalSize - totalProcessedSize;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">
          Compression Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">
              {Math.max(0, compressionRatio).toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Size Reduction</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {formatFileSize(totalOriginalSize)}
            </p>
            <p className="text-sm text-muted-foreground">Original Size</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {formatFileSize(totalProcessedSize)}
            </p>
            <p className="text-sm text-muted-foreground">New Size</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-accent">
              {formatFileSize(savedSpace)}
            </p>
            <p className="text-sm text-muted-foreground">Space Saved</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
