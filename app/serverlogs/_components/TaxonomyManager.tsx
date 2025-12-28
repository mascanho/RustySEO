// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, X, Save, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardFooter } from "@/components/ui/card";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { invoke } from "@/lib/invoke";

interface PathConfig {
  path: string;
  matchType: "startsWith" | "contains" | "exactMatch";
}

interface Taxonomy {
  id: string;
  name: string;
  paths: PathConfig[];
}

function PathItem({ pathConfig, onUpdate, onRemove }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPath, setEditedPath] = useState(pathConfig.path);

  const handleMatchTypeChange = () => {
    let newMatchType: "startsWith" | "contains" | "exactMatch";
    if (pathConfig.matchType === "startsWith") {
      newMatchType = "contains";
    } else if (pathConfig.matchType === "contains") {
      newMatchType = "exactMatch";
    } else {
      newMatchType = "startsWith";
    }
    onUpdate({ ...pathConfig, matchType: newMatchType });
  };

  const getButtonText = (
    currentType: "startsWith" | "contains" | "exactMatch",
  ) => {
    if (currentType === "startsWith") return "Starts with";
    if (currentType === "contains") return "Contains";
    return "Exact match";
  };

  const handlePathUpdate = () => {
    if (editedPath.trim() && editedPath !== pathConfig.path) {
      onUpdate({ ...pathConfig, path: editedPath.trim() });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedPath(pathConfig.path);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center w-[] justify-between text-sm bg-muted dark:bg-slate-800/50 rounded-md px-2 py-1">
      <div className="flex items-center gap-2 flex-1">
        {isEditing ? (
          <Input
            value={editedPath}
            onChange={(e) => setEditedPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handlePathUpdate();
              if (e.key === "Escape") handleCancelEdit();
            }}
            className="h-6 text-xs font-mono flex-1"
            autoFocus
          />
        ) : (
          <span
            className="font-mono text-xs cursor-pointer hover:bg-slate-700/50 rounded px-1 py-0.5 flex-1"
            onClick={() => setIsEditing(true)}
            title="Click to edit path"
          >
            {pathConfig.path}
          </span>
        )}

        <Button
          variant="outline"
          size="sm"
          className="h-6 text-xs"
          onClick={handleMatchTypeChange}
        >
          {getButtonText(pathConfig.matchType)}
        </Button>
      </div>

      <div className="flex items-center gap-1 ml-2">
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-green-500"
              onClick={handlePathUpdate}
            >
              <Save className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleCancelEdit}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => onRemove(pathConfig.path)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function MatchTypeToggle({ matchType, onChange, className = "" }) {
  const getNextMatchType = (
    currentType: "startsWith" | "contains" | "exactMatch",
  ) => {
    if (currentType === "startsWith") return "contains";
    if (currentType === "contains") return "exactMatch";
    return "startsWith";
  };

  const getButtonText = (
    currentType: "startsWith" | "contains" | "exactMatch",
  ) => {
    if (currentType === "startsWith") return "Starts with";
    if (currentType === "contains") return "Contains";
    return "Exact match";
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={`h-8 text-xs ${className}`}
      onClick={() => onChange(getNextMatchType(matchType))}
    >
      {getButtonText(matchType)}
    </Button>
  );
}

