// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardFooter } from "@/components/ui/card";
import { BiSolidCategoryAlt, BiWorld } from "react-icons/bi";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { invoke } from "@/lib/invoke";
import { useRouter } from "next/navigation";

interface DomainManagerProps {
  closeDialog: () => void;
}

export default function DomainManager({ closeDialog }: DomainManagerProps) {
  const [inputValue, setInputValue] = useState("");
  const [domain, setDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOnTables, setShowOnTables] = useState(false);
  const router = useRouter();

  const handleAddDomain = () => {
    if (!inputValue.trim()) {
      toast.error("Domain cannot be empty");
      return;
    }

    // Basic domain validation
    if (!/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(inputValue)) {
      toast.error("Please enter a valid domain");
      return;
    }

    setDomain(inputValue);
    setInputValue("");
    toast.success(`Domain "${inputValue}" has been added`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddDomain();
    }
  };

  const handleSubmitDomain = async () => {
    if (!domain.trim()) {
      toast.error("No domain to submit");
      return;
    }

    setIsSubmitting(true);

    try {
      // Store both domain and showOnTables in localStorage
      localStorage.setItem("domain", domain);
      localStorage.setItem("showOnTables", JSON.stringify(showOnTables));

      toast.success("Settings saved", {
        description: `Domain: ${domain} | Show on tables: ${showOnTables ? "Yes" : "No"}`,
      });
    } catch (error) {
      toast.error("Failed to save settings", {
        description: "Please try again later",
      });
      console.error("Error saving settings:", error);
    } finally {
      closeDialog();
      setIsSubmitting(false);
      window.location.reload();
    }
  };

  useEffect(() => {
    // Get settings from localStorage
    const storedDomain = localStorage.getItem("domain");
    const storedShowOnTables = localStorage.getItem("showOnTables");

    if (storedDomain) {
      setDomain(storedDomain);
    }
    if (storedShowOnTables) {
      setShowOnTables(JSON.parse(storedShowOnTables));
    }
  }, []);

  return (
    <section className="w-[750px] max-w-5xl mx-auto h-[500px] pt-4">
      <CardContent className="grid gap-6 h-[490px]">
        {/* Domain Input Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium dark:text-white">Set Domain</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter your domain (e.g., example.com)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-8 dark:text-white"
              disabled={isSubmitting}
            />
            <Button
              onClick={handleAddDomain}
              className="flex items-center gap-1 h-8 bg-brand-bright dark:hover:bg-brand-bright dark:bg-brand-bright dark:text-white hover:bg-brand-bright"
              disabled={isSubmitting}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>

          {/* Current Domain Display */}
          <div className="space-y-4 mt-6">
            <h3 className="text-sm font-medium dark:text-white">
              Current Domain
            </h3>
            <div className="border dark:border-brand-dark rounded-md p-4">
              {domain ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BiWorld className="dark:text-white" size={16} />
                    <span className="px-3 dark:text-white/80 py-1 text-sm">
                      {domain}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDomain("")}
                    aria-label="Remove domain"
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center dark:text-white/50">
                  No domain set yet
                </div>
              )}
            </div>
          </div>

          {/* Show on Tables Toggle */}
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="show-on-tables"
              checked={showOnTables}
              onCheckedChange={setShowOnTables}
              disabled={isSubmitting}
              className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-blue-700"
            />
            <Label className="dark:text-white/50" htmlFor="show-on-tables">
              Show domain on tables
            </Label>
          </div>

          <div className="py-2 bg-neutral-100 dark:bg-brand-dark dark:text-white/50 px-2 rounded-md mt-4">
            <p className="text-xs text-muted-foreground dark:text-white/50">
              Enter your primary domain to enable site-wide features. This
              should be your root domain without protocol (e.g.,
              &quot;example.com&quot; not &quot;https://example.com&quot;).
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmitDomain}
          className="w-full flex items-center gap-2 bg-brand-bright hover:bg-brand-bright dark:bg-brand-bright dark:hover:bg-brand-bright dark:text-white"
          size="lg"
          disabled={!domain || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Settings...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Settings & Reload</span>
            </>
          )}
        </Button>
      </CardFooter>
    </section>
  );
}
