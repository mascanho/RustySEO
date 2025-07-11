// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { useKeywordsStore } from "@/store/KWTrackingStore";

interface KeywordData {
  id: string;
  keyword: string;
  url: string;
  current_impressions: number;
  initial_impressions: number;
  current_clicks: number;
  initial_clicks: number;
  current_position: number;
  initial_position: number;
  date_added: string;
}

export function KeywordsTableDeep() {
  const [data, setData] = useState<KeywordData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Store
  const { setKeywords } = useKeywordsStore();

  const fetchKeywordsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await invoke<KeywordData[]>(
        "fetch_keywords_summarized_matched_command",
      );
      setData(response);

      useKeywordsStore.getState().setKeywords(response);

      console.log(response, "reponse KWs");
    } catch (error) {
      // toast.error("Failed to fetch data");
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await invoke("refresh_keywords_data");
      await fetchKeywordsData();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchKeywordsData]);

  useEffect(() => {
    fetchKeywordsData();
  }, [fetchKeywordsData]);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const term = searchTerm.toLowerCase().trim();

    if (!term) {
      return data;
    }

    const searchWords = term.split(/\s+/).filter((word) => word.length > 0);

    return data.filter((item) => {
      const keyword = item.keyword?.toLowerCase() || "";
      const url = item.url?.toLowerCase() || "";
      const query = item.query?.toLowerCase() || ""; // If you have a query field

      // Check all search words against all relevant fields
      return searchWords.every(
        (word) =>
          keyword.includes(word) || url.includes(word) || query.includes(word),
      );

      // Alternative: Check if all words appear in at least one field (not necessarily same field)
      // return searchWords.every(word =>
      //   [keyword, url, query].some(field => field.includes(word))
      // );
    });
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleDelete = async (id: string) => {
    if (!id) {
      toast.error("No keyword ID provided");
      return;
    }

    try {
      await invoke("delete_keyword_command", { id: String(id) });
      await emit("keyword-tracked", { action: "delete", id });

      // Update state properly
      setData((prev) => prev.filter((item) => item.id !== id));

      // Handle pagination
      if (currentData.length <= 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      toast.success("Keyword deleted successfully");
    } catch (error) {
      toast.error("Failed to delete keyword");
      console.error("Delete error:", error);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const renderChangeIndicator = (
    current: number,
    previous: number,
    inverse = false,
  ) => {
    const change = calculateChange(current, previous);
    const isPositive = inverse ? change < 0 : change > 0;

    if (change === 0) return null;

    return (
      <div
        className={`flex items-center text-xs whitespace-nowrap ${isPositive ? "text-green-500" : "text-red-500"}`}
      >
        {isPositive ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      }

      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mt-4 dark:bg-brand-darker">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="relative w-full md:w-auto md:flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-white/50" />
          <Input
            placeholder="Search by keyword or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={isRefreshing}
            className="dark:bg-brand-darker dark:text-white/50 dark:border-brand-dark"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>

          <div className="flex items-center">
            <span className="text-sm mr-2 dark:text-white/50">Show:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px] dark:bg-brand-darker dark:text-white/50">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden dark:border-brand-dark">
        <div className="overflow-x-auto h-[calc(100vh-26.5rem)] max-h-[calc(100vh-26rem)] border-none">
          <Table className="bg-white dark:border-brand-dark [&_tr]:h-[12px] [&_td]:p-0 [&_th]:p-0">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow style={{ height: "12px" }}>
                <TableHead
                  className="w-[150px]"
                  style={{ height: "12px", padding: 10 }}
                >
                  Keyword
                </TableHead>
                <TableHead
                  className="text-right"
                  style={{ height: "12px", padding: 10 }}
                >
                  Impressions
                </TableHead>
                <TableHead
                  className="text-right"
                  style={{ height: "12px", padding: 10 }}
                >
                  Clicks
                </TableHead>
                <TableHead
                  className="hidden md:table-cell"
                  style={{ height: "12px", padding: 10 }}
                >
                  URL
                </TableHead>
                <TableHead
                  className="text-right"
                  style={{ height: "12px", padding: 10 }}
                >
                  Position
                </TableHead>
                <TableHead
                  className="hidden md:table-cell"
                  style={{ height: "12px", padding: 10 }}
                >
                  Updated
                </TableHead>
                <TableHead
                  className="text-center"
                  style={{ height: "12px", padding: 10 }}
                >
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length > 0 ? (
                currentData.map((row) => (
                  <TableRow key={row.id} style={{ height: "12px" }}>
                    <TableCell
                      style={{ height: "12px", padding: 5, paddingLeft: 12 }}
                      className="font-medium truncate text-xs"
                    >
                      {row?.query}
                    </TableCell>
                    <TableCell
                      style={{ height: "12px", padding: 0 }}
                      className="text-right"
                    >
                      <div className="flex items-center justify-end gap-1 h-[12px] overflow-hidden">
                        <span className="text-xs leading-none">
                          {row.current_impressions.toLocaleString()}
                        </span>
                        {renderChangeIndicator(
                          row.current_impressions,
                          row.initial_impressions,
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      style={{ height: "12px", padding: 0, paddingRight: 10 }}
                      className="text-right"
                    >
                      <div className="flex items-center justify-end gap-1 h-[12px] overflow-hidden">
                        <span className="text-xs leading-none">
                          {row.current_clicks.toLocaleString()}
                        </span>
                        {renderChangeIndicator(
                          row.current_clicks,
                          row.initial_clicks,
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      style={{ height: "12px", padding: 0, paddingLeft: 16 }}
                      className="hidden md:table-cell truncate"
                    >
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-xs leading-none"
                      >
                        {row.url}
                      </a>
                    </TableCell>
                    <TableCell
                      style={{ height: "12px", padding: 0, paddingRight: 12 }}
                      className="text-right"
                    >
                      <div className="flex items-center justify-end gap-1 h-[12px] overflow-hidden">
                        <span className="text-xs leading-none">
                          {row.current_position.toFixed(1)}
                        </span>
                        {renderChangeIndicator(
                          row.current_position,
                          row.initial_position,
                          true,
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      style={{ height: "12px", padding: 0, paddingLeft: 16 }}
                      className="hidden md:table-cell"
                    >
                      <span className="text-xs leading-none">
                        {formatDate(new Date())}
                      </span>
                    </TableCell>
                    <TableCell
                      style={{ height: "12px", paddingTop: 8 }}
                      className="text-center"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-[12px] w-[12px]"
                        onClick={() => handleDelete(row?.id)}
                        aria-label="Delete row"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow style={{ height: "12px" }}>
                  <TableCell
                    colSpan={7}
                    style={{ height: "12px", padding: 0 }}
                    className="text-center text-xs"
                  >
                    {searchTerm
                      ? `No results found for "${searchTerm}"`
                      : "No keywords available"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>{" "}
        </div>
      </div>

      {filteredData.length > 0 && (
        <div className="mt-2 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground dark:text-white/50">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)}{" "}
            of {filteredData.length} entries
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className=" w-5 h-5 text-xs p-0 dark:bg-slate-900 dark:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span key={`ellipsis-${index}`} className="px-2 ">
                  ...
                </span>
              ) : (
                <Button
                  key={`page-${page}`}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => handlePageChange(Number(page))}
                  className=" w-4 h-4 text-xs p-0  dark:text-brand-bright"
                >
                  {page}
                </Button>
              ),
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="w-5 h-5 dark:bg-slate-900 dark:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
