// @ts-nocheck
"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle2 } from "lucide-react";
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
            if (!file.type.startsWith("image/")) {
                toast.error(`${file.name} is not an image file`);
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`);
                return;
            }

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
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">{description}</p>
            </div>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[160px] ${isDragging
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 scale-[0.99] shadow-inner"
                    : "border-gray-200 dark:border-brand-dark hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-gray-50/50 dark:hover:bg-brand-dark/20"
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

                <div className="bg-blue-600/10 dark:bg-blue-500/20 p-4 rounded-2xl mb-4 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                    <Upload className="h-6 w-6" />
                </div>

                <div className="text-center">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Click to upload or drag and drop
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-[0.2em] font-black opacity-50">
                        Up to {maxFiles} images (Max 5MB each)
                    </p>
                </div>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((img) => (
                        <div
                            key={img.id}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-brand-dark bg-gray-50 dark:bg-brand-dark shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                            <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <button
                                    onClick={(e) => handleRemove(img.id, e)}
                                    className="h-9 w-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all scale-75 group-hover:scale-100"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="absolute bottom-2 right-2">
                                <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
