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
import { UploadIcon } from "lucide-react";

export default function Page() {
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
  const [optimizedImages, setOptimizedImages] = useState([]);
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
    console.log("Clicking Optimize Image");

    if (!validateInputs() || !image) return;

    setIsProcessing(true);
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onload = async () => {
        const base64Image = reader.result.split(",")[1];

        try {
          const formats = ["jpg", "png", "webp"];
          const results = [];

          for (const fmt of formats) {
            const result = await invoke("handle_image_conversion", {
              image: base64Image,
              format: fmt,
              quality,
              width: dimensions.width,
              height: dimensions.height,
            });

            const mimeType = `image/${fmt}`;
            results.push({
              src: `data:${mimeType};base64,${result}`,
              format: fmt,
            });
          }

          setOptimizedImages(results);
        } catch (invokeError) {
          console.error("Error invoking Tauri command:", invokeError);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    const estimatedSize = Math.round(
      (dimensions.width * dimensions.height * 3 * (quality / 100)) / 1024,
    );
    setFileSize(estimatedSize);
  }, [dimensions, quality]);

  const saveImage = async (img) => {
    const base64Data = img.src.split(",")[1];
    const binaryData = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0),
    );

    const fileName = `optimized_${img.format}.${img.format}`;

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

  const handleDomainCrawl = () => {
    invoke("crawl_domain", { url: "www.slimstock.com" }).then((result) =>
      console.log(result),
    ).await;
  };

  return (
    <section className="w-full border-none rounded-none h-full p-10 dark:bg-brand-dark shadow-none flex">
      <button onClick={handleDomainCrawl}>Crawl Domain</button>
    </section>
  );
}
