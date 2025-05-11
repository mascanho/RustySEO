// @ts-nocheck
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoke } from "@tauri-apps/api/core";

// Mock data with previous values for comparison
const initialData = [
  {
    id: "1",
    keyword: "digital marketing",
    impressions: 5200,
    prevImpressions: 4800,
    clicks: 320,
    prevClicks: 280,
    url: "https://example.com/digital-marketing",
    position: 3.2,
    prevPosition: 4.1,
    date: "2025-05-01",
  },
  {
    id: "2",
    keyword: "seo services",
    impressions: 3800,
    prevImpressions: 4200,
    clicks: 210,
    prevClicks: 230,
    url: "https://example.com/seo-services",
    position: 5.6,
    prevPosition: 5.2,
    date: "2025-05-01",
  },
  {
    id: "3",
    keyword: "content strategy",
    impressions: 2900,
    prevImpressions: 2100,
    clicks: 180,
    prevClicks: 120,
    url: "https://example.com/content-strategy",
    position: 7.3,
    prevPosition: 9.5,
    date: "2025-05-01",
  },
  {
    id: "4",
    keyword: "social media marketing",
    impressions: 6700,
    prevImpressions: 5900,
    clicks: 410,
    prevClicks: 350,
    url: "https://example.com/social-media",
    position: 2.1,
    prevPosition: 2.8,
    date: "2025-05-01",
  },
  {
    id: "5",
    keyword: "ppc advertising",
    impressions: 4100,
    prevImpressions: 4300,
    clicks: 290,
    prevClicks: 310,
    url: "https://example.com/ppc-advertising",
    position: 4.8,
    prevPosition: 4.5,
    date: "2025-05-01",
  },
  {
    id: "6",
    keyword: "email marketing",
    impressions: 3200,
    prevImpressions: 2800,
    clicks: 190,
    prevClicks: 160,
    url: "https://example.com/email-marketing",
    position: 6.2,
    prevPosition: 7.1,
    date: "2025-05-01",
  },
  {
    id: "7",
    keyword: "conversion optimization",
    impressions: 2100,
    prevImpressions: 1800,
    clicks: 130,
    prevClicks: 110,
    url: "https://example.com/conversion-optimization",
    position: 8.4,
    prevPosition: 9.2,
    date: "2025-05-01",
  },
  {
    id: "8",
    keyword: "local seo",
    impressions: 3600,
    prevImpressions: 3100,
    clicks: 240,
    prevClicks: 200,
    url: "https://example.com/local-seo",
    position: 4.3,
    prevPosition: 5.7,
    date: "2025-05-01",
  },
  {
    id: "9",
    keyword: "mobile optimization",
    impressions: 4800,
    prevImpressions: 5200,
    clicks: 320,
    prevClicks: 350,
    url: "https://example.com/mobile-optimization",
    position: 3.9,
    prevPosition: 3.5,
    date: "2025-05-01",
  },
  {
    id: "10",
    keyword: "backlink strategy",
    impressions: 2700,
    prevImpressions: 2300,
    clicks: 150,
    prevClicks: 130,
    url: "https://example.com/backlink-strategy",
    position: 7.8,
    prevPosition: 8.5,
    date: "2025-05-01",
  },
  {
    id: "11",
    keyword: "content marketing",
    impressions: 5100,
    prevImpressions: 4600,
    clicks: 340,
    prevClicks: 290,
    url: "https://example.com/content-marketing",
    position: 3.5,
    prevPosition: 4.2,
    date: "2025-05-02",
  },
  {
    id: "12",
    keyword: "keyword research",
    impressions: 4300,
    prevImpressions: 3900,
    clicks: 260,
    prevClicks: 230,
    url: "https://example.com/keyword-research",
    position: 4.1,
    prevPosition: 4.8,
    date: "2025-05-02",
  },
  {
    id: "13",
    keyword: "technical seo",
    impressions: 3500,
    prevImpressions: 3200,
    clicks: 210,
    prevClicks: 190,
    url: "https://example.com/technical-seo",
    position: 5.2,
    prevPosition: 5.9,
    date: "2025-05-02",
  },
  {
    id: "14",
    keyword: "ecommerce seo",
    impressions: 4900,
    prevImpressions: 4200,
    clicks: 320,
    prevClicks: 270,
    url: "https://example.com/ecommerce-seo",
    position: 3.8,
    prevPosition: 4.5,
    date: "2025-05-02",
  },
  {
    id: "15",
    keyword: "voice search optimization",
    impressions: 2800,
    prevImpressions: 2200,
    clicks: 170,
    prevClicks: 130,
    url: "https://example.com/voice-search",
    position: 6.7,
    prevPosition: 7.9,
    date: "2025-05-02",
  },
];

