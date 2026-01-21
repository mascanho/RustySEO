// @ts-nocheck
"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, Eye } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { KeywordValidator } from "./keyword-validator";
import { SitelinksEditor } from "./sitelinks-editor";
import { toast } from "sonner";

import type { Ad, AdType, Sitelink } from "@/types/ad";

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
    keywords: Array.isArray(ad.keywords)
      ? ad.keywords
      : typeof ad.keywords === "string"
        ? ad.keywords.split("\n")
        : [],
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

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, finalUrl: e.target.value });
  };

  const handleDisplayPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, displayPath: e.target.value });
  };

  const handleUpdateSitelinks = (sitelinks: Sitelink[]) => {
    setFormData({ ...formData, sitelinks });
  };

  const handleSave = () => {
    onSave(formData);

    // set the data into local storage
    localStorage.setItem("Ads", JSON.stringify(formData));
    toast.success("Ad saved");
  };

  return (
    <div className="space-y-4 w-full max-w-full relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ad Type Selector - Now Integrated */}
        <Card className="lg:col-span-12 rounded-xl border-gray-200/50 dark:border-white/5 shadow-sm bg-white dark:bg-brand-darker/60">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Label className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Ad Type</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={handleTypeChange}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="search" id="ad-type-search" />
                  <Label htmlFor="ad-type-search" className="text-sm font-medium">Search</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pmax" id="ad-type-pmax" />
                  <Label htmlFor="ad-type-pmax" className="text-sm font-medium">Performance Max</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="display" id="ad-type-display" />
                  <Label htmlFor="ad-type-display" className="text-sm font-medium">Display</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7 h-fit dark:bg-brand-darker/60 rounded-xl dark:border-white/5 relative shadow-sm">
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Ad Details</CardTitle>
            <CardDescription className="text-xs">
              Enter the basic information for your ad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6 pt-0">
            <div className="space-y-2">
              <Label htmlFor="ad-name">Ad Name</Label>
              <Input
                id="ad-name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Enter a name for your ad"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Headlines ({formData.headlines.length}/15)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddHeadline}
                  disabled={formData.headlines.length >= 15}
                  className=" dark:bg-brand-bright h-7 text-xs"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Headline
                </Button>
              </div>
              <div className="space-y-2">
                {formData.headlines.map((headline, index) => (
                  <div key={index} className="flex gap-2 relative group mt-2">
                    <div className="relative flex-1">
                      <Input
                        value={headline}
                        onChange={(e) =>
                          handleHeadlineChange(index, e.target.value)
                        }
                        placeholder={`Headline ${index + 1}`}
                        maxLength={30}
                        className="pr-12"
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${headline.length > 25 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {headline.length}/30
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveHeadline(index)}
                      disabled={formData.headlines.length <= 1}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Each headline can have up to 30 characters
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Descriptions ({formData.descriptions.length}/4)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDescription}
                  disabled={formData.descriptions.length >= 4}
                  className="dark:bg-brand-bright dark:text-white h-7 text-xs"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Description
                </Button>
              </div>
              <div className="space-y-2">
                {formData.descriptions.map((description, index) => (
                  <div key={index} className="flex gap-2 relative group mt-2">
                    <div className="relative flex-1">
                      <Textarea
                        value={description}
                        onChange={(e) =>
                          handleDescriptionChange(index, e.target.value)
                        }
                        placeholder={`Description ${index + 1}`}
                        maxLength={90}
                        className="resize-none dark:bg-brand-darker dark:border-brand-dark pr-12"
                        rows={2}
                      />
                      <span className={`absolute right-3 bottom-2 text-[10px] font-mono ${description.length > 80 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {description.length}/90
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDescription(index)}
                      disabled={formData.descriptions.length <= 1}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Each description can have up to 90 characters
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-5 space-y-6">
          <Card className="w-full h-fit pb-6 dark:bg-brand-darker/60 rounded-xl dark:border-white/5 shadow-sm">
            <CardHeader className="py-4">
              <CardTitle className="text-lg">URL Settings</CardTitle>
              <CardDescription className="text-xs">
                Set the destination and display URLs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <div className="space-y-2">
                <Label htmlFor="final-url">Final URL</Label>
                <Input
                  id="final-url"
                  value={formData.finalUrl}
                  onChange={handleUrlChange}
                  placeholder="https://example.com/landing-page"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display-path">Display Path</Label>
                <Input
                  id="display-path"
                  value={formData.displayPath}
                  onChange={handleDisplayPathChange}
                  placeholder="example.com/special-offer"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="w-full max-h-[32rem] overflow-y-auto dark:bg-brand-darker/60 rounded-xl dark:border-white/5 shadow-sm">
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Keywords</CardTitle>
              <CardDescription className="text-xs">
                Add keywords to track in your ad copy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 items-center flex flex-col">
              <form onSubmit={handleAddKeyword} className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Enter a keyword"
                />
                <Button
                  className="text-xs bg-white border text-black  dark:bg-brand-bright  h-9 dark:text-white dark:border-brand-dark hover:bg-gray-100"
                  type="submit"
                >
                  Add
                </Button>
              </form>

              <div className="flex flex-wrap gap-2 max-h-24 h-24 overflow-y-auto   ">
                {formData.keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 h-fit"
                  >
                    {keyword}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
                      <Trash className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </Badge>
                ))}
                {formData.keywords.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No keywords added yet
                  </p>
                )}
              </div>

              <section className="pt-2">
                <KeywordValidator
                  validationResults={validationResults}
                  adContent={formData}
                />
              </section>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SITELINKS */}

      {formData.type === "search" && (
        <Card className="w-full dark:bg-brand-darker/60 rounded-xl dark:border-white/5 shadow-sm">
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Sitelinks</CardTitle>
            <CardDescription className="text-xs">
              Add sitelinks to enhance your search ad
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96 overflow-auto px-6">
            <SitelinksEditor
              sitelinks={formData.sitelinks || []}
              onChange={handleUpdateSitelinks}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onPreview}
          className="dark:bg-brand-darker dark:text-white dark:border-brand-dark"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Ad
        </Button>
        <Button
          className="dark:bg-brand-bright h-8 w-28 mt-1.5 rounded dark:text-white dark:border-brand-dark dark:hover:bg-brand-bright/80 active:scale-95 "
          onClick={handleSave}
        >
          Save Ad
        </Button>
      </div>
    </div>
  );
}
