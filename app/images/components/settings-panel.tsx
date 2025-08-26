"use client";

import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Zap,
  FileImage,
  Palette,
  Monitor,
  Smartphone,
  Camera,
} from "lucide-react";
import type { ResizeSettings, ImageFile } from "./types/image";

const PRESETS = {
  web: {
    width: 1920,
    height: 1080,
    quality: 85,
    format: "jpeg",
    name: "Web (1920×1080)",
    icon: Monitor,
  },
  social: {
    width: 1080,
    height: 1080,
    quality: 90,
    format: "jpeg",
    name: "Social Media (1080×1080)",
    icon: Smartphone,
  },
  thumbnail: {
    width: 400,
    height: 400,
    quality: 80,
    format: "jpeg",
    name: "Thumbnail (400×400)",
    icon: FileImage,
  },
  print: {
    width: 3000,
    height: 2000,
    quality: 95,
    format: "png",
    name: "Print Quality (3000×2000)",
    icon: Camera,
  },
  email: {
    width: 800,
    height: 600,
    quality: 75,
    format: "jpeg",
    name: "Email (800×600)",
    icon: FileImage,
  },
};

const QUALITY_PRESETS = {
  low: { quality: 60, name: "Low (Smaller file)" },
  medium: { quality: 80, name: "Medium (Balanced)" },
  high: { quality: 90, name: "High (Better quality)" },
  maximum: { quality: 95, name: "Maximum (Largest file)" },
};

interface SettingsPanelProps {
  resizeSettings: ResizeSettings;
  setResizeSettings: React.Dispatch<React.SetStateAction<ResizeSettings>>;
  images: ImageFile[];
  processing: boolean;
  onProcessImages: () => void;
}

