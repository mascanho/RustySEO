// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Link as LinkIcon,
  User,
  LayoutGrid
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
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

interface AgregatedWidgetContentTableProps {
  type: "status" | "method" | "useragent" | "referer" | "browser" | "verified" | "ip";
  title: string;
  segment: string;
}

export const AgregatedWidgetContentTable: React.FC<AgregatedWidgetContentTableProps> = ({
  type,
  title,
  segment = "all",
}) => {
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "hit_count", direction: "descending" });

  const getCommandName = () => {
    switch (type) {
      case "status": return "get_active_path_status_aggregations";
      case "method": return "get_active_path_method_aggregations";
      case "useragent": return "get_active_path_user_agent_aggregations";
      case "referer": return "get_active_path_referer_aggregations";
      case "browser": return "get_active_path_browser_aggregations";
      case "verified": return "get_active_path_verified_aggregations";
      case "ip": return "get_active_path_ip_aggregations";
      case "path_analysis": return "get_active_path_aggregations";
      default: return "";
    }
  };

  const getFilterName = () => {
    switch (type) {
      case "status": return "status_filter";
      case "method": return "method_filter";
      case "useragent": return "user_agent_filter";
      case "referer": return "referer_filter";
      case "browser": return "browser_filter";
      case "verified": return "crawler_filter";
      case "ip": return "ip_filter";
      case "path_analysis": return "crawler_filter";
      default: return "";
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const command = getCommandName();
      const filterName = getFilterName();
      
      const params = {
        page,
        limit,
        sort_by: sortConfig.key,
        sort_order: sortConfig.direction,
        segment_filter: segment === "all" ? null : segment,
        [filterName]: searchTerm || null,
      };

      const result = await invoke(command, params);
      
      setData(result.data || []);
      setTotalCount(result.total_count || 0);
    } catch (error) {
      console.error(`Failed to fetch ${type} aggregations:`, error);
      toast.error(`Failed to load ${title}`);
    } finally {
      setLoading(false);
    }
  }, [type, page, limit, searchTerm, sortConfig, segment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "descending" ? "ascending" : "descending"
    }));
  };

  const getColumns = () => {
    const base = [
      { key: "path", label: "Path", icon: <LayoutGrid className="w-3 h-3" /> },
    ];
    
    let specific = [];
    switch (type) {
      case "status": specific = [{ key: "status", label: "Status", icon: <Hash className="w-3 h-3" /> }]; break;
      case "method": specific = [{ key: "method", label: "Method", icon: <Hash className="w-3 h-3" /> }]; break;
      case "useragent": specific = [{ key: "user_agent", label: "User Agent", icon: <User className="w-3 h-3" /> }]; break;
      case "referer": specific = [{ key: "referer", label: "Referer", icon: <LinkIcon className="w-3 h-3" /> }]; break;
      case "browser": specific = [{ key: "browser", label: "Browser", icon: <Monitor className="w-3 h-3" /> }]; break;
      case "verified": specific = [
        { key: "crawler_type", label: "Crawler", icon: <Globe className="w-3 h-3" /> },
        { key: "verified", label: "Verified", icon: <ShieldCheck className="w-3 h-3" /> }
      ]; break;
      case "ip": specific = [{ key: "ip", label: "IP Address", icon: <Globe className="w-3 h-3" /> }]; break;
      case "path_analysis": specific = [{ key: "crawler_type", label: "Crawler", icon: <Globe className="w-3 h-3" /> }]; break;
    }

    return [...base, ...specific, { key: "hit_count", label: "Hits", icon: <Hash className="w-3 h-3" /> }];
  };

  const renderValue = (item: any, key: string) => {
    const val = item[key];
    if (key === "verified") {
      return val ? (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
          <ShieldCheck className="w-3 h-3" /> Verified
        </Badge>
      ) : (
        <Badge variant="outline" className="text-rose-500 border-rose-500/20 gap-1">
          <ShieldAlert className="w-3 h-3" /> Unverified
        </Badge>
      );
    }
    if (key === "status") {
      const color = val >= 200 && val < 300 ? "text-emerald-500" : val >= 300 && val < 400 ? "text-amber-500" : "text-rose-500";
      return <span className={`font-mono font-bold ${color}`}>{val}</span>;
    }
    if (key === "hit_count") {
      return <span className="font-bold text-brand-bright">{val.toLocaleString()}</span>;
    }
    if (key === "path") {
        return <span className="font-mono text-[10px] opacity-70 truncate max-w-[300px] block" title={val}>{val}</span>;
    }
    return <span className="truncate max-w-[200px] block" title={val}>{val || "-"}</span>;
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="flex flex-col h-[700px] bg-white dark:bg-slate-950 rounded-lg overflow-hidden">
      <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            {title}
            <Badge variant="secondary" className="ml-2 font-mono">
              {totalCount.toLocaleString()} Total
            </Badge>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Trend analysis for site segment: <span className="font-bold text-brand-bright uppercase">{segment}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder={`Filter ${type}...`}
              className="pl-8 w-64 h-9 bg-white dark:bg-slate-800"
              value={searchTerm}
              onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
              }}
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-bright" />
            <p className="text-sm text-slate-500">Loading aggregated data...</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10">
              <TableRow>
                {getColumns().map((col) => (
                  <TableHead 
                    key={col.key}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-2">
                      {col.icon}
                      <span className="text-[10px] uppercase tracking-wider font-bold">{col.label}</span>
                      {sortConfig.key === col.key && (
                        <span className="text-[10px] text-brand-bright">
                          {sortConfig.direction === "ascending" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    {getColumns().map((col) => (
                      <TableCell key={col.key}>
                        {renderValue(item, col.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={getColumns().length} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <LayoutGrid className="w-8 h-8 opacity-20" />
                      <p>No aggregation data found for this filter.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="p-4 border-t dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900 dark:text-slate-100">{((page - 1) * limit) + 1}</span> to <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(page * limit, totalCount)}</span> of <span className="font-bold text-slate-900 dark:text-slate-100">{totalCount.toLocaleString()}</span> entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-xs font-medium">
            Page {page} of {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
