// @ts-nocheck
import React, { useState, useEffect } from "react";
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

interface StatusCodeCounts {
  counts: { [key: number]: number };
  success_count: number;
  redirect_count: number;
  client_error_count: number;
  server_error_count: number;
  other_count: number;
}

interface ProcessedLogEntry extends LogEntry {
  status_codes?: StatusCodeCounts;
  total_frequency?: number;
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

const WidgetContentTable: React.FC<WidgetTableProps> = ({
  data,
  entries,
  segment,
}) => {
  const [initialLogs, setInitialLogs] = useState<ProcessedLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ProcessedLogEntry[]>([]);
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
  } | null>({ key: "frequency", direction: "descending" });
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [domain, setDomain] = useState("");
  const [showOnTables, setShowOnTables] = useState(false);
  const [botTypeFilter, setBotTypeFilter] = useState<string | null>("all");
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string | "all">(
    "all",
  );

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

  // Filter logs based on selected taxonomy
  const filterLogsByTaxonomy = (
    logs: ProcessedLogEntry[],
    taxonomyId: string,
  ): ProcessedLogEntry[] => {
    if (taxonomyId === "all") {
      return logs;
    }

    const taxonomy = taxonomies.find((tax) => tax.id === taxonomyId);
    if (!taxonomy) {
      return logs;
    }

    return logs.filter((log) => pathMatchesTaxonomy(log.path, taxonomy));
  };

  // Filter logs based on segment name (taxonomy name)
  const filterLogsBySegment = (
    logs: ProcessedLogEntry[],
    segmentName: string,
  ): ProcessedLogEntry[] => {
    if (!segmentName || segmentName === "all") {
      return logs;
    }

    const taxonomy = taxonomies.find((tax) => tax.name === segmentName);
    if (!taxonomy) {
      console.warn(`No taxonomy found for segment: ${segmentName}`);
      return logs;
    }

    return logs.filter((log) => pathMatchesTaxonomy(log.path, taxonomy));
  };

  // Process entries to aggregate data and calculate frequencies
  const processEntries = (entries: LogEntry[]): ProcessedLogEntry[] => {
    const pathMap = new Map();

    entries.forEach((entry) => {
      if (!pathMap.has(entry.path)) {
        pathMap.set(entry.path, {
          ...entry,
          total_frequency: 0,
          status_codes: {
            counts: {},
            success_count: 0,
            redirect_count: 0,
            client_error_count: 0,
            server_error_count: 0,
            other_count: 0,
          },
        });
      }

      const aggregated = pathMap.get(entry.path);
      aggregated.total_frequency += entry.frequency || 1;

      // Aggregate status codes
      if (entry.status && aggregated.status_codes) {
        const status = entry.status;
        aggregated.status_codes.counts[status] =
          (aggregated.status_codes.counts[status] || 0) + 1;

        // Categorize status codes
        if (status >= 200 && status < 300) {
          aggregated.status_codes.success_count += 1;
        } else if (status >= 300 && status < 400) {
          aggregated.status_codes.redirect_count += 1;
        } else if (status >= 400 && status < 500) {
          aggregated.status_codes.client_error_count += 1;
        } else if (status >= 500 && status < 600) {
          aggregated.status_codes.server_error_count += 1;
        } else {
          aggregated.status_codes.other_count += 1;
        }
      }
    });

    return Array.from(pathMap.values()).map((entry) => ({
      ...entry,
      frequency: entry.total_frequency,
    }));
  };

  // Initialize logs with raw entries data
  useEffect(() => {
    if (!entries || entries.length === 0) {
      setInitialLogs([]);
      setFilteredLogs([]);
      return;
    }

    // Process the raw entries to aggregate data
    const processedLogs = processEntries(entries);

    // Apply segment filter to processed logs
    const segmentFilteredLogs = filterLogsBySegment(processedLogs, segment);

    setInitialLogs(segmentFilteredLogs);
    setFilteredLogs(segmentFilteredLogs);
  }, [entries, segment, taxonomies]);

