// @ts-nocheck
"use client";

import { useState } from "react";
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
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gray-50/50 dark:bg-brand-dark/20 p-4 rounded-xl border border-gray-100 dark:border-white/5">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Ad Sitelinks</h4>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
            Add up to 6 secondary links below your main ad
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddSitelink}
          disabled={sitelinks.length >= 6}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" /> <span>Add Sitelink</span>
        </button>
      </div>

      {sitelinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl opacity-50 space-y-3">
          <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-full">
            <Plus className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-xs font-bold text-gray-500">No sitelinks added yet</p>
        </div>
      ) : (
        <div className="space-y-3 px-1">
          {sitelinks.map((sitelink) => (
            <div
              key={sitelink.id}
              className="border border-gray-100 dark:border-brand-dark rounded-xl overflow-hidden bg-white dark:bg-brand-darker/40 transition-all hover:shadow-md"
            >
              <div
                className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${expandedSitelink === sitelink.id ? "bg-blue-50/30 dark:bg-blue-500/5 border-b border-gray-100 dark:border-brand-dark" : "bg-white dark:bg-brand-darker/40"}`}
                onClick={() => toggleExpand(sitelink.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-md transition-colors ${expandedSitelink === sitelink.id ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "bg-gray-100 text-gray-400 dark:bg-white/5"}`}>
                    {expandedSitelink === sitelink.id ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className={`text-xs font-bold ${sitelink.title ? "text-gray-900 dark:text-white" : "text-gray-400 italic"}`}>
                    {sitelink.title || "Untitled Sitelink"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSitelink(sitelink.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>

              {expandedSitelink === sitelink.id && (
                <div className="p-4 space-y-4 bg-white dark:bg-[#0a0a0b]/60">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Link Text</label>
                      <input
                        value={sitelink.title}
                        onChange={(e) => handleUpdateSitelink(sitelink.id, "title", e.target.value)}
                        placeholder="e.g., Shop Now"
                        maxLength={25}
                        className="w-full px-3 h-9 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-400"
                      />
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold opacity-50">Max 25 chars</span>
                        <span className="text-[9px] text-muted-foreground font-mono">{sitelink.title.length}/25</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Link URL</label>
                      <input
                        value={sitelink.url}
                        onChange={(e) => handleUpdateSitelink(sitelink.id, "url", e.target.value)}
                        placeholder="https://example.com/page"
                        className="w-full px-3 h-9 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-50 dark:border-white/5">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Description Line 1</label>
                      <input
                        value={sitelink.description1 || ""}
                        onChange={(e) => handleUpdateSitelink(sitelink.id, "description1", e.target.value)}
                        placeholder="First descriptive line"
                        maxLength={35}
                        className="w-full px-3 h-9 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Description Line 2</label>
                      <input
                        value={sitelink.description2 || ""}
                        onChange={(e) => handleUpdateSitelink(sitelink.id, "description2", e.target.value)}
                        placeholder="Second descriptive line"
                        maxLength={35}
                        className="w-full px-3 h-9 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-400"
                      />
                    </div>
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
