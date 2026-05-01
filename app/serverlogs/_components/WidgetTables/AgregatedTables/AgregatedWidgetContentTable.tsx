// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Download,
  Loader2,
  ChevronDown,
  Monitor,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Link as LinkIcon,
  User,
  LayoutGrid,
  RefreshCw,
  FileCode,
  Bot,
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
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent } from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { handleCopyClick, handleURLClick } from "../helpers/useCopyOpen";
import { save, message } from "@tauri-apps/plugin-dialog";

interface AgregatedWidgetContentTableProps {
  type:
    | "status"
    | "method"
    | "useragent"
    | "referer"
    | "browser"
    | "verified"
    | "ip"
    | "path_analysis"
    | "human";
  title: string;
  segment: string;
}

const getStatusCodeInfo = (statusCode: number) => {
  if (statusCode >= 200 && statusCode < 300) {
    return {
      textColor: "text-green-800 dark:text-green-200",
      bgColor: "bg-green-100 dark:bg-green-900",
    };
  } else if (statusCode >= 300 && statusCode < 400) {
    return {
      textColor: "text-yellow-800 dark:text-yellow-200",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
    };
  } else if (statusCode >= 400 && statusCode < 500) {
    return {
      textColor: "text-orange-800 dark:text-orange-200",
      bgColor: "bg-orange-100 dark:bg-orange-900",
    };
  } else if (statusCode >= 500 && statusCode < 600) {
    return {
      textColor: "text-red-800 dark:text-red-200",
      bgColor: "bg-red-100 dark:bg-red-900",
    };
  }
  return {
    textColor: "text-gray-800 dark:text-gray-200",
    bgColor: "bg-gray-100 dark:bg-gray-900",
  };
};

const getBrowserInfo = (browser: string) => {
  const b = browser.toLowerCase();
  if (b.includes("chrome"))
    return {
      textColor: "text-blue-800 dark:text-blue-200",
      bgColor: "bg-blue-100 dark:bg-blue-900 border-blue-200",
    };
  if (b.includes("firefox"))
    return {
      textColor: "text-orange-800 dark:text-orange-200",
      bgColor: "bg-orange-100 dark:bg-orange-900 border-orange-200",
    };
  if (b.includes("safari"))
    return {
      textColor: "text-sky-800 dark:text-sky-200",
      bgColor: "bg-sky-100 dark:bg-sky-900 border-sky-200",
    };
  if (b.includes("edge"))
    return {
      textColor: "text-teal-800 dark:text-teal-200",
      bgColor: "bg-teal-100 dark:bg-teal-900 border-teal-200",
    };
  if (b.includes("opera"))
    return {
      textColor: "text-red-800 dark:text-red-200",
      bgColor: "bg-red-100 dark:bg-red-900 border-red-200",
    };
  return {
    textColor: "text-slate-800 dark:text-slate-200",
    bgColor: "bg-slate-100 dark:bg-slate-900 border-slate-200",
  };
};

const getMethodInfo = (method: string) => {
  const m = method.toUpperCase();
  if (m === "GET")
    return {
      textColor: "text-green-800 dark:text-green-200",
      bgColor: "bg-green-100 dark:bg-green-900 border-green-200",
    };
  if (m === "POST")
    return {
      textColor: "text-blue-800 dark:text-blue-200",
      bgColor: "bg-blue-100 dark:bg-blue-900 border-blue-200",
    };
  if (m === "PUT")
    return {
      textColor: "text-yellow-800 dark:text-yellow-200",
      bgColor: "bg-yellow-100 dark:bg-yellow-900 border-yellow-200",
    };
  if (m === "DELETE")
    return {
      textColor: "text-red-800 dark:text-red-200",
      bgColor: "bg-red-100 dark:bg-red-900 border-red-200",
    };
  if (m === "HEAD")
    return {
      textColor: "text-purple-800 dark:text-purple-200",
      bgColor: "bg-purple-100 dark:bg-purple-900 border-purple-200",
    };
  return {
    textColor: "text-slate-800 dark:text-slate-200",
    bgColor: "bg-slate-100 dark:bg-slate-900 border-slate-200",
  };
};

export const AgregatedWidgetContentTable: React.FC<
  AgregatedWidgetContentTableProps