function Segment({ taxonomy, onUpdate, onRemove }) {
  const [newPath, setNewPath] = useState("");
  const [newPathMatchType, setNewPathMatchType] = useState<
    "startsWith" | "contains"
  >("startsWith");

  const handleAddPath = () => {
    const cleanPath = newPath.trim();
    if (!cleanPath) return;

    const pathExists = taxonomy.paths.some((p) => p.path === cleanPath);
    if (pathExists) {
      toast.error("This path already exists in the segment");
      return;
    }

    const newPathConfig: PathConfig = {
      path: cleanPath,
      matchType: newPathMatchType,
    };

    const updatedPaths = [...taxonomy.paths, newPathConfig];
    onUpdate({ ...taxonomy, paths: updatedPaths });
    setNewPath("");
  };

  const handleRemovePath = (pathToRemove: string) => {
    const updatedPaths = taxonomy.paths.filter((p) => p.path !== pathToRemove);
    onUpdate({ ...taxonomy, paths: updatedPaths });
  };

  const handleUpdatePath = (updatedPathConfig: PathConfig) => {
    const updatedPaths = taxonomy.paths.map((p) =>
      p.path === updatedPathConfig.path ? updatedPathConfig : p,
    );
    onUpdate({ ...taxonomy, paths: updatedPaths });
  };

  return (
    <div className="border dark:border-slate-700 rounded-md p-3 space-y-2 dark:text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BiSolidCategoryAlt className="dark:text-white" size={14} />
          <span className="font-semibold dark:text-white/90">
            {taxonomy.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500"
          onClick={() => onRemove(taxonomy.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1 pl-2">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Paths
        </h4>
        {taxonomy.paths.length > 0 ? (
          <div className="space-y-1">
            {taxonomy.paths.map((pathConfig) => (
              <PathItem
                key={pathConfig.path}
                pathConfig={pathConfig}
                onUpdate={handleUpdatePath}
                onRemove={handleRemovePath}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 pl-2">
            No paths added yet.
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-2 pl-2">
        <Input
          placeholder="Add a new path (e.g., /blog/)"
          value={newPath}
          onChange={(e) => setNewPath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddPath()}
          className="h-8 dark:text-white flex-1"
        />
        <MatchTypeToggle
          matchType={newPathMatchType}
          onChange={setNewPathMatchType}
        />
        <Button
          onClick={handleAddPath}
          className="h-8 dark:bg-brand-bright dark:text-white dark:hover:bg-brand-bright/50 dark:hover:text-white"
        >
          Add Path
        </Button>
      </div>
    </div>
  );
}

export default function TaxonomyManager({ closeDialog }) {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [newTaxonomyName, setNewTaxonomyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleAddSegment = () => {
    const cleanName = newTaxonomyName.trim();
    if (!cleanName) {
      toast.error("Segment name cannot be empty");
      return;
    }
    if (
      taxonomies.some(
        (tax) => tax.name.toLowerCase() === cleanName.toLowerCase(),
      )
    ) {
      toast.error("A segment with this name already exists");
      return;
    }

    const newTaxonomy: Taxonomy = {
      id: crypto.randomUUID(),
      name: cleanName,
      paths: [],
    };

    setTaxonomies([...taxonomies, newTaxonomy]);
    setNewTaxonomyName("");
  };

  const handleUpdateSegment = (updatedTaxonomy) => {
    const newTaxonomies = taxonomies.map((tax) =>
      tax.id === updatedTaxonomy.id ? updatedTaxonomy : tax,
    );
    setTaxonomies(newTaxonomies);
  };

  const handleRemoveSegment = (id) => {
    setTaxonomies(taxonomies.filter((tax) => tax.id !== id));
  };

  const handleSubmitTaxonomies = async () => {
    setIsSubmitting(true);
    try {
      const taxonomyInfo = taxonomies.flatMap((tax) =>
        tax.paths.map((pathConfig) => ({
          path: pathConfig.path,
          match_type: pathConfig.matchType,
          name: tax.name,
        })),
      );

      await invoke("set_taxonomies", { newTaxonomies: taxonomyInfo });
      localStorage.setItem("taxonomies", JSON.stringify(taxonomies));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("taxonomiesUpdated"));

      toast.success("Segments saved to database");
    } catch (error) {
      toast.error("Failed to save segments");
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
      const storedTaxonomies = localStorage.getItem("taxonomies");

      if (storedTaxonomies) {
        try {
          const parsed = JSON.parse(storedTaxonomies);
          if (Array.isArray(parsed)) {
            loadedTaxonomies = parsed.map((tax) => ({
              ...tax,
              paths: Array.isArray(tax.paths)
                ? tax.paths.map((p) =>
                    typeof p === "string"
                      ? { path: p, matchType: "startsWith" } // Default to startsWith for old string paths
                      : p,
                  )
                : [],
            }));

            // Immediately send to backend
            const taxonomyInfo = loadedTaxonomies.flatMap((tax) =>
              tax.paths.map((pathConfig) => ({
                path: pathConfig.path,
                match_type: pathConfig.matchType,
                name: tax.name,
              })),
            );
            await invoke("set_taxonomies", { newTaxonomies: taxonomyInfo });
          }
        } catch (e) {
          console.error("Failed to parse taxonomies from localStorage", e);
          localStorage.removeItem("taxonomies");
        }
      } else {
        try {
          const backendTaxonomies = await invoke("get_taxonomies");
          if (
            Array.isArray(backendTaxonomies) &&
            backendTaxonomies.length > 0
          ) {
            const grouped = backendTaxonomies.reduce((acc, item) => {
              if (!acc[item.name]) {
                acc[item.name] = {
                  id: crypto.randomUUID(),
                  name: item.name,
                  paths: [],
                };
              }
              acc[item.name].paths.push({
                path: item.path,
                matchType: item.match_type || "startsWith",
              });
              return acc;
            }, {});
            loadedTaxonomies = Object.values(grouped);
            localStorage.setItem(
              "taxonomies",
              JSON.stringify(loadedTaxonomies),
            );

            // Immediately send to backend after loading from backend and storing in local storage
            const taxonomyInfo = loadedTaxonomies.flatMap((tax) =>
              tax.paths.map((pathConfig) => ({
                path: pathConfig.path,
                match_type: pathConfig.matchType,
                name: tax.name,
              })),
            );
            await invoke("set_taxonomies", { newTaxonomies: taxonomyInfo });
          }
        } catch (error) {
          console.log("No taxonomies found in backend:", error);
        }
      }

      setTaxonomies(loadedTaxonomies);
      setIsLoading(false);
    };

    loadTaxonomies();
  }, []);

  if (isLoading) {
    return (
      <section className="w-[650px] max-w-5xl mx-auto h-full pt-4 flex flex-col">
        <CardContent className="flex items-center justify-center h-[360px]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </section>
    );
  }

  return (
    <section className="w-[750px] max-w-5xl mx-auto h-full pt-4 flex flex-col">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium dark:text-white">
            Add New Segment
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="New Segment Name (e.g., Blog)"
              value={newTaxonomyName}
              onChange={(e) => setNewTaxonomyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSegment()}
              className="h-8 dark:text-white"
            />
            <Button
              onClick={handleAddSegment}
              className="h-8 dark:bg-brand-bright dark:text-white dark:hover:bg-brand-bright/50 dark:hover:text-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Segment
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium dark:text-white">
            Current Segments
          </h3>
          <div className="border dark:border-brand-dark rounded-md h-[370px] overflow-y-auto p-2 space-y-3">
            {taxonomies.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center dark:text-white/50">
                No segments added yet.
              </div>
            ) : (
              taxonomies.map((tax) => (
                <Segment
                  key={tax.id}
                  taxonomy={tax}
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
          className="w-full flex items-center gap-2 bg-brand-bright hover:bg-brand-bright dark:bg-brand-bright dark:hover:bg-brand-bright/50 dark:text-white"
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
