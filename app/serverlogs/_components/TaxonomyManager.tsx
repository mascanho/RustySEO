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
}

interface TaxonomyNodeProps {
  taxonomy: Taxonomy;
  onRemove: (id: string) => void;
  onAddChild: (parentId: string, name: string) => void;
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
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAdd = () => {
    if (newChildName.trim()) {
      onAddChild(taxonomy.id, newChildName);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDuplicate = (taxonomies: Taxonomy[], name: string): boolean => {
    const cleanName = name.trim().replace(/^\/|\/$/g, "");
    for (const tax of taxonomies) {
      if (tax.name.toLowerCase() === cleanName.toLowerCase()) return true;
      if (tax.children && isDuplicate(tax.children, cleanName)) return true;
    }
    return false;
  };

  const handleAddRootTaxonomy = () => {
    const cleanName = newTaxonomy.trim().replace(/^\/|\/$/g, "");
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
    };

    setTaxonomies([...taxonomies, newTax]);
    setNewTaxonomy("");
    toast.success(`Taxonomy "${cleanName}" has been added`);
  };

  const handleAddChildTaxonomy = (parentId: string, childName: string) => {
    const cleanName = childName.trim().replace(/^\/|\/$/g, "");
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

    setTaxonomies((prev) => addChildRecursive(prev, parentId, newChild));
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

  const buildPaths = (taxonomies: Taxonomy[], parentPath: string): string[] => {
    let paths: string[] = [];
    taxonomies.forEach((tax) => {
      const currentPath = parentPath + tax.name;
      if (tax.children.length > 0) {
        paths.push(currentPath + "/");
        paths.push(...buildPaths(tax.children, currentPath + "/"));
      } else {
        paths.push(currentPath);
      }
    });
    return paths;
  };

  const handleSubmitTaxonomies = async () => {
    if (taxonomies.length === 0) {
      toast.error("No taxonomies to submit");
      return;
    }

    if (taxonomies.length > 8) {
      toast.error("Maximum of 8 root taxonomies allowed");
      return;
    }

    setIsSubmitting(true);

    try {
      const taxonomyPaths = buildPaths(taxonomies, "/");

      console.log(taxonomyPaths);

      await invoke("set_taxonomies", { newTaxonomies: taxonomyPaths });

      localStorage.setItem("taxonomies", JSON.stringify(taxonomies));

      toast.success("Taxonomies saved to database", {
        description: `Successfully saved ${taxonomyPaths.length} taxonomies`,
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
    const getTaxonomies = () => {
      const storedTaxonomies = localStorage.getItem("taxonomies");
      if (storedTaxonomies) {
        const parsed = JSON.parse(storedTaxonomies);
        const ensureChildren = (items: any[]): Taxonomy[] => {
          return items.map((item) => ({
            ...item,
            children: item.children ? ensureChildren(item.children) : [],
          }));
        };
        setTaxonomies(ensureChildren(parsed));
      }
    };
    getTaxonomies();
  }, []);

  return (
    <section className="w-[650px] max-w-5xl mx-auto h-[650px] pt-4">
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[380px]">
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
          <div className="border dark:border-brand-dark rounded-md h-[330px] overflow-y-auto">
            {taxonomies.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center h-full flex items-center justify-center dark:text-white/50">
                No taxonomies added yet
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
      <CardFooter>
        <Button
          onClick={handleSubmitTaxonomies}
          className="w-full flex items-center gap-2 bg-brand-bright hover:bg-brand-bright dark:bg-brand-bright dark:hover:bg-brand-bright dark:text-white"
          size="lg"
          disabled={taxonomies.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving to Database...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save content taxonomies</span>
            </>
          )}
        </Button>
      </CardFooter>
    </section>
  );
}

