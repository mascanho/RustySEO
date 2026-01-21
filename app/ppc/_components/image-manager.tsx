// @ts-nocheck
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { AdImage } from "@/types/ad";

interface ImageManagerProps {
    images: AdImage[];
    onChange: (images: AdImage[]) => void;
    title: string;
    description: string;
    maxFiles?: number;
}

export function ImageManager({
    images,
    onChange,
    title,
    description,
    maxFiles = 15,
}: ImageManagerProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        processFiles(files);
    };

    const processFiles = (files: File[]) => {
        if (images.length + files.length > maxFiles) {
            toast.error(`You can only upload up to ${maxFiles} images`);
            return;
        }

        const newImages: AdImage[] = [];

        files.forEach((file) => {
            // Basic validation
            if (!file.type.startsWith("image/")) {
                toast.error(`${file.name} is not an image file`);
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`);
                return;
            }

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                const adImage: AdImage = {
                    id: Math.random().toString(36).substring(7),
                    url,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                };

                onChange([...images, ...newImages, adImage]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(images.filter((img) => img.id !== id));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[140px] ${isDragging
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10"
                        : "border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                    accept="image/*"
                />

                <div className="bg-blue-100 dark:bg-blue-500/20 p-3 rounded-full mb-3 text-blue-600 dark:text-blue-400">
                    <Upload className="h-5 w-5" />
                </div>

                <div className="text-center">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Click to upload or drag and drop
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-black opacity-60">
                        Up to {maxFiles} images (Max 5MB each)
                    </p>
                </div>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {images.map((img) => (
                        <div
                            key={img.id}
                            className="group relative aspect-square rounded-lg overflow-hidden border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-brand-dark shadow-sm hover:shadow-md transition-all"
                        >
                            <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={(e) => handleRemove(img.id, e)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="absolute bottom-1 right-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-white dark:fill-brand-dark" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
