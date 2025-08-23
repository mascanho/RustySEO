// @ts-nocheck
"use client";

import React, { useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Eye, Download, CheckSquare, Square } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
      const img = new Image();
      img.onload = () => {
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id
              ? {
                  ...img,
                  originalDimensions: {
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                  },
                }
              : img,
          ),
        );
      };
      img.src = imageFile.preview;
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
        if (image.processedBlob) {
          URL.revokeObjectURL(URL.createObjectURL(image.processedBlob));
        }
        if (image.processedPreview) {
          URL.revokeObjectURL(image.processedPreview);
        }
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
    <Card className="border border-red-700 h-[900px] max-h-fit">
      <CardHeader>
        <CardTitle className="font-serif">Upload Images</CardTitle>
        <CardDescription>
          Drag and drop your images here or click to browse. Supports JPG, PNG,
          WebP formats.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
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
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Drop images here</h3>
          <p className="text-muted-foreground mb-4">
            or <span className="text-primary font-medium">browse files</span>
          </p>
          <Badge variant="secondary">
            {images.filter((img) => img.selected).length} of {images.length}{" "}
            image{images.length !== 1 ? "s" : ""} selected
          </Badge>
        </div>

        {images.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Selected Images</h4>
              <div className="flex gap-2">
                {images.some((img) => img.status === "completed") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const completedImages = images.filter(
                        (img) => img.status === "completed",
                      );
                      const allSelected = completedImages.every(
                        (img) => img.selected,
                      );
                      setImages((prev) =>
                        prev.map((img) =>
                          img.status === "completed"
                            ? { ...img, selected: !allSelected }
                            : img,
                        ),
                      );
                    }}
                    disabled={processing}
                  >
                    {images
                      .filter((img) => img.status === "completed")
                      .every((img) => img.selected)
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImages([])}
                  disabled={processing}
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    image.selected && image.status === "completed"
                      ? "bg-primary/10 border-2 border-primary/30 shadow-sm"
                      : "bg-muted/50 border-2 border-transparent"
                  }`}
                >
                  {image.status === "completed" && (
                    <button
                      onClick={() => onToggleSelection(image.id)}
                      className="flex-shrink-0 p-1 rounded hover:bg-primary/10 transition-colors duration-200 group"
                      title={image.selected ? "Deselect image" : "Select image"}
                    >
                      {image.selected ? (
                        <CheckSquare className="w-5 h-5 text-primary group-hover:text-primary/80 transition-colors" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground group-hover:text-primary/60 transition-colors" />
                      )}
                    </button>
                  )}
                  <img
                    src={image.preview || "/placeholder.svg"}
                    alt="Preview"
                    className={`w-12 h-12 object-cover rounded cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-105 ${
                      image.selected && image.status === "completed"
                        ? "ring-2 ring-primary/50"
                        : ""
                    }`}
                    onClick={() => onPreview(image)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {image.file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(image.originalSize)}</span>
                      {image.processedSize && (
                        <>
                          <span>→</span>
                          <span className="text-accent font-medium">
                            {formatFileSize(image.processedSize)}
                          </span>
                        </>
                      )}
                    </div>
                    {image.originalDimensions && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {image.originalDimensions.width}×
                          {image.originalDimensions.height}
                        </span>
                        {image.processedDimensions && (
                          <>
                            <span>→</span>
                            <span className="text-accent font-medium">
                              {image.processedDimensions.width}×
                              {image.processedDimensions.height}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    {image.status === "processing" &&
                      image.progress !== undefined && (
                        <Progress
                          value={image.progress}
                          className="w-full h-1 mt-1"
                        />
                      )}
                    {image.status === "error" && image.errorMessage && (
                      <p className="text-xs text-destructive mt-1">
                        {image.errorMessage}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {image.status === "completed" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPreview(image)}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownload(image)}
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Badge
                      variant={
                        image.status === "completed"
                          ? "default"
                          : image.status === "processing"
                            ? "secondary"
                            : image.status === "error"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {image.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(image.id)}
                      disabled={processing}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