> = ({ type, title, segment = "all" }) => {
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "hit_count",
    direction: "descending",
  });

  const getCommandName = () => {
    switch (type) {
      case "status":
        return "get_active_path_status_aggregations";
      case "method":
        return "get_active_path_method_aggregations";
      case "useragent":
        return "get_active_path_user_agent_aggregations";
      case "referer":
        return "get_active_path_referer_aggregations";
      case "browser":
        return "get_active_path_browser_aggregations";
      case "verified":
        return "get_active_path_verified_aggregations";
      case "ip":
        return "get_active_path_ip_aggregations";
      case "path_analysis":
      case "human":
        return "get_active_path_aggregations";
      default:
        return "";
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const command = getCommandName();

      const params: any = {
        page,
        limit: itemsPerPage,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        segmentFilter: segment === "all" ? null : segment,
        searchQuery: searchTerm || null,
      };

      if (type === "human") {
        params.crawlerFilter = "Human";
      }

      const result = await invoke(command, params);
      setData(result.data || []);
      setTotalCount(result.total_count || 0);

      // Fetch summary for the total hits badge
      const summary = await invoke("get_trend_totals_summary");
      let hits = 0;
      switch (type) {
        case "status":
          hits = summary.status_hits;
          break;
        case "method":
          hits = summary.method_hits;
          break;
        case "useragent":
          hits = summary.user_agent_hits;
          break;
        case "referer":
          hits = summary.referer_hits;
          break;
        case "browser":
          hits = summary.browser_hits;
          break;
        case "verified":
          hits = summary.verified_hits;
          break;
        case "ip":
          hits = summary.ip_hits;
          break;
        case "path_analysis":
          hits = summary.path_hits;
          break;
        case "human":
          hits = summary.human_hits;
          break;
      }
      setTotalHits(hits || 0);
    } catch (error) {
      console.error(`Failed to fetch ${type} aggregations:`, error);
      toast.error(`Failed to load ${title}`);
    } finally {
      setLoading(false);
    }
  }, [type, page, itemsPerPage, searchTerm, sortConfig, segment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportCSV = async () => {
    try {
      const filePath = await save({
        filters: [
          {
            name: "CSV",
            extensions: ["csv"],
          },
        ],
        defaultPath: `${title.toLowerCase().replace(/\s+/g, "_")}_aggregations.csv`,
      });

      if (!filePath) return;

      setLoading(true);
      const totalExported = await invoke("export_aggregated_logs_csv", {
        filePath,
        aggType: type,
        segmentFilter: segment === "all" ? null : segment,
        searchQuery: searchTerm || null,
      });

      await message(`Successfully exported ${totalExported} rows to CSV.`, {
        title: "Export Complete",
        kind: "info",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "descending"
          ? "ascending"
          : "descending",
    }));
    setPage(1);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setPage(1);
    setSortConfig({ key: "hit_count", direction: "descending" });
  };

  const getColumns = () => {
    const base = [
      { key: "path", label: "Path", icon: <LayoutGrid className="w-3 h-3" /> },
    ];

    let specific = [];
    switch (type) {
      case "status":
        specific = [
          {
            key: "status",
            label: "Status Code",
            icon: <Hash className="w-3 h-3" />,
          },
        ];
        break;
      case "method":
        specific = [
          {
            key: "method",
            label: "Method",
            icon: <Hash className="w-3 h-3" />,
          },
        ];
        break;
      case "useragent":
        specific = [
          {
            key: "user_agent",
            label: "User Agent",
            icon: <User className="w-3 h-3" />,
          },
        ];
        break;
      case "referer":
        specific = [
          {
            key: "referer",
            label: "Referer",
            icon: <LinkIcon className="w-3 h-3" />,
          },
        ];
        break;
      case "browser":
        specific = [
          {
            key: "browser",
            label: "Browser",
            icon: <Monitor className="w-3 h-3" />,
          },
        ];
        break;
      case "verified":
        specific = [
          {
            key: "crawler_type",
            label: "Crawler",
            icon: <Bot className="w-3 h-3" />,
          },
          {
            key: "verified",
            label: "Verified",
            icon: <ShieldCheck className="w-3 h-3" />,
          },
        ];
        break;
      case "ip":
        specific = [
          {
            key: "ip",
            label: "IP Address",
            icon: <Globe className="w-3 h-3" />,
          },
        ];
        break;
      case "path_analysis":
      case "human":
        specific = [
          {
            key: "crawler_type",
            label: "Crawler",
            icon: <Bot className="w-3 h-3" />,
          },
        ];
        break;
    }

    return [
      ...base,
      ...specific,
      { key: "segment", label: "Segment", icon: <Hash className="w-3 h-3" /> },
      { key: "hit_count", label: "Hits", icon: <Hash className="w-3 h-3" /> },
    ];
  };

  const renderValue = (item: any, key: string) => {
    const val = item[key];
    if (key === "verified") {
      return val ? (
        <Badge className="bg-blue-600 text-white border-blue-200 gap-1 text-[10px]">
          <ShieldCheck className="w-3 h-3" /> VERIFIED
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="bg-red-600 text-white dark:bg-red-400 border-purple-200 gap-1 text-[10px]"
        >
          <ShieldAlert className="w-3 h-3" /> UNVERIFIED
        </Badge>
      );
    }
    if (key === "status") {
      const info = getStatusCodeInfo(val);
      return (
        <Badge
          variant="outline"
          className={`${info.bgColor} ${info.textColor} font-mono text-[10px]`}
        >
          {val}
        </Badge>
      );
    }
    if (key === "browser") {
      const info = getBrowserInfo(val);
      return (
        <Badge
          variant="outline"
          className={`${info.bgColor} ${info.textColor} text-[10px] uppercase font-bold flex items-center gap-1`}
        >
          <Monitor className="w-3 h-3" /> {val}
        </Badge>
      );
    }
    if (key === "method") {
      const info = getMethodInfo(val);
      return (
        <Badge
          variant="outline"
          className={`${info.bgColor} ${info.textColor} text-[10px] uppercase font-bold font-mono`}
        >
          {val}
        </Badge>
      );
    }
    if (key === "hit_count") {
      return (
        <span className="font-bold text-brand-bright">
          {val.toLocaleString()}
        </span>
      );
    }
    if (key === "path") {
      return (
        <div className="flex items-center gap-2 ml-3">
          <span
            onClick={(e) => handleCopyClick(val, e, "URL / PATH")}
            className="cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0"
          >
            <FileCode className="text-blue-500 w-3 h-3" />
          </span>
          <span
            className="font-mono text-xs break-all cursor-pointer hover:underline dark:text-white/80"
            title={val}
            onClick={(e) => handleURLClick(val, e)}
          >
            {val}
          </span>
        </div>
      );
    }
    if (key === "crawler_type") {
      const displayVal = val || (type === "human" ? "Human" : val);
      return (
        <Badge
          variant="outline"
          className={
            displayVal !== "Human"
              ? "px-2 py-0.5 text-[10px] bg-red-600 text-white dark:bg-red-400 border-red-200"
              : "px-2 py-0.5 text-[11px] bg-blue-600 text-white border-blue-200"
          }
        >
          {displayVal}
        </Badge>
      );
    }
    if (key === "segment") {
      return (
        <Badge
          variant="outline"
          className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-brand-dark border-brand-dark dark:text-white/70"
        >
          {val || "All"}
        </Badge>
      );
    }
    return (
      <span
        className="truncate max-w-[250px] block dark:text-white/70 text-xs"
        title={val}
      >
        {val || "-"}
      </span>
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-4">
      {/* HEADER SECTION - IDENTICAL TO WIDGETCONTENTTABLE */}
      <div className="bg-slate-50/50 dark:bg-brand-dark/20 p-4 rounded-lg border border-slate-100 dark:border-brand-dark">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
              <LayoutGrid className="w-4 h-4 text-brand-bright" />
              {title} Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/50">
              Detailed analysis of aggregated logs for {title.toLowerCase()}{" "}
              across all segments.
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
          >
            {totalCount.toLocaleString()} unique items (
            {totalHits.toLocaleString()} total hits)
          </Badge>
        </div>
      </div>

      {/* TOOLBAR - IDENTICAL TO WIDGETCONTENTTABLE */}
      <div className="flex flex-col md:flex-row justify-between -mb-4 p-1">
        <div className="relative w-full mr-1">
          <Search className="absolute dark:text-white/50 left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={`Search by path or ${type}...`}
            className="pl-8 w-full dark:text-white dark:bg-brand-darker dark:border-brand-dark"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-1 gap-1">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex gap-2 dark:bg-brand-darker dark:border-brand-dark dark:text-white w-full"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={loading}
            className="flex gap-2 dark:bg-brand-darker dark:border-brand-dark dark:text-white w-full"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* TABLE CONTAINER - IDENTICAL TO WIDGETCONTENTTABLE */}
      <div
        style={{
          height: "calc(100vh - 40vh)",
          maxHeight: "calc(100vh - 40vh)",
          overflowX: "hidden",
        }}
        className="px-1"
      >
        <CardContent className="p-0 h-full overflow-hidden">
          <div className="rounded-md border dark:border-brand-dark h-full overflow-hidden flex flex-col">
            <div className="relative w-full h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-brand-darker z-20">
                  <TableRow className="hover:bg-transparent border-b dark:border-brand-dark">
                    {getColumns().map((col) => (
                      <TableHead
                        key={col.key}
                        className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-brand-dark transition-colors h-10 ${
                          col.key !== "path" ? "text-center" : ""
                        }`}
                        onClick={() => handleSort(col.key)}
                      >
                        <div
                          className={`flex items-center gap-2 mt-2 ${
                            col.key !== "path" ? "justify-center" : ""
                          }`}
                        >
                          {col.icon}
                          <span className="text-[10px] uppercase tracking-wider font-bold dark:text-white/70">
                            {col.label}
                          </span>
                          {sortConfig.key === col.key && (
                            <ChevronDown
                              className={`h-4 w-4 text-brand-bright transition-transform ${
                                sortConfig.direction === "descending"
                                  ? ""
                                  : "rotate-180"
                              }`}
                            />
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={getColumns().length} className="h-64">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-brand-bright" />
                          <p className="text-sm text-slate-500 dark:text-white/50">
                            Loading data...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : data.length > 0 ? (
                    data.map((item, idx) => (
                      <TableRow
                        key={idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-brand-dark/50 border-b dark:border-brand-dark/50 transition-colors"
                      >
                        {getColumns().map((col) => (
                          <TableCell
                            key={col.key}
                            className={`py-2 ${col.key !== "path" ? "text-center" : ""}`}
                          >
                            <div
                              className={`flex items-center ${col.key !== "path" ? "justify-center" : ""}`}
                            >
                              {renderValue(item, col.key)}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={getColumns().length}
                        className="h-64 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                          <LayoutGrid className="w-8 h-8 opacity-20" />
                          <p className="dark:text-white/50 text-xs">
                            No entries found.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </div>

      {/* FOOTER / PAGINATION */}
      <div
        className="flex items-center justify-between w-full px-1"
        style={{ marginTop: "0.2em" }}
      >
        <div className="flex items-center -mt-2 ml-1 gap-4">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[70px] text-xs dark:text-white/50 h-6 mr-2 z-50 dark:bg-brand-darker dark:border-brand-dark">
              <SelectValue placeholder="100" />
            </SelectTrigger>
            <SelectContent className="z-[9999999999] dark:bg-brand-darker dark:border-brand-dark">
              <SelectItem
                className="dark:hover:bg-brand-bright dark:hover:text-white hover:bg-brand-bright hover:text-white"
                value="50"
              >
                50
              </SelectItem>
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
          <div className="text-xs text-slate-500 dark:text-white/50">
            Showing{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {(page - 1) * itemsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {Math.min(page * itemsPerPage, totalCount)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {totalCount.toLocaleString()}
            </span>{" "}
            entries
          </div>
        </div>

        <Pagination className="text-xs w-auto mx-0 pt-2">
          <PaginationContent>
            <PaginationItem className="cursor-pointer">
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`text-xs h-8 ${page === 1 ? "pointer-events-none opacity-50" : "dark:text-white"}`}
              />
            </PaginationItem>

            <div className="flex items-center gap-1 mx-2">
              <span className="text-xs dark:text-white/50">Page</span>
              <Badge
                variant="outline"
                className="h-6 min-w-[24px] flex justify-center dark:border-brand-dark dark:text-white font-mono"
              >
                {page}
              </Badge>
              <span className="text-xs dark:text-white/50">
                of {totalPages || 1}
              </span>
            </div>

            <PaginationItem className="cursor-pointer">
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`text-xs h-8 ${page === totalPages || totalPages === 0 ? "pointer-events-none opacity-50" : "dark:text-white"}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
