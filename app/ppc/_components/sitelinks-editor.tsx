// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, ChevronDown, ChevronUp } from "lucide-react";
import type { Sitelink } from "@/types/ad";

interface SitelinksEditorProps {
  sitelinks: Sitelink[];
  onChange: (sitelinks: Sitelink[]) => void;
}

export function SitelinksEditor({ sitelinks, onChange }: SitelinksEditorProps) {
  const [expandedSitelink, setExpandedSitelink] = useState<string | null>(null);

  const handleAddSitelink = () => {
    const newSitelink: Sitelink = {
      id: Date.now().toString(),
      title: "",
      url: "",
    };
    onChange([...sitelinks, newSitelink]);
    setExpandedSitelink(newSitelink.id);
  };

  const handleRemoveSitelink = (id: string) => {
    onChange(sitelinks.filter((sitelink) => sitelink.id !== id));
    if (expandedSitelink === id) {
      setExpandedSitelink(null);
    }
  };

  const handleUpdateSitelink = (
    id: string,
    field: keyof Sitelink,
    value: string,
  ) => {
    onChange(
      sitelinks.map((sitelink) =>
        sitelink.id === id ? { ...sitelink, [field]: value } : sitelink,
      ),
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedSitelink(expandedSitelink === id ? null : id);
  };

  return (
    <div className="space-y-4 z-20 ">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Sitelinks appear as additional links below your ad. Add up to 6
          sitelinks.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSitelink}
          disabled={sitelinks.length >= 6}
          className="absolute top-8 right-6 h-7 text-xs z-50 bg-brand-bright dark:bg-brand-bright"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Sitelink
        </Button>
      </div>

      {sitelinks.length === 0 ? (
        <div className="text-center py-6 border border-dashed rounded-md">
          <p className="text-sm text-muted-foreground">
            No sitelinks added yet
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handleAddSitelink}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Your First Sitelink
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sitelinks.map((sitelink) => (
            <div
              key={sitelink.id}
              className="border dark:border-brand-dark rounded-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleExpand(sitelink.id)}
                  >
                    {expandedSitelink === sitelink.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <span className="font-medium">
                    {sitelink.title || "Untitled Sitelink"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSitelink(sitelink.id)}
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>

              {expandedSitelink === sitelink.id && (
                <div className="p-3 space-y-3 border-t dark:border-t-brand-dark  ">
                  <div className="space-y-2">
                    <Label htmlFor={`sitelink-title-${sitelink.id}`}>
                      Link Text
                    </Label>
                    <Input
                      id={`sitelink-title-${sitelink.id}`}
                      value={sitelink.title}
                      onChange={(e) =>
                        handleUpdateSitelink(
                          sitelink.id,
                          "title",
                          e.target.value,
                        )
                      }
                      placeholder="e.g., Shop Now"
                      maxLength={25}
                    />
                    <p className="text-xs text-muted-foreground">
                      Max 25 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sitelink-url-${sitelink.id}`}>
                      Link URL
                    </Label>
                    <Input
                      id={`sitelink-url-${sitelink.id}`}
                      value={sitelink.url}
                      onChange={(e) =>
                        handleUpdateSitelink(sitelink.id, "url", e.target.value)
                      }
                      placeholder="https://example.com/page"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sitelink-desc1-${sitelink.id}`}>
                      Description Line 1 (Optional)
                    </Label>
                    <Input
                      id={`sitelink-desc1-${sitelink.id}`}
                      value={sitelink.description1 || ""}
                      onChange={(e) =>
                        handleUpdateSitelink(
                          sitelink.id,
                          "description1",
                          e.target.value,
                        )
                      }
                      placeholder="First line of description"
                      maxLength={35}
                    />
                    <p className="text-xs text-muted-foreground">
                      Max 35 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sitelink-desc2-${sitelink.id}`}>
                      Description Line 2 (Optional)
                    </Label>
                    <Input
                      id={`sitelink-desc2-${sitelink.id}`}
                      value={sitelink.description2 || ""}
                      onChange={(e) =>
                        handleUpdateSitelink(
                          sitelink.id,
                          "description2",
                          e.target.value,
                        )
                      }
                      placeholder="Second line of description"
                      maxLength={35}
                    />
                    <p className="text-xs text-muted-foreground">
                      Max 35 characters
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
