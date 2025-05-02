// @ts-nocheck
import { useEffect } from "react";
import { FileDiff, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDiffStore } from "@/store/DiffStore";
import { invoke } from "@tauri-apps/api/core";
import { format } from "date-fns";

export default function DiffChecker() {
  const { diff, setBulkDiffData, setLoading, setError } = useDiffStore();

  useEffect(() => {
    const fetchDiff = async () => {
      try {
        setLoading(true);
        if (!diff) {
          const diffResult = await invoke("get_url_diff_command");
          setBulkDiffData(diffResult);
        }
      } catch (err) {
        console.error("Error fetching diff:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDiff();
  }, [diff, setBulkDiffData, setLoading, setError]);

  // Format dates for display
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return format(new Date(timestamp), "MMM dd, yyyy - h:mm a");
  };

  console.log(diff, "Diff Data from the modal");

  if (diff?.added?.url !== diff?.removed?.url) {
    return (
      <section className="flex flex-col justify-center items-center min-h-screen p-6  transition-colors duration-300 -mt-64">
        <div className="bg-white p-8 w-full max-w-lg text-center ">
          <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 tracking-tight">
            Crawled Website Mismatch
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            The websites from the previous and current crawls are different and
            cannot be compared.
          </p>
          <div className="space-y-6">
            <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg transition-colors duration-200">
              <svg
                className="w-7 h-7 text-blue-600 dark:text-blue-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
                ></path>
              </svg>
              <div className="text-left">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Previous Crawl:
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400 break-all underline">
                  {diff?.removed?.url}
                </span>
              </div>
            </div>
            <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg transition-colors duration-200">
              <svg
                className="w-7 h-7 text-green-600 dark:text-green-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.763 21H7.438a2 2 0 01-1.789-2.894l3.5-7A2 2 0 0110 10H5a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-8a2 2 0 00-2-2z"
                ></path>
              </svg>
              <div className="text-left">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Current Crawl:
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400 break-all underline">
                  {diff?.added?.url}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="w-full h-full flex flex-col dark:bg-brand-dark/40 overflow-hidden p-0 dark:border dark:border-brand-dark/50 dark:text-white"
      style={{ height: "530px" }}
    >
      <CardHeader className="bg-white dark:bg-brand-darker pt-4 pb-2 px-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FileDiff className="h-5 w-5 text-gray-700 dark:text-gray-300 -ml-1" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              URL Changes Detected Since Last Crawl
            </span>
          </div>

          {/* Date Comparison Section */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                Previous: {formatDate(diff?.previous_crawl_timestamp)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Current: {formatDate(diff?.current_crawl_timestamp)}</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mt-1">
            <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-brand-darker border dark:border-brand-dark/50 rounded-md">
              <div className="text-sm text-gray-500 dark:text-gray-300">
                Added Pages
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {diff?.added?.number_of_pages ?? 0}
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
                {diff?.removed?.number_of_pages ?? 0}
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
              +{diff?.added?.pages?.length ?? 0} new
            </Badge>
            <Badge
              variant="outline"
              className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
            >
              -{diff?.removed?.pages?.length ?? 0} removed
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
              New URLs ({diff?.added?.pages?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="removed"
              className="rounded-none data-[state=active]:bg-red-50 data-[state=active]:dark:bg-red-900/30 data-[state=active]:text-red-500"
            >
              Removed URLs ({diff?.removed?.pages?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="added"
            className="mt-0 flex-1 min-h-0 overflow-hidden"
          >
            <ScrollArea className="h-full w-full">
              <div className="py-2">
                {!diff?.added?.pages?.length ? (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No new URLs found
                  </div>
                ) : (
                  diff.added.pages.sort().map((url) => (
                    <div
                      key={url}
                      className="py-2 px-4 font-mono text-sm border-l-2 border-l-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 flex items-center"
                    >
                      <span className="truncate" title={url}>
                        {url}
                      </span>
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
                {!diff?.removed?.pages?.length ? (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No removed URLs found
                  </div>
                ) : (
                  diff.removed.pages.sort().map((url) => (
                    <div
                      key={url}
                      className="py-2 px-4 font-mono text-sm border-l-2 border-l-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center"
                    >
                      <span className="truncate" title={url}>
                        {url}
                      </span>
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
