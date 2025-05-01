// @ts-nocheck
import { useEffect } from "react";
import { FileDiff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDiffStore } from "@/store/DiffStore";
import { invoke } from "@tauri-apps/api/core";

export default function DiffChecker() {
  const { diff, setBulkDiffData, setLoading, setError } = useDiffStore();

  useEffect(() => {
    const fetchDiff = async () => {
      try {
        if (diff === null) {
          const diffResult = await invoke("get_url_diff_command");
          setBulkDiffData(diffResult);
        }
      } catch (err) {
        console.error("Error fetching diff:", err);
      }
    };

    fetchDiff();
  }, [diff]); // Add diff.length as dependency

  return (
    <section
      className="w-full h-full flex flex-col dark:bg-brand-dark/40 overflow-hidden p-0 dark:border dark:border-brand-dark/50 dark:text-white"
      style={{ height: "530px" }}
    >
      <button className="hidden">Check Diff</button>

      <CardHeader className="bg-white dark:bg-brand-darker pt-4 pb-2 px-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FileDiff className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              URL Changes Detected Since Last Crawl
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-brand-darker border dark:border-brand-dark/50 rounded-md">
              <div className="text-sm text-gray-500 dark:text-gray-300">
                Added Pages
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {diff?.added.number_of_pages}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300">
                pages
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-brand-darker rounded-md border dark:border-brand-dark/50">
              <div className="text-sm text-gray-500 dark:text-gray-300">
                Removed Pages
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {diff?.removed.number_of_pages}
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
              +{diff?.added.pages.length} new
            </Badge>
            <Badge
              variant="outline"
              className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
            >
              -{diff?.removed.pages.length} removed
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
              New URLs ({diff?.added.pages.length})
            </TabsTrigger>
            <TabsTrigger
              value="removed"
              className="rounded-none data-[state=active]:bg-red-50 data-[state=active]:dark:bg-red-900/30 data-[state=active]:text-red-500"
            >
              Removed URLs ({diff?.removed.pages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="added"
            className="mt-0 flex-1 min-h-0 overflow-hidden"
          >
            <ScrollArea className="h-full w-full">
              <div className="py-2">
                {diff?.added.pages.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No new URLs found
                  </div>
                ) : (
                  diff?.added.pages.sort().map((url) => (
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
                {diff?.removed.pages.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No removed URLs found
                  </div>
                ) : (
                  diff?.removed.pages.sort().map((url) => (
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
