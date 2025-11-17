// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import {
  PlusCircle,
  X,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardFooter } from "@/components/ui/card";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { invoke } from "@tauri-apps/api/core";

interface Taxonomy {
  id: string;
  name: string;
  children: Taxonomy[];
  matchType: "startsWith" | "contains";
}

interface TaxonomyNodeProps {
  taxonomy: Taxonomy;
  onRemove: (id: string) => void;
  onAddChild: (
    parentId: string,
    name: string,
    matchType: "startsWith" | "contains",
  ) => void;
  isSubmitting: boolean;
}

const TaxonomyNode: React.FC<TaxonomyNodeProps> = ({
  taxonomy,
  onRemove,
  onAddChild,
  isSubmitting,
}) => {
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildMatchType, setNewChildMatchType] = useState<
    "startsWith" | "contains"
  >("startsWith");
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAdd = () => {
    if (newChildName.trim()) {
      onAddChild(taxonomy.id, newChildName, newChildMatchType);
      setNewChildName("");
      setIsAddingChild(false);
    } else {
      toast.error("Taxonomy name cannot be empty");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="ml-2">
      <div className="flex items-center justify-between border dark:border-slate-500 mt-1 px-3 bg-muted rounded-md">
        <div className="flex items-center">
          {taxonomy.children.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mr-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          <BiSolidCategoryAlt className="dark:text-white" size={12} />
          <span className="px-3 dark:text-white/80 py-1 text-sm">
            {taxonomy.name}
          </span>
          <span className="text-xs text-gray-500">({taxonomy.matchType})</span>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAddingChild(true)}
            aria-label={`Add child to ${taxonomy.name}`}
            disabled={isSubmitting}
          >
            <PlusCircle className="h-4 w-4 text-green-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(taxonomy.id)}
            aria-label={`Remove ${taxonomy.name}`}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {isAddingChild && (
        <div className="flex gap-2 mt-2 ml-4 mb-2">
          <Input
            placeholder="Enter child taxonomy name"
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-8 dark:text-white"
            disabled={isSubmitting}
            autoFocus
          />
          <Button
            variant="outline"
            className="w-[120px] h-8"
            onClick={() =>
              setNewChildMatchType((prev) =>
                prev === "startsWith" ? "contains" : "startsWith",
              )
            }
          >
            {newChildMatchType === "startsWith" ? "Starts with" : "Contains"}
          </Button>
          <Button onClick={handleAdd} className="h-8">
            Add
          </Button>
          <Button
            onClick={() => setIsAddingChild(false)}
            variant="outline"
            className="h-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isExpanded && taxonomy.children.length > 0 && (
        <div className="mt-1">
          {taxonomy.children.map((child) => (
            <TaxonomyNode
              key={child.id}
              taxonomy={child}
              onRemove={onRemove}
              onAddChild={onAddChild}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TaxonomyManagerProps {
  closeDialog: () => void;
}

export default function TaxonomyManager({ closeDialog }: TaxonomyManagerProps) {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [newTaxonomy, setNewTaxonomy] = useState("");
  const [newTaxonomyMatchType, setNewTaxonomyMatchType] = useState<
    "startsWith" | "contains"
  >("startsWith");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isDuplicate = (taxonomies: Taxonomy[], name: string): boolean => {
    const cleanName = name.trim().replace(/^\/|\/$/g, "");
    for (const tax of taxonomies) {
      if (tax.name.toLowerCase() === cleanName.toLowerCase()) return true;
      if (tax.children && isDuplicate(tax.children, cleanName)) return true;
    }
    return false;
  };

  const handleAddRootTaxonomy = () => {
    const cleanName = newTaxonomy
      .trim()
      .replace(/^\/|\/$/g, "")
      .toLowerCase();
    if (!cleanName) {
      toast.error("Taxonomy name cannot be empty");
      return;
    }

    if (isDuplicate(taxonomies, cleanName)) {
      toast.error("This taxonomy already exists");
      return;
    }

    const newTax: Taxonomy = {
      id: crypto.randomUUID(),
      name: cleanName,
      children: [],
      matchType: newTaxonomyMatchType,
    };

    const newTaxonomies = [...taxonomies, newTax];
    setTaxonomies(newTaxonomies);

    // Update localStorage immediately when adding
    localStorage.setItem("taxonomies", JSON.stringify(newTaxonomies));

    setNewTaxonomy("");
    toast.success(`Taxonomy "${cleanName}" has been added`);
  };

  const handleAddChildTaxonomy = (
    parentId: string,
    childName: string,
    matchType: "startsWith" | "contains",
  ) => {
    const cleanName = childName
      .trim()
      .replace(/^\/|\/$/g, "")
      .toLowerCase();
    if (!cleanName) {
      toast.error("Taxonomy name cannot be empty");
      return;
    }

    if (isDuplicate(taxonomies, cleanName)) {
      toast.error("This taxonomy already exists");
      return;
    }

    const newChild: Taxonomy = {
      id: crypto.randomUUID(),
      name: cleanName,
      children: [],
      matchType: matchType,
    };

    const addChildRecursive = (
      items: Taxonomy[],
      pId: string,
      child: Taxonomy,
    ): Taxonomy[] => {
      return items.map((item) => {
        if (item.id === pId) {
          return { ...item, children: [...item.children, child] };
        }
        if (item.children.length > 0) {
          return {
            ...item,
            children: addChildRecursive(item.children, pId, child),
          };
        }
        return item;
      });
    };

    const newTaxonomies = addChildRecursive(taxonomies, parentId, newChild);
    setTaxonomies(newTaxonomies);

    // Update localStorage immediately when adding child
    localStorage.setItem("taxonomies", JSON.stringify(newTaxonomies));

    toast.success(`Taxonomy "${cleanName}" has been added`);
  };

  const handleRemoveTaxonomy = (id: string) => {
    let removedTaxonomy: Taxonomy | null = null;

    function recursiveRemove(list: Taxonomy[], idToRemove: string): Taxonomy[] {
      return list.reduce((acc, item) => {
        if (item.id === idToRemove) {
          removedTaxonomy = item;
          return acc;
        }
        const children = item.children
          ? recursiveRemove(item.children, idToRemove)
          : [];
        if (item.children && children.length < item.children.length) {
          // A child was removed
        }
        acc.push({ ...item, children });
        return acc;
      }, [] as Taxonomy[]);
    }

    const newTaxonomies = recursiveRemove(taxonomies, id);

    if (removedTaxonomy) {
      setTaxonomies(newTaxonomies);

      // Update localStorage immediately when removing
      if (newTaxonomies.length === 0) {
        // Remove taxonomies completely from localStorage when last one is removed
        localStorage.removeItem("taxonomies");
        console.log("All taxonomies removed - cleared from localStorage");
      } else {
        // Update localStorage with remaining taxonomies
        localStorage.setItem("taxonomies", JSON.stringify(newTaxonomies));
      }

      toast(`Taxonomy "${removedTaxonomy.name}" has been removed`, {
        description: "You can add it again if needed",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddRootTaxonomy();
    }
  };

  const buildTaxonomyInfo = (
    taxonomies: Taxonomy[],
    parentPath: string,
  ): { path: string; match_type: string }[] => {
    let info: { path: string; match_type: string }[] = [];
    taxonomies.forEach((tax) => {
      const currentPath = parentPath + tax.name;
      if (tax.children.length > 0) {
        info.push({
          path: currentPath + "/",
          match_type: tax.matchType,
        });
        info.push(...buildTaxonomyInfo(tax.children, currentPath + "/"));
      } else {
        info.push({ path: currentPath, match_type: tax.matchType });
      }
    });
    return info;
  };

  // Convert backend taxonomy format to frontend format
  const parseTaxonomiesFromBackend = (backendTaxonomies: any[]): Taxonomy[] => {
    if (!Array.isArray(backendTaxonomies)) {
      console.log("Backend taxonomies is not an array:", backendTaxonomies);
      return [];
    }

    console.log("Parsing backend taxonomies:", backendTaxonomies);

    // Create a map to store taxonomies by their full path
    const taxonomyMap = new Map();
    const rootTaxonomies: Taxonomy[] = [];

    // First pass: create all taxonomy nodes
    backendTaxonomies.forEach((item) => {
      if (!item.path) {
        console.log("Skipping item with no path:", item);
        return;
      }

      // Remove leading and trailing slashes and split into segments
      const cleanPath = item.path.replace(/^\/+|\/+$/g, "");
      const segments = cleanPath.split("/").filter(Boolean);

      if (segments.length === 0) {
        console.log("Skipping empty path after cleaning");
        return;
      }

      const fullPath = segments.join("/");

      // Create taxonomy node
      const taxonomy: Taxonomy = {
        id: crypto.randomUUID(),
        name: segments[segments.length - 1],
        children: [],
        matchType: item.match_type || "startsWith",
      };

      taxonomyMap.set(fullPath, taxonomy);
    });

    // Second pass: build hierarchy
    backendTaxonomies.forEach((item) => {
      if (!item.path) return;

      const cleanPath = item.path.replace(/^\/+|\/+$/g, "");
      const segments = cleanPath.split("/").filter(Boolean);

      if (segments.length === 0) return;

      const fullPath = segments.join("/");
      const currentTaxonomy = taxonomyMap.get(fullPath);

      if (segments.length === 1) {
        // This is a root taxonomy
        if (
          currentTaxonomy &&
          !rootTaxonomies.find((tax) => tax.name === currentTaxonomy.name)
        ) {
          rootTaxonomies.push(currentTaxonomy);
        }
      } else {
        // This is a child taxonomy - find its parent
        const parentPath = segments.slice(0, -1).join("/");
        const parentTaxonomy = taxonomyMap.get(parentPath);

        if (parentTaxonomy && currentTaxonomy) {
          const existingChild = parentTaxonomy.children.find(
            (child: Taxonomy) => child.name === currentTaxonomy.name,
          );
          if (!existingChild) {
            parentTaxonomy.children.push(currentTaxonomy);
          }
        }
      }
    });

    console.log("Parsed root taxonomies:", rootTaxonomies);
    return rootTaxonomies;
  };

  const loadTaxonomiesFromBackend = async (): Promise<Taxonomy[]> => {
    try {
      console.log("Attempting to load taxonomies from backend...");

      const backendTaxonomies = await invoke("get_taxonomies");
      console.log("Raw backend taxonomies response:", backendTaxonomies);

      if (!backendTaxonomies) {
        console.log("No taxonomies returned from backend");
        return [];
      }

      if (Array.isArray(backendTaxonomies) && backendTaxonomies.length > 0) {
        const parsed = parseTaxonomiesFromBackend(backendTaxonomies);
        console.log("Successfully parsed taxonomies from backend:", parsed);
        return parsed;
      } else {
        console.log("Backend returned empty or invalid taxonomies array");
        return [];
      }
    } catch (error) {
      console.log(
        "No taxonomies found in backend (this is normal for first use):",
        error,
      );
      return [];
    }
  };

  const handleSubmitTaxonomies = async () => {
    if (taxonomies.length === 0) {
      // If no taxonomies, remove them from backend and localStorage
      setIsSubmitting(true);
      try {
        await invoke("set_taxonomies", { newTaxonomies: [] });
        localStorage.removeItem("taxonomies");
        toast.success("All taxonomies removed from database");
      } catch (error) {
        toast.error("Failed to remove taxonomies");
        console.error("Error removing taxonomies:", error);
      } finally {
        closeDialog();
        setIsSubmitting(false);
      }
      return;
    }

    if (taxonomies.length > 8) {
      toast.error("Maximum of 8 root taxonomies allowed");
      return;
    }

    setIsSubmitting(true);

    try {
      const taxonomyInfo = buildTaxonomyInfo(taxonomies, "/");

      console.log("Submitting taxonomies:", taxonomyInfo);

      await invoke("set_taxonomies", { newTaxonomies: taxonomyInfo });

      localStorage.setItem("taxonomies", JSON.stringify(taxonomies));

      toast.success("Taxonomies saved to database", {
        description: `Successfully saved ${taxonomyInfo.length} taxonomies`,
      });
    } catch (error) {
      toast.error("Failed to save taxonomies", {
        description: "Please try again later",
      });
      console.error("Error saving taxonomies:", error);
    } finally {
      closeDialog();
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadTaxonomies = async () => {
      setIsLoading(true);
      let loadedTaxonomies: Taxonomy[] = [];

      try {
        // First try localStorage
        const storedTaxonomies = localStorage.getItem("taxonomies");

        if (storedTaxonomies) {
          try {
            const parsed = JSON.parse(storedTaxonomies);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const ensureDataShape = (items: any[]): Taxonomy[] => {
                return items.map((item) => ({
                  ...item,
                  matchType: item.matchType || "startsWith",
                  children: Array.isArray(item.children)
                    ? ensureDataShape(item.children)
                    : [],
                }));
              };
              loadedTaxonomies = ensureDataShape(parsed);
              console.log(
                "Loaded taxonomies from localStorage:",
                loadedTaxonomies,
              );
            }
          } catch (e) {
            console.log(
              "Failed to parse taxonomies from localStorage, clearing...",
              e,
            );
            localStorage.removeItem("taxonomies");
          }
        }

        // If localStorage fails or is empty, try backend
        if (loadedTaxonomies.length === 0) {
          console.log("No taxonomies in localStorage, trying backend...");
          loadedTaxonomies = await loadTaxonomiesFromBackend();
          if (loadedTaxonomies.length > 0) {
            console.log("Loaded taxonomies from backend:", loadedTaxonomies);
            // Also save to localStorage for next time
            localStorage.setItem(
              "taxonomies",
              JSON.stringify(loadedTaxonomies),
            );
          }
        }

        setTaxonomies(loadedTaxonomies);
      } catch (error) {
        console.log("Error during taxonomy loading (starting fresh):", error);
        setTaxonomies([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTaxonomies();
  }, []);

  if (isLoading) {
    return (
      <section className="w-[650px] max-w-5xl mx-auto h-full pt-4 flex flex-col">
        <CardContent className="grid grid-cols-1 md:grid-cols-1 gap-6 h-[360px] flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading taxonomies...
            </span>
          </div>
        </CardContent>
      </section>
    );
  }

  return (
    <section className="w-[650px] max-w-5xl mx-auto h-full pt-4 flex flex-col">
      <CardContent className="grid grid-cols-1 md:grid-cols-1 gap-6 h-[360px]">
        {/* Left Column - Add Taxonomy Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium dark:text-white">
            Add New Root Taxonomy
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter taxonomy name"
              value={newTaxonomy}
              onChange={(e) => setNewTaxonomy(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-8 dark:text-white"
              disabled={isSubmitting}
            />
            <Button
              variant="outline"
              className="w-[120px] h-8"
              onClick={() =>
                setNewTaxonomyMatchType((prev) =>
                  prev === "startsWith" ? "contains" : "startsWith",
                )
              }
            >
              {newTaxonomyMatchType === "startsWith"
                ? "Starts with"
                : "Contains"}
            </Button>
            <Button
              onClick={handleAddRootTaxonomy}
              className="flex items-center gap-1 h-8 bg-brand-bright dark:hover:bg-brand-bright dark:bg-brand-bright dark:text-white hover:bg-brand-bright"
              disabled={isSubmitting}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>
          <div className="py-2 bg-neutral-100 dark:bg-brand-dark dark:text-white/50 px-2 rounded-md mt-4">
            <p className="text-xs text-muted-foreground ">
              Add content taxonomies one at a time to categorize your content.
              Each taxonomy should be unique. Each taxonomy needs a unique name
              to segment your content. Use your website structure as names.
              Example: blog
            </p>
          </div>
        </div>

        {/* Right Column - Taxonomy List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium dark:text-white">
            Current Taxonomies
          </h3>
          <div className="border dark:border-brand-dark rounded-md h-[270px] overflow-y-auto">
            {taxonomies.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center h-full flex items-center justify-center dark:text-white/50">
                No taxonomies added yet. Start by adding a root taxonomy.
              </div>
            ) : (
              <div className="grid gap-1 pr-2 mt-2 w-full mb-2">
                {taxonomies.map((tax) => (
                  <TaxonomyNode
                    key={tax.id}
                    taxonomy={tax}
                    onRemove={handleRemoveTaxonomy}
                    onAddChild={handleAddChildTaxonomy}
                    isSubmitting={isSubmitting}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-32">
        <Button
          onClick={handleSubmitTaxonomies}
          className="w-full flex items-center gap-2 bg-brand-bright hover:bg-brand-bright dark:bg-brand-bright dark:hover:bg-brand-bright dark:text-white"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving to Database...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>
                {taxonomies.length === 0
                  ? "Clear Taxonomies"
                  : "Save content taxonomies"}
              </span>
            </>
          )}
        </Button>
      </CardFooter>
    </section>
  );
}