export default function SEOMetricsTable() {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // KEYWORD STUFF
  const [keywordsSummary, setKeywordsSummary] = useState([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Memoized handlers
  const handleKeywordsSummary = useCallback(async () => {
    try {
      const response = await invoke(
        "fetch_keywords_summarized_matched_command",
      );
      setKeywordsSummary(response);
    } catch (error) {
      console.error("Failed to fetch Keywords Summary:", error);
    }
  }, []);

  const handleFetchKeywords = useCallback(async () => {
    try {
      const response = await invoke("fetch_tracked_keywords_command");
      const summaryResponse = invoke(
        "fetch_keywords_summarized_matched_command",
      );

      const transformedData = response.map((item) => {
        const summaryMatch = summaryResponse.find(
          (s) => s.query === item.query,
        );
        return {
          id: item.id,
          keyword: item.query,
          initialImpressions: summaryMatch
            ? summaryMatch.initial_impressions
            : item.impressions,
          currentImpressions: summaryMatch
            ? summaryMatch.current_impressions
            : item.impressions,
          initialClicks: summaryMatch
            ? summaryMatch.initial_clicks
            : item.clicks,
          currentClicks: summaryMatch
            ? summaryMatch.current_clicks
            : item.clicks,
          url: item.url,
          initialPosition: summaryMatch
            ? summaryMatch.initial_position.toFixed(1)
            : item.position.toFixed(1),
          currentPosition: summaryMatch
            ? Number(summaryMatch.current_position.toFixed(1))
            : Number(item.position.toFixed(1)),
          dateAdded: new Date(item.date).toLocaleDateString("en-GB", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          }),
        };
      });

      setInitialData(transformedData);
      setKeywords(transformedData);
      sessionStorage.setItem(
        "keywordsLength",
        transformedData.length.toString(),
      );
    } catch (error) {
      console.error("Failed to fetch keywords:", error);
    }
  }, []);

  useEffect(() => {
    if (needsUpdate && !isUpdating) {
      const updateData = async () => {
        setIsUpdating(true);
        try {
          await invoke("match_tracked_with_gsc_command");
          await handleKeywordsSummary();
          await handleFetchKeywords();
        } catch (error) {
          toast.error("Failed to refresh data");
          console.error("Error updating data:", error);
        } finally {
          setIsUpdating(false);
        }
      };
      updateData();
      setNeedsUpdate(false);
    }
  }, [needsUpdate, isUpdating, handleKeywordsSummary, handleFetchKeywords]);

  const handleMatchedTrackedKws = useCallback(async () => {
    try {
      const response = await invoke("read_matched_keywords_from_db_command");
      setMatchedTrackedKws(response);
    } catch (error) {
      console.error("Failed to fetch Matched Tracked Keywords:", error);
    }
  }, []);

  // Filter data based on search term
  const filteredData = data.filter(
    (item) =>
      item.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Delete a row
  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id));
    // If deleting the last item on a page, go to previous page
    if (currentData.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  // Render change indicator
  const renderChangeIndicator = (
    current: number,
    previous: number,
    inverse = false,
  ) => {
    const change = calculateChange(current, previous);
    const isPositive = inverse ? change < 0 : change > 0;

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

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of middle pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        end = 4;
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push("...");
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">SEO Performance Metrics</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="relative w-full md:w-auto md:flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by keyword or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center">
          <span className="text-sm mr-2">Show:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[200px]">Keyword</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="hidden md:table-cell">URL</TableHead>
                <TableHead className="text-right">Position</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length > 0 ? (
                currentData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.keyword}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{row.impressions.toLocaleString()}</span>
                        {renderChangeIndicator(
                          row.impressions,
                          row.prevImpressions,
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{row.clicks.toLocaleString()}</span>
                        {renderChangeIndicator(row.clicks, row.prevClicks)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell truncate max-w-[200px]">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {row.url}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{row.position.toFixed(1)}</span>
                        {renderChangeIndicator(
                          row.position,
                          row.prevPosition,
                          true,
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {row.date}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(row.id)}
                        aria-label="Delete row"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No results found for "{searchTerm}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of{" "}
          {filteredData.length} entries
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2">
                ...
              </span>
            ) : (
              <Button
                key={`page-${page}`}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(Number(page))}
                className="min-w-[32px]"
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
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
