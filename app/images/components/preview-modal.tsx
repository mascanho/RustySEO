"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Download } from "lucide-react";
import type { ImageFile, ResizeSettings } from "./types/image";

interface PreviewModalProps {
  previewImage: ImageFile | null;
  setPreviewImage: (image: ImageFile | null) => void;
  resizeSettings: ResizeSettings;
  onDownload: (image: ImageFile) => void;
}

export function PreviewModal({
  previewImage,
  setPreviewImage,
  resizeSettings,
  onDownload,
}: PreviewModalProps) {
  const [previewMode, setPreviewMode] = useState<
    "side-by-side" | "before" | "after"
  >("side-by-side");

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
    <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {previewImage?.file.name}
          </DialogTitle>
        </DialogHeader>

        {previewImage && (
          <div className="space-y-4">
            {previewImage.status === "completed" &&
              previewImage.processedPreview && (
                <Tabs
                  value={previewMode}
                  onValueChange={(value) =>
                    setPreviewMode(value as typeof previewMode)
                  }
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="side-by-side"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      Side by Side
                    </TabsTrigger>
                    <TabsTrigger value="before">Original</TabsTrigger>
                    <TabsTrigger value="after">Processed</TabsTrigger>
                  </TabsList>

                  <TabsContent value="side-by-side" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-center">Original</h4>
                        <div className="relative bg-muted rounded-lg overflow-hidden">
                          <img
                            src={previewImage.preview || "/placeholder.svg"}
                            alt="Original"
                            className="w-full h-auto max-h-96 object-contain"
                          />
                        </div>
                        <div className="text-center text-sm text-muted-foreground space-y-1">
                          <p>{formatFileSize(previewImage.originalSize)}</p>
                          {previewImage.originalDimensions && (
                            <p>
                              {previewImage.originalDimensions.width} ×{" "}
                              {previewImage.originalDimensions.height}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-center">Processed</h4>
                        <div className="relative bg-muted rounded-lg overflow-hidden">
                          <img
                            src={
                              previewImage.processedPreview ||
                              "/placeholder.svg"
                            }
                            alt="Processed"
                            className="w-full h-auto max-h-96 object-contain"
                          />
                        </div>
                        <div className="text-center text-sm text-muted-foreground space-y-1">
                          <p className="text-accent font-medium">
                            {formatFileSize(previewImage.processedSize || 0)}
                          </p>
                          {previewImage.processedDimensions && (
                            <p className="text-accent font-medium">
                              {previewImage.processedDimensions.width} ×{" "}
                              {previewImage.processedDimensions.height}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="before" className="mt-4">
                    <div className="text-center space-y-4">
                      <h4 className="font-medium">Original Image</h4>
                      <div className="relative bg-muted rounded-lg overflow-hidden max-w-4xl mx-auto">
                        <img
                          src={previewImage.preview || "/placeholder.svg"}
                          alt="Original"
                          className="w-full h-auto max-h-[60vh] object-contain"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{formatFileSize(previewImage.originalSize)}</p>
                        {previewImage.originalDimensions && (
                          <p>
                            {previewImage.originalDimensions.width} ×{" "}
                            {previewImage.originalDimensions.height}
                          </p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="after" className="mt-4">
                    <div className="text-center space-y-4">
                      <h4 className="font-medium">Processed Image</h4>
                      <div className="relative bg-muted rounded-lg overflow-hidden max-w-4xl mx-auto">
                        <img
                          src={
                            previewImage.processedPreview || "/placeholder.svg"
                          }
                          alt="Processed"
                          className="w-full h-auto max-h-[60vh] object-contain"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="text-accent font-medium">
                          {formatFileSize(previewImage.processedSize || 0)}
                        </p>
                        {previewImage.processedDimensions && (
                          <p className="text-accent font-medium">
                            {previewImage.processedDimensions.width} ×{" "}
                            {previewImage.processedDimensions.height}
                          </p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

            {previewImage.status !== "completed" && (
              <div className="text-center space-y-4">
                <h4 className="font-medium">Original Image</h4>
                <div className="relative bg-muted rounded-lg overflow-hidden max-w-4xl mx-auto">
                  <img
                    src={previewImage.preview || "/placeholder.svg"}
                    alt="Original"
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{formatFileSize(previewImage.originalSize)}</p>
                  {previewImage.originalDimensions && (
                    <p>
                      {previewImage.originalDimensions.width} ×{" "}
                      {previewImage.originalDimensions.height}
                    </p>
                  )}
                </div>
              </div>
            )}

            {previewImage.status === "completed" && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => onDownload(previewImage)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Processed Image
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