  useEffect(() => {
    let result = [...initialLogs];

    // Apply taxonomy filter first (if user selects a specific taxonomy)
    if (selectedTaxonomy !== "all") {
      result = filterLogsByTaxonomy(result, selectedTaxonomy);
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

    if (fileTypeFilter.length > 0) {
      result = result.filter((log) => fileTypeFilter.includes(log.file_type));
    }

    if (botFilter !== null) {
      if (botFilter === "bot") {
        result = result.filter((log) => log.crawler_type !== "Human");
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

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof ProcessedLogEntry];
        const bValue = b[sortConfig.key as keyof ProcessedLogEntry];

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

    setFilteredLogs(result);
    setCurrentPage(1);
  }, [
    searchTerm,
    methodFilter,
    botFilter,
    verifiedFilter,
    sortConfig,
    initialLogs,
    fileTypeFilter,
    botTypeFilter,
    selectedTaxonomy,
    taxonomies,
  ]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
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
    setSortConfig({ key: "frequency", direction: "descending" });
    setExpandedRow(null);
    setSelectedTaxonomy("all");
    setBotTypeFilter(null);
    setFileTypeFilter([]);
    setFilteredLogs(initialLogs);
  };

  const exportCSV = async () => {
    const headers = [
      "IP",
      "Timestamp",
      "Method",
      "Path",
      "File Type",
      "Response Size",
      "Frequency",
      "User Agent",
      "Crawler Type",
      "Google Verified",
      "Taxonomy",
    ];

    const dataToExport = filteredLogs.length > 0 ? filteredLogs : initialLogs;

    const csvData = dataToExport.map((log) => [
      log.ip || "",
      log.timestamp || "",
      log.method || "",
      showOnTables ? "https://" + domain + log.path : log.path || "",
      log.file_type || "",
      log.response_size || "",
      log.frequency || "",
      `"${(log.user_agent || "").replace(/"/g, '""')}"`,
      log.crawler_type || "",
      log.verified ? "Yes" : "No",
      getTaxonomyForPath(log.path),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    try {
      const filePath = await save({
        defaultPath: `RustySEO - ${segment || "All"} - Google Bot Frequency -${new Date().toISOString().slice(0, 10)}.csv`,
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
        return <FileCode className="text-blue-500" size={14} />;
      case "Image":
        return <Image className="text-green-500" size={14} />;
      case "Video":
        return <FileVideo className="text-purple-500" size={14} />;
      case "Audio":
        return <FileAudio className="text-yellow-500" size={14} />;
      case "PHP":
        return <FileCode className="text-indigo-500" size={14} />;
      case "TXT":
        return <FileType className="text-gray-500" size={14} />;
      case "CSS":
        return <FileCode className="text-pink-500" size={14} />;
      case "JS":
        return <FileCode className="text-yellow-600" size={14} />;
      case "Document":
        return <FileText className="text-red-500" size={14} />;
      case "Archive":
        return <Package className="text-orange-500" size={14} />;
      case "Font":
        return <FileType2 className="text-teal-500" size={14} />;
      default:
        return <FileCode className="text-gray-400" size={14} />;
    }
  };

  // Calculate timings based on actual entries
  const oldestEntry =
    entries.length > 0
      ? entries.reduce((oldest, log) =>
          new Date(log.timestamp) < new Date(oldest.timestamp) ? log : oldest,
        )
      : null;

  const newestEntry =
    entries.length > 0
      ? entries.reduce((newest, log) =>
          new Date(log.timestamp) > new Date(newest.timestamp) ? log : newest,
        )
      : null;

  const totalTimeBetweenNewAndOldest = () => {
    if (newestEntry && oldestEntry) {
      const start = new Date(oldestEntry.timestamp);
      const end = new Date(newestEntry.timestamp);
      const diff = Math.abs(end.getTime() - start.getTime());
      return diff;
    }
    return 0;
  };

  const elapsedTimeMs = totalTimeBetweenNewAndOldest();

  const timings = (log: ProcessedLogEntry) => {
    if (!oldestEntry || !newestEntry) {
      return {
        elapsedTime: "0h 0m 0s",
        frequency: {
          total: 0,
          perHour: "0.00",
          perMinute: "0.00/minute",
          perSecond: "0.00/second",
        },
      };
    }

    const frequency = log?.frequency || 0;
    const elapsedTimeMs = totalTimeBetweenNewAndOldest();
    const elapsedTimeHours = elapsedTimeMs / (1000 * 60 * 60);

    const perHour =
      elapsedTimeHours > 0 ? (frequency / elapsedTimeHours).toFixed(1) : "0.0";

    const hours = Math.floor(elapsedTimeMs / (1000 * 60 * 60));
    const minutes = Math.floor(
      (elapsedTimeMs % (1000 * 60 * 60)) / (1000 * 60),
    );
    const seconds = Math.floor((elapsedTimeMs % (1000 * 60)) / 1000);

    return {
      elapsedTime: `${hours}h ${minutes}m ${seconds}s`,
      frequency: {
        total: frequency,
        perHour: perHour,
        perMinute: `${(frequency / (elapsedTimeMs / (1000 * 60))).toFixed(2)}/minute`,
        perSecond: `${(frequency / (elapsedTimeMs / 1000)).toFixed(2)}/second`,
      },
    };
  };

  // Get current segment taxonomy for display
  const currentSegmentTaxonomy = taxonomies.find((tax) => tax.name === segment);

  return (
    <div className="space-y-4 h-full pb-0 -mb-4">
      {/* Segment Header */}
      {segment && segment !== "all" && currentSegmentTaxonomy && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                Viewing: {segment}
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Showing Google bot activity for {segment.toLowerCase()} section
                {currentSegmentTaxonomy.paths.length > 0 && (
                  <span className="ml-1">
                    (matches:{" "}
                    {currentSegmentTaxonomy.paths.map((p) => p.path).join(", ")}
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
          {/* Taxonomy Filter - Always show for further filtering within segment */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex gap-2 dark:bg-brand-darker dark:text-white dark:border-brand-dark w-32"
              >
                <FolderTree className="h-4 w-4" />
                Taxonomy
                {selectedTaxonomy !== "all" && (
                  <Badge variant="secondary" className="ml-1">
                    {taxonomies.find((t) => t.id === selectedTaxonomy)?.name}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white dark:border-brand-dark dark:text-white dark:bg-brand-darker z-[999999999999999999]"
            >
              <DropdownMenuLabel>Filter by Taxonomy</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                className="bg-white active:bg-brand-bright hover:text-white dark:bg-brand-darker dark:hover:bg-brand-bright"
                checked={selectedTaxonomy === "all"}
                onCheckedChange={() => setSelectedTaxonomy("all")}
              >
                All Taxonomies
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex gap-2 dark:bg-brand-darker dark:text-white dark:border-brand-dark w-32"
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
              className="bg-white dark:border-brand-dark dark:text-white dark:bg-brand-darker z-[999999999999999999]"
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
                        fileTypeFilter.filter((m) => m !== fileType),
                      );
                    }
                  }}
                >
                  {fileType}
                </DropdownMenuCheckboxItem>
              ))}
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
                    <TableHead>Taxonomy</TableHead>
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
                      className="cursor-pointer min-w-10 max-w-[50px] text-center"
                      onClick={() => requestSort("frequency")}
                    >
                      Total Hits
                      {sortConfig?.key === "frequency" && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 inline-block ${
                            sortConfig.direction === "descending"
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      )}
                    </TableHead>
                    <TableHead>Hourly Hits</TableHead>
                    <TableHead>Crawler Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log, index) => (
                      <React.Fragment
                        key={`${log.ip}-${log.timestamp}-${index}-${log.path}`}
                      >
                        <TableRow
                          className={`group cursor-pointer ${expandedRow === index ? "bg-sky-dark/10" : ""}`}
                          onClick={() =>
                            setExpandedRow(expandedRow === index ? null : index)
                          }
                        >
                          <TableCell className="font-medium text-center max-w-[40px]">
                            {indexOfFirstItem + index + 1}
                          </TableCell>
                          <TableCell className="inline-block truncate max-w-[600px]">
                            <div className="flex items-center w-full m-auto">
                              <span className="mr-2 pl-2">
                                {getFileIcon(log.file_type)}
                              </span>
                              <span className="leading-[28px] m-auto flex items-center truncate">
                                {showOnTables && domain
                                  ? "https://" + domain + log.path
                                  : log?.path}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[30px] truncate">
                            <Badge variant="outline">{log.file_type}</Badge>
                          </TableCell>
                          <TableCell className="min-w-[100px]">
                            <Badge variant="secondary" className="text-xs">
                              {getTaxonomyForPath(log.path)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {formatResponseSize(log.response_size)}
                          </TableCell>
                          <TableCell className="text-center min-w-[90px]">
                            {timings(log)?.frequency?.total}
                          </TableCell>
                          <TableCell className="text-center w-[90px]">
                            {timings(log)?.frequency?.perHour}
                          </TableCell>
                          <TableCell width={100} className="max-w-[100px]">
                            <Badge
                              variant="outline"
                              className={
                                log.crawler_type !== "Human"
                                  ? "bg-red-200 dark:bg-red-400 border-purple-200 text-black dark:text-white"
                                  : "bg-green-100 text-green-800 border-green-200"
                              }
                            >
                              {log.crawler_type.length > 10
                                ? log.crawler_type.trim().slice(0, 10)
                                : log.crawler_type}
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
                                    <h4 className="font-bold">Timespan</h4>
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
                                    <p className="text-sm font-mono break-all">
                                      {timings(log)?.elapsedTime}
                                    </p>
                                  </div>
                                </div>

                                {/* Right Column */}
                                <div className="flex flex-col">
                                  <h4 className="mb-2 font-bold">
                                    Hits per Hour
                                  </h4>
                                  <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md h-full">
                                    <p className="text-sm break-all">
                                      {timings(log)?.frequency?.perHour}
                                    </p>
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
                                    Response Codes
                                  </h4>
                                  <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                      {/* Success Codes (200-299) */}
                                      <div className="flex flex-col ">
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                          Success (2xx)
                                        </span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-xs">
                                            200:{" "}
                                            {log.status_codes?.counts?.[200] ||
                                              0}
                                          </span>
                                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-xs">
                                            201:{" "}
                                            {log.status_codes?.counts?.[201] ||
                                              0}
                                          </span>
                                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-xs">
                                            204:{" "}
                                            {log.status_codes?.counts?.[204] ||
                                              0}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          Total:{" "}
                                          {log.status_codes?.success_count || 0}
                                        </span>
                                      </div>

                                      {/* Redirect Codes (300-399) */}
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                          Redirect (3xx)
                                        </span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                                            301:{" "}
                                            {log.status_codes?.counts?.[301] ||
                                              0}
                                          </span>
                                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                                            302:{" "}
                                            {log.status_codes?.counts?.[302] ||
                                              0}
                                          </span>
                                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                                            304:{" "}
                                            {log.status_codes?.counts?.[304] ||
                                              0}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          Total:{" "}
                                          {log.status_codes?.redirect_count ||
                                            0}
                                        </span>
                                      </div>

                                      {/* Client Error Codes (400-499) */}
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                                          Client Error (4xx)
                                        </span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
                                            400:{" "}
                                            {log.status_codes?.counts?.[400] ||
                                              0}
                                          </span>
                                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
                                            401:{" "}
                                            {log.status_codes?.counts?.[401] ||
                                              0}
                                          </span>
                                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
                                            403:{" "}
                                            {log.status_codes?.counts?.[403] ||
                                              0}
                                          </span>
                                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
                                            404:{" "}
                                            {log.status_codes?.counts?.[404] ||
                                              0}
                                          </span>
                                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
                                            429:{" "}
                                            {log.status_codes?.counts?.[429] ||
                                              0}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          Total:{" "}
                                          {log.status_codes
                                            ?.client_error_count || 0}
                                        </span>
                                      </div>

                                      {/* Server Error Codes (500-599) */}
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                          Server Error (5xx)
                                        </span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900 rounded text-xs">
                                            500:{" "}
                                            {log.status_codes?.counts?.[500] ||
                                              0}
                                          </span>
                                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900 rounded text-xs">
                                            502:{" "}
                                            {log.status_codes?.counts?.[502] ||
                                              0}
                                          </span>
                                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900 rounded text-xs">
                                            503:{" "}
                                            {log.status_codes?.counts?.[503] ||
                                              0}
                                          </span>
                                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900 rounded text-xs">
                                            504:{" "}
                                            {log.status_codes?.counts?.[504] ||
                                              0}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          Total:{" "}
                                          {log.status_codes
                                            ?.server_error_count || 0}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Other Status Codes */}
                                    {(log.status_codes?.other_count || 0) >
                                      0 && (
                                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                                        <span className="font-semibold text-gray-600 dark:text-gray-400">
                                          Other Codes:{" "}
                                          {log.status_codes?.other_count || 0}
                                        </span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {Object.entries(
                                            log.status_codes?.counts || {},
                                          )
                                            .filter(([code]) => {
                                              const status = parseInt(code);
                                              return (
                                                status < 200 || status >= 600
                                              );
                                            })
                                            .map(([code, count]) => (
                                              <span
                                                key={code}
                                                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                                              >
                                                {code}: {count}
                                              </span>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center h-24">
                        {segment && segment !== "all"
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

export { WidgetContentTable };
