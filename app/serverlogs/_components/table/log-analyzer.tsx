"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { ChevronDown, Download, Filter, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Mock data for demonstration
const mockLogs = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  ip: `${Math.floor(Math.random() * 255)}.${Math.floor(
    Math.random() * 255,
  )}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  userAgent: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  ][Math.floor(Math.random() * 5)],
  timestamp: new Date(
    Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
  ).toISOString(),
  method: ["GET", "POST", "PUT", "DELETE"][Math.floor(Math.random() * 4)],
  path: [
    "/",
    "/about",
    "/contact",
    "/api/users",
    "/products",
    "/login",
    "/dashboard",
    "/images/logo.png",
    "/css/style.css",
    "/js/main.js",
  ][Math.floor(Math.random() * 10)],
  statusCode: [200, 201, 204, 400, 401, 403, 404, 500][
    Math.floor(Math.random() * 8)
  ],
  responseSize: Math.floor(Math.random() * 10000),
  referer: [
    "-",
    "https://www.google.com",
    "https://www.bing.com",
    "https://www.example.com",
  ][Math.floor(Math.random() * 4)],
  responseTime: Math.floor(Math.random() * 1000),
}));

// Helper function to determine if a user agent is likely a bot
const isBot = (userAgent: string) => {
  const botPatterns = [
    "bot",
    "crawler",
    "spider",
    "slurp",
    "baiduspider",
    "yandex",
    "googlebot",
    "bingbot",
    "rogerbot",
  ];
  const lowerCaseUA = userAgent.toLowerCase();
  return botPatterns.some((pattern) => lowerCaseUA.includes(pattern));
};

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

export function LogAnalyzer() {
  const [logs, setLogs] = useState(mockLogs);
  const [filteredLogs, setFilteredLogs] = useState(mockLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<number[]>([]);
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [botFilter, setBotFilter] = useState<string | null>("all");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);

  // Apply filters and search
  useEffect(() => {
    let result = [...logs];

    // Apply search
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          log.ip.toLowerCase().includes(lowerCaseSearch) ||
          log.path.toLowerCase().includes(lowerCaseSearch) ||
          log.userAgent.toLowerCase().includes(lowerCaseSearch),
      );
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      result = result.filter((log) => statusFilter.includes(log.statusCode));
    }

    // Apply method filter
    if (methodFilter.length > 0) {
      result = result.filter((log) => methodFilter.includes(log.method));
    }

    // Apply bot filter
    if (botFilter !== null) {
      if (botFilter === "bot") {
        result = result.filter((log) => isBot(log.userAgent));
      } else if (botFilter === "human") {
        result = result.filter((log) => !isBot(log.userAgent));
      }
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredLogs(result);
    setCurrentPage(1);
  }, [logs, searchTerm, statusFilter, methodFilter, botFilter, sortConfig]);

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
    setStatusFilter([]);
    setMethodFilter([]);
    setBotFilter("all");
    setSortConfig(null);
  };

  // Export logs as CSV
  const exportCSV = () => {
    const headers = [
      "ID",
      "IP",
      "User Agent",
      "Timestamp",
      "Method",
      "Path",
      "Status Code",
      "Response Size",
      "Referer",
      "Response Time",
      "Bot/Human",
    ];

    const csvData = filteredLogs.map((log) => [
      log.id,
      log.ip,
      `"${log.userAgent.replace(/"/g, '""')}"`,
      log.timestamp,
      log.method,
      log.path,
      log.statusCode,
      log.responseSize,
      log.referer,
      log.responseTime,
      isBot(log.userAgent) ? "Bot" : "Human",
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
      `apache_logs_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get status code badge color
  const getStatusCodeColor = (code: number) => {
    if (code >= 200 && code < 300) return "bg-green-500";
    if (code >= 300 && code < 400) return "bg-blue-500";
    if (code >= 400 && code < 500) return "bg-yellow-500";
    if (code >= 500) return "bg-red-500";
    return "bg-gray-500";
  };

  return (
    <div className="space-y-4 h-full">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by IP, path, or user agent..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status Code Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                Status
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[200, 201, 204, 400, 401, 403, 404, 500].map((code) => (
                <DropdownMenuCheckboxItem
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
                    className={`mr-2 ${getStatusCodeColor(code)} text-white`}
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
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                Method
                {methodFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {methodFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Method</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["GET", "POST", "PUT", "DELETE"].map((method) => (
                <DropdownMenuCheckboxItem
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
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Bot/Human" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="bot">Bots</SelectItem>
              <SelectItem value="human">Humans</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>

          <Button variant="outline" onClick={exportCSV} className="flex gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="h-full">
        <CardContent className="p-0 h-full">
          <div className="rounded-md border h-full">
            <div className="relative w-full h-full overflow-auto">
              <Table className="h-full">
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="w-[80px] cursor-pointer"
                      onClick={() => requestSort("id")}
                    >
                      ID
                      {sortConfig?.key === "id" && (
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
                      onClick={() => requestSort("statusCode")}
                    >
                      Status
                      {sortConfig?.key === "statusCode" && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 inline-block ${
                            sortConfig.direction === "descending"
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      )}
                    </TableHead>
                    <TableHead>Bot/Human</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => requestSort("responseTime")}
                    >
                      Response Time
                      {sortConfig?.key === "responseTime" && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 inline-block ${
                            sortConfig.direction === "descending"
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      )}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log) => (
                      <TableRow key={log.id} className="group">
                        <TableCell className="font-medium">{log.id}</TableCell>
                        <TableCell>{log.ip}</TableCell>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              log.method === "GET"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : log.method === "POST"
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : log.method === "PUT"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {log.method}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.path}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusCodeColor(log.statusCode)} text-white`}
                          >
                            {log.statusCode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              isBot(log.userAgent)
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }
                          >
                            {isBot(log.userAgent) ? "Bot" : "Human"}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.responseTime} ms</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredLogs.length)} of{" "}
            {filteredLogs.length} entries
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => setItemsPerPage(Number(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;

              // Adjust page numbers for pagination with ellipsis
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
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
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

      {/* Log Details Modal would go here */}
    </div>
  );
}
