import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  ChevronDown,
  Download,
  Filter,
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

// Interface for log entry based on provided data structure
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
}

// Helper function to format date
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

// Format response size
const formatResponseSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface WidgetTableProps {
  data: any;
}

const WidgetTable: React.FC<WidgetTableProps> = ({ data }) => {
  const [initialLogs, setInitialLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(100);
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [botFilter, setBotFilter] = useState<string | null>("all");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Process data when component mounts or data changes
  useEffect(() => {
    if (!data?.totals?.google_bot_page_frequencies) return;

    const logs: LogEntry[] = [];
    Object.entries(data.totals.google_bot_page_frequencies).forEach(
      ([path, entries]) => {
        (entries as any[]).forEach((entry: any) => {
          logs.push({
            ...entry,
            path,
          });
        });
      },
    );

    setInitialLogs(logs);
    setFilteredLogs(logs);
  }, [data]);

  // Apply filters and search
  useEffect(() => {
    let result = [...initialLogs];

    // Apply search
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

    // Apply method filter
    if (methodFilter.length > 0) {
      result = result.filter((log) => methodFilter.includes(log.method));
    }

    // Apply bot filter
    if (botFilter !== null) {
      if (botFilter === "bot") {
        result = result.filter((log) => log.crawler_type !== "Human");
      } else if (botFilter === "Human") {
        result = result.filter((log) => log.crawler_type === "Human");
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
  }, [searchTerm, methodFilter, botFilter, sortConfig, initialLogs]);

  // Get current logs for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

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
    setMethodFilter([]);
    setBotFilter("all");
    setSortConfig(null);
    setExpandedRow(null);
    setFilteredLogs(initialLogs); // Restore filteredLogs to initial state
  };

  // Export logs as CSV
  const exportCSV = () => {
    const headers = [
      "IP",
      "Timestamp",
      "Method",
      "Path",
      "File Type",
      "Response Size",
      "User Agent",
      "Referer",
      "Crawler Type",
      "Frequency",
    ];

    const csvData = filteredLogs.map((log) => [
      log.ip,
      log.timestamp,
      log.method,
      log.path,
      log.file_type,
      log.response_size,
      `"${log.user_agent.replace(/"/g, '""')}"`,
      log.referer || "-",
      log.crawler_type,
      log.frequency,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `server_logs_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 h-full pb-0 -mb-4">
      <div className="flex flex-col md:flex-row justify-between -mb-4 p-1">
        <div className="relative w-full mr-1">
          <Search className="absolute dark:text-white/50 left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by IP, path, user agent, or referer..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-1 gap-1">
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
            <SelectTrigger className="w-[130px] dark:bg-brand-darker dark:text-white">
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

      <div
        style={{
          height: "calc(100vh - 40vh)",
          maxHeight: "calc(100vh - 40vh)",
        }}
        className="px-1"
      >
        <CardContent className="p-0 h-full">
          <div className="rounded-md border dark:border-brand-dark h-full">
            <div className="relative w-full h-full overflow-auto">
              <Table className="h-full">
                <TableHeader>
                  <TableRow>
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
                      className="cursor-pointer"
                      onClick={() => requestSort("frequency")}
                    >
                      Frequency
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
                          <TableCell className="font-medium">
                            {indexOfFirstItem + index + 1}
                          </TableCell>
                          <TableCell>{log.ip}</TableCell>
                          <TableCell>{log.browser}</TableCell>
                          <TableCell width={200}>
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                log.method === "GET"
                                  ? "bg-green-100 dark:bg-green-400 text-green-800 border-green-200"
                                  : log.method === "POST"
                                    ? "bg-blue-100 dark:bg-blue-400 text-blue-800 border-blue-200"
                                    : log.method === "PUT"
                                      ? "bg-yellow-100 dark:bg-yellow-400 text-yellow-800 border-yellow-200"
                                      : "bg-red-100 dark:bg-red-400 text-red-800 border-red-200"
                              }
                            >
                              {log.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[480px] truncate">
                            {log.path}
                          </TableCell>
                          <TableCell className="max-w-[480px] truncate">
                            <Badge variant="outline">{log.file_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {formatResponseSize(log.response_size)}
                          </TableCell>
                          <TableCell className="text-center">
                            {log.frequency}
                          </TableCell>
                          <TableCell width={100} className="max-w-[100px]">
                            <Badge
                              variant="outline"
                              className={
                                log.crawler_type !== "Human"
                                  ? "bg-purple-50 text-purple-800 border-purple-200"
                                  : "bg-green-100 text-green-800 border-green-200"
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
                              className="bg-gray-50 dark:bg-gray-800 p-4"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* User Agent */}
                                <div className="flex flex-col max-w-[calc(100vw-62vw)]">
                                  <h4 className="mb-2 font-bold">User Agent</h4>
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
            <SelectTrigger className="w-[70px] text-xs h-6 mr-2 z-50">
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
          <span className="flex justify-end text-muted-foreground w-[180px] flex-nowrap text-right pr-2.5 -mt-1.5 text-xs text-black/50">
            {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredLogs.length)} of{" "}
            {filteredLogs.length} logs
          </span>
        </div>
      </div>
    </div>
  );
};

export { WidgetTable };

