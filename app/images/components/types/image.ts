export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  processedSize?: number;
  status: "pending" | "processing" | "completed" | "error";
  processedBlob?: Blob;
  progress?: number;
  errorMessage?: string;
  processedPreview?: string;
  originalDimensions?: { width: number; height: number };
  processedDimensions?: { width: number; height: number };
  selected?: boolean;
}

export interface ResizeSettings {
  width: number;
  height: number;
  quality: number;
  format: string;
  maintainAspectRatio: boolean;
  fileNamePattern: string;
  addPrefix: boolean;
  addSuffix: boolean;
  prefix: string;
  suffix: string;
}
