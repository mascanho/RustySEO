// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertCircle,
  BadgeCheck,
  ChevronDown,
  Download,
  FileAudio,
  FileCode,
  FileText,
  FileType,
  FileType2,
  FileVideo,
  Filter,
  Image,
  Package,
  RefreshCw,
  Search,
  FolderTree,
  User,
  Bot,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { message, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { handleCopyClick, handleURLClick } from "./helpers/useCopyOpen";
import { useAsyncLogFilter } from "./hooks/useAsyncLogFilter";
import { Loader2 } from "lucide-react";

interface LogEntry {
  browser: string;
  crawler_type: string;
  file_type: string;
  frequency: number;
  ip: string;
  method: string;
  referer: string;
  response_size: number;
  timestamp: string;
  user_agent: string;
  path: string;
  verified: boolean;
  status?: number;
  country?: string;
  is_crawler?: boolean;
}

interface Taxonomy {
  id: string;
  name: string;
  paths: Array<{
    path: string;
    matchType: "contains" | "exactMatch";
  }>;
}

interface WidgetTableProps {
  data: any;
  entries: LogEntry[];
  segment: string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

const formatResponseSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Get status code category and description
const getStatusCodeInfo = (statusCode: number) => {
  if (statusCode >= 100 && statusCode < 200) {
    return {
      category: "Informational",
      description: "Informational response",
      color: "bg-blue-500",
      textColor: "text-blue-800 dark:text-blue-200",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    };
  } else if (statusCode >= 200 && statusCode < 300) {
    return {
      category: "Success",
      description: getSuccessDescription(statusCode),
      color: "bg-green-500",
      textColor: "text-green-800 dark:text-green-200",
      bgColor: "bg-green-100 dark:bg-green-900",
    };
  } else if (statusCode >= 300 && statusCode < 400) {
    return {
      category: "Redirection",
      description: getRedirectionDescription(statusCode),
      color: "bg-yellow-500",
      textColor: "text-yellow-800 dark:text-yellow-200",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
    };
  } else if (statusCode >= 400 && statusCode < 500) {
    return {
      category: "Client Error",
      description: getClientErrorDescription(statusCode),
      color: "bg-orange-500",
      textColor: "text-orange-800 dark:text-orange-200",
      bgColor: "bg-orange-100 dark:bg-orange-900",
    };
  } else if (statusCode >= 500 && statusCode < 600) {
    return {
      category: "Server Error",
      description: getServerErrorDescription(statusCode),
      color: "bg-red-500",
      textColor: "text-red-800 dark:text-red-200",
      bgColor: "bg-red-100 dark:bg-red-900",
    };
  }
  return {
    category: "Unknown",
    description: "Unknown status code",
    color: "bg-gray-500",
    textColor: "text-gray-800 dark:text-gray-200",
    bgColor: "bg-gray-100 dark:bg-gray-900",
  };
};

// Helper functions for status code descriptions
const getSuccessDescription = (code: number): string => {
  const descriptions: Record<number, string> = {
    200: "OK - Request succeeded",
    201: "Created - Resource created",
    202: "Accepted - Request accepted for processing",
    204: "No Content - Request succeeded, no content to return",
    206: "Partial Content - Partial content delivered",
  };
  return descriptions[code] || "Success - Request succeeded";
};

const getRedirectionDescription = (code: number): string => {
  const descriptions: Record<number, string> = {
    301: "Moved Permanently - Resource moved permanently",
    302: "Found - Resource temporarily moved",
    304: "Not Modified - Resource not modified since last request",
    307: "Temporary Redirect - Temporary redirection",
    308: "Permanent Redirect - Permanent redirection",
  };
  return descriptions[code] || "Redirection - Resource moved";
};

const getClientErrorDescription = (code: number): string => {
  const descriptions: Record<number, string> = {
    400: "Bad Request - Malformed request",
    401: "Unauthorized - Authentication required",
    403: "Forbidden - Access denied",
    404: "Not Found - Resource not found",
    405: "Method Not Allowed - HTTP method not allowed",
    408: "Request Timeout - Request took too long",
    429: "Too Many Requests - Rate limit exceeded",
  };
  return descriptions[code] || "Client Error - Invalid request";
};

const getServerErrorDescription = (code: number): string => {
  const descriptions: Record<number, string> = {
    500: "Internal Server Error - Server encountered an error",
    502: "Bad Gateway - Invalid response from upstream server",
    503: "Service Unavailable - Server temporarily unavailable",
    504: "Gateway Timeout - Upstream server timeout",
  };
  return (
    descriptions[code] || "Server Error - Server failed to fulfill request"
  );
};

// Get file icon
const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "HTML":
      return <FileCode className="text-blue-500 mt-[3px]" size={12} />;
    case "Image":
      return <Image className="text-green-500 mt-[3px]" size={12} />;
    case "Video":
      return <FileVideo className="text-purple-500 mt-[3px]" size={12} />;
    case "Audio":
      return <FileAudio className="text-yellow-500 mt-[3px]" size={12} />;
    case "PHP":
      return <FileCode className="text-indigo-500 mt-[3px]" size={12} />;
    case "TXT":
      return <FileType className="text-gray-500 mt-[3px]" size={12} />;
    case "CSS":
      return <FileCode className="text-pink-500 mt-[3px]" size={12} />;
    case "JS":
      return <FileCode className="text-yellow-600 mt-3px" size={12} />;
    case "Document":
      return <FileText className="text-red-500 mt-3px" size={12} />;
    case "Archive":
      return <Package className="text-orange-500 mt-[3px]" size={12} />;
    case "Font":
      return <FileType2 className="text-teal-500 mt-[3px]" size={12} />;
    case "Unknown":
      return <AlertCircle className="text-gray-400 mt-[3px]" size={12} />;
    default:
      return <FileCode className="text-gray-400 mt-[3px]" size={12} />;
  }
};

