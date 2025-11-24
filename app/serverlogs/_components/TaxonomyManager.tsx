// @ts-nocheck
"use client";

import React, { useState } from "react";
import { PlusCircle, X, Save, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardFooter } from "@/components/ui/card";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { invoke } from "@tauri-apps/api/core";
import { useLogAnalysis } from "@/store/ServerLogsStore";

function Segment({ taxonomy, allTaxonomies, onUpdate, onRemove }) {
  const [newPath, setNewPath] = useState("");

  const handleAddPath = () => {
    if (!newPath) return;

    if (taxonomy.paths.includes(newPath)) {
      toast.error("This path already exists in this segment.");
      return;
    }

    const pathExistsInOtherSegment = allTaxonomies.some(tax => 
      tax.id !== taxonomy.id && tax.paths.includes(newPath)
    );
    if (pathExistsInOtherSegment) {
      toast.warning("This path is already used in another segment.");
    }

    const updatedPaths = [...taxonomy.paths, newPath];
    onUpdate({ ...taxonomy, paths: updatedPaths });
    setNewPath("");
  };

  const handleRemovePath = (pathToRemove) => {
    const updatedPaths = taxonomy.paths.filter((p) => p !== pathToRemove);
    onUpdate({ ...taxonomy, paths: updatedPaths });
  };

  const handleMatchTypeChange = () => {
    const newMatchType =
      taxonomy.matchType === "startsWith" ? "contains" : "startsWith";
    onUpdate({ ...taxonomy, matchType: newMatchType });
  };

  return (
    <div className="border dark:border-slate-700 rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BiSolidCategoryAlt className="dark:text-white" size={14} />
          <span className="font-semibold dark:text-white/90">{taxonomy.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={handleMatchTypeChange}
          >
            {taxonomy.matchType === "startsWith" ? "Starts with" : "Contains"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500"
            onClick={() => onRemove(taxonomy.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1 pl-2">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Paths</h4>
        {taxonomy.paths.length > 0 ? (
          taxonomy.paths.map((path) => (
            <div
              key={path}
              className="flex items-center justify-between text-sm bg-muted dark:bg-slate-800/50 rounded-md px-2 py-1"
            >
              <span className="font-mono text-xs">{path}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemovePath(path)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 pl-2">No paths added yet.</p>
        )}
      </div>
      <div className="flex gap-2 pt-2 pl-2">
        <Input
          placeholder="Add a new path (e.g., /blog/)"
          value={newPath}
          onChange={(e) => setNewPath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddPath()}
          className="h-8 dark:text-white"
        />
        <Button onClick={handleAddPath} className="h-8">
          Add Path
        </Button>
      </div>
    </div>
  );
}

export default function TaxonomyManager({ closeDialog }) {
  const { taxonomies, setTaxonomies } = useLogAnalysis();
  const [newTaxonomyName, setNewTaxonomyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSegment = () => {
    const cleanName = newTaxonomyName.trim();
    if (!cleanName) {
      toast.error("Segment name cannot be empty");
      return;
    }
    if (taxonomies.some((tax) => tax.name.toLowerCase() === cleanName.toLowerCase())) {
      toast.error("A segment with this name already exists");
      return;
    }

    const newTaxonomy = {
      id: crypto.randomUUID(),
      name: cleanName,
      paths: [],
      matchType: "startsWith",
    };

    setTaxonomies([...taxonomies, newTaxonomy]);
    setNewTaxonomyName("");
  };

  const handleUpdateSegment = (updatedTaxonomy) => {
    const newTaxonomies = taxonomies.map((tax) =>
      tax.id === updatedTaxonomy.id ? updatedTaxonomy : tax
    );
    setTaxonomies(newTaxonomies);
  };

  const handleRemoveSegment = (id) => {
    setTaxonomies(taxonomies.filter((tax) => tax.id !== id));
  };

  const handleSubmitTaxonomies = async () => {
    setIsSubmitting(true);
    try {
      const taxonomyInfo = taxonomies.flatMap(tax =>
        tax.paths.map(path => ({
          path: path,
          match_type: tax.matchType,
          name: tax.name,
        }))
      );

      await invoke("set_taxonomies", { newTaxonomies: taxonomyInfo });
      // The store already saves to localStorage in the setTaxonomies action
      toast.success("Segments saved to database");
    } catch (error) {
      toast.error("Failed to save segments");
      console.error("Error saving taxonomies:", error);
    } finally {
      closeDialog();
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-[650px] max-w-5xl mx-auto h-full pt-4 flex flex-col">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium dark:text-white">Add New Segment</h3>
          <div className="flex gap-2">
            <Input
              placeholder="New Segment Name (e.g., Blog)"
              value={newTaxonomyName}
              onChange={(e) => setNewTaxonomyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSegment()}
              className="h-8 dark:text-white"
            />
            <Button onClick={handleAddSegment} className="h-8">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Segment
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium dark:text-white">Current Segments</h3>
          <div className="border dark:border-brand-dark rounded-md h-[300px] overflow-y-auto p-2 space-y-3">
            {taxonomies.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center dark:text-white/50">
                No segments added yet.
              </div>
            ) : (
              taxonomies.map((tax) => (
                <Segment
                  key={tax.id}
                  taxonomy={tax}
                  allTaxonomies={taxonomies}
                  onUpdate={handleUpdateSegment}
                  onRemove={handleRemoveSegment}
                />
              ))
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-4">
        <Button
          onClick={handleSubmitTaxonomies}
          className="w-full flex items-center gap-2 bg-brand-bright hover:bg-brand-bright dark:bg-brand-bright dark:hover:bg-brand-bright dark:text-white"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Save Segments</span>
        </Button>
      </CardFooter>
    </section>
  );
}

