// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
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
  selectedFileType?: string; // Add this prop
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

const WidgetFileType: React.FC<WidgetTableProps> = ({
  data,
  entries,
  segment,
  selectedFileType,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(100);
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [botFilter, setBotFilter] = useState<string | null>("all");
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
  const [statusFilter, setStatusFilter] = useState<number[]>([]);
  const [crawlerTypeFilter, setCrawlerTypeFilter] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableFileTypes, setAvailableFileTypes] = useState<string[]>([]);

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

  // Get all unique file types from entries
  useEffect(() => {
    if (entries && entries.length > 0) {
      const types = new Set<string>();
      entries.forEach((log) => {
        if (log.file_type && log.file_type.trim() !== "") {
          types.add(log.file_type);
        }
      });
      const sortedTypes = Array.from(types).sort();
      setAvailableFileTypes(sortedTypes);

      // Debug: Log available file types
      console.log("Available file types:", sortedTypes);
    }
  }, [entries]);

  // Initialize file type filter when selectedFileType is provided
  useEffect(() => {
    if (selectedFileType && !isInitialized && availableFileTypes.length > 0) {
      // Check if the selectedFileType exists in available file types
      const normalizedSelectedType = selectedFileType.trim();
      const existsInData = availableFileTypes.some(
        (type) => type.toLowerCase() === normalizedSelectedType.toLowerCase(),
      );

      console.log("Initializing filter:", {
        selectedFileType,
        normalizedSelectedType,
        availableFileTypes,
        existsInData,
      });

      if (existsInData) {
        // Find the exact case from available file types
        const exactType = availableFileTypes.find(
          (type) => type.toLowerCase() === normalizedSelectedType.toLowerCase(),
        );
        if (exactType) {
          setFileTypeFilter([exactType]);
          setIsInitialized(true);
        }
      } else if (selectedFileType !== "") {
        // If not found, still set it (might be a new file type)
        setFileTypeFilter([selectedFileType]);
        setIsInitialized(true);
      }
    } else if (!selectedFileType && !isInitialized) {
      // No file type selected, initialize as empty
      setIsInitialized(true);
    }
  }, [selectedFileType, availableFileTypes, isInitialized]);

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
    const codes = new Set<number>();
    entries.forEach((log) => {
      if (log.status) {
        codes.add(log.status);
      }
    });
    return Array.from(codes).sort((a, b) => a - b);
  }, [entries]);

  // Get unique crawler types from entries
  const uniqueCrawlerTypes = useMemo(() => {
    const types = new Set<string>();
    entries.forEach((log) => {
      if (log.crawler_type) {
        types.add(log.crawler_type);
      }
    });
    return Array.from(types).sort();
  }, [entries]);

  // Derived state for filtered logs using useMemo on raw entries
  const filteredLogs = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    console.log("Filtering logs with:", {
      totalEntries: entries.length,
      fileTypeFilter,
      selectedFileType,
      availableFileTypes,
      segment,
    });

    let result = [...entries]; // Create a copy to avoid mutations

    // Apply segment filter first (from props)
    if (segment && segment !== "all") {
      const taxonomy = taxonomies.find((tax) => tax.name === segment);
      if (taxonomy) {
        result = result.filter((log) =>
          pathMatchesTaxonomy(log.path, taxonomy),
        );
      }
    }

    // Apply taxonomy filter (user selection)
    if (selectedTaxonomy !== "all") {
      const taxonomy = taxonomies.find((tax) => tax.id === selectedTaxonomy);
      if (taxonomy) {
        result = result.filter((log) =>
          pathMatchesTaxonomy(log.path, taxonomy),
        );
      }
    }

    // Apply file type filter (this is the main filter for this component)
    if (fileTypeFilter.length > 0) {
      console.log("Applying file type filter:", fileTypeFilter);
      result = result.filter((log) => {
        const logFileType = log.file_type || "";
        return fileTypeFilter.some(
          (filterType) =>
            filterType.toLowerCase() === logFileType.toLowerCase(),
        );
      });
      console.log("After file type filter:", result.length);
    }

    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          log.ip.toLowerCase().includes(lowerCaseSearch) ||
          log.path.toLowerCase().includes(lowerCaseSearch) ||
          log.user_agent.toLowerCase().includes(lowerCaseSearch) ||
          (log.referer && log.referer.toLowerCase().includes(lowerCaseSearch)),
      );
    }

    if (methodFilter.length > 0) {
      result = result.filter((log) => methodFilter.includes(log.method));
    }

    if (botFilter !== null) {
      if (botFilter === "bot") {
        result = result.filter((log) => log.crawler_type === "Human");
      } else if (botFilter === "Human") {
        result = result.filter((log) => log.crawler_type === "Human");
      }
    }

    if (verifiedFilter !== null) {
      result = result.filter((log) => log.verified === verifiedFilter);
    }

    if (botTypeFilter !== null) {
      if (botTypeFilter === "Mobile") {
        result = result.filter((log) => log.user_agent.includes("Mobile"));
      } else if (botTypeFilter === "Desktop") {
        result = result.filter((log) => !log.user_agent.includes("Mobile"));
      }
    }

    // Apply status code filter
    if (statusFilter.length > 0) {
      result = result.filter((log) => {
        if (!log.status) return false;
        return statusFilter.includes(log.status);
      });
    }

    // Apply crawler type filter
    if (crawlerTypeFilter.length > 0) {
      result = result.filter((log) =>
        crawlerTypeFilter.includes(log.crawler_type),
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof LogEntry];
        const bValue = b[sortConfig.key as keyof LogEntry];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "ascending"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "ascending"
            ? aValue - bValue
            : bValue - aValue;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    console.log("Final filtered logs:", result.length);
    return result;
  }, [
    entries,
    segment,
    searchTerm,
    methodFilter,
    botFilter,
    verifiedFilter,
    sortConfig,
    fileTypeFilter,
    botTypeFilter,
    selectedTaxonomy,
    taxonomies,
    statusFilter,
    crawlerTypeFilter,
    selectedFileType,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    methodFilter,
    botFilter,
    verifiedFilter,
    fileTypeFilter,
    botTypeFilter,
    selectedTaxonomy,
    segment,
    statusFilter,
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
    setBotFilter("all");
    setVerifiedFilter(null);
    setSortConfig({ key: "timestamp", direction: "descending" });
    setExpandedRow(null);
    setSelectedTaxonomy("all");
    setBotTypeFilter(null);
    setStatusFilter([]);
    setCrawlerTypeFilter([]);
    // Reset fileTypeFilter based on selectedFileType
    if (selectedFileType && availableFileTypes.length > 0) {
      const exactType = availableFileTypes.find(
        (type) => type.toLowerCase() === selectedFileType.toLowerCase(),
      );
      if (exactType) {
        setFileTypeFilter([exactType]);
      } else {
        setFileTypeFilter([]);
      }
    } else {
      setFileTypeFilter([]);
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
      "Frequency",
      "User Agent",
      "Crawler Type",
      "Google Verified",
      "Taxonomy",
    ];

    // Use filteredLogs directly, it contains LogEntry items
    const dataToExport = filteredLogs.length > 0 ? filteredLogs : entries;

    const csvRows = dataToExport.map((log) =>
      [
        log.ip || "",
        log.timestamp || "",
        log.method || "",
        showOnTables ? "https://" + domain + log.path : log.path || "",
        log.file_type || "",
        log.response_size || "",
        log.status || "",
        log.frequency || "",
        `"${(log.user_agent || "").replace(/"/g, '""')}"`,
        log.crawler_type || "",
        log.verified ? "Yes" : "No",
        getTaxonomyForPath(log.path),
      ].join(","),
    );

    const csvContent = [headers.join(","), ...csvRows].join("\n");

    try {
      const filePath = await save({
        defaultPath: `RustySEO - ${fileTypeFilter.length === 1 ? fileTypeFilter[0] : "File Types"} - ${segment || "All"} - URLs -${new Date().toISOString().slice(0, 10)}.csv`,
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

  // Calculate timings based on actual entries
  const oldestEntry = useMemo(
    () =>
      entries.length > 0
        ? entries.reduce((oldest, log) =>
            new Date(log.timestamp) < new Date(oldest.timestamp) ? log : oldest,
          )
        : null,
    [entries],
  );

  const newestEntry = useMemo(
    () =>
      entries.length > 0
        ? entries.reduce((newest, log) =>
            new Date(log.timestamp) > new Date(newest.timestamp) ? log : newest,
          )
        : null,
    [entries],
  );

  const totalTimeBetweenNewAndOldest = () => {
    if (newestEntry && oldestEntry) {
      const start = new Date(oldestEntry.timestamp);
      const end = new Date(newestEntry.timestamp);
      const diff = Math.abs(end.getTime() - start.getTime());
      return diff;
    }
    return 0;
  };

  // Helper to calculate details on the fly for a single log entry
  const getLogDetails = (log: LogEntry) => {
    const frequency = log.frequency || 1;
    const elapsedTimeMs = totalTimeBetweenNewAndOldest();

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
          perMinute: `${(frequency / (elapsedTimeMs / (1000 * 60))).toFixed(2)}/minute`,
          perSecond: `${(frequency / (elapsedTimeMs / 1000)).toFixed(2)}/second`,
        },
      };
    }

    return { timings };
  };

  // Get current segment taxonomy for display
  const currentSegmentTaxonomy = taxonomies.find((tax) => tax.name === segment);

  return (
    <div className="space-y-4 h-full pb-0 -mb-4">
      {/* File Type Header */}
      {fileTypeFilter.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                Viewing: {fileTypeFilter.join(", ")} Files
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Showing {filteredLogs.length} log entries with{" "}
                <span className="font-bold">{fileTypeFilter.join(", ")}</span>{" "}
                file type{fileTypeFilter.length > 1 ? "s" : ""}
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

      {/* Segment Header - Only show if segment is selected */}
      {segment &&
        segment !== "all" &&
        currentSegmentTaxonomy &&
        !fileTypeFilter.length && (
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

          {/* File Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex gap-2 dark:bg-brand-darker dark:text-white dark:border-brand-dark w-full"
              >
                <Filter className="h-4 w-4" />
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
              {availableFileTypes.map((fileType) => (
                <DropdownMenuCheckboxItem
                  className="bg-white active:bg-brand-bright hover:text-white dark:bg-brand-darker dark:hover:bg-brand-bright"
                  key={fileType}
                  checked={fileTypeFilter.some(
                    (ft) => ft.toLowerCase() === fileType.toLowerCase(),
                  )}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // Add the exact type from availableFileTypes
                      setFileTypeFilter([...fileTypeFilter, fileType]);
                    } else {
                      // Remove by case-insensitive comparison
                      setFileTypeFilter(
                        fileTypeFilter.filter(
                          (m) => m.toLowerCase() !== fileType.toLowerCase(),
                        ),
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
              {availableFileTypes.length === 0 && (
                <div className="px-2 py-2 text-sm text-gray-500">
                  No file types available
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Code Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex gap-2 dark:bg-brand-darker dark:text-white dark:border-brand-dark w-32"
              >
                <CheckCircle className="h-4 w-4" />
                Status
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white dark:border-brand-dark dark:text-white dark:bg-brand-darker z-[999999999999999999]"
            >
              <DropdownMenuLabel>Filter by Status Code</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {uniqueStatusCodes.map((statusCode) => (
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
                    <div
                      className={`w-3 h-3 rounded-full ${
                        statusCode >= 200 && statusCode < 300
                          ? "bg-green-500"
                          : statusCode >= 300 && statusCode < 400
                            ? "bg-blue-500"
                            : statusCode >= 400 && statusCode < 500
                              ? "bg-yellow-500"
                              : statusCode >= 500
                                ? "bg-red-500"
                                : "bg-gray-500"
                      }`}
                    />
                    <span>{statusCode}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              {uniqueStatusCodes.length === 0 && (
                <div className="px-2 py-2 text-sm text-gray-500">
                  No status codes available
                </div>
              )}
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
                      onClick={() => requestSort("file_type")}
                    >
                      File Type
                      {sortConfig?.key === "file_type" && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 inline-block ${
                            sortConfig.direction === "descending"
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      )}
                    </TableHead>
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
                    <TableHead
                      className="cursor-pointer text-center"
                      onClick={() => requestSort("status")}
                    >
                      Status
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
                    <TableHead>Crawler Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log, index) => {
                      // Calculate details only for visible rows
                      const { timings } = getLogDetails(log);

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
                                  onClick={(e) =>
                                    handleCopyClick(log?.path, e, "URL / PATH")
                                  }
                                  className="mr-1 hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                  {getFileIcon(log.file_type || "Unknown")} {""}
                                </span>
                                <span
                                  onClick={(click) =>
                                    handleURLClick(log?.path, click)
                                  }
                                  className="hover:underline"
                                >
                                  {showOnTables && domain
                                    ? "https://" + domain + log.path
                                    : log?.path}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell className="min-w-[30px] truncate align-middle">
                              <Badge variant="outline">
                                {log.file_type || "Unknown"}
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
                            <TableCell className="text-center align-middle flex justify-center m-auto">
                              <Badge
                                variant="outline"
                                className={
                                  log.status
                                    ? log.status >= 200 && log.status < 300
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      : log.status >= 300 && log.status < 400
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                        : log.status >= 400 && log.status < 500
                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                          : log.status >= 500
                                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                }
                              >
                                {log.status || "N/A"}
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
                                colSpan={9}
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
                                            User Agent:
                                          </span>{" "}
                                          <span className="font-mono text-xs break-all">
                                            {log.user_agent}
                                          </span>
                                        </div>
                                        {log.referer && (
                                          <div>
                                            <span className="font-semibold">
                                              Referer:
                                            </span>{" "}
                                            <span className="font-mono text-xs break-all">
                                              {log.referer}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Column */}
                                  <div className="flex flex-col">
                                    <h4 className="mb-2 font-bold">
                                      Frequency Analysis
                                    </h4>
                                    <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md h-full">
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="font-semibold">
                                            Total Hits:
                                          </span>{" "}
                                          {log.frequency || 1}
                                        </div>
                                        <div>
                                          <span className="font-semibold">
                                            Per Hour:
                                          </span>{" "}
                                          {timings?.frequency?.perHour}
                                        </div>
                                        <div>
                                          <span className="font-semibold">
                                            Per Minute:
                                          </span>{" "}
                                          {timings?.frequency?.perMinute}
                                        </div>
                                        <div>
                                          <span className="font-semibold">
                                            Per Second:
                                          </span>{" "}
                                          {timings?.frequency?.perSecond}
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

                                  {/* Response Codes Section */}
                                  <div className="md:col-span-2">
                                    <h4 className="mb-2 font-bold">
                                      Response Code Details
                                    </h4>
                                    <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md">
                                      <div className="flex items-center justify-center">
                                        <div className="text-center">
                                          <Badge
                                            variant="outline"
                                            className={
                                              log.status
                                                ? log.status >= 200 &&
                                                  log.status < 300
                                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-lg px-4 py-2"
                                                  : log.status >= 300 &&
                                                      log.status < 400
                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-lg px-4 py-2"
                                                    : log.status >= 400 &&
                                                        log.status < 500
                                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-lg px-4 py-2"
                                                      : log.status >= 500
                                                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-lg px-4 py-2"
                                                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 text-lg px-4 py-2"
                                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 text-lg px-4 py-2"
                                            }
                                          >
                                            Status: {log.status || "N/A"}
                                          </Badge>
                                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            This individual request returned
                                            status code {log.status}
                                          </p>
                                        </div>
                                      </div>
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
                      <TableCell colSpan={9} className="text-center h-24">
                        {fileTypeFilter.length > 0
                          ? `No log entries found for ${fileTypeFilter.join(", ")} file type${fileTypeFilter.length > 1 ? "s" : ""}. Available types: ${availableFileTypes.join(", ")}`
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

export { WidgetFileType };
