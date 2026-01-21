// @ts-nocheck
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Plus, Trash, Eye, Upload, Download, RefreshCcw } from "lucide-react";
import { KeywordValidator } from "./keyword-validator";
import { SitelinksEditor } from "./sitelinks-editor";
import { ImageManager } from "./image-manager";
import { ExtensionsEditor } from "./extensions-editor";
import { CampaignSettings } from "./campaign-settings";
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

type TabType = "content" | "assets" | "targeting" | "settings";

export function AdForm({ ad, onSave, onPreview, onChange }: AdFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const [formData, setFormData] = useState<Ad>(() => ({
    ...ad,
    headlines: Array.isArray(ad.headlines) ? ad.headlines : [""],
    descriptions: Array.isArray(ad.descriptions) ? ad.descriptions : [""],
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
    localStorage.setItem("Ads", JSON.stringify(formData));
    toast.success("Ad saved");
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-brand-dark/5 overflow-hidden">
      {/* TABS NAVBAR */}
      <div className="flex-shrink-0 p-3 pb-0">
        <div className="flex bg-white dark:bg-brand-dark p-1 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-x-auto custom-scrollbar no-scrollbar">
          {[
            { id: "content", label: "Content" },
            { id: "assets", label: "Assets" },
            { id: "targeting", label: "Targeting" },
            { id: "settings", label: "Settings" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 min-w-[100px] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SCROLLABLE AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 pt-4 space-y-6 pb-32">
        {activeTab === "content" && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* AD TYPE SELECTION */}
            <div className="bg-white dark:bg-brand-darker/60 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">Select Ad Type</h5>
              <div className="flex flex-wrap gap-8">
                {["search", "pmax", "display"].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="ad-type"
                        checked={formData.type === type}
                        onChange={() => handleTypeChange(type as AdType)}
                        className="peer appearance-none w-5 h-5 rounded-full border-2 border-gray-200 dark:border-white/10 checked:border-blue-600 transition-all"
                      />
                      <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-600 scale-0 peer-checked:scale-100 transition-transform" />
                    </div>
                    <span className={`text-xs font-bold transition-colors ${formData.type === type ? "text-gray-900 dark:text-white" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`}>
                      {type === "pmax" ? "Performance Max" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* AD CREATIVE */}
            <div className="bg-white dark:bg-brand-darker/60 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ad Creative</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black opacity-60">Define your messaging and landing page</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Ad Name</label>
                  <input
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="Enter ad variation name"
                    className="w-full px-3 h-10 text-xs rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                  />
                </div>

                {(formData.type === "display" || formData.type === "pmax") && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Business Name</label>
                    <input
                      value={formData.businessName || ""}
                      onChange={handleBusinessNameChange}
                      placeholder="Your brand name"
                      maxLength={25}
                      className="w-full px-3 h-10 text-xs rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Final URL</label>
                <input
                  value={formData.finalUrl}
                  onChange={handleFinalUrlChange}
                  placeholder="https://example.com/landing-page"
                  className="w-full px-3 h-10 text-xs rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                />
              </div>

              {/* HEADLINES */}
              <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Headlines ({formData.headlines.length}/15)</label>
                  <button
                    type="button"
                    onClick={handleAddHeadline}
                    disabled={formData.headlines.length >= 15}
                    className="px-3 py-1.5 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    Add Headline
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formData.headlines.map((headline, index) => (
                    <div key={index} className="relative group">
                      <input
                        value={headline}
                        onChange={(e) => handleHeadlineChange(index, e.target.value)}
                        placeholder={`Headline ${index + 1}`}
                        maxLength={30}
                        className="w-full pl-3 pr-16 h-10 text-xs rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                      />
                      <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[9px] font-mono text-gray-400 tabular-nums">
                        {headline.length}/30
                      </div>
                      <button
                        onClick={() => handleRemoveHeadline(index)}
                        disabled={formData.headlines.length <= 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* DESCRIPTIONS */}
              <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Descriptions ({formData.descriptions.length}/4)</label>
                  <button
                    type="button"
                    onClick={handleAddDescription}
                    disabled={formData.descriptions.length >= 4}
                    className="px-3 py-1.5 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    Add Description
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.descriptions.map((desc, index) => (
                    <div key={index} className="relative group">
                      <textarea
                        value={desc}
                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                        placeholder={`Description ${index + 1}`}
                        maxLength={90}
                        rows={2}
                        className="w-full pl-3 pr-16 py-2.5 text-xs rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium resize-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                      />
                      <div className="absolute right-10 bottom-3 text-[9px] font-mono text-gray-400 tabular-nums">
                        {desc.length}/90
                      </div>
                      <button
                        onClick={() => handleRemoveDescription(index)}
                        disabled={formData.descriptions.length <= 1}
                        className="absolute right-2 bottom-3 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "assets" && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* VISUAL CREATIVES */}
            {(formData.type === "display" || formData.type === "pmax") && (
              <div className="bg-white dark:bg-brand-darker/60 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Visual Creatives</h3>
                <div className="space-y-8">
                  <ImageManager title="Marketing Images" description="Upload your high-quality brand visuals" images={formData.images || []} onChange={handleUpdateImages} maxFiles={15} />
                  <div className="pt-8 border-t border-gray-50 dark:border-white/5">
                    <ImageManager title="Logos" description="Add your square and landscape logos" images={formData.logos || []} onChange={handleUpdateLogos} maxFiles={5} />
                  </div>
                </div>
              </div>
            )}

            {/* AD EXTENSIONS */}
            <div className="bg-white dark:bg-brand-darker/60 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
              <div className="space-y-10">
                <ExtensionsEditor extensions={formData.extensions || []} onChange={handleUpdateExtensions} />
                <div className="pt-10 border-t border-gray-50 dark:border-white/5">
                  <SitelinksEditor sitelinks={formData.sitelinks || []} onChange={handleUpdateSitelinks} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "targeting" && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white dark:bg-brand-darker/60 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Targeting & Keywords</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black opacity-60 mb-6">Define who should see your ads</p>

              <div className="space-y-4">
                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Target Keywords (One per line)</label>
                <textarea
                  value={keywordInput}
                  onChange={handleKeywordInputChange}
                  onBlur={handleKeywordsBlur}
                  placeholder="e.g. digital marketing&#10;seo tools&#10;ad simulator"
                  className="w-full p-4 h-64 text-xs font-mono rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0a0a0b]/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none custom-scrollbar text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                />
              </div>

              <div className="mt-8 pt-8 border-t border-gray-50 dark:border-white/5">
                <KeywordValidator validationResults={validationResults} adContent={formData} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white dark:bg-brand-darker/60 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Campaign Strategy</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black opacity-60 mb-6">Configure your budget and auction strategy</p>
              <CampaignSettings ad={formData} onChange={handleUpdateSettings} />
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-white/5 bg-white/80 dark:bg-brand-darker/80 backdrop-blur-xl flex justify-between items-center z-50">
        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex items-center gap-2 px-4 h-10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Eye className="h-4 w-4" /> <span>Preview</span>
          </button>

          <input type="file" id="csv-import-native" className="hidden" accept=".csv" onChange={handleImport} />
          <button
            onClick={() => document.getElementById('csv-import-native')?.click()}
            className="flex items-center gap-2 px-4 h-10 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Upload className="h-4 w-4" /> <span>Import</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 h-10 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Download className="h-4 w-4" /> <span>Export</span>
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <RefreshCcw className="h-4 w-4" /> <span>Clear</span>
          </button>
        </div>

        <button
          onClick={handleSave}
          className="px-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 active:scale-95 transition-all transform hover:-translate-y-0.5"
        >
          Save Campaign
        </button>
      </div>
    </div>
  );
}
