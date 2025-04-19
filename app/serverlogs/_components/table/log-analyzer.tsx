// @ts-nocheck
import { useState, useEffect } from "react";
import {
  AlertCircle,
  BadgeCheck,
  ChevronDown,
  CircleHelp,
  ClipboardCopy,
  Copy,
  CopyPlus,
  Download,
  Filter,
  FlaskRound,
  Ghost,
  RefreshCw,
  Search,
  Waypoints,
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

// Helper function to format date
const formatDate = (dateString: string) => {
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

// Get status code badge color
const getStatusCodeColor = (code: number) => {
  if (code >= 200 && code < 300)
    return "bg-green-100 border-green-200 text-green-800 dark:bg-green-700 hover:bg-green-500 dark:text-white";
  if (code >= 300 && code < 400)
    return "bg-blue-400 dark:bg-blue-700 dark:text-white";
  if (code >= 400 && code < 500)
    return "bg-red-400 dark:bg-red-600 dark:text-white text-white";
  if (code >= 500) return "bg-red-400 text-white";
  return "bg-gray-500";
};

// Format response size
const formatResponseSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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

  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("google");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [statusFilter, setStatusFilter] = useState<number[]>([]);
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [botFilter, setBotFilter] = useState<string | null>("all");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [ipModal, setIpModal] = useState(false);
  const [ip, setIP] = useState("");
  const [domain, setDomain] = useState("");
  const [showOnTables, setShowOnTables] = useState(false);

  // GET THE domain from the local storage to use on the table to complement the path
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
  }, [entries.length]);

  // Apply filters and search
  useEffect(() => {
    if (!entries.length) return;

    let result = [...entries];

    // Apply search
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          log.ip.toLowerCase().includes(lowerCaseSearch) ||
          log.path.toLowerCase().includes(lowerCaseSearch) ||
          log.user_agent.toLowerCase().includes(lowerCaseSearch),
        // (log.referer && log.referer.toLowerCase().includes(lowerCaseSearch)),
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

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof LogEntry];
        const bValue = b[sortConfig.key as keyof LogEntry];

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
  }, [entries, searchTerm, statusFilter, methodFilter, botFilter, sortConfig]);

  // Get current logs for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs =
    filteredLogs.length > 0
      ? filteredLogs.slice(indexOfFirstItem, indexOfLastItem)
      : entries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(
    filteredLogs.length > 0
      ? filteredLogs.length / itemsPerPage
      : entries.length / itemsPerPage,
  );

  // Handle sorting
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

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter([]);
    setMethodFilter([]);
    setBotFilter("all");
    setSortConfig(null);
    setExpandedRow(null);
  };

  // Export logs as CSV
  const exportCSV = async () => {
    const headers = [
      "IP",
      "Country",
      "Browser",
      "Timestamp",
      "Method",
      "Path",
      "File Type",
      "Status Code",
      "Response Size",
      "User Agent",
      "Referer",
      "Bot/Human",
      "Google Verified",
      "Taxonomy",
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
      log.file_type || "",
      log.status || "",
      log.response_size || "",
      `"${(log.user_agent || "").replace(/"/g, '""')}"`,
      log.referer || "-",
      log.crawler_type || "",
      log.verified || "false",
      log.taxonomy || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    try {
      // Ask user for save location
      const filePath = await save({
        defaultPath: `RustySEO - server_logs_${new Date().toISOString().slice(0, 10)}.csv`,
        filters: [
          {
            name: "CSV",
            extensions: ["csv"],
          },
        ],
      });

      if (filePath) {
        await writeTextFile(filePath, csvContent);

        // Optional: Show success message
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

  // Handle loading and error states
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

  function handleIP(ip) {
    setIpModal(true);
    setIP(ip);
  }

  return (
    <div className="space-y-4  flex flex-col flex-1 h-full ">
      <div className="flex flex-col md:flex-row  justify-between relative -mb-4 p-1 h-full">
        {ipModal && (
          <div className="absolute z-50 top-1/3  left-1/2 transform -translate-x-1/2 -translate-y-[2rem]">
            <IpDisplay ip={ip} close={setIpModal} />
          </div>
        )}
        <div className="relative w-full mr-1 ">
          <Search className="absolute dark:text-white/50 left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by IP, path, user agent, or referer..."
            className="pl-8 w-full "
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-1 gap-1 ">
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
              align="end"
              className="w-56 bg-white dark:bg-brand-darker"
            >
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[200, 201, 204, 400, 401, 403, 404, 500].map((code) => (
                <DropdownMenuCheckboxItem
                  className="hover:bg-brand-blue hover:text-white"
                  key={code}
                  checked={statusFilter.includes(code)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setStatusFilter([...statusFilter, code]);
                    } else {
                      setStatusFilter(statusFilter.filter((c) => c !== code));
                    }
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
              className="bg-white dark:border-brand-dark dark:text-white dark:active:bg-brand-bright  dark:bg-brand-darker"
            >
              <DropdownMenuLabel>Filter by Method</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["GET", "POST", "PUT", "DELETE"].map((method) => (
                <DropdownMenuCheckboxItem
                  className={
                    "bg-white active:bg-gray-100 hover:text-white dark:bg-brand-darker dark:hover:bg-brand-bright"
                  }
                  key={method}
                  checked={methodFilter.includes(method)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setMethodFilter([...methodFilter, method]);
                    } else {
                      setMethodFilter(methodFilter.filter((m) => m !== method));
                    }
                  }}
                >
                  {method}
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
            <SelectTrigger className="w-[130px] dark:bg-brand-darker  dark:text-white">
              <SelectValue placeholder="Bot/Human" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="bot">Bots</SelectItem>
              <SelectItem value="Human">Humans</SelectItem>
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
          className="p-0 "
          style={{
            height: "calc(100vh - 27.2rem)",
          }}
        >
          <div className="rounded-md border  dark:border-brand-dark h-full logs">
            <div className="relative w-full h-full overflow-auto">
              <Table className="h-full [&_tr]:p-10 logs">
                <TableHeader>
                  <TableRow className="p-10">
                    <TableHead className="w-[80px]">#</TableHead>
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
                      className="cursor-pointer"
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
                      className="cursor-pointer"
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
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log, index) => (
                      <>
                        <TableRow
                          key={`${log.ip}-${log.timestamp}-${index}`}
                          className="group cursor-pointer"
                          onClick={() => {
                            setExpandedRow(
                              expandedRow === index ? null : index,
                            );
                          }}
                        >
                          <TableCell className="font-medium">
                            {indexOfFirstItem + index + 1}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center">
                              <Waypoints
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleIP(log.ip);
                                }}
                                title="Click to inspect IP"
                                className="mr-2 text-blue-400 dark:text-white/50 hover:scale-110 cursor-pointer"
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
                          <TableCell>{log?.browser}</TableCell>
                          <TableCell>{formatDate(log.timestamp)}</TableCell>
                          <TableCell className="max-w-[480px] truncate">
                            {showOnTables && domain
                              ? "https://" + domain + log.path
                              : log?.path}
                          </TableCell>
                          <TableCell className="max-w-[480px] truncate">
                            <Badge variant={"outline"}>{log.file_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getStatusCodeColor(log.status)} `}
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatResponseSize(log.response_size)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                log.crawler_type !== "Human"
                                  ? "bg-red-100"
                                  : "bg-blue-100 dark:bg-green-700 dark:text-white text-green-800  border-green-200"
                              }
                            >
                              {log.crawler_type}
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
                                {/* User Agent */}
                                <div className="flex flex-col max-w-[70rem] w-full">
                                  <div className="flex mb-2 space-x-2 items-center justify-between">
                                    <h4 className=" font-bold">User Agent</h4>
                                    {log.verified && (
                                      <div className="flex items-center space-x-1 bg-red-100 px-2 text-xs rounded-md">
                                        <BadgeCheck
                                          className="text-blue-400 pr-1"
                                          size={18}
                                        />
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

                                {/* Referer */}
                                <div className="flex flex-col">
                                  <h4 className="mb-2 font-bold">Referer</h4>
                                  <div className="p-3 bg-brand-bright/20 dark:bg-gray-700 rounded-md h-full">
                                    <p className="text-sm break-all">
                                      {log.referer || (
                                        <span className="text-muted-foreground">
                                          No referer
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}{" "}
                      </>
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
        className="flex items-center justify-between w-full "
        style={{ marginTop: "0.2em" }}
      >
        <div className="flex items-center -mt-2 ml-1">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => setItemsPerPage(Number(value))}
          >
            <SelectTrigger className="w-[70px] dark:text-white/50 text-xs h-6 mr-2  z-50">
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
            <PaginationItem className="cursor-pointer">
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
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
          <span className="flex justify-end text-muted-foreground w-[180px] flex-nowrap dark:text-white/50 text-right  pr-2.5 -mt-1.5 text-xs text-black/50">
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
    </div>
  );
}