const WidgetStatusCodesTable: React.FC<WidgetTableProps> = ({
  data,
  entries,
  segment,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(100);
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<number[]>([]);
  const [statusCategoryFilter, setStatusCategoryFilter] = useState<string[]>(
    [],
  );
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>({ key: "timestamp", direction: "descending" });
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [domain, setDomain] = useState("");
  const [showOnTables, setShowOnTables] = useState(false);
  const [botTypeFilter, setBotTypeFilter] = useState<string | null>("all");
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string | "all">(
    "all",
  );
  const [crawlerTypeFilter, setCrawlerTypeFilter] = useState<string[]>([]);
  const [availableStatusCategories, setAvailableStatusCategories] = useState<
    string[]
  >([]);
  const [isReady, setIsReady] = useState(false);

  // Use deferred rendering to unblock initial paint
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  useEffect(() => {
    const tax = localStorage.getItem("taxonomies");
    if (tax) {
      setTaxonomies(JSON.parse(tax));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDomain = localStorage.getItem("domain");
      if (storedDomain) {
        setDomain(storedDomain);
      }

      const isShowing = localStorage.getItem("showOnTables");
      if (isShowing === "true") {
        setShowOnTables(true);
      }
    }
  }, [data?.length]);

  // Get all unique status categories from entries
  useEffect(() => {
    if (!isReady) return;
    if (entries && entries.length > 0) {
      const categories = new Set<string>();
      entries.forEach((log) => {
        if (log.status) {
          const info = getStatusCodeInfo(log.status);
          categories.add(info.category);
        }
      });
      const sortedCategories = Array.from(categories).sort();
      setAvailableStatusCategories(sortedCategories);
    }
  }, [entries, isReady]);

  // Initialize status filter when segment is a specific status code
  useEffect(() => {
    if (segment && segment !== "all") {
      // Check if segment is a status code number
      const statusCode = parseInt(segment);
      if (!isNaN(statusCode)) {
        setStatusFilter([statusCode]);
      }
    }
  }, [segment]);

  // Function to check if a path matches taxonomy criteria
  const pathMatchesTaxonomy = (path: string, taxonomy: Taxonomy): boolean => {
    return taxonomy.paths.some((taxPath) => {
      if (taxPath.matchType === "exactMatch") {
        return path === taxPath.path;
      } else if (taxPath.matchType === "contains") {
        return path.includes(taxPath.path);
      }
      return false;
    });
  };

  // Function to get taxonomy name for a path
  const getTaxonomyForPath = (path: string): string => {
    const taxonomy = taxonomies.find((tax) => pathMatchesTaxonomy(path, tax));
    return taxonomy?.name || "Uncategorized";
  };

  // Get unique status codes from entries
  const uniqueStatusCodes = useMemo(() => {
    if (!isReady) return [];
    const codes = new Set<number>();
    entries.forEach((log) => {
      if (log.status) {
        codes.add(log.status);
      }
    });
    return Array.from(codes).sort((a, b) => a - b);
  }, [entries, isReady]);

  // Get unique crawler types from entries
  const uniqueCrawlerTypes = useMemo(() => {
    if (!isReady) return [];
    const types = new Set<string>();
    entries.forEach((log) => {
      if (log.crawler_type) {
        types.add(log.crawler_type);
      }
    });
    return Array.from(types).sort();
  }, [entries, isReady]);

  const sortFn = useCallback(
    (a: LogEntry, b: LogEntry) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      const aValue = a[key as keyof LogEntry];
      const bValue = b[key as keyof LogEntry];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "ascending"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "ascending" ? aValue - bValue : bValue - aValue;
      }
      if (aValue < bValue) return direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return direction === "ascending" ? 1 : -1;
      return 0;
    },
    [sortConfig],
  );

  const filterFn = useCallback(
    (log: LogEntry) => {
      // Apply segment filter first (from props)
      if (segment && segment !== "all") {
        const taxonomy = taxonomies.find((tax) => tax.name === segment);
        if (taxonomy && !pathMatchesTaxonomy(log.path, taxonomy)) {
          return false;
        }
      }

      // Apply taxonomy filter (user selection)
      if (selectedTaxonomy !== "all") {
        const taxonomy = taxonomies.find((tax) => tax.id === selectedTaxonomy);
        if (taxonomy && !pathMatchesTaxonomy(log.path, taxonomy)) {
          return false;
        }
      }

      // Apply status category filter
      if (statusCategoryFilter.length > 0) {
        if (!log.status) return false;
        const info = getStatusCodeInfo(log.status);
        if (!statusCategoryFilter.includes(info.category)) return false;
      }

      // Apply specific status code filter
      if (statusFilter.length > 0) {
        if (!log.status) return false;
        if (!statusFilter.includes(log.status)) return false;
      }

      if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        const matches =
          log.ip.toLowerCase().includes(lowerCaseSearch) ||
          log.path.toLowerCase().includes(lowerCaseSearch) ||
          (log.user_agent &&
            log.user_agent.toLowerCase().includes(lowerCaseSearch)) ||
          (log.referer && log.referer.toLowerCase().includes(lowerCaseSearch));
        if (!matches) return false;
      }

      if (methodFilter.length > 0) {
        if (!methodFilter.includes(log.method)) return false;
      }

      if (fileTypeFilter.length > 0) {
        const typeMatch = fileTypeFilter.some(
          (filterType) =>
            filterType.toLowerCase() === (log.file_type || "").toLowerCase(),
        );
        if (!typeMatch) return false;
      }

      if (verifiedFilter !== null) {
        if (log.verified !== verifiedFilter) return false;
      }

      if (botTypeFilter !== null) {
        if (botTypeFilter === "Mobile") {
          if (!log.user_agent || !log.user_agent.includes("Mobile"))
            return false;
        } else if (botTypeFilter === "Desktop") {
          if (log.user_agent && log.user_agent.includes("Mobile")) return false;
        }
      }

      // Apply crawler type filter
      if (crawlerTypeFilter.length > 0) {
        if (!crawlerTypeFilter.includes(log.crawler_type)) return false;
      }

      return true;
    },
    [
      segment,
      searchTerm,
      methodFilter,
      verifiedFilter,
      fileTypeFilter,
      statusCategoryFilter,
      statusFilter,
      botTypeFilter,
      selectedTaxonomy,
      taxonomies,
      crawlerTypeFilter,
    ],
  );

  const { filteredData: filteredLogs, isProcessing } = useAsyncLogFilter(
    entries,
    filterFn,
    sortConfig,
    sortFn,
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    methodFilter,
    verifiedFilter,
    fileTypeFilter,
    statusCategoryFilter,
    statusFilter,
    botTypeFilter,
    selectedTaxonomy,
    segment,
    crawlerTypeFilter,
  ]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = useMemo(
    () => filteredLogs.slice(indexOfFirstItem, indexOfLastItem),
    [filteredLogs, indexOfFirstItem, indexOfLastItem],
  );
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setMethodFilter([]);
    setFileTypeFilter([]);
    setStatusFilter([]);
    setStatusCategoryFilter([]);
    setVerifiedFilter(null);
    setSortConfig({ key: "timestamp", direction: "descending" });
    setExpandedRow(null);
    setSelectedTaxonomy("all");
    setBotTypeFilter(null);
    setCrawlerTypeFilter([]);
    // Reset status filter based on segment
    if (segment && segment !== "all") {
      const statusCode = parseInt(segment);
      if (!isNaN(statusCode)) {
        setStatusFilter([statusCode]);
      } else {
        setStatusFilter([]);
      }
    } else {
      setStatusFilter([]);
    }
  };

  const exportCSV = async () => {
    const headers = [
      "IP",
      "Timestamp",
      "Method",
      "Path",
      "File Type",
      "Response Size",
      "Status Code",
      "Status Category",
      "Status Description",
      "Frequency",
      "User Agent",
      "Referer",
      "Crawler Type",
      "Google Verified",
      "Taxonomy",
    ];

    const dataToExport = filteredLogs.length > 0 ? filteredLogs : entries;

    const csvRows = dataToExport.map((log) => {
      const statusInfo = log.status
        ? getStatusCodeInfo(log.status)
        : { category: "Unknown", description: "No status code" };

      return [
        log.ip || "",
        log.timestamp || "",
        log.method || "",
        showOnTables ? "https://" + domain + log.path : log.path || "",
        log.file_type || "",
        log.response_size || "",
        log.status || "",
        statusInfo.category,
        statusInfo.description,
        log.frequency || "",
        `"${(log.user_agent || "").replace(/"/g, '""')}"`,
        log.referer || "",
        log.crawler_type || "",
        log.verified ? "Yes" : "No",
        getTaxonomyForPath(log.path),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");

    try {
      const filePath = await save({
        defaultPath: `RustySEO - ${statusFilter.length === 1 ? statusFilter[0] : "Status Codes"} - ${segment || "All"} - URLs -${new Date().toISOString().slice(0, 10)}.csv`,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });

      if (filePath) {
        await writeTextFile(filePath, csvContent);
        await message("CSV file saved successfully!", {
          title: "Export Complete",
          type: "info",
        });
      }
    } catch (error) {
      console.error("Export failed:", error);
      await message(`Failed to export CSV: ${error}`, {
        title: "Export Error",
        type: "error",
      });
    }
  };

  // Calculate timings based on actual entries
  const oldestEntry = useMemo(
    () =>
      isReady && entries.length > 0
        ? entries.reduce((oldest, log) =>
            new Date(log.timestamp) < new Date(oldest.timestamp) ? log : oldest,
          )
        : null,
    [entries, isReady],
  );

  const newestEntry = useMemo(
    () =>
      isReady && entries.length > 0
        ? entries.reduce((newest, log) =>
            new Date(log.timestamp) > new Date(newest.timestamp) ? log : newest,
          )
        : null,
    [entries, isReady],
  );

  const elapsedTimeMs = useMemo(() => {
    if (!isReady) return 0;
    if (newestEntry && oldestEntry) {
      const start = new Date(oldestEntry.timestamp);
      const end = new Date(newestEntry.timestamp);
      const diff = Math.abs(end.getTime() - start.getTime());
      return diff;
    }
    return 0;
  }, [newestEntry, oldestEntry, isReady]);

  // Helper to calculate details on the fly for a single log entry
  const getLogDetails = useCallback(
    (log: LogEntry) => {
      const frequency = log.frequency || 1;

      let timings = {
        elapsedTime: "0h 0m 0s",
        frequency: {
          total: frequency,
          perHour: "0.00",
          perMinute: "0.00/minute",
          perSecond: "0.00/second",
        },
      };

      if (oldestEntry && newestEntry && elapsedTimeMs > 0) {
        const elapsedTimeHours = elapsedTimeMs / (1000 * 60 * 60);
        const perHour =
          elapsedTimeHours > 0
            ? (frequency / elapsedTimeHours).toFixed(1)
            : "0.0";

        const hours = Math.floor(elapsedTimeMs / (1000 * 60 * 60));
        const minutes = Math.floor(
          (elapsedTimeMs % (1000 * 60 * 60)) / (1000 * 60),
        );
        const seconds = Math.floor((elapsedTimeMs % (1000 * 60)) / 1000);

        timings = {
          elapsedTime: `${hours}h ${minutes}m ${seconds}s`,
          frequency: {
            total: frequency,
            perHour: perHour,
            perMinute: `${(frequency / (elapsedTimeMs / (1000 * 60))).toFixed(
              2,
            )}/minute`,
            perSecond: `${(frequency / (elapsedTimeMs / 1000)).toFixed(
              2,
            )}/second`,
          },
        };
      }

      return { timings };
    },
    [elapsedTimeMs, oldestEntry, newestEntry],
  );

  // Get current segment taxonomy for display
  const currentSegmentTaxonomy = taxonomies.find((tax) => tax.name === segment);

  if (!isReady || (isProcessing && entries.length > 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[650px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Processing {entries?.length?.toLocaleString()} logs...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            This may take a moment for large datasets
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full pb-0 -mb-4">
      {/* Status Code Header */}
      {statusFilter.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                Viewing: Status Code {statusFilter.join(", ")}
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Showing {filteredLogs.length} log entries with{" "}
                <span className="font-bold">
                  {statusFilter.join(", ")} status code
                  {statusFilter.length > 1 ? "s" : ""}
                </span>
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
            >
              {filteredLogs.length} entries
            </Badge>
          </div>
        </div>
      )}

      {/* Status Category Header */}
      {statusCategoryFilter.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-3 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-800 dark:text-purple-300">
                Viewing: {statusCategoryFilter.join(", ")} Status Codes
              </h3>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                Showing {filteredLogs.length} log entries with{" "}
                <span className="font-bold">
                  {statusCategoryFilter.join(", ")} status
                  {statusCategoryFilter.length > 1 ? "es" : ""}
                </span>
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200"
            >
              {filteredLogs.length} entries
            </Badge>
          </div>
        </div>
      )}

      {/* Segment Header - Only show if segment is selected */}
      {segment &&
        segment !== "all" &&
        currentSegmentTaxonomy &&
        !statusFilter.length &&
        !statusCategoryFilter.length && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                  Viewing: {segment}
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Showing request activity for{" "}
                  <span className="font-bold">{segment.toLowerCase()}</span>
                  {""} segment
                  {currentSegmentTaxonomy.paths.length > 0 && (
                    <span className="ml-1">
                      (<span className="font-bold">matches: {""}</span>
                      {currentSegmentTaxonomy.paths
                        .map((p) => p.path)
                        .join(", ")}
                      )
                    </span>
                  )}
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
              >
                {filteredLogs.length} entries
              </Badge>
            </div>
          </div>
        )}

      <div className="flex flex-col md:flex-row justify-between -mb-4 p-1">
        <div className="relative w-full mr-1">
          <Search className="absolute dark:text-white/50 left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by IP, path, user agent, or referer..."
            className="pl-8 w-full dark:text-white dark:bg-brand-darker"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-1 gap-1">
          {/* Taxonomy Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex gap-2 dark:bg-brand-darker dark:text-white dark:border-brand-dark w-full"
              >
                <FolderTree className="h-4 w-4" />
                Segment
                {selectedTaxonomy !== "all" && (
                  <Badge variant="secondary" className="ml-1">
                    {taxonomies.find((t) => t.id === selectedTaxonomy)?.name}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white dark:border-brand-dark dark:text-white dark:bg-brand-darker z-[999999999999999999] w-[200px]"
            >
              <DropdownMenuLabel>Filter by Segment</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                className="bg-white active:bg-brand-bright hover:text-white dark:bg-brand-darker dark:hover:bg-brand-bright"
                checked={selectedTaxonomy === "all"}
                onCheckedChange={() => setSelectedTaxonomy("all")}
              >
                All Segments
              </DropdownMenuCheckboxItem>
              {taxonomies.map((taxonomy) => (
                <DropdownMenuCheckboxItem
                  className="bg-white active:bg-brand-bright hover:text-white dark:bg-brand-darker dark:hover:bg-brand-bright"
                  key={taxonomy.id}
                  checked={selectedTaxonomy === taxonomy.id}
                  onCheckedChange={(checked) => {
                    setSelectedTaxonomy(checked ? taxonomy.id : "all");
                  }}
                >
                  {taxonomy.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex gap-2 dark:bg-brand-darker dark:text-white dark:border-brand-dark w-full"
              >
                <CheckCircle className="h-4 w-4" />
                Status Category
                {statusCategoryFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {statusCategoryFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white dark:border-brand-dark dark:text-white dark:bg-brand-darker z-[999999999999999999] max-h-[400px] overflow-y-auto"
            >
              <DropdownMenuLabel>Filter by Status Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableStatusCategories.map((category) => (
                <DropdownMenuCheckboxItem
                  className="bg-white active:bg-brand-bright hover:text-white dark:bg-brand-darker dark:hover:bg-brand-bright"
                  key={category}
                  checked={statusCategoryFilter.includes(category)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setStatusCategoryFilter([
                        ...statusCategoryFilter,
                        category,
                      ]);
                    } else {
                      setStatusCategoryFilter(
                        statusCategoryFilter.filter((cat) => cat !== category),
                      );
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        category === "Success"
                          ? "bg-green-500"
                          : category === "Redirection"
                            ? "bg-yellow-500"
                            : category === "Client Error"
                              ? "bg-orange-500"
                              : category === "Server Error"
                                ? "bg-red-500"
                                : category === "Informational"
                                  ? "bg-blue-500"
                                  : "bg-gray-500"
                      }`}
                    />
                    <span>{category}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              {availableStatusCategories.length === 0 && (
                <div className="px-2 py-2 text-sm text-gray-500">
                  No status categories available
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Code Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex gap-2 dark:bg-brand-darker dark:text-white dark:border-brand-dark w-full"
              >
                <Filter className="h-4 w-4" />
                Status Code
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white dark:border-brand-dark dark:text-white dark:bg-brand-darker z-[999999999999999999] max-h-[400px] overflow-y-auto"
            >
              <DropdownMenuLabel>Filter by Status Code</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {uniqueStatusCodes.map((statusCode) => {
                const info = getStatusCodeInfo(statusCode);
                return (
                  <DropdownMenuCheckboxItem
                    className="bg-white active:bg-brand-bright hover:text-white dark:bg-brand-darker dark:hover:bg-brand-bright"
                    key={statusCode}
                    checked={statusFilter.includes(statusCode)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setStatusFilter([...statusFilter, statusCode]);
                      } else {
                        setStatusFilter(
                          statusFilter.filter((code) => code !== statusCode),
                        );
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${info.color}`} />
                      <span className="font-mono">{statusCode}</span>
                      <span className="text-xs text-gray-500">
                        ({info.category})
                      </span>
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
              {uniqueStatusCodes.length === 0 && (
                <div className="px-2 py-2 text-sm text-gray-500">
                  No status codes available
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* File Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex gap-2 dark:bg-brand-darker dark:text-white dark:border-brand-dark w-32"
              >
                <FileCode className="h-4 w-4" />
                File Type
                {fileTypeFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {fileTypeFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white dark:border-brand-dark dark:text-white dark:bg-brand-darker z-[999999999999999999] max-h-[400px] overflow-y-auto"
            >
              <DropdownMenuLabel>Filter by File Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                "HTML",
                "CSS",
                "JS",
                "PHP",
                "TXT",
                "Image",
                "Video",
                "Audio",
                "Document",
                "Archive",
                "Font",
              ].map((fileType) => (
                <DropdownMenuCheckboxItem
                  className="bg-white active:bg-brand-bright hover:text-white dark:bg-brand-darker dark:hover:bg-brand-bright"
                  key={fileType}
                  checked={fileTypeFilter.includes(fileType)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFileTypeFilter([...fileTypeFilter, fileType]);
                    } else {
                      setFileTypeFilter(
                        fileTypeFilter.filter((ft) => ft !== fileType),
                      );
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {getFileIcon(fileType)}
                    <span>{fileType}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Crawler Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex gap-2 dark:bg-brand-darker dark:text-white dark:border-brand-dark w-32"
              >
                <Bot className="h-4 w-4" />
                Crawler
                {crawlerTypeFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {crawlerTypeFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white dark:border-brand-dark dark:text-white dark:bg-brand-darker z-[999999999999999999] max-h-[400px] overflow-y-scroll -right-32 absolute"
            >
              <DropdownMenuLabel>Filter by Crawler Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {uniqueCrawlerTypes.map((crawlerType) => (
                <DropdownMenuCheckboxItem
                  className="bg-white active:bg-brand-bright hover:text-white dark:bg-brand-darker dark:hover:bg-brand-bright"
                  key={crawlerType}
                  checked={crawlerTypeFilter.includes(crawlerType)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setCrawlerTypeFilter([...crawlerTypeFilter, crawlerType]);
                    } else {
                      setCrawlerTypeFilter(
                        crawlerTypeFilter.filter(
                          (type) => type !== crawlerType,
                        ),
                      );
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {crawlerType === "Human" ? (
                      <User className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Bot className="h-4 w-4 text-purple-500" />
                    )}
                    <span>{crawlerType}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              {uniqueCrawlerTypes.length === 0 && (
                <div className="px-2 py-2 text-sm text-gray-500">
                  No crawler types available
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex gap-2 dark:bg-brand-darker dark:border-brand-dark dark:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>

          <Button
            variant="outline"
            onClick={exportCSV}
            className="flex gap-2 dark:bg-brand-darker dark:border-brand-dark dark:text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div
        style={{
          height: "calc(100vh - 40vh)",
          maxHeight: "calc(100vh - 40vh)",
          overflowX: "hidden",
        }}
        className="px-1"
      >
        <CardContent className="p-0 h-full overflow-hidden">
          <div className="rounded-md border dark:border-brand-dark h-full">
            <div className="relative w-full h-full overflow-auto">
              <Table className="h-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-center">#</TableHead>
                    <TableHead
                      className="cursor-pointer w-[190px]"
                      onClick={() => requestSort("timestamp")}
                    >
                      Timestamp
                      {sortConfig?.key === "timestamp" && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 inline-block ${
                            sortConfig.direction === "descending"
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      )}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => requestSort("path")}
                    >
                      Path
                      {sortConfig?.key === "path" && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 inline-block ${
                            sortConfig.direction === "descending"
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      )}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => requestSort("status")}
                    >
                      Status Code
                      {sortConfig?.key === "status" && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 inline-block ${
                            sortConfig.direction === "descending"
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      )}
                    </TableHead>
                    <TableHead>Status Category</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead
                      className="cursor-pointer text-center w-20"
                      onClick={() => requestSort("response_size")}
                    >
                      Size
                      {sortConfig?.key === "response_size" && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 inline-block ${
                            sortConfig.direction === "descending"
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      )}
                    </TableHead>
                    <TableHead>File Type</TableHead>
                    <TableHead>Crawler Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log, index) => {
                      // Calculate details only for visible rows
                      const { timings } = getLogDetails(log);
                      const statusInfo = log.status
                        ? getStatusCodeInfo(log.status)
                        : {
                            category: "Unknown",
                            description: "No status code",
                            color: "bg-gray-500",
                            textColor: "text-gray-800 dark:text-gray-200",
                            bgColor: "bg-gray-100 dark:bg-gray-900",
                          };

                      return (
                        <React.Fragment
                          key={`${log.ip}-${log.timestamp}-${index}-${log.path}`}
                        >
                          <TableRow
                            className={`group pb-2 cursor-pointer ${expandedRow === index ? "bg-sky-dark/10" : ""}`}
                            onClick={() =>
                              setExpandedRow(
                                expandedRow === index ? null : index,
                              )
                            }
                          >
                            <TableCell className="font-medium text-center max-w-[40px] align-middle">
                              {indexOfFirstItem + index + 1}
                            </TableCell>
                            <TableCell className="min-w-[150px] align-middle">
                              {formatDate(log.timestamp)}
                            </TableCell>
                            <TableCell className="truncate max-w-[400px] align-middle">
                              <span className="flex items-start truncate">
                                <span
                                  onClick={(click) =>
                                    handleCopyClick(
                                      log?.path,
                                      click,
                                      "URL / PATH",
                                    )
                                  }
                                  className="hover:scale-105 active:scale-95 mr-1"
                                >
                                  {getFileIcon(log.file_type || "Unknown")} {""}
                                </span>
                                <span
                                  className="hover:underline"
                                  onClick={(click) =>
                                    handleURLClick(log?.path, click)
                                  }
                                >
                                  {showOnTables && domain
                                    ? "https://" + domain + log.path
                                    : log?.path}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell className="text-center align-middle">
                              <Badge
                                variant="outline"
                                className={`${statusInfo.bgColor} ${statusInfo.textColor}`}
                              >
                                {log.status || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="min-w-[100px] align-middle">
                              <Badge variant="outline" className="text-xs">
                                {statusInfo.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="min-w-[100px] align-middle">
                              <Badge variant="secondary" className="text-xs">
                                {getTaxonomyForPath(log.path)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center align-middle">
                              {formatResponseSize(log.response_size)}
                            </TableCell>
                            <TableCell className="min-w-[30px] truncate align-middle">
                              <Badge variant="outline">
                                {log.file_type || "Unknown"}
                              </Badge>
                            </TableCell>
                            <TableCell width={110} className="max-w-[100px] ">
                              <Badge
                                variant="outline"
                                className={
                                  log.crawler_type !== "Human"
                                    ? "w-[95px] p-0 flex justify-center text-[10px] bg-red-600 text-white dark:bg-red-400 border-purple-200  dark:text-white"
                                    : "w-[95px] p-0 flex justify-center text-[11px] text-center bg-blue-600 text-white border-blue-200"
                                }
                              >
                                {log.crawler_type &&
                                log.crawler_type.length > 12
                                  ? log.crawler_type.trim().slice(0, 15)
                                  : log.crawler_type || "Unknown"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          {expandedRow === index && (
                            <TableRow>
                              <TableCell
                                colSpan={10}
                                className="bg-gray-50 dark:bg-gray-800 p-4"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Left Column */}
                                  <div className="flex flex-col max-w-[70rem] w-full">
                                    <div className="flex mb-2 space-x-2 items-center justify-between">
                                      <h4 className="font-bold">Details</h4>
                                      {log.verified && (
                                        <div className="flex items-center space-x-1 py-1 bg-red-200 dark:bg-red-400 px-2 text-xs rounded-md">
                                          <BadgeCheck
                                            size={18}
                                            className="text-blue-800 pr-1 dark:text-blue-900"
                                          />
                                          {log?.crawler_type}
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md h-full">
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="font-semibold">
                                            IP:
                                          </span>{" "}
                                          {log.ip}
                                        </div>
                                        <div>
                                          <span className="font-semibold">
                                            Method:
                                          </span>{" "}
                                          {log.method}
                                        </div>
                                        <div>
                                          <span className="font-semibold">
                                            Referer:
                                          </span>{" "}
                                          <span className="font-mono text-xs break-all">
                                            {log.referer || "Direct/None"}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-semibold">
                                            User Agent:
                                          </span>{" "}
                                          <span className="font-mono text-xs break-all">
                                            {log.user_agent || "Unknown"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Column */}
                                  <div className="flex flex-col">
                                    <h4 className="mb-2 font-bold">
                                      Status Code Analysis
                                    </h4>
                                    <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md h-full">
                                      <div className="space-y-3">
                                        <div
                                          className="flex flex-col items-center justify-center p-3 rounded-lg"
                                          style={{
                                            backgroundColor: statusInfo.bgColor
                                              .replace("bg-", "bg-")
                                              .replace("dark:", "dark:"),
                                          }}
                                        >
                                          <div
                                            className="text-3xl font-bold mb-1"
                                            style={{
                                              color: statusInfo.textColor
                                                .replace("text-", "text-")
                                                .replace("dark:", "dark:"),
                                            }}
                                          >
                                            {log.status || "N/A"}
                                          </div>
                                          <div
                                            className="text-lg font-semibold mb-1"
                                            style={{
                                              color: statusInfo.textColor
                                                .replace("text-", "text-")
                                                .replace("dark:", "dark:"),
                                            }}
                                          >
                                            {statusInfo.category}
                                          </div>
                                          <div
                                            className="text-sm text-center"
                                            style={{
                                              color: statusInfo.textColor
                                                .replace("text-", "text-")
                                                .replace("dark:", "dark:")
                                                .replace("200", "700")
                                                .replace("800", "900"),
                                            }}
                                          >
                                            {statusInfo.description}
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <div>
                                            <span className="font-semibold">
                                              Frequency:
                                            </span>{" "}
                                            {log.frequency || 1} hits
                                          </div>
                                          <div>
                                            <span className="font-semibold">
                                              Hits per Hour:
                                            </span>{" "}
                                            {timings?.frequency?.perHour}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Taxonomy Information */}
                                  <div className="md:col-span-2">
                                    <h4 className="mb-2 font-bold">
                                      Taxonomy Information
                                    </h4>
                                    <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md">
                                      <div className="flex items-center gap-4">
                                        <div>
                                          <span className="font-semibold">
                                            Category:
                                          </span>
                                          <Badge
                                            variant="secondary"
                                            className="ml-2"
                                          >
                                            {getTaxonomyForPath(log.path)}
                                          </Badge>
                                        </div>
                                        <div>
                                          <span className="font-semibold">
                                            Matching Rules:
                                          </span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {taxonomies
                                              .find(
                                                (tax) =>
                                                  tax.name ===
                                                  getTaxonomyForPath(log.path),
                                              )
                                              ?.paths.map((pathRule, idx) => (
                                                <Badge
                                                  key={idx}
                                                  variant="outline"
                                                  className="text-xs"
                                                >
                                                  {pathRule.path} (
                                                  {pathRule.matchType})
                                                </Badge>
                                              ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* File Type Information */}
                                  <div className="md:col-span-2">
                                    <h4 className="mb-2 font-bold">
                                      File Type Information
                                    </h4>
                                    <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {getFileIcon(
                                            log.file_type || "Unknown",
                                          )}
                                          <span className="text-lg font-medium">
                                            {log.file_type || "Unknown"} File
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-semibold">
                                            Response Size:
                                          </span>{" "}
                                          <span className="font-medium ml-2">
                                            {formatResponseSize(
                                              log.response_size,
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                        This {log.file_type || "Unknown"} file
                                        returned status code {log.status} (
                                        {statusInfo.category})
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center h-24">
                        {statusFilter.length > 0
                          ? `No log entries found for status code${statusFilter.length > 1 ? "s" : ""} ${statusFilter.join(", ")}. Available codes: ${uniqueStatusCodes.join(", ")}`
                          : statusCategoryFilter.length > 0
                            ? `No log entries found for ${statusCategoryFilter.join(", ")} status${statusCategoryFilter.length > 1 ? "es" : ""}. Available categories: ${availableStatusCategories.join(", ")}`
                            : segment && segment !== "all"
                              ? `No log entries found for ${segment}`
                              : "No log entries found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </div>

      <div
        className="flex items-center justify-between w-full"
        style={{ marginTop: "0.2em" }}
      >
        <div className="flex items-center -mt-2 ml-1">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => setItemsPerPage(Number(value))}
          >
            <SelectTrigger className="w-[70px] text-xs dark:text-white/50 h-6 mr-2 z-50">
              <SelectValue placeholder="100" />
            </SelectTrigger>
            <SelectContent className="z-[9999999999]">
              <SelectItem
                className="dark:hover:bg-brand-bright dark:hover:text-white hover:bg-brand-bright hover:text-white"
                value="100"
              >
                100
              </SelectItem>
              <SelectItem
                className="dark:hover:bg-brand-bright dark:hover:text-white hover:bg-brand-bright hover:text-white"
                value="500"
              >
                500
              </SelectItem>
              <SelectItem
                className="dark:hover:bg-brand-bright dark:hover:text-white hover:bg-brand-bright hover:text-white"
                value="1000"
              >
                1000
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination className="text-xs">
          <PaginationContent style={{ marginTop: "-5px" }}>
            <PaginationItem className="cursor-pointer">
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50 text-xs"
                    : "text-xs"
                }
              />
            </PaginationItem>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;

              if (totalPages > 5) {
                if (currentPage > 3 && currentPage <= totalPages - 2) {
                  pageNum = currentPage - 2 + i;
                } else if (currentPage > totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                }
              }

              return (
                <PaginationItem key={i}>
                  <PaginationLink
                    className="cursor-pointer h-6"
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <PaginationItem className="cursor-pointer">
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem className="cursor-pointer">
              <PaginationNext
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export { WidgetStatusCodesTable };
