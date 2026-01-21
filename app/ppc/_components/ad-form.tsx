// @ts-nocheck
"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, Eye, Upload, Download, RefreshCcw } from "lucide-react";
import { KeywordValidator } from "./keyword-validator";
import { SitelinksEditor } from "./sitelinks-editor";
import { ImageManager } from "./image-manager";
import { ExtensionsEditor } from "./extensions-editor";
import { CampaignSettings } from "./campaign-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportAdsToCSV } from "@/utils/ad-export";
import { importAdsFromCSV } from "@/utils/ad-import";
import { toast } from "sonner";

import type { Ad, AdType, Sitelink, AdImage, AdExtension } from "@/types/ad";

interface AdFormProps {
  ad: Ad;
  onSave: (ad: Ad) => void;
  onPreview: () => void;
  onChange?: (ad: Ad) => void;
}

export function AdForm({ ad, onSave, onPreview, onChange }: AdFormProps) {
  const [formData, setFormData] = useState<Ad>(() => ({
    ...ad,
    headlines: Array.isArray(ad.headlines)
      ? ad.headlines
      : typeof ad.headlines === "string"
        ? ad.headlines.split("\n")
        : [],
    descriptions: Array.isArray(ad.descriptions)
      ? ad.descriptions
      : typeof ad.descriptions === "string"
        ? ad.descriptions.split("\n")
        : [],
    keywords: Array.isArray(ad.keywords) ? ad.keywords : [],
    images: Array.isArray(ad.images) ? ad.images : [],
    logos: Array.isArray(ad.logos) ? ad.logos : [],
    extensions: Array.isArray(ad.extensions) ? ad.extensions : [],
    locations: Array.isArray(ad.locations) ? ad.locations : [],
    languages: Array.isArray(ad.languages) ? ad.languages : [],
    budget: ad.budget || 0,
    biddingStrategy: ad.biddingStrategy || "maximize_clicks",
    status: ad.status || "enabled",
  }));
  const [keywordInput, setKeywordInput] = useState("");
  const [validationResults, setValidationResults] = useState<{
    valid: boolean;
    missingKeywords: string[];
  }>({ valid: true, missingKeywords: [] });

  // Validate keywords whenever form data changes and notify parent of changes
  useEffect(() => {
    validateKeywords();
    if (onChange) {
      onChange(formData);
    }
  }, [formData]);

  const validateKeywords = () => {
    if (!formData.keywords.length) {
      setValidationResults({ valid: true, missingKeywords: [] });
      return;
    }

    const allText = [
      ...formData.headlines,
      ...formData.descriptions,
      formData.finalUrl,
      formData.displayPath,
    ]
      .join(" ")
      .toLowerCase();

    const missingKeywords = formData.keywords.filter(
      (keyword) => !allText.includes(keyword.toLowerCase()),
    );

    setValidationResults({
      valid: missingKeywords.length === 0,
      missingKeywords,
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
  };

  const handleTypeChange = (value: AdType) => {
    setFormData({ ...formData, type: value });
  };

  const handleHeadlineChange = (index: number, value: string) => {
    const newHeadlines = [...formData.headlines];
    newHeadlines[index] = value;
    setFormData({ ...formData, headlines: newHeadlines });
  };

  const handleAddHeadline = () => {
    if (formData.headlines.length < 15) {
      setFormData({ ...formData, headlines: [...formData.headlines, ""] });
    }
  };

  const handleRemoveHeadline = (index: number) => {
    const newHeadlines = [...formData.headlines];
    newHeadlines.splice(index, 1);
    setFormData({ ...formData, headlines: newHeadlines });
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const newDescriptions = [...formData.descriptions];
    newDescriptions[index] = value;
    setFormData({ ...formData, descriptions: newDescriptions });
  };

  const handleAddDescription = () => {
    if (formData.descriptions.length < 4) {
      setFormData({
        ...formData,
        descriptions: [...formData.descriptions, ""],
      });
    }
  };

  const handleRemoveDescription = (index: number) => {
    const newDescriptions = [...formData.descriptions];
    newDescriptions.splice(index, 1);
    setFormData({ ...formData, descriptions: newDescriptions });
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (keywordInput.trim()) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()],
      });
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((k) => k !== keyword),
    });
  };

  const handleKeywordInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setKeywordInput(e.target.value);
  };

  const handleKeywordsBlur = () => {
    const keywords = keywordInput
      .split("\n")
      .map((k) => k.trim())
      .filter(Boolean);
    setFormData({ ...formData, keywords });
  };

  const handleFinalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, finalUrl: e.target.value });
  };

  const handleDisplayPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, displayPath: e.target.value });
  };

  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, businessName: e.target.value });
  };

  const handleUpdateSitelinks = (sitelinks: Sitelink[]) => {
    setFormData({ ...formData, sitelinks });
  };

  const handleUpdateImages = (images: AdImage[]) => {
    setFormData({ ...formData, images });
  };

  const handleUpdateLogos = (logos: AdImage[]) => {
    setFormData({ ...formData, logos });
  };

  const handleUpdateExtensions = (extensions: AdExtension[]) => {
    setFormData({ ...formData, extensions });
  };

  const handleUpdateSettings = (updates: Partial<Ad>) => {
    setFormData({ ...formData, ...updates });
  };

  const handleExport = () => {
    exportAdsToCSV([formData]);
    toast.success("Ad exported as Google Ads CSV");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedAds = await importAdsFromCSV(file);
      if (importedAds.length > 0) {
        // Merge imported data with defaults to ensure all required fields exist
        const newAd = { ...formData, ...importedAds[0] };
        setFormData(newAd);
        setKeywordInput(newAd.keywords.join("\n"));
        toast.success("Ad imported successfully");
      }
    } catch (err) {
      toast.error("Failed to import CSV. Check format.");
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all fields?")) {
      setFormData({
        ...formData,
        name: "",
        headlines: [""],
        descriptions: [""],
        finalUrl: "",
        displayPath: "",
        businessName: "",
        keywords: [],
        sitelinks: [],
        images: [],
        logos: [],
        extensions: [],
        budget: 0,
      });
      setKeywordInput("");
      toast.success("Form cleared");
    }
  };

  const handleSave = () => {
    onSave(formData);

    // set the data into local storage
    localStorage.setItem("Ads", JSON.stringify(formData));
    toast.success("Ad saved");
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-brand-dark/5 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
        <Tabs defaultValue="content" className="w-full h-fit space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-brand-dark p-1 rounded-xl h-11">
            <TabsTrigger value="content" className="rounded-lg font-bold text-xs uppercase tracking-wider">Content</TabsTrigger>
            <TabsTrigger value="assets" className="rounded-lg font-bold text-xs uppercase tracking-wider">Assets</TabsTrigger>
            <TabsTrigger value="targeting" className="rounded-lg font-bold text-xs uppercase tracking-wider">Targeting</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg font-bold text-xs uppercase tracking-wider">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-0">
            {/* AD TYPE SELECTION */}
            <Card className="w-full h-fit dark:bg-brand-darker/60 rounded-xl dark:border-white/5 relative shadow-sm mb-0">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400">Ad Type</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <RadioGroup
                  value={formData.type}
                  onValueChange={handleTypeChange}
                  className="flex flex-wrap gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="search" id="ad-type-search" />
                    <Label htmlFor="ad-type-search" className="text-sm font-bold">Search</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pmax" id="ad-type-pmax" />
                    <Label htmlFor="ad-type-pmax" className="text-sm font-bold">Performance Max</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="display" id="ad-type-display" />
                    <Label htmlFor="ad-type-display" className="text-sm font-bold">Display</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* AD DETAILS */}
            <Card className="w-full dark:bg-brand-darker/60 rounded-xl dark:border-white/5 relative shadow-sm mb-0">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Ad Creative</CardTitle>
                <CardDescription className="text-xs italic">Define your messaging and landing page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6 pt-0">
                <div className="space-y-2">
                  <Label htmlFor="ad-name">Ad Name</Label>
                  <Input id="ad-name" value={formData.name} onChange={handleNameChange} placeholder="Enter a name for your ad" className="h-9 text-xs" />
                </div>

                {(formData.type === "display" || formData.type === "pmax") && (
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input id="business-name" value={formData.businessName || ""} onChange={handleBusinessNameChange} placeholder="Enter your brand or company name" maxLength={25} className="h-9 text-xs" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="final-url">Final URL</Label>
                  <Input id="final-url" value={formData.finalUrl} onChange={handleFinalUrlChange} placeholder="https://example.com" className="h-9 text-xs" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Headlines ({formData.headlines.length}/15)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddHeadline} disabled={formData.headlines.length >= 15} className="h-7 text-xs font-bold ring-offset-background transition-colors hover:bg-brand-bright hover:text-white dark:bg-brand-dark">
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.headlines.map((headline, index) => (
                      <div key={index} className="flex gap-2 relative group">
                        <Input value={headline} onChange={(e) => handleHeadlineChange(index, e.target.value)} placeholder={`Headline ${index + 1}`} maxLength={30} className="h-9 text-xs flex-1 pr-12" />
                        <span className="absolute right-12 top-1/2 -translate-y-1/2 text-[9px] font-mono text-gray-400 tabular-nums">{headline.length}/30</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveHeadline(index)} disabled={formData.headlines.length <= 1} className="h-9 w-9 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Descriptions ({formData.descriptions.length}/4)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddDescription} disabled={formData.descriptions.length >= 4} className="h-7 text-xs font-bold ring-offset-background transition-colors hover:bg-brand-bright hover:text-white dark:bg-brand-dark">
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.descriptions.map((description, index) => (
                      <div key={index} className="flex gap-2 relative group">
                        <Textarea value={description} onChange={(e) => handleDescriptionChange(index, e.target.value)} placeholder={`Description ${index + 1}`} maxLength={90} className="h-16 text-xs resize-none flex-1 pr-12 dark:bg-brand-darker" />
                        <span className="absolute right-12 bottom-2 text-[9px] font-mono text-gray-400 tabular-nums">{description.length}/90</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveDescription(index)} disabled={formData.descriptions.length <= 1} className="h-16 w-9 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6 mt-0">
            {/* VISUAL ASSETS */}
            {(formData.type === "display" || formData.type === "pmax") && (
              <Card className="w-full dark:bg-brand-darker/60 rounded-xl dark:border-white/5 shadow-sm">
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Visual Creatives</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 px-6 pb-6">
                  <ImageManager title="Marketing Images" description="Upload your brand visuals" images={formData.images || []} onChange={handleUpdateImages} maxFiles={15} />
                  <div className="pt-6 border-t dark:border-white/5">
                    <ImageManager title="Logos" description="Add your square logos" images={formData.logos || []} onChange={handleUpdateLogos} maxFiles={5} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* EXTENSIONS */}
            <Card className="w-full dark:bg-brand-darker/60 rounded-xl dark:border-white/5 shadow-sm h-fit">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Ad Extensions</CardTitle>
                <CardDescription className="text-xs">Assets that appear with your ad to provide more information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 px-6 pb-6">
                <ExtensionsEditor extensions={formData.extensions || []} onChange={handleUpdateExtensions} />
                <div className="pt-8 border-t dark:border-white/5">
                  <Label className="block mb-4 text-xs font-black uppercase tracking-widest text-gray-400">Sitelinks</Label>
                  <SitelinksEditor sitelinks={formData.sitelinks || []} onChange={handleUpdateSitelinks} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="targeting" className="space-y-6 mt-0">
            <Card className="w-full dark:bg-brand-darker/60 rounded-xl dark:border-white/5 shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Targeting & Keywords</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 px-6 pb-6 pt-0">
                <div className="space-y-2">
                  <Label>Keyword List (One per line)</Label>
                  <Textarea
                    value={keywordInput}
                    onChange={handleKeywordInputChange}
                    onBlur={handleKeywordsBlur}
                    placeholder="Enter keywords to target..."
                    className="h-48 text-xs font-mono dark:bg-brand-darker"
                  />
                </div>
                <section className="pt-2 border-t dark:border-white/5 mt-4">
                  <KeywordValidator validationResults={validationResults} adContent={formData} />
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-0">
            <Card className="w-full dark:bg-brand-darker/60 rounded-xl dark:border-white/5 shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Campaign Strategy</CardTitle>
                <CardDescription className="text-xs">Configure budget, bidding and scheduling</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <CampaignSettings ad={formData} onChange={handleUpdateSettings} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* STICKY FOOTER */}
      <div className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-white/5 bg-white/80 dark:bg-brand-darker/80 backdrop-blur-xl flex justify-between items-center z-50">
        <div className="flex gap-2.5">
          <Button variant="outline" onClick={onPreview} className="rounded-xl px-4 h-10 font-bold border-none bg-gray-100 dark:bg-brand-dark text-gray-700 dark:text-gray-300">
            <Eye className="h-4 w-4 mr-2" /> Preview
          </Button>

          <input type="file" id="csv-import" className="hidden" accept=".csv" onChange={handleImport} />
          <Button variant="outline" onClick={() => document.getElementById('csv-import')?.click()} className="rounded-xl px-4 h-10 font-bold border-none bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Upload className="h-4 w-4 mr-2" /> Import
          </Button>

          <Button variant="outline" onClick={handleExport} className="rounded-xl px-4 h-10 font-bold border-none bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>

          <Button variant="outline" onClick={handleClear} className="rounded-xl px-4 h-10 font-bold border-none bg-red-500/10 text-red-600 dark:text-red-400">
            <RefreshCcw className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-10 h-10 font-black shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
          Save Campaign
        </Button>
      </div>
    </div>
  );
}