export function SettingsPanel({
  resizeSettings,
  setResizeSettings,
  images,
  processing,
  onProcessImages,
}: SettingsPanelProps) {
  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setResizeSettings((prev) => ({
      ...prev,
      width: preset.width,
      height: preset.height,
      quality: preset.quality,
      format: preset.format,
    }));
  };

  const applyQualityPreset = (presetKey: keyof typeof QUALITY_PRESETS) => {
    const preset = QUALITY_PRESETS[presetKey];
    setResizeSettings((prev) => ({
      ...prev,
      quality: preset.quality,
    }));
  };

  const isPresetActive = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    return (
      resizeSettings.width === preset.width &&
      resizeSettings.height === preset.height &&
      resizeSettings.quality === preset.quality &&
      resizeSettings.format === preset.format
    );
  };

  const isQualityPresetActive = (presetKey: keyof typeof QUALITY_PRESETS) => {
    const preset = QUALITY_PRESETS[presetKey];
    return resizeSettings.quality === preset.quality;
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

  return (
    <Card className="h-[calc(100vh-1vh)] max-h-[calc(100vh-32.5vh)] px-0 mx-0">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Output Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-3 border-b -mt-3 ">
            <TabsTrigger
              value="presets"
              className="flex items-center gap-1 rounded-t-lg"
            >
              <Zap className="w-3 h-3" />
              Presets
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="flex items-center gap-1 rounded-t-lg"
            >
              <Settings className="w-3 h-3" />
              Custom
            </TabsTrigger>
            <TabsTrigger
              value="naming"
              className="flex items-center gap-1 rounded-t-lg"
            >
              {" "}
              <FileImage className="w-3 h-3" />
              Naming
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="presets"
            className="space-y-4 mt-4 h-[36rem] pb-6 pt-2 overflow-auto m-0 px-2"
          >
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Size Presets
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => {
                  const IconComponent = preset.icon;
                  const isActive = isPresetActive(key as keyof typeof PRESETS);
                  return (
                    <Button
                      key={key}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => applyPreset(key as keyof typeof PRESETS)}
                      className={`justify-start h-auto p-3 transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                          : "hover:bg-primary/10 hover:border-primary/50"
                      }`}
                      disabled={processing}
                    >
                      <IconComponent
                        className={`w-4 h-4 mr-2 flex-shrink-0 ${
                          isActive ? "text-primary-foreground" : ""
                        }`}
                      />
                      <div className="text-left">
                        <div className="font-medium text-sm">{preset.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {preset.quality}% quality,{" "}
                          {preset.format.toUpperCase()}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium mb-3 block">
                Quality Presets
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(QUALITY_PRESETS).map(([key, preset]) => {
                  const isActive = isQualityPresetActive(
                    key as keyof typeof QUALITY_PRESETS,
                  );
                  return (
                    <Button
                      key={key}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        applyQualityPreset(key as keyof typeof QUALITY_PRESETS)
                      }
                      className={`justify-start transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                          : "hover:bg-primary/10 hover:border-primary/50"
                      }`}
                      disabled={processing}
                    >
                      <Palette
                        className={`w-4 h-4 mr-2 ${
                          isActive ? "text-primary-foreground" : ""
                        }`}
                      />
                      {preset.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4 px-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="width">Width (px)</Label>
                <Input
                  id="width"
                  type="number"
                  value={resizeSettings.width}
                  onChange={(e) =>
                    setResizeSettings((prev) => ({
                      ...prev,
                      width: Number.parseInt(e.target.value) || 0,
                    }))
                  }
                  disabled={processing}
                />
              </div>
              <div>
                <Label htmlFor="height">Height (px)</Label>
                <Input
                  id="height"
                  type="number"
                  value={resizeSettings.height}
                  onChange={(e) =>
                    setResizeSettings((prev) => ({
                      ...prev,
                      height: Number.parseInt(e.target.value) || 0,
                    }))
                  }
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="quality">
                Quality ({resizeSettings.quality}%)
              </Label>
              <Input
                id="quality"
                type="range"
                min="1"
                max="100"
                value={resizeSettings.quality}
                onChange={(e) =>
                  setResizeSettings((prev) => ({
                    ...prev,
                    quality: Number.parseInt(e.target.value) || 80,
                  }))
                }
                disabled={processing}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Low</span>
                <span className="font-medium text-primary">
                  {resizeSettings.quality <= 60
                    ? "Low"
                    : resizeSettings.quality <= 80
                      ? "Medium"
                      : resizeSettings.quality <= 90
                        ? "High"
                        : resizeSettings.quality === 100
                          ? "Maximum"
                          : "Custom"}
                </span>
                <span>Maximum</span>
              </div>
            </div>

            <div>
              <Label htmlFor="format">Output Format</Label>
              <select
                id="format"
                className="w-full px-3 py-2 border border-input rounded-md bg-background disabled:opacity-50 mt-1"
                value={resizeSettings.format}
                onChange={(e) =>
                  setResizeSettings((prev) => ({
                    ...prev,
                    format: e.target.value,
                  }))
                }
                disabled={processing}
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="aspectRatio"
                checked={resizeSettings.maintainAspectRatio}
                onChange={(e) =>
                  setResizeSettings((prev) => ({
                    ...prev,
                    maintainAspectRatio: e.target.checked,
                  }))
                }
                className="rounded border-input"
                disabled={processing}
              />
              <Label htmlFor="aspectRatio" className="text-sm">
                Maintain aspect ratio
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="naming" className="space-y-4 mt-4 px-2">
            <div>
              <Label htmlFor="fileNamePattern">File Name Pattern</Label>
              <Input
                id="fileNamePattern"
                value={resizeSettings.fileNamePattern}
                onChange={(e) =>
                  setResizeSettings((prev) => ({
                    ...prev,
                    fileNamePattern: e.target.value,
                  }))
                }
                disabled={processing}
                placeholder="resized_{name}"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use: {"{name}"}, {"{width}"}, {"{height}"}, {"{quality}"},{" "}
                {"{format}"}
              </p>
            </div>

            {/* ... existing naming options ... */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="addPrefix"
                  checked={resizeSettings.addPrefix}
                  onChange={(e) =>
                    setResizeSettings((prev) => ({
                      ...prev,
                      addPrefix: e.target.checked,
                    }))
                  }
                  className="rounded border-input"
                  disabled={processing}
                />
                <Label htmlFor="addPrefix" className="text-sm">
                  Add prefix
                </Label>
              </div>
              {resizeSettings.addPrefix && (
                <Input
                  value={resizeSettings.prefix}
                  onChange={(e) =>
                    setResizeSettings((prev) => ({
                      ...prev,
                      prefix: e.target.value,
                    }))
                  }
                  disabled={processing}
                  placeholder="prefix"
                />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="addSuffix"
                  checked={resizeSettings.addSuffix}
                  onChange={(e) =>
                    setResizeSettings((prev) => ({
                      ...prev,
                      addSuffix: e.target.checked,
                    }))
                  }
                  className="rounded border-input"
                  disabled={processing}
                />
                <Label htmlFor="addSuffix" className="text-sm">
                  Add suffix
                </Label>
              </div>
              {resizeSettings.addSuffix && (
                <Input
                  value={resizeSettings.suffix}
                  onChange={(e) =>
                    setResizeSettings((prev) => ({
                      ...prev,
                      suffix: e.target.value,
                    }))
                  }
                  disabled={processing}
                  placeholder="suffix"
                />
              )}
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Preview:</p>
              <p className="text-sm text-muted-foreground">
                {generateFileName("example.jpg", resizeSettings)}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <Button
          className=" mt-6 text-xs absolute top-20 right-10 w-40"
          onClick={onProcessImages}
          disabled={images.length === 0 || processing}
        >
          {processing ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <FileImage className="w-4 h-4 mr-2" />
              Resize Images ({images.length})
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
