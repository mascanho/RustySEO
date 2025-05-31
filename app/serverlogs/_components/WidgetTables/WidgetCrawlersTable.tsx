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
  ip: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  user_agent: string;
  referer: string;
  response_size: string | number;
  country?: string;
  is_crawler: boolean;
  crawler_type: string;
  browser: string;
  file_type: string;
  frequency?: number;
  verified?: boolean;
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

const formatResponseSize = (size: string | number): string => {
  if (typeof size === "number") {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (typeof size === "string") {
    if (size.includes("MB")) return size;
    if (size.includes("KB")) {
      const kbValue = parseFloat(size.split(" ")[0]) || 0;
      return `${(kbValue / 1024).toFixed(1)} MB`;
    }
    const bytesValue = parseFloat(size) || 0;
    return `${(bytesValue / (1024 * 1024)).toFixed(1)} MB`;
  }

  return "0 MB";
};

const parseSizeToNumber = (size: string | number): number => {
  if (typeof size === "number") return size;

  if (typeof size === "string") {
    const [value, unit] = size.split(" ");
    const numericValue = parseFloat(value) || 0;

    if (unit === "MB") return numericValue * 1024 * 1024;
    if (unit === "KB") return numericValue * 1024;
    return numericValue;
  }

  return 0;
};

interface WidgetCrawlersTableProps {
  data: {
    totals?: {
      google_bot_page_frequencies?: Record<string, LogEntry[]>;
    };
    log_finish_time?: string;
  };
}

const WidgetCrawlersTable: React.FC<WidgetCrawlersTableProps> = ({ data }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDomain = localStorage.getItem("domain");
      if (storedDomain) setDomain(storedDomain);
      const isShowing = localStorage.getItem("showOnTables");
      if (isShowing === "true") setShowOnTables(true);
    }
  }, []);

  useEffect(() => {
    if (!data?.totals?.google_bot_page_frequencies) return;

    const mergedLogs: LogEntry[] = [];
    const urlMap = new Map<string, LogEntry>();

    Object.entries(data.totals.google_bot_page_frequencies).forEach(
      ([path, entries]) => {
        entries.forEach((entry: LogEntry) => {
          const normalizedPath = path.toLowerCase().trim();
          const responseSize =
            typeof entry.response_size === "string"
              ? entry.response_size
              : `${(entry.response_size / (1024 * 1024)).toFixed(1)} MB`;

          if (urlMap.has(normalizedPath)) {
            const existing = urlMap.get(normalizedPath)!;
            existing.frequency =
              (existing.frequency || 0) + (entry.frequency || 1);

            const existingSize = parseSizeToNumber(existing.response_size);
            const newSize = parseSizeToNumber(entry.response_size);
            existing.response_size = `${((existingSize + newSize) / (1024 * 1024)).toFixed(1)} MB`;

            if (new Date(entry.timestamp) > new Date(existing.timestamp)) {
              existing.timestamp = entry.timestamp;
              existing.status = entry.status;
              existing.ip = entry.ip;
              existing.user_agent = entry.user_agent;
              existing.method = entry.method;
              existing.file_type = entry.file_type;
              existing.crawler_type = entry.crawler_type;
              existing.verified = entry.verified;
            }
          } else {
            const newEntry = {
              ...entry,
              path,
              response_size: responseSize,
              frequency: entry.frequency || 1,
            };
            urlMap.set(normalizedPath, newEntry);
          }
        });
      },
    );

    const mergedEntries = Array.from(urlMap.values());
    setLogs(mergedEntries);
    setFilteredLogs(mergedEntries);
  }, [data]);

  useEffect(() => {
    let result = [...logs];

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
        const aValue = a[sortConfig.key as keyof LogEntry];
        const bValue = b[sortConfig.key as keyof LogEntry];

        if (sortConfig.key === "response_size") {
          const aSize = parseSizeToNumber(a.response_size);
          const bSize = parseSizeToNumber(b.response_size);
          return sortConfig.direction === "ascending"
            ? aSize - bSize
            : bSize - aSize;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "ascending"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
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
    logs,
    fileTypeFilter,
    botTypeFilter,
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
    setBotTypeFilter(null);
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
    ];

    const csvData = filteredLogs.map((log) => [
      log.ip || "",
      log.timestamp || "",
      log.method || "",
      showOnTables ? "https://" + domain + log.path : log.path || "",
      log.file_type || "",
      formatResponseSize(log.response_size),
      log.frequency || "",
      `"${(log.user_agent || "").replace(/"/g, '""')}"`,
      log.crawler_type || "",
      log.verified ? "Yes" : "No",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    try {
      const filePath = await save({
        defaultPath: `Google_Bot_Frequency_${new Date().toISOString().slice(0, 10)}.csv`,
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
        return <FileCode size={14} />;
      case "Image":
        return <Image size={14} />;
      case "Video":
        return <FileVideo size={14} />;
      case "Audio":
        return <FileAudio size={14} />;
      case "PHP":
        return <FileCode size={14} />;
      case "TXT":
        return <FileType size={14} />;
      case "CSS":
        return <FileCode size={14} />;
      case "JS":
        return <FileCode size={14} />;
      case "Document":
        return <FileText size={14} />;
      case "Archive":
        return <Package size={14} />;
      case "Font":
        return <FileType2 size={14} />;
      default:
        return <FileCode size={14} />;
    }
  };

  // Get the oldest date in the array
  const findOldestEntry = (logs: LogEntry[]): LogEntry | null => {
    if (logs.length === 0) return null;

    return logs.reduce((oldest, current) => {
      return new Date(current.timestamp) < new Date(oldest.timestamp)
        ? current
        : oldest;
    });
  };

  function calculateElapsedTime(
    oldestEntry: LogEntry | null,
    finishTime?: string,
  ) {
    if (!oldestEntry || !finishTime) return "N/A";

    const initialDate = new Date(oldestEntry.timestamp);
    const finishDate = new Date(finishTime);

    const elapsedTimeMs = Math.abs(
      finishDate.getTime() - initialDate.getTime(),
    );
    const hours = Math.floor(elapsedTimeMs / (1000 * 60 * 60));
    const minutes = Math.floor(
      (elapsedTimeMs % (1000 * 60 * 60)) / (1000 * 60),
    );
    const seconds = Math.floor((elapsedTimeMs % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  function calculateHitsPerHour(log: LogEntry, finishTime?: string) {
    if (!finishTime) return "N/A";

    const initialDate = new Date(log.timestamp);
    const finishDate = new Date(finishTime);
    const elapsedTimeHours =
      Math.abs(finishDate.getTime() - initialDate.getTime()) / (1000 * 60 * 60);
    const frequency = log.frequency || 0;

    return elapsedTimeHours > 0
      ? (frequency / elapsedTimeHours).toFixed(1)
      : "0.0";
  }

  function timings(log: LogEntry, finishTime?: string) {
    if (!finishTime)
      return { elapsedTime: "N/A", frequency: { perHour: "N/A" } };

    const initialDate = new Date(log?.timestamp);
    const finishDate = new Date(finishTime);

    const elapsedTimeMs = Math.abs(
      finishDate.getTime() - initialDate.getTime(),
    );
    const hours = Math.floor(elapsedTimeMs / (1000 * 60 * 60));
    const minutes = Math.floor(
      (elapsedTimeMs % (1000 * 60 * 60)) / (1000 * 60),
    );
    const seconds = Math.floor((elapsedTimeMs % (1000 * 60)) / 1000);

    const elapsedTimeHours = elapsedTimeMs / (1000 * 60 * 60);
    const frequency = log?.frequency || 0;
    const perHour =
      elapsedTimeHours > 0 ? (frequency / elapsedTimeHours).toFixed(1) : "0.0";

    return {
      elapsedTime: `${hours}h ${minutes}m ${seconds}s`,
      frequency: {
        perHour,
      },
    };
  }

  const oldestEntry = findOldestEntry(logs);

  return (
    <div className="space-y-4 h-full pb-0 -mb-4 not-selectable">
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
              className="bg-white dark:border-brand-dark dark:text-white   dark:bg-brand-darker z-[999999999999] hover:text-black active:text-black hover:bg-brand-brigh"
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
                  className={
                    "bg-white active:bg-brand-bright  dark:bg-brand-darker dark:hover:bg-brand-bright active:text-white hover:bg-brand-bright hover:text-white"
                  }
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
            <SelectTrigger className="w-[150px] dark:bg-brand-darker dark:text-white">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent className="z-[999999999999999]">
              <SelectItem
                className="hover:bg-brand-bright hover:text-white"
                value="all"
              >
                All IPs
              </SelectItem>
              <SelectItem
                className="hover:bg-brand-bright hover:text-white"
                value="verified"
              >
                Verified
              </SelectItem>
              <SelectItem
                className="hover:bg-brand-bright hover:text-white"
                value="unverified"
              >
                Unverified
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={botTypeFilter === null ? "all" : botTypeFilter}
            onValueChange={(value) =>
              setBotTypeFilter(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-[120px] dark:bg-brand-darker dark:text-white ">
              <SelectValue placeholder="Bot/Human" />
            </SelectTrigger>
            <SelectContent className="z-[999999999999999]">
              <SelectItem
                className="hover:bg-brand-bright hover:text-white"
                value="all"
              >
                All devices
              </SelectItem>
              <SelectItem
                className="hover:bg-brand-bright hover:text-white"
                value="Desktop"
              >
                Desktop
              </SelectItem>
              <SelectItem
                className="hover:bg-brand-bright hover:text-white"
                value="Mobile"
              >
                Mobile
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
              <Table className="h-full not-selectable">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-center">#</TableHead>
                    <TableHead
                      className="cursor-pointer max-w-[20px] truncate"
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
                      ∑ Frequency
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
                    <TableHead>Crawler Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log, index) => (
                      <React.Fragment
                        key={`${log.ip}-${log.timestamp}-${index}`}
                      >
                        <TableRow
                          className="group cursor-pointer"
                          onClick={() =>
                            setExpandedRow(expandedRow === index ? null : index)
                          }
                        >
                          <TableCell className="font-medium text-center max-w-[40px]">
                            {indexOfFirstItem + index + 1}
                          </TableCell>
                          <TableCell className="w-[200px] pl-2">
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell className="inline-block truncate max-w-[600px]">
                            <span className="mr-2 inline-block pl-2">
                              {getFileIcon(log.file_type)}
                            </span>
                            {showOnTables && domain
                              ? "https://" + domain + log.path
                              : log.path}
                          </TableCell>
                          <TableCell className="min-w-[30px] truncate">
                            <Badge variant="outline">{log.file_type}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {formatResponseSize(log.response_size)}
                          </TableCell>
                          <TableCell
                            size={80}
                            className="text-center min-w-[90px]"
                          >
                            {log.frequency}
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
                              {log.crawler_type.startsWith("Goo")
                                ? "Google 🤖"
                                : log.crawler_type.length > 20
                                  ? log.crawler_type.slice(0, 10) + "..."
                                  : log.crawler_type}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {expandedRow === index && (
                          <TableRow>
                            <TableCell
                              colSpan={10}
                              className="bg-gray-50 dark:bg-gray-800 p-4 "
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col max-w-[70rem] w-full">
                                  <div className="flex mb-2 space-x-2 items-center justify-between">
                                    <h4 className=" font-bold">Timespan</h4>
                                    {log.verified && (
                                      <div className="flex items-center space-x-1 py-1 bg-red-200 dark:bg-red-400 px-2 text-xs rounded-md">
                                        <BadgeCheck
                                          size={18}
                                          className="text-blue-800 pr-1 dark:text-blue-900 "
                                        />
                                        {log?.crawler_type}
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md h-full">
                                    <p className="text-sm font-mono break-all">
                                      {calculateElapsedTime(
                                        oldestEntry,
                                        data?.log_finish_time,
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-col">
                                  <h4 className="mb-2 font-bold">
                                    Hits per Hour
                                  </h4>
                                  <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md h-full">
                                    <p className="text-sm break-all">
                                      {calculateHitsPerHour(
                                        log,
                                        data?.log_finish_time,
                                      )}{" "}
                                    </p>
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
                      <TableCell colSpan={10} className="h-24 text-center">
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
        <div>
          {/* <span className="flex justify-end text-muted-foreground dark:text-white/50 w-[180px] flex-nowrap -ml-16 text-right pr-2.5 -mt-1.5 text-xs text-black/50"> */}
          {/*   {indexOfFirstItem + 1}- */}
          {/*   {Math.min(indexOfLastItem, filteredLogs.length)} of{" "} */}
          {/*   {filteredLogs.length} logs */}
          {/* </span> */}
        </div>
      </div>
    </div>
  );
};

export default WidgetCrawlersTable;
