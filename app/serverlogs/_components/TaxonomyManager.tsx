// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardFooter } from "@/components/ui/card";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { invoke } from "@tauri-apps/api/core";

interface Taxonomy {
  id: string;
  name: string;
}

interface TaxonomyManagerProps {
  closeDialog: () => void;
}

export default function TaxonomyManager({ closeDialog }: TaxonomyManagerProps) {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [newTaxonomy, setNewTaxonomy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTaxonomy = () => {
    if (!newTaxonomy.trim()) {
      toast.error("Taxonomy name cannot be empty");
      return;
    }

    // Check for duplicates
    if (
      taxonomies.some(
        (tax) => tax.name.toLowerCase() === newTaxonomy.toLowerCase(),
      )
    ) {
      toast.error("This taxonomy already exists");
      return;
    }

    // Add new taxonomy with a unique ID
    const newTax: Taxonomy = {
      id: crypto.randomUUID(), // Use crypto.randomUUID() for unique IDs
      name: newTaxonomy.toLowerCase().trim(),
    };

    setTaxonomies([...taxonomies, newTax]);

    setNewTaxonomy("");

    toast.success(`Taxonomy "${newTaxonomy}" has been added`);
  };

  const handleRemoveTaxonomy = (id: string) => {
    const taxonomyToRemove = taxonomies.find((tax) => tax.id === id);
    setTaxonomies(taxonomies.filter((tax) => tax.id !== id));

    if (taxonomyToRemove) {
      toast(`Taxonomy "${taxonomyToRemove.name}" has been removed`, {
        description: "You can add it again if needed",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTaxonomy();
    }
  };

  const handleSubmitTaxonomies = async () => {
    if (taxonomies.length === 0) {
      toast.error("No taxonomies to submit");
      return;
    }

    if (taxonomies.length > 8) {
      toast.error("Maximum of 8 taxonomies allowed");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert taxonomies to an array of names
      const taxonomyNames = taxonomies.map((tax) => tax.name);

      console.log(taxonomyNames);

      // Send the array to the Tauri command with the correct argument name
      await invoke("set_taxonomies", { newTaxonomies: taxonomyNames });

      // STORE THE INFORMATION INSIDE LOCALSTORAGE
      localStorage.setItem("taxonomies", JSON.stringify(taxonomies));

      toast.success("Taxonomies saved to database", {
        description: `Successfully saved ${taxonomies.length} taxonomies`,
      });

      // Optionally clear the list after successful submission
      // setTaxonomies([])
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
    // GET THE TAXONOMIES FROM LOCALSTORAGE
    const getTaxonomies = () => {
      const storedTaxonomies = localStorage.getItem("taxonomies");
      if (storedTaxonomies) {
        setTaxonomies(JSON.parse(storedTaxonomies));
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
            Add New Taxonomy
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
              onClick={handleAddTaxonomy}
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
              <div className="text-sm text-muted-foreground py-4 text-center h-full flex items-center justify-center">
                No taxonomies added yet
              </div>
            ) : (
              <div className="grid gap-2 px-3 mt-2">
                {taxonomies.map((tax) => (
                  <div
                    key={tax.id}
                    className="flex items-center justify-between border dark:border-slate-500 mt-1 px-3 bg-muted rounded-md"
                  >
                    <div className="flex items-center">
                      <BiSolidCategoryAlt
                        className="dark:text-white"
                        size={12}
                      />
                      <span className="px-3 dark:text-white/80 py-1 text-sm border-red-500">
                        {tax.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTaxonomy(tax.id)}
                      aria-label={`Remove ${tax.name}`}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
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
