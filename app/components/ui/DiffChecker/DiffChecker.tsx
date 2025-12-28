// @ts-nocheck
import { useEffect } from "react";
import { FileDiff, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDiffStore } from "@/store/DiffStore";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { GiSpiderBot } from "react-icons/gi";

export default function DiffChecker() {
  const { diff, setBulkDiffData, setLoading, setError } = useDiffStore();

  useEffect(() => {
    const fetchDiff = async () => {
      try {
        setLoading(true);
        if (!diff) {
          const diffResult = await api.getUrlDiff();
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

  console.log(diff, "THE DIFF DATA");

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return format(new Date(timestamp), "MMM dd, yyyy - h:mm a");
  };

  const normalizeUrl = (url) => {
    if (!url) return "";
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.hostname}${parsed.pathname.replace(/\/+$/, "")}`.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  };

  const getDomain = (url) => {
    if (!url) return null;
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname;
    } catch {
      return null;
    }
  };

  const normalizedAdded =
    diff?.added?.pages?.map((url) => normalizeUrl(url)) || [];
  const normalizedRemoved =
    diff?.removed?.pages?.map((url) => normalizeUrl(url)) || [];

  const uniqueAdded = Array.from(
    new Set(normalizedAdded.filter((url) => !normalizedRemoved.includes(url))),
  );

  const uniqueRemoved = Array.from(
    new Set(normalizedRemoved.filter((url) => !normalizedAdded.includes(url))),
  );

  const addedBaseUrlIndex = (diff?.added?.pages.length - 1) / 2;
  const addedBaseUrl = getDomain(diff?.added.pages[addedBaseUrlIndex]);
  const removedBaseUrlIndex = (diff?.removed?.pages.length - 1) / 2;
  const removedBaseUrl = getDomain(diff?.removed.pages[removedBaseUrlIndex]);

  if (addedBaseUrl && removedBaseUrl && addedBaseUrl !== removedBaseUrl) {
    return (
      <section className="flex flex-col justify-center items-center -mt-10 h-full w-full px-6 transition-colors duration-300 ">
        <div className="bg-white px-8 w-full max-w-lg text-center dark:bg-brand-darker">
          <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 tracking-tight">
            Crawled Website Mismatch
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            The websites from the previous and current crawls are different and
            cannot be compared.
          </p>
          <div className="space-y-6 dark:bg-brand-darker">
            <div className="flex items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors duration-200">
              <GiSpiderBot className="text-2xl text-purple-500 mr-2" />
              <div className="text-left">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Previous Crawl:
                </span>
                <span
                  className={`first-letter:ml-2 text-gray-600 dark:text-gray-400 break-all ${diff?.removed?.url === null ? "italic ml-2 text-red-400" : "ml-2 underline"}`}
                >
                  {diff?.removed?.url === null
                    ? "No website crawled previously"
                    : removedBaseUrl}
                </span>
              </div>
            </div>
            <div className="flex items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors duration-200">
              <GiSpiderBot className="text-2xl text-blue-500 mr-2" />
              <div className="text-left">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Current Crawl:
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400 break-all underline">
                  {addedBaseUrl}
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
              {diff?.added?.number_of_pages === diff?.removed?.number_of_pages
                ? "No URLs were added or removed between the crawls"
                : "RustySEO detected changes between the crawls"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Previous: {formatDate(diff?.removed?.timestamp)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Current: {formatDate(diff?.added?.timestamp)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-1">
            <div className="flex flex-col items-center justify-center p-3 dark:bg-brand-darker bg-gray-50 dark:bg-brand-darker border dark:border-brand-dark/50 rounded-md">
              <div className="text-sm text-gray-500 dark:text-gray-300">
                Added Pages
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {uniqueAdded.length}
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
                {uniqueRemoved.length}
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
              +{uniqueAdded.length} new
            </Badge>
            <Badge
              variant="outline"
              className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
            >
              -{uniqueRemoved.length} removed
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
              New URLs ({uniqueAdded.length})
            </TabsTrigger>
            <TabsTrigger
              value="removed"
              className="rounded-none data-[state=active]:bg-red-50 data-[state=active]:dark:bg-red-900/30 data-[state=active]:text-red-500"
            >
              Removed URLs ({uniqueRemoved.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="added"
            className="mt-0 flex-1 min-h-0 overflow-hidden"
          >
            <ScrollArea className="h-full w-full">
              <div className="py-2">
                {uniqueAdded.length === 0 ? (
                  <div className="py-8 text-center mt-16 text-gray-500 dark:text-gray-400">
                    No new URLs added since last crawl
                  </div>
                ) : (
                  uniqueAdded.sort().map((url) => (
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
                {uniqueRemoved.length === 0 ? (
                  <div className="py-8 mt-16 text-center text-gray-500 dark:text-gray-400">
                    No removed URLs detected between crawls
                  </div>
                ) : (
                  uniqueRemoved.sort().map((url) => (
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
