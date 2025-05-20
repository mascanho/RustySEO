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

interface AdFormProps {
  ad: Ad;
  onSave: (ad: Ad) => void;
  onPreview: () => void;
}

export function AdForm({ ad, onSave, onPreview }: AdFormProps) {
  const [formData, setFormData] = useState<Ad>(ad);
  const [keywordInput, setKeywordInput] = useState("");
  const [validationResults, setValidationResults] = useState<{
    valid: boolean;
    missingKeywords: string[];
  }>({ valid: true, missingKeywords: [] });

  // Validate keywords whenever form data changes
  useEffect(() => {
    validateKeywords();
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
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Ad Type</CardTitle>
          <CardDescription>
            Select the type of ad you want to create
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.type}
            onValueChange={handleTypeChange}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="search" id="ad-type-search" />
              <Label htmlFor="ad-type-search">Search</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pmax" id="ad-type-pmax" />
              <Label htmlFor="ad-type-pmax">Performance Max</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="display" id="ad-type-display" />
              <Label htmlFor="ad-type-display">Display</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Ad Details</CardTitle>
            <CardDescription>
              Enter the basic information for your ad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Headline
                </Button>
              </div>
              <div className="space-y-2">
                {formData.headlines.map((headline, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={headline}
                      onChange={(e) =>
                        handleHeadlineChange(index, e.target.value)
                      }
                      placeholder={`Headline ${index + 1}`}
                      maxLength={30}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveHeadline(index)}
                      disabled={formData.headlines.length <= 1}
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
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Description
                </Button>
              </div>
              <div className="space-y-2">
                {formData.descriptions.map((description, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={description}
                      onChange={(e) =>
                        handleDescriptionChange(index, e.target.value)
                      }
                      placeholder={`Description ${index + 1}`}
                      maxLength={90}
                      className="resize-none"
                      rows={2}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDescription(index)}
                      disabled={formData.descriptions.length <= 1}
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

        <div className="space-y-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>URL Settings</CardTitle>
              <CardDescription>
                Set the destination and display URLs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Keywords</CardTitle>
              <CardDescription>
                Add keywords to track in your ad copy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddKeyword} className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Enter a keyword"
                />
                <Button type="submit">Add</Button>
              </form>

              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
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

              <KeywordValidator
                validationResults={validationResults}
                adContent={formData}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {formData.type === "search" && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sitelinks</CardTitle>
            <CardDescription>
              Add sitelinks to enhance your search ad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SitelinksEditor
              sitelinks={formData.sitelinks || []}
              onChange={handleUpdateSitelinks}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPreview}>
          <Eye className="h-4 w-4 mr-2" />
          Preview Ad
        </Button>
        <Button onClick={handleSave}>Save Ad</Button>
      </div>
    </div>
  );
}
