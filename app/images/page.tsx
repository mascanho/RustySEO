"use client";
import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useDropzone } from "react-dropzone";

export default function ImageOptimizer() {
  const [image, setImage] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [originalDimensions, setOriginalDimensions] = useState({
    width: 800,
    height: 600,
  });
  const [format, setFormat] = useState("jpg");
  const [quality, setQuality] = useState(80);
  const [fileSize, setFileSize] = useState(100);
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [cropMode, setCropMode] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      setDimensions({ width: img.width, height: img.height });
    };
    img.src = URL.createObjectURL(file);
    setImage(Object.assign(file, { preview: URL.createObjectURL(file) }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: false,
  });

  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    const newValue = parseInt(value, 10);

    if (maintainAspectRatio) {
      const aspect = originalDimensions.width / originalDimensions.height;
      if (name === "width") {
        setDimensions({
          width: newValue,
          height: Math.round(newValue / aspect),
        });
      } else {
        setDimensions({
          width: Math.round(newValue * aspect),
          height: newValue,
        });
      }
    } else {
      setDimensions((prev) => ({ ...prev, [name]: newValue }));
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    if (dimensions.width < 1 || dimensions.width > 10000)
      newErrors.width = "Width must be between 1 and 10000 pixels";
    if (dimensions.height < 1 || dimensions.height > 10000)
      newErrors.height = "Height must be between 1 and 10000 pixels";
    if (fileSize < 1 || fileSize > 10000)
      newErrors.fileSize = "File size must be between 1 and 10000 KB";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOptimize = async () => {
    if (!validateInputs()) return;
    setIsProcessing(true);
    // Implement image optimization logic here
    // This is a placeholder for actual image processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
  };

  useEffect(() => {
    // Estimate file size based on dimensions and quality
    const estimatedSize = Math.round(
      (dimensions.width * dimensions.height * 3 * (quality / 100)) / 1024,
    );
    setFileSize(estimatedSize);
  }, [dimensions, quality]);

  return (
    <div className="flex flex-col items-center h-full rounded-none justify-center min-h-screen bg-brand-dark">
      <Card className="w-full rounded-none h-screen p-10 bg-brand-dark ">
        <CardHeader>
          <CardTitle>Advanced Image Optimizer</CardTitle>
          <CardDescription>
            Upload an image and customize its dimensions, format, quality, and
            more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div
              {...getRootProps()}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer"
            >
              <input {...getInputProps()} />
              {image ? (
                <img
                  src={image.preview}
                  alt="Preview"
                  className="max-w-full max-h-64 object-contain"
                />
              ) : isDragActive ? (
                <p>Drop the image here ...</p>
              ) : (
                <>
                  <UploadIcon className="w-12 h-12 mb-4 text-gray-400" />
                  <p>Drag 'n' drop an image here, or click to select one</p>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="aspect-ratio"
                checked={maintainAspectRatio}
                onCheckedChange={setMaintainAspectRatio}
              />
              <Label htmlFor="aspect-ratio">Maintain aspect ratio</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="crop-mode"
                checked={cropMode}
                onCheckedChange={setCropMode}
              />
              <Label htmlFor="crop-mode">Enable crop mode</Label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="width">Width (px)</Label>
                <Input
                  id="width"
                  name="width"
                  type="number"
                  value={dimensions.width}
                  onChange={handleDimensionChange}
                  min={1}
                  max={10000}
                  aria-invalid={errors.width ? "true" : "false"}
                />
                {errors.width && (
                  <p className="text-red-500 text-sm mt-1">{errors.width}</p>
                )}
              </div>
              <div>
                <Label htmlFor="height">Height (px)</Label>
                <Input
                  id="height"
                  name="height"
                  type="number"
                  value={dimensions.height}
                  onChange={handleDimensionChange}
                  min={1}
                  max={10000}
                  aria-invalid={errors.height ? "true" : "false"}
                />
                {errors.height && (
                  <p className="text-red-500 text-sm mt-1">{errors.height}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jpg">JPG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quality">Quality</Label>
                <Slider
                  id="quality"
                  min={1}
                  max={100}
                  step={1}
                  value={[quality]}
                  onValueChange={(value) => setQuality(value[0])}
                />
                <p className="text-sm text-gray-500 mt-1">{quality}%</p>
              </div>
            </div>
            <div>
              <Label htmlFor="fileSize">Estimated File Size</Label>
              <Input
                id="fileSize"
                type="number"
                value={fileSize}
                readOnly
                suffix="KB"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleOptimize} disabled={!image || isProcessing}>
            {isProcessing ? "Processing..." : "Optimize and Download"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function UploadIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
