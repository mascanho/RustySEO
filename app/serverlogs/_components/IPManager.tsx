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

const DEFAULT_GOOGLE_IPS = [
  // IPv4 ranges
  "64.233.160.0/19",
  "66.102.0.0/20",
  "66.249.64.0/19",
  "72.14.192.0/18",
  "74.125.0.0/16",
  "108.177.8.0/21",
  "172.217.0.0/19",
  "173.194.0.0/16",
  "209.85.128.0/17",
  "216.58.192.0/19",
  "216.239.32.0/19",
  // IPv6 ranges
  "2001:4860:4000::/36",
  "2404:6800:4000::/36",
  "2607:f8b0:4000::/36",
  "2800:3f0:4000::/36",
  "2a00:1450:4000::/36",
  "2c0f:fb50:4000::/36",
];

interface IPRange {
  id: string;
  range: string;
}

interface IPManagerProps {
  closeDialog: () => void;
}

export default function IPManager({ closeDialog }: IPManagerProps) {
  const [ipRanges, setIpRanges] = useState<IPRange[]>([]);
  const [newIpRange, setNewIpRange] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddIPRange = () => {
    if (!newIpRange.trim()) {
      toast.error("IP range cannot be empty");
      return;
    }

    // Validate IP range format (simple check)
    if (
      !newIpRange.match(/^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/) &&
      !newIpRange.includes("::")
    ) {
      toast.error(
        "Invalid IP range format. Use CIDR notation (e.g., 192.168.1.0/24)",
      );
      return;
    }

    // Check for duplicates
    if (
      ipRanges.some((ip) => ip.range.toLowerCase() === newIpRange.toLowerCase())
    ) {
      toast.error("This IP range already exists");
      return;
    }

    // Add new IP range with a unique ID
    const newRange: IPRange = {
      id: crypto.randomUUID(),
      range: newIpRange.trim(),
    };

    setIpRanges([...ipRanges, newRange]);
    setNewIpRange("");
    toast.success(`IP range "${newIpRange}" has been added`);
  };

  const handleRemoveIPRange = (id: string) => {
    const rangeToRemove = ipRanges.find((ip) => ip.id === id);
    setIpRanges(ipRanges.filter((ip) => ip.id !== id));

    if (rangeToRemove) {
      toast(`IP range "${rangeToRemove.range}" has been removed`, {
        description: "You can add it again if needed",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddIPRange();
    }
  };

  const handleSubmitIPRanges = async () => {
    if (ipRanges.length === 0) {
      toast.error("No IP ranges to submit");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert IP ranges to an array of strings
      const ranges = ipRanges.map((ip) => ip.range);


      // Store in localStorage
      localStorage.setItem("google_verified_ips", JSON.stringify(ipRanges));

      toast.success("Google IP ranges saved", {
        description: `Successfully saved ${ipRanges.length} IP ranges`,
      });
    } catch (error) {
      toast.error("Failed to save IP ranges", {
        description: "Please try again later",
      });
      console.error("Error saving IP ranges:", error);
    } finally {
      closeDialog();
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Load IP ranges from localStorage or use defaults
    const loadIPRanges = () => {
      const storedRanges = localStorage.getItem("google_verified_ips");
      if (storedRanges) {
        setIpRanges(JSON.parse(storedRanges));
      } else {
        // Initialize with default Google IPs if nothing in storage
        setIpRanges(
          DEFAULT_GOOGLE_IPS.map((range) => ({
            id: crypto.randomUUID(),
            range,
          })),
        );
      }
    };
    loadIPRanges();
  }, []);

  return (
    <section className="w-[650px] max-w-5xl mx-auto h-[650px] pt-4">
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[380px]">
        {/* Left Column - Add IP Range Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Add Google Verified IP Range</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP range (CIDR format)"
              value={newIpRange}
              onChange={(e) => setNewIpRange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-8 dark:text-white"
              disabled={isSubmitting}
            />
            <Button
              onClick={handleAddIPRange}
              className="flex items-center gap-1 h-8 bg-brand-bright dark:hover:bg-brand-bright dark:bg-brand-bright dark:text-white hover:bg-brand-bright"
              disabled={isSubmitting}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>
          <div className="py-2 bg-neutral-100 dark:bg-brand-dark dark:text-white/50 px-2 rounded-md mt-4">
            <p className="text-xs text-muted-foreground">
              Add Google&apos;s verified IP ranges in CIDR notation (e.g.,
              64.233.160.0/19). These are used to identify legitimate Google
              crawlers.
            </p>
            <p className="text-xs text-muted-foreground">
              Please refer to{" "}
              <a
                className="mr-1 underline"
                href="https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot"
                target="_blank"
              >
                Google&apos;s{""}
              </a>
              {""}
              official documentation
            </p>
          </div>
        </div>

        {/* Right Column - IP Range List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Current IP Ranges</h3>
          <div className="border dark:border-brand-dark rounded-md h-[330px] overflow-y-auto">
            {ipRanges.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center h-full flex items-center justify-center">
                No IP ranges added yet
              </div>
            ) : (
              <div className="grid  px-3 mt-1">
                {ipRanges.map((ip) => (
                  <div
                    key={ip.id}
                    className="flex items-center justify-between border dark:border-slate-500 my-1 px-3 bg-muted rounded-md"
                  >
                    <div className="flex items-center">
                      <BiSolidCategoryAlt
                        className="dark:text-white"
                        size={12}
                      />
                      <span className="px-3 dark:text-white/80 py-1 text-sm border-red-500">
                        {ip.range}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveIPRange(ip.id)}
                      aria-label={`Remove ${ip.range}`}
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
          onClick={handleSubmitIPRanges}
          className="w-full flex items-center gap-2 bg-brand-bright hover:bg-brand-bright dark:bg-brand-bright dark:hover:bg-brand-bright dark:text-white"
          size="lg"
          disabled={ipRanges.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving IP Ranges...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Google IP Ranges</span>
            </>
          )}
        </Button>
      </CardFooter>
    </section>
  );
}
