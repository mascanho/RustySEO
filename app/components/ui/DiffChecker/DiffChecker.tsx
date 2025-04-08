"use client";

import { FileDiff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect } from "react";

// Mock data for crawl comparisons
const previousCrawl = {
  date: "2025-04-01",
  urls: [
    "/",
    "/about",
    "/blog",
    "/contact",
    "/faq",
    "/products",
    "/services",
    "/terms",
  ],
};

const currentCrawl = {
  date: "2025-04-06",
  urls: [
    "/",
    "/about",
    "/blog",
    "/blog/spring-update",
    "/careers",
    "/careers/lead-engineer",
    "/careers/lead-engineer",
    "/careers/lead-engineer",
    "/careers/lead-engineer",
    "/careers/lead-engineer",
    "/careers/lead-engineer",
    "/careers/lead-engineer",
    "/contact",
    "/products",
    "/products/new-item",
    "/services/consulting",
  ],
};

// Process data to identify URL changes
const processUrlChanges = () => {
  const added = currentCrawl.urls.filter(
    (url) => !previousCrawl.urls.includes(url),
  );
  const removed = previousCrawl.urls.filter(
    (url) => !currentCrawl.urls.includes(url),
  );

  return { added, removed };
};

const { added, removed } = processUrlChanges();

export default function DiffChecker() {
  useEffect(() => {
    console.log("Diff check mounted");
  }, []);

  return (
    <section
      className="w-full h-full flex flex-col dark:bg-brand-dark/40 overflow-hidden p-0 dark:border dark:border-brand-dark/50  dark:text-white"
      style={{ height: "530px" }}
    >
      <CardHeader className="bg-white dark:bg-brand-darker pt-4 pb-2 px-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FileDiff className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {new Date(previousCrawl.date).toLocaleDateString()} →{" "}
              {new Date(currentCrawl.date).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-brand-darker border dark:border-brand-dark/50 rounded-md">
              <div className="text-sm text-gray-500 dark:text-gray-300">
                Previous Crawl
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {previousCrawl.urls.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300">
                pages
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-brand-darker rounded-md border dark:border-brand-dark/50">
              <div className="text-sm text-gray-500 dark:text-gray-300">
                Current Crawl
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {currentCrawl.urls.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300">
                pages
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-center mt-1">
            <Badge
              variant="outline"
              className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
            >
              +{added.length} new
            </Badge>
            <Badge
              variant="outline"
              className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
            >
              -{removed.length} removed
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        <Tabs defaultValue="added" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full grid bg-gray-100 dark:bg-gray-900 grid-cols-2 rounded-none">
            <TabsTrigger
              value="added"
              className="rounded-none data-[state=active]:bg-green-50 data-[state=active]:dark:bg-green-900/30 data-[state=active]:text-green-500"
            >
              New URLs ({added.length})
            </TabsTrigger>
            <TabsTrigger
              value="removed"
              className="rounded-none data-[state=active]:bg-red-50 data-[state=active]:dark:bg-red-900/30 data-[state=active]:text-red-500"
            >
              Removed URLs ({removed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="added"
            className="mt-0 flex-1 min-h-0 overflow-hidden"
          >
            <ScrollArea className="h-full w-full">
              <div className="py-2">
                {added.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No new URLs found
                  </div>
                ) : (
                  added.sort().map((url) => (
                    <div
                      key={url}
                      className="py-2 px-4 font-mono text-sm border-l-2 border-l-green-500 hover:bg-green-50 dark:hover:bg-green-900/10"
                    >
                      {url}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="removed"
            className="mt-0 flex-1 min-h-0 overflow-hidden"
          >
            <ScrollArea className="h-full w-full">
              <div className="py-2">
                {removed.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No removed URLs found
                  </div>
                ) : (
                  removed.sort().map((url) => (
                    <div
                      key={url}
                      className="py-2 px-4 font-mono text-sm border-l-2 border-l-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                      {url}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </section>
  );
}
