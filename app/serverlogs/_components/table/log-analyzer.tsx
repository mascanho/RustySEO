// @ts-nocheck
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { debounce } from "lodash";
import {
  AlertCircle,
  BadgeCheck,
  ChevronDown,
  CircleHelp,
  ClipboardCopy,
  Copy,
  CopyPlus,
  Download,
  FileCode,
  FileIcon,
  Filter,
  FlaskRound,
  Ghost,
  RefreshCw,
  Search,
  Waypoints,
  Image,
  FileVideo,
  FileAudio,
  FileType,
  FileText,
  Package,
  FileType2,
  BadgeInfo,
  X,
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
import { useLogAnalysis } from "@/store/ServerLogsStore";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { ask, message, save } from "@tauri-apps/plugin-dialog";
import { SiGoogle } from "react-icons/si";
import { toast } from "sonner";
import { IpDisplay } from "./IpCheckModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentLogs } from "@/store/logFilterStore";
import { IoClose } from "react-icons/io5";
import { FaApper } from "react-icons/fa";

export function LogAnalyzer() {
  const {
    entries,
    overview,
    isLoading,
    error,
    filters,
    setLogData,
    setFilter,
    resetAll,
  } = useLogAnalysis();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [statusFilter, setStatusFilter] = useState<number[]>([]);
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [botFilter, setBotFilter] = useState<string | null>("all");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>({
    key: "timestamp",
    direction: "ascending",
  });
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [ipModal, setIpModal] = useState(false);
  const [ip, setIP] = useState("");
  const [domain, setDomain] = useState("");
  const [showOnTables, setShowOnTables] = useState(false);
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | null>(null);
  const [botTypeFilter, setBotTypeFilter] = useState<string | null>("all");
  const searchTermRef = useRef("");
  // SET the input search to be based on button click
  const [inputValue, setInputValue] = useState(""); // stores what's typed in the input

  // Helper functions
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  }, []);

  const getFileIcon = useCallback((path) => {
    switch (path) {
      case "HTML":
        return <FileCode type="html" className="text-blue-400" size={14} />;
      case "Image":
        return <Image className="text-green-600" size={14} />;
      case "Video":
        return <FileVideo size={14} />;
      case "Audio":
        return <FileAudio size={14} />;
      case "PHP":
        return <FileCode className="text-blue-400" type="php" size={14} />;
      case "TXT":
        return <FileType size={14} className="text-purple-400" />;
      case "CSS":
        return <FileCode type="css" className="text-yellow-400" size={14} />;
      case "JS":
        return <FileCode type="javascript" size={14} />;
      case "Document":
        return <FileText className="text-red-500" size={14} />;
      case "Archive":
        return <Package size={14} />;
      case "Font":
        return <FileType2 size={14} />;
      default:
        return <FileCode size={14} />;
    }
  }, []);

  const getStatusCodeColor = useCallback((code: number) => {
    if (code >= 200 && code < 300)
      return "bg-green-100 border-green-200 text-green-800 dark:bg-green-700 hover:bg-green-500 dark:text-white";
    if (code >= 300 && code < 400)
      return "bg-blue-400 dark:bg-blue-700 dark:text-white";
    if (code >= 400 && code < 500)
      return "bg-red-400 dark:bg-red-600 dark:text-white text-white";
    if (code >= 500) return "bg-red-400 text-white";
    return "bg-gray-500";
  }, []);

  const formatResponseSize = (size: unknown): string => {
    // Handle empty/undefined cases
    if (size === undefined || size === null || size === "") {
      return "0 KB";
    }

    // Convert to bytes first
    let bytes: number;
    if (typeof size === "number") {
      bytes = size;
    } else if (typeof size === "string") {
      // Clean and parse the string value
      const str = size.replace(/,/g, ".").trim();
      const numericMatch = str.match(/(\d+\.?\d*)\s*(B|KB|MB|GB)?/i);
      if (!numericMatch) return "0 KB";

      const numericValue = parseFloat(numericMatch[1]);
      if (isNaN(numericValue)) return "0 KB";

      // Convert to bytes based on unit
      const unit = (numericMatch[2] || "B").toUpperCase();
      switch (unit) {
        case "GB":
          bytes = numericValue * 1024 * 1024 * 1024;
          break;
        case "MB":
          bytes = numericValue * 1024 * 1024;
          break;
        case "KB":
          bytes = numericValue * 1024;
          break;
        default:
          bytes = numericValue;
          break; // Bytes
      }
    } else {
      return "0 KB";
    }

    // Convert to KB first
    const kbValue = bytes / 1024;

    // Only use MB/GB if KB would be too large (>10,000 KB)
    if (kbValue >= 10000) {
      const mbValue = kbValue / 1024;
      if (mbValue >= 1000) {
        const gbValue = mbValue / 1024;
        if (gbValue >= 100) return `${Math.round(gbValue)} GB`;
        return `${gbValue.toFixed(2)} GB`;
      }
      if (mbValue >= 100) return `${Math.round(mbValue)} MB`;
      return `${mbValue.toFixed(2)} MB`;
    }

    // Default to KB display
    if (kbValue < 1) {
      return "<1 KB";
    } else if (kbValue < 10) {
      return `${kbValue.toFixed(2)} KB`;
    } else if (kbValue < 100) {
      return `${kbValue.toFixed(1)} KB`;
    } else {
      return `${Math.round(kbValue)} KB`;
    }
  };

  // Debounced filter function
  const applyFilters = useMemo(
    () =>
      debounce((term: string, entries: LogEntry[]) => {
        if (!entries.length) {
          setFilteredLogs([]);
          return;
        }

        let result = [...entries];

        // Apply search
        if (term) {
          const lowerCaseSearch = term.toLowerCase();
          result = result.filter(
            (log) =>
              log.ip.toLowerCase().includes(lowerCaseSearch) ||
              log.path.toLowerCase().includes(lowerCaseSearch) ||
              log.user_agent.toLowerCase().includes(lowerCaseSearch),
          );
        }

        // Apply status filter
        if (statusFilter.length > 0) {
          result = result.filter((log) => statusFilter.includes(log.status));
        }

        // Apply method filter
        if (methodFilter.length > 0) {
          result = result.filter((log) => methodFilter.includes(log.method));
        }

        // Apply file type filter
        if (fileTypeFilter.length > 0) {
          result = result.filter((log) =>
            fileTypeFilter.includes(log.file_type),
          );
        }

        // Apply bot filter
        if (botFilter !== null) {
          if (botFilter === "bot") {
            result = result.filter(
              (log) => log?.crawler_type && log.crawler_type !== "Human",
            );
          } else if (botFilter === "Human") {
            result = result.filter((log) => log?.crawler_type === "Human");
          }
        }

        // Apply Bot type filter (Mobile or Desktop)
        if (botTypeFilter !== null) {
          if (botTypeFilter === "Mobile") {
            result = result.filter((log) => log?.user_agent.includes("Mobile"));
          } else if (botTypeFilter === "Desktop") {
            result = result.filter(
              (log) => !log?.user_agent.includes("Mobile"),
            );
          }
        }

        // Apply verified filter
        if (verifiedFilter !== null) {
          result = result.filter((log) => log.verified === verifiedFilter);
        }
        // Apply sorting
        if (sortConfig) {
          result.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof LogEntry];
            const bValue = b[sortConfig.key as keyof LogEntry];

            // Special case for timestamp sorting
            if (sortConfig.key === "timestamp") {
              const aDate = new Date(aValue as string).getTime();
              const bDate = new Date(bValue as string).getTime();
              return sortConfig.direction === "ascending"
                ? aDate - bDate
                : bDate - aDate;
            }

            // Normal string sorting
            if (typeof aValue === "string" && typeof bValue === "string") {
              return sortConfig.direction === "ascending"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            }

            // Fallback for other types
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
      }, 300),
    [
      statusFilter,
      methodFilter,
      fileTypeFilter,
      botFilter,
      sortConfig,
      verifiedFilter,
      botTypeFilter,
    ],
  );

  const [searchInput, setSearchInput] = useState("");
  // DEBOUNCING SEARCH FUNCTION
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        searchTermRef.current = term;
        applyFilters(term, entries);
      }, 300),
    [entries, applyFilters],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e?.target?.value;
      setSearchInput(value);
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  // Apply filters when search term or entries change
  useEffect(() => {
    applyFilters(searchTerm, entries);
  }, [searchTerm, entries, applyFilters]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      applyFilters.cancel();
    };
  }, [applyFilters]);

  // GET THE domain from the local storage
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
  }, []);

  // Set the Zustand store with the current filtered logs
  useEffect(() => {
    useCurrentLogs.getState().setCurrentLogs(filteredLogs);
  }, [filteredLogs]);

  // Get current logs for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  // Handle sorting
  const requestSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction:
            prev.direction === "ascending" ? "descending" : "ascending",
        };
      }
      return { key, direction: "ascending" };
    });
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter([]);
    setMethodFilter([]);
    setBotFilter("all");
    setSortConfig(null);
    setExpandedRow(null);
    setFileTypeFilter([]);
    setVerifiedFilter(null);
    setBotTypeFilter(null);
  }, []);

  // Export logs as CSV
  const exportCSV = useCallback(async () => {
    const headers = [
      "IP",
      "Country",
      "Browser",
      "Timestamp",
      "Method",
      "Path",
      "Taxonomy",
      "File Type",
      "Status Code",
      "Response Size",
      "User Agent",
      "Referer",
      "Bot/Human",
      "Google Verified",
    ];

    const dataToExport = filteredLogs.length > 0 ? filteredLogs : entries;

    const csvData = dataToExport.map((log) => [
      log.ip || "",
      log.country || "",
      log.browser || "",
      log.timestamp || "",
      log.method || "",
      (domain && showOnTables ? "https://" + domain + log.path : log.path) ||
        "",
      log.taxonomy || "",
      log.file_type || "",
      log.status || "",
      log.response_size || "",
      `"${(log.user_agent || "").replace(/"/g, '""')}"`,
      log.referer || "-",
      log.crawler_type || "",
      log.verified || "false",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    try {
      const filePath = await save({
        defaultPath: `RustySEO - Server Logs - ${new Date().toISOString().slice(0, 10)}.csv`,
        filters: [
          {
            name: "CSV",
            extensions: ["csv"],
          },
        ],
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
  }, [filteredLogs, entries, domain, showOnTables]);

  const handleIP = useCallback((ip: string) => {
    setIpModal(true);
    setIP(ip);
  }, []);

  const mac = process.platform === "darwin";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <AlertCircle className="h-5 w-5 mr-2" />
        {error}
      </div>
    );
  }

  console.log(entries, "Entries");

  return (
    <div className="space-y-4 flex flex-col flex-1 h-full not-selectable">
      <div className="flex flex-col md:flex-row justify-between relative -mb-4 p-1 h-full">
        {ipModal && (
          <div className="absolute z-50 top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-[2rem]">
            <IpDisplay ip={ip} close={setIpModal} />
          </div>
        )}
        <div className="relative w-full mr-1">
          <Search className="absolute dark:text-white/50 left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            reset={resetFilters}
            type="search"
            placeholder="Search by IP, path, user agent..."
            className="pl-8 w-full dark:text-white"
            value={searchInput}
            onChange={handleSearchChange}
            onKeyPress={(e) => e.key === "Enter" && setSearchTerm(inputValue)}
          />
          {/* <button */}
          {/*   onClick={() => setSearchTerm(inputValue)} */}
          {/*   className="absolute right-3 bg-brand-bright p-1 top-2 rounded-md px-2 dark:text-white text-xs" */}
          {/* > */}
          {/*   search */}
          {/* </button> */}

          {inputValue && (
            <X
              size={14}
              className="absolute right-3 text-red-500 w-6 dark:text-red-500    top-3 rounded-md  text-xs bg-white dark:bg-brand-darker cursor-pointer "
              onClick={() => {
                setInputValue("");
                setSearchTerm("");
                resetFilters();
              }}
            />
          )}
        </div>

        <div className="flex flex-1 gap-1">
          {/* Status Code Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex gap-2 dark:bg-brand-darker dark:text-white dark:border-brand-dark"
              >
                <Filter className="h-4 w-4" />
                Status
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-0">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="w-48 m-0 bg-white dark:bg-brand-darker text-left dark:text-white dark:border-brand-dark"
            >
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[200, 201, 204, 400, 401, 403, 404, 500].map((code) => (
                <DropdownMenuCheckboxItem
                  className="hover:bg-brand-blue active:text-black hover:text-white dark:text-white"
                  key={code}
                  checked={statusFilter.includes(code)}
                  onCheckedChange={(checked) => {
                    setStatusFilter((prev) =>
                      checked
                        ? [...prev, code]
                        : prev.filter((c) => c !== code),
                    );
                  }}
                >
                  <Badge
                    variant="outline"
                    className={`mr-2 ${getStatusCodeColor(code)}`}
                  >
                    {code}
                  </Badge>
                  {code >= 200 && code < 300
                    ? "Success"
                    : code >= 300 && code < 400
                      ? "Redirection"
                      : code >= 400 && code < 500
                        ? "Client Error"
                        : "Server Error"}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Method Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex gap-2 dark:bg-brand-darker dark:text-white dark:border-brand-dark"
              >
                <Filter className="h-4 w-4" />
                Method
                {methodFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {methodFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white dark:border-brand-dark dark:text-white dark:active:bg-brand-bright dark:bg-brand-darker"
            >
              <DropdownMenuLabel>Filter by Method</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["GET", "POST", "PUT", "DELETE"].map((method) => (
                <DropdownMenuCheckboxItem
                  className="bg-white active:bg-gray-100 hover:text-white dark:bg-brand-darker dark:hover:bg-brand-bright"
                  key={method}
                  checked={methodFilter.includes(method)}
                  onCheckedChange={(checked) => {
                    setMethodFilter((prev) =>
                      checked
                        ? [...prev, method]
                        : prev.filter((m) => m !== method),
                    );
                  }}
                >
                  {method}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* FileType Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex gap-2 dark:bg-brand-darker dark:text-white dark:border-brand-dark"
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
              className="bg-white dark:border-brand-dark dark:text-white dark:bg-brand-darker"
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
                    setFileTypeFilter((prev) =>
                      checked
                        ? [...prev, fileType]
                        : prev.filter((m) => m !== fileType),
                    );
                  }}
                >
                  {fileType}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bot/Human Filter */}
          <Select
            value={botFilter || "all"}
            onValueChange={(value) =>
              setBotFilter(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-[125px] dark:bg-brand-darker dark:text-white">
              <SelectValue placeholder="Bot/Human" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="bot">🤖 Robots</SelectItem>
              <SelectItem value="Human">🙋 Human</SelectItem>
            </SelectContent>
          </Select>

          {/* SELECT BOT TYPE (DESKTOP OR MOBILE) */}
          <Select
            value={botTypeFilter === null ? "all" : botTypeFilter}
            onValueChange={(value) =>
              setBotTypeFilter(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-[120px] dark:bg-brand-darker dark:text-white">
              <SelectValue placeholder="Bot/Human" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All devices</SelectItem>
              <SelectItem value="Desktop">Desktop</SelectItem>
              <SelectItem value="Mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>

          {/* SELECT VEREFIED OR NOT VERIFIED */}
          <Select
            value={
              verifiedFilter === null
                ? "all"
                : verifiedFilter
                  ? "verified"
                  : "unverified"
            }
            onValueChange={(value) => {
              if (value === "all") setVerifiedFilter(null);
              else setVerifiedFilter(value === "verified");
            }}
          >
            <SelectTrigger className="w-[130px] dark:bg-brand-darker dark:text-white">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All IPs</SelectItem>
              <SelectItem className="flex" value="verified">
                <div className="flex items-center">
                  <BadgeCheck
                    className="text-xs active:text-brand-bright hover:white active:white"
                    size={17}
                  />
                  <span className="ml-1 inline-block">Verified</span>
                </div>
              </SelectItem>
              <SelectItem value="unverified">
                <div className="flex">
                  <BadgeInfo size={17} />{" "}
                  <span className="ml-1">Unverified</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

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

      <div>
        <CardContent
          className="p-0"
          style={{
            height: "calc(100vh - 27.2rem)",
          }}
        >
          <div className="rounded-md border dark:border-brand-dark h-full logs">
            <div className="relative w-full h-full overflow-auto">
              <Table className="h-full [&_tr]:p-10 logs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] text-center">#</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => requestSort("ip")}
                    >
                      IP Address
                      {sortConfig?.key === "ip" && (
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
                      onClick={() => requestSort("method")}
                    >
                      Method
                      {sortConfig?.key === "method" && (
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
                      className="cursor-pointer w-[90px] text-left"
                      onClick={() => requestSort("browser")}
                    >
                      Browser
                      {sortConfig?.key === "browser" && (
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
                      className="cursor-pointer w-[200px] text-left"
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
                      className="cursor-pointer pl-7"
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
                    <TableHead
                      className="cursor-pointer"
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
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => requestSort("responseSize")}
                    >
                      Size
                      {sortConfig?.key === "responseSize" && (
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
                  {filteredLogs.length > 0 ? (
                    currentLogs.map((log, index) => (
                      <LogRow
                        key={`${log.ip}-${log.timestamp}-${index}`}
                        log={log}
                        index={index}
                        indexOfFirstItem={indexOfFirstItem}
                        expandedRow={expandedRow}
                        setExpandedRow={setExpandedRow}
                        handleIP={handleIP}
                        showOnTables={showOnTables}
                        domain={domain}
                        formatDate={formatDate}
                        getFileIcon={getFileIcon}
                        getStatusCodeColor={getStatusCodeColor}
                        formatResponseSize={formatResponseSize}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="h-24 text-center text-black/50 dark:text-white/50"
                      >
                        No log entries found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        indexOfFirstItem={indexOfFirstItem}
        indexOfLastItem={indexOfLastItem}
        filteredLogs={filteredLogs}
        entries={entries}
      />
    </div>
  );
}

// Extracted LogRow component
function LogRow({
  log,
  index,
  indexOfFirstItem,
  expandedRow,
  setExpandedRow,
  handleIP,
  showOnTables,
  domain,
  formatDate,
  getFileIcon,
  getStatusCodeColor,
  formatResponseSize,
}) {
  return (
    <>
      <TableRow
        className="group cursor-pointer max-h-2"
        onClick={() => {
          setExpandedRow(expandedRow === index ? null : index);
        }}
      >
        <TableCell className="font-medium text-center">
          {indexOfFirstItem + index + 1}
        </TableCell>

        <TableCell className="w-[60px]">
          <div className="flex items-center">
            <Waypoints
              onClick={(e) => {
                e.stopPropagation();
                handleIP(log.ip);
              }}
              title="Click to inspect IP"
              className="mr-2 text-blue-400 dark:text-blue-300/50 hover:scale-110 cursor-pointer"
              size={13}
            />
            {log.ip}
          </div>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={
              log.method === "GET"
                ? "bg-green-100 dark:bg-green-700 text-green-800 border-green-200"
                : log.method === "POST"
                  ? "bg-blue-100 dark:bg-blue-700 text-blue-800 border-blue-200"
                  : log.method === "PUT"
                    ? "bg-yellow-100 dark:bg-yellow-400 text-yellow-800 border-yellow-200"
                    : "bg-red-100 dark:bg-red-700 text-red-800 border-red-200"
            }
          >
            {log.method}
          </Badge>
        </TableCell>
        <TableCell
          className={` pl-3  ${log?.browser === "Chrome" ? "text-red-400" : ""}
          ${log?.browser === "Firefox" ? "text-green-500" : ""}
${log?.browser === "Safari" ? "text-blue-400" : ""}
`}
          width={12}
        >
          {log?.browser}
        </TableCell>
        <TableCell className="max-w-44">{formatDate(log.timestamp)}</TableCell>
        <TableCell className="max-w-[480px] truncate mr-2">
          <span className="mr-1 inline-block" style={{ paddingTop: "" }}>
            {getFileIcon(log.file_type)}
          </span>
          {showOnTables && domain ? "https://" + domain + log.path : log?.path}
        </TableCell>
        <TableCell className="max-w-[480px] truncate">
          <Badge variant={"outline"}>{log.file_type}</Badge>
        </TableCell>
        <TableCell>
          <Badge className={`${getStatusCodeColor(log.status)}`}>
            {log.status}
          </Badge>
        </TableCell>
        <TableCell>{formatResponseSize(log.response_size)}</TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={
              log.crawler_type !== "Human"
                ? "bg-red-100 dark:bg-red-400 dark:text-white"
                : "bg-blue-100 dark:bg-blue-500 dark:text-white text-blue-800 border-blue-200"
            }
          >
            {log.crawler_type && log.crawler_type.length > 16
              ? `${log.crawler_type.substring(0, 13)}...`
              : log.crawler_type}{" "}
            {log.verified && (
              <BadgeCheck className="text-blue-800 pl-1" size={18} />
            )}
          </Badge>{" "}
        </TableCell>
      </TableRow>
      {expandedRow === index && (
        <TableRow>
          <TableCell colSpan={10} className="bg-gray-50 dark:bg-gray-800 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col max-w-5xl">
                <div className="flex mb-2 space-x-2 items-center justify-between">
                  <h4 className="font-bold">User Agent</h4>
                  {log.verified && (
                    <div className="flex items-center space-x-1 bg-red-200 dark:bg-red-400 p-1 px-2 text-xs rounded-md">
                      <BadgeCheck className="text-blue-700 pr-1" size={18} />
                      {log?.crawler_type}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md h-full">
                  <p className="text-sm font-mono break-all">
                    {log.user_agent}
                  </p>
                </div>
              </div>

              <div className="flex flex-col">
                <h4 className="mb-2 font-bold">Referer</h4>
                <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md h-full">
                  <p className="text-sm break-all">
                    {log.referer || (
                      <span className="text-muted-foreground">No referer</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// Extracted PaginationControls component
function PaginationControls({
  currentPage,
  totalPages,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  indexOfFirstItem,
  indexOfLastItem,
  filteredLogs,
  entries,
}) {
  return (
    <div
      className="flex items-center justify-between w-full"
      style={{ marginTop: "0.2em" }}
    >
      <div className="flex items-center -mt-2 ml-1 z-0">
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => setItemsPerPage(Number(value))}
        >
          <SelectTrigger className="w-[70px] dark:text-white/50 text-xs h-6 mr-2 z-50">
            <SelectValue placeholder="100" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="500">500</SelectItem>
            <SelectItem value="1000">1000</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Pagination className="text-xs">
        <PaginationContent style={{ marginTop: "-5px" }}>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={
                currentPage === 1
                  ? "pointer-events-none opacity-50 text-xs"
                  : "cursor-pointer text-xs"
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
                  className="cursor-pointer h-6 text-xs"
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
              <PaginationItem className="text-xs">
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  className="cursor-pointer text-xs"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem className="cursor-pointer text-xs">
            <PaginationNext
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50 text-xs"
                  : "text-xs"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <div>
        <span className="flex justify-end text-muted-foreground w-[180px] flex-nowrap dark:text-white/50 text-right pr-2.5 -mt-1.5 -ml-28 text-xs text-black/50">
          {indexOfFirstItem + 1}-
          {Math.min(
            indexOfLastItem,
            filteredLogs.length > 0 ? filteredLogs.length : entries.length,
          )}{" "}
          of {filteredLogs.length > 0 ? filteredLogs.length : entries.length}{" "}
          logs
        </span>
      </div>
    </div>
  );
}
