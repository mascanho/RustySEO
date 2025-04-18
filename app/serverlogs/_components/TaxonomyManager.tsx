// @ts-nocheck
"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { PlusCircle, X, Save, Loader2, Pen } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BiSolidCategoryAlt } from "react-icons/bi";

interface Taxonomy {
  id: string;
  name: string;
}

export default function TaxonomyManager({ closeDialog }) {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [newTaxonomy, setNewTaxonomy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storedTaxonomies, setStoredTaxonomies] = useState<Taxonomy[]>([]);

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

    // Add new taxonomy
    const newTax: Taxonomy = {
      id: Date.now().toString(),
      name: newTaxonomy.trim(),
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

    setIsSubmitting(true);

    try {
      // Simulate API call to database
      await new Promise((resolve) => setTimeout(resolve, 1500));

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
  console.log(storedTaxonomies, "This is the stored taxonomies");

  return (
    <section className="w-[650px] max-w-5xl mx-auto h-[650px] pt-4">
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[380px]">
        {/* Left Column - Add Taxonomy Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Add New Taxonomy</h3>
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
            <p className="text-sm text-muted-foreground ">
              Add content taxonomies one at a time to categorize your content.
              Each taxonomy should be unique.
            </p>
          </div>
        </div>

        {/* Right Column - Taxonomy List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Current Taxonomies</h3>
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
          className="w-full flex items-center gap-2 bg-brand-bright"
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
              <span>Save Taxonomies to Database</span>
            </>
          )}
        </Button>
      </CardFooter>
    </section>
  );
}
