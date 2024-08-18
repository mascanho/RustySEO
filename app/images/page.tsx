// @ts-nocheck
"use client";

import { writeBinaryFile, BaseDirectory } from "@tauri-apps/api/fs";
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
import { invoke } from "@tauri-apps/api/tauri";

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
  const [optimizedImages, setOptimizedImages] = useState(null);
  const [loading, setLoading] = useState(false);

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
    if (!validateInputs() || !image) return;

    setIsProcessing(true);
    setLoading(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onload = async () => {
        const base64Image = reader.result.split(",")[1];

        try {
          // Call the Tauri command to handle image upload and optimization
          const results = await invoke("handle_image_conversion", {
            image: base64Image,
            format,
            quality,
            width: dimensions.width,
            height: dimensions.height,
          });

          console.log("Optimization results:", results);
          // Set the optimized images
          setOptimizedImages(
            results.map((result, index) => ({
              src: `data:image/${format};base64,${result}`,
              format: format,
              size: ["original", "half", "quarter"][index % 3],
            })),
          );
        } catch (invokeError) {
          console.error("Error invoking Tauri command:", invokeError);
          // Handle Tauri command error
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        setLoading(false);
      };
    } catch (error) {
      console.error("Error optimizing image:", error);
      // Handle the error (e.g., show an error message to the user)
      setLoading(false);
    }
  };

  useEffect(() => {
    // Estimate file size based on dimensions and quality
    const estimatedSize = Math.round(
      (dimensions.width * dimensions.height * 3 * (quality / 100)) / 1024,
    );
    setFileSize(estimatedSize);
  }, [dimensions, quality]);

  // Function to save the image using Tauri's file system API
  const saveImage = async (img) => {
    const base64Data = img.src.split(",")[1]; // Get base64 string
    const binaryData = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0),
    );

    const fileName = `optimized_${img.format}_${img.size}.${img.format}`;

    try {
      await writeBinaryFile(fileName, binaryData, {
        dir: BaseDirectory.Download,
      });
      alert(`Image saved as ${fileName} in your Downloads folder.`);
    } catch (error) {
      console.error("Failed to save the file:", error);
      alert("Failed to save the file. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center h-[calc(100vh-6rem)] pb-20 mb-10 overflow-auto rounded-none bg-white justify-center dark:bg-brand-dark">
      <Card className="w-full border-none rounded-none h-full p-10 dark:bg-brand-dark shadow-none">
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
                  <p>
                    Drag &apos;n&apos; drop an image here, or click to select
                    one
                  </p>
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
              <Input id="fileSize" type="number" value={fileSize} readOnly />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleOptimize} disabled={!image || loading}>
            {loading ? "Processing..." : "Optimize and Download"}
          </Button>
        </CardFooter>
        {/* Grid for optimized images */}
        {optimizedImages && (
          <div className="mt-4 pb-10">
            <h3 className="text-lg font-semibold mb-2">Optimized Images</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {optimizedImages.map((img, index) => (
                <div key={index} className="p-4 border rounded-lg shadow-md">
                  <img
                    src={img.src}
                    alt={`Optimized ${img.format} ${img.size}`}
                    className="w-1/2 h-auto object-contain"
                  />
                  <p className="mt-2 text-sm text-gray-700">
                    Format: {img.format}, Size: {img.size}
                  </p>
                  <button
                    onClick={() => saveImage(img)}
                    className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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

// Function to save the image using Tauri's file system API
const saveImage = async (img) => {
  const base64Data = img.src.split(",")[1]; // Get base64 string
  const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  const fileName = `optimized_${img.format}_${img.size}.${img.format}`;

  try {
    await writeBinaryFile(fileName, binaryData, {
      dir: BaseDirectory.Download,
    });
    alert(`Image saved as ${fileName} in your Downloads folder.`);
  } catch (error) {
    console.error("Failed to save the file:", error);
    alert("Failed to save the file. Please try again.");
  }
};
