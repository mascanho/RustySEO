// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Activity,
  Plus,
  RefreshCw,
  Play,
  Pause,
  ScrollText,
  Info,
  Shield,
  Lock,
  Server,
  FileText,
  Cloud,
  Database,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  AlertCircle,
  Zap,
  Clock,
  Trash2,
  Globe,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useVisibilityStore } from "@/store/VisibilityStore";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import useLoaderStore from "@/store/loadersStore";

interface UrlStatus {
  url: string;
  status: "online" | "offline" | "checking" | "unknown";
  statusCode?: number;
  responseTime?: number;
  lastChecked?: Date;
  headers?: Record<string, string>;
  securityHeaders?: Record<string, string | null>;
  contentType?: string;
  server?: string;
  isSecure?: boolean;
  isRedirect?: boolean;
  redirectLocation?: string;
  rawHeaders?: [string, string][]; // Add raw headers array
}

interface LogEntry {
  timestamp: Date;
  url: string;
  status: "online" | "offline";
  statusCode?: number;
  responseTime?: number;
  message: string;
}

// Updated interface for Tauri backend response with headers
interface TauriUrlCheckResult {
  url: string;
  status?: number;
  error?: string;
  timestamp: number;
  response_time_ms?: number;
  headers?: [string, string][]; // Array of [key, value] pairs
}

export function UrlStatusChecker() {
  const [urls, setUrls] = useState<UrlStatus[]>([
    { url: "https://vercel.com", status: "unknown" },
  ]);
  const [newUrl, setNewUrl] = useState("");
  const [pollingInterval, setPollingInterval] = useState(30);
  const [stopOnError, setStopOnError] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedUrlIndex, setSelectedUrlIndex] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    security: true,
    caching: true,
    content: true,
    server: true,
    other: true,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { hideUrlChecker, visibility } = useVisibilityStore();

  // Get store state and actions
  const { loaders } = useLoaderStore();

  // Initialize isPolling from store
  const [isPolling, setIsPolling] = useState(false);

  // Sync with store when component mounts
  useEffect(() => {
    const wasActive = loaders.httpChecker;
    if (wasActive !== isPolling) {
      setIsPolling(wasActive);
    }
  }, []);

  // Update store when isPolling changes
  useEffect(() => {
    if (loaders.httpChecker !== isPolling) {
      if (isPolling) {
        useLoaderStore.getState().showLoader("httpChecker");
      } else {
        useLoaderStore.getState().hideLoader("httpChecker");
      }
    }
  }, [isPolling, loaders.httpChecker]);

  const addLog = (entry: Omit<LogEntry, "timestamp">) => {
    setLogs((prev) =>
      [{ ...entry, timestamp: new Date() }, ...prev].slice(0, 100),
    ); // Keep last 100 entries
  };

  // Helper to convert array headers to object
  const headersArrayToObject = (
    headersArray: [string, string][] = [],
  ): Record<string, string> => {
    const headersObj: Record<string, string> = {};
    headersArray.forEach(([key, value]) => {
      headersObj[key] = value;
    });
    return headersObj;
  };

  // Check URLs using Tauri backend
  const checkAllUrls = async () => {
    // Set all URLs to checking state
    setUrls((prev) => prev.map((u) => ({ ...u, status: "checking" })));

    try {
      const results = await invoke<TauriUrlCheckResult[]>("check_url", {
        urls: urls.map((u) => u.url),
        interval: 1,
      });

      console.log(results, "Results From HTTP");

      // Update URLs with new results
      const updatedUrls = urls.map((urlStatus) => {
        const result = results.find((r) => r.url === urlStatus.url);
        if (!result) return urlStatus;

        const newStatus = result.status ? "online" : "offline";
        const newStatusCode = result.status;

        // Convert headers array to object
        const headers = result.headers
          ? headersArrayToObject(result.headers)
          : undefined;

        // Add log entry
        addLog({
          url: result.url,
          status: newStatus,
          statusCode: newStatusCode,
          responseTime: result.response_time_ms,
          message: newStatusCode
            ? `${newStatusCode} • ${result.response_time_ms}ms`
            : `Failed: ${result.error || "Unknown error"}`,
        });

        return {
          ...urlStatus,
          status: newStatus,
          statusCode: newStatusCode,
          responseTime: result.response_time_ms,
          lastChecked: new Date(result.timestamp),
          headers,
          rawHeaders: result.headers, // Keep raw headers array
          // Extract some common headers for easy access
          contentType: headers?.["content-type"] || headers?.["Content-Type"],
          server: headers?.["server"] || headers?.["Server"],
          isSecure: urlStatus.url.startsWith("https://"),
          securityHeaders: extractSecurityHeaders(headers),
        };
      });

      setUrls(updatedUrls);

      // Check if we should stop polling on error
      if (stopOnError && results.some((r) => !r.status)) {
        console.log("Stopping polling due to error");
        setIsPolling(false);
      }

      return updatedUrls;
    } catch (error) {
      console.error("Failed to check URLs:", error);
      addLog({
        url: "System",
        status: "offline",
        message: `Error checking URLs: ${error}`,
      });

      // Reset to unknown status on error
      setUrls((prev) => prev.map((u) => ({ ...u, status: "unknown" })));
      return urls;
    }
  };

  // Check single URL
  const handleCheckSingle = async (index: number) => {
    const url = urls[index].url;
    setUrls((prev) =>
      prev.map((u, i) => (i === index ? { ...u, status: "checking" } : u)),
    );

    try {
      const results = await invoke<TauriUrlCheckResult[]>("check_url", {
        urls: [url],
        interval: 0,
      });

      const result = results[0];
      if (result) {
        const newStatus = result.status ? "online" : "offline";

        // Convert headers array to object
        const headers = result.headers
          ? headersArrayToObject(result.headers)
          : undefined;

        addLog({
          url: result.url,
          status: newStatus,
          statusCode: result.status,
          responseTime: result.response_time_ms,
          message: result.status
            ? `${result.status} • ${result.response_time_ms}ms`
            : `Failed: ${result.error || "Unknown error"}`,
        });

        setUrls((prev) =>
          prev.map((u, i) =>
            i === index
              ? {
                  ...u,
                  status: newStatus,
                  statusCode: result.status,
                  responseTime: result.response_time_ms,
                  lastChecked: new Date(result.timestamp),
                  headers,
                  rawHeaders: result.headers,
                  contentType:
                    headers?.["content-type"] || headers?.["Content-Type"],
                  server: headers?.["server"] || headers?.["Server"],
                  isSecure: url.startsWith("https://"),
                  securityHeaders: extractSecurityHeaders(headers),
                }
              : u,
          ),
        );

        setSelectedUrlIndex(index);
        setExpandedCategories({
          security: true,
          caching: true,
          content: true,
          server: true,
          other: true,
        });
      }
    } catch (error) {
      console.error("Failed to check URL:", error);
      addLog({
        url,
        status: "offline",
        message: `Error: ${error}`,
      });
      setUrls((prev) =>
        prev.map((u, i) => (i === index ? { ...u, status: "offline" } : u)),
      );
    }
  };

  // Toggle polling
  const togglePolling = () => {
    const newPollingState = !isPolling;
    setIsPolling(newPollingState);

    if (!newPollingState) {
      // Stop polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      console.log("Polling stopped");
    } else {
      // Start polling
      console.log("Polling started");
    }
  };

  // Manual check all
  const handleCheckAll = async () => {
    await checkAllUrls();
  };

  // Add new URL
  const addUrl = () => {
    if (newUrl.trim() && !urls.find((u) => u.url === newUrl)) {
      setUrls([...urls, { url: newUrl.trim(), status: "unknown" }]);
      setNewUrl("");
    }
  };

  // Remove URL
  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
    if (selectedUrlIndex === index) {
      setSelectedUrlIndex(null);
    }
  };

  // Polling effect
  useEffect(() => {
    if (isPolling) {
      console.log("Setting up polling interval:", pollingInterval);

      // Check immediately
      checkAllUrls();

      // Then set up interval
      intervalRef.current = setInterval(() => {
        checkAllUrls();
      }, pollingInterval * 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Clear interval if polling is stopped
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isPolling, pollingInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Helper functions
  const getStatusColor = (status: UrlStatus["status"]) => {
    switch (status) {
      case "online":
        return "bg-success";
      case "offline":
        return "bg-destructive";
      case "checking":
        return "bg-warning";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusText = (status: UrlStatus) => {
    switch (status.status) {
      case "online":
        return `${status.statusCode} • ${status.responseTime}ms`;
      case "offline":
        return "Offline";
      case "checking":
        return "Checking...";
      default:
        return "Not checked";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const extractSecurityHeaders = (headers?: Record<string, string>) => {
    if (!headers) return {};

    const securityHeaders: Record<string, string | null> = {};
    const securityHeaderKeys = [
      "strict-transport-security",
      "content-security-policy",
      "x-content-type-options",
      "x-frame-options",
      "x-xss-protection",
      "permissions-policy",
      "referrer-policy",
      "access-control-allow-origin",
      "cross-origin-opener-policy",
      "cross-origin-resource-policy",
      "cross-origin-embedder-policy",
      "feature-policy",
    ];

    Object.keys(headers).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (securityHeaderKeys.includes(lowerKey)) {
        securityHeaders[key] = headers[key];
      }
    });

    // Check for missing security headers
    securityHeaderKeys.forEach((header) => {
      if (!securityHeaders[header]) {
        securityHeaders[header] = null;
      }
    });

    return securityHeaders;
  };

  const countSecurityHeaders = (urlStatus: UrlStatus) => {
    if (!urlStatus.securityHeaders) return 0;
    return Object.values(urlStatus.securityHeaders).filter((v) => v !== null)
      .length;
  };

  const categorizeHeaders = (headers: Record<string, string>) => {
    const security = [
      "strict-transport-security",
      "content-security-policy",
      "x-content-type-options",
      "x-frame-options",
      "x-xss-protection",
      "permissions-policy",
      "referrer-policy",
      "access-control-allow-origin",
      "cross-origin-opener-policy",
      "cross-origin-resource-policy",
      "cross-origin-embedder-policy",
      "feature-policy",
    ];
    const caching = [
      "cache-control",
      "etag",
      "expires",
      "last-modified",
      "age",
      "pragma",
      "vary",
    ];
    const content = [
      "content-type",
      "content-length",
      "content-encoding",
      "content-language",
      "content-disposition",
      "content-range",
      "transfer-encoding",
      "accept-ranges",
    ];

    const categorized = {
      security: {} as Record<string, string>,
      caching: {} as Record<string, string>,
      content: {} as Record<string, string>,
      server: {} as Record<string, string>,
      other: {} as Record<string, string>,
    };

    Object.entries(headers).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (security.includes(lowerKey)) {
        categorized.security[key] = value;
      } else if (caching.includes(lowerKey)) {
        categorized.caching[key] = value;
      } else if (content.includes(lowerKey)) {
        categorized.content[key] = value;
      } else if (
        lowerKey.includes("server") ||
        lowerKey.includes("powered") ||
        lowerKey.includes("via") ||
        lowerKey.includes("x-powered-by") ||
        lowerKey.includes("x-vercel-id") ||
        lowerKey.includes("x-nextjs")
      ) {
        categorized.server[key] = value;
      } else {
        categorized.other[key] = value;
      }
    });

    return categorized;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const selectedUrl = selectedUrlIndex !== null ? urls[selectedUrlIndex] : null;
  const categorizedHeaders = selectedUrl?.headers
    ? categorizeHeaders(selectedUrl.headers)
    : null;
  const securityHeadersCount = selectedUrl
    ? countSecurityHeaders(selectedUrl)
    : 0;
  const totalHeadersCount = selectedUrl?.headers
    ? Object.keys(selectedUrl.headers).length
    : 0;

  return (
    <section className={`${visibility.urlchecker ? "block" : "hidden"}`}>
      {/* Overlay background */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/60 z-40 backdrop-blur-[2px] transition-all duration-300"
        onClick={handleHideHttpChecker}
      />
      <Card className="max-w-full bg-white dark:bg-brand-darker w-[750px] border-border fixed bottom-9 left-2 z-50 h-[calc(100vh-120px)] max-h-[900px] flex flex-col shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-left-4 fade-in duration-300">
        {/* Header */}
        <div className="p-4 border-b dark:border-white/20 border-border/50 flex items-center justify-between flex-shrink-0 bg-secondary/5 dark:bg-card">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                HTTP Status Monitor
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Real-time connectivity
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLogs(!showLogs)}
              className={`h-8 w-8 transition-colors ${showLogs ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              title="Toggle logs"
            >
              <ScrollText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleHideHttpChecker}
              className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Scrollable Content Wrapper */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background dark:bg-brand-darker">
          {/* Response Details Panel - Slim version */}
          {selectedUrl &&
            selectedUrl.status !== "unknown" &&
            selectedUrl.headers && (
              <div className="flex-shrink-0 p-4 dark:border-white/10 border-b border-border/50 bg-primary/5 dark:bg-primary/10 animate-in slide-in-from-top-2 duration-200 overflow-y-auto max-h-[45%]">
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      {selectedUrl.url}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground bg-secondary/50 dark:bg-secondary/20 px-1.5 py-0.5 rounded">
                        {totalHeadersCount} headers • {securityHeadersCount}{" "}
                        security
                      </span>
                      {selectedUrl.isSecure && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Lock className="h-2.5 w-2.5" />
                          HTTPS
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(
                            selectedUrl.rawHeaders || selectedUrl.headers,
                            null,
                            2,
                          ),
                        )
                      }
                      className="h-7 px-2 text-[10px] font-semibold dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy JSON
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedUrlIndex(null)}
                      className="h-7 w-7 text-muted-foreground hover:bg-secondary dark:hover:bg-white/5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Basic Info Row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-background dark:bg-card border border-border/40 dark:border-white/5 shadow-sm">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">
                        Status
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${getStatusColor(selectedUrl.status)}`}
                        />

                        <Zap className="w-3 h-3 text-amber-500 -ml-3" />
                        <span className="text-xs font-bold">
                          {selectedUrl.statusCode || "---"}
                        </span>
                      </div>
                    </div>
                    {selectedUrl.responseTime && (
                      <div className="p-2 rounded-lg bg-background dark:bg-card border border-border/40 dark:border-white/5 shadow-sm">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">
                          Latency
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-xs font-bold">
                            {selectedUrl.responseTime}ms
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedUrl.contentType && (
                      <div className="p-2 rounded-lg bg-background dark:bg-card border border-border/40 dark:border-white/5 shadow-sm min-w-0">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">
                          Type
                        </p>
                        <span className="text-xs font-bold truncate block">
                          {selectedUrl.contentType.split(";")[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Headers Breakdown - Condensed Accordions */}
                  {categorizedHeaders && (
                    <div className="space-y-1.5">
                      {[
                        {
                          id: "security",
                          label: "Security",
                          icon: Shield,
                          color: "text-emerald-500",
                          data: categorizedHeaders.security,
                        },
                        {
                          id: "server",
                          label: "Server",
                          icon: Server,
                          color: "text-blue-500",
                          data: categorizedHeaders.server,
                        },
                        {
                          id: "caching",
                          label: "Caching",
                          icon: Database,
                          color: "text-purple-500",
                          data: categorizedHeaders.caching,
                        },
                        {
                          id: "other",
                          label: "Other",
                          icon: Info,
                          color: "text-slate-500",
                          data: categorizedHeaders.other,
                        },
                      ].map(
                        (cat) =>
                          Object.keys(cat.data).length > 0 && (
                            <div
                              key={cat.id}
                              className="border border-border/30 dark:border-white/5 rounded-lg overflow-hidden bg-background/50 dark:bg-card/50"
                            >
                              <button
                                onClick={() => toggleCategory(cat.id)}
                                className="w-full flex items-center justify-between p-2 hover:bg-secondary/30 dark:hover:bg-white/5 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <cat.icon
                                    className={`h-3.5 w-3.5 ${cat.color}`}
                                  />
                                  <span className="text-[11px] font-bold text-foreground">
                                    {cat.label} ({Object.keys(cat.data).length})
                                  </span>
                                </div>
                                {expandedCategories[cat.id] ? (
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                )}
                              </button>
                              {expandedCategories[cat.id] && (
                                <div className="px-2 pb-2 space-y-1 divide-y divide-border/20 dark:divide-white/5">
                                  {Object.entries(cat.data).map(
                                    ([key, value], idx) => (
                                      <div key={idx} className="py-1.5 group">
                                        <div className="flex items-center justify-between mb-0.5">
                                          <code className="text-[10px] font-bold text-primary/80 dark:text-primary">
                                            {key}
                                          </code>
                                          <button
                                            onClick={() =>
                                              copyToClipboard(value as string)
                                            }
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-secondary dark:hover:bg-white/10 rounded"
                                          >
                                            <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                                          </button>
                                        </div>
                                        <code className="text-[10px] font-medium text-muted-foreground leading-relaxed break-all font-mono">
                                          {value as string}
                                        </code>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Controls section - Condensed Grid */}
          <div className="p-3 bg-secondary/5 dark:bg-secondary/10 border-b border-border/50 dark:border-white/5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-0.5">
                  Interval (sec)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="5"
                    max="300"
                    value={pollingInterval}
                    onChange={(e) => setPollingInterval(Number(e.target.value))}
                    className="h-8 pl-8 text-xs font-bold bg-white dark:bg-transparent border-border/50 dark:border-white/20 focus-visible:ring-primary/20 text-foreground"
                  />
                  <RefreshCw className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-0.5">
                  Fault Tolerance
                </label>
                <button
                  onClick={() => setStopOnError(!stopOnError)}
                  disabled={isPolling}
                  className={`h-8 w-full rounded-md border text-[10px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm
                    ${
                      stopOnError
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                    }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  {stopOnError ? "STOP ON ERROR" : "CONTINUE ON ERROR"}
                </button>
              </div>
            </div>
          </div>

          {/* Main Work Area: URL List and Logs */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* URL List */}
            <div
              className={`flex-1 overflow-y-auto p-4 space-y-2 transition-all duration-300 ${showLogs ? "h-[60%]" : "h-full"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                  Monitored Endpoints
                </h4>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {urls.length} TOTAL
                </span>
              </div>

              {urls.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 opacity-50">
                  <div className="p-4 rounded-full bg-secondary/50 dark:bg-white/5">
                    <Globe className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    No URLs added to monitor yet.
                  </p>
                </div>
              ) : (
                urls.map((urlStatus, index) => (
                  <div
                    key={index}
                    className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 hover:shadow-md
                      ${
                        selectedUrlIndex === index
                          ? "bg-primary/5 dark:bg-primary/10 border-brand-bright shadow-sm"
                          : "bg-background dark:bg-card border-border/40 dark:border-white/5 hover:border-primary/30"
                      }`}
                  >
                    <button
                      onClick={() => handleCheckSingle(index)}
                      className="relative flex-shrink-0"
                      disabled={urlStatus.status === "checking" || isPolling}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                        ${
                          urlStatus.status === "online"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : urlStatus.status === "offline"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-secondary/50 dark:bg-white/10 text-muted-foreground"
                        }`}
                      >
                        <Activity
                          className={`w-4 h-4 ${urlStatus.status === "checking" ? "animate-pulse" : ""}`}
                        />
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background dark:border-brand-darker
                        ${getStatusColor(urlStatus.status)} ${urlStatus.status === "checking" ? "animate-ping" : ""}`}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {urlStatus.url}
                        </p>
                        {urlStatus.isSecure &&
                          urlStatus.status === "online" && (
                            <Lock className="w-2.5 h-2.5 text-emerald-500" />
                          )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/50 dark:bg-secondary/20
                          ${
                            urlStatus.statusCode === 200
                              ? "text-emerald-600 dark:text-emerald-400"
                              : urlStatus.statusCode
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {urlStatus.statusCode || "---"}{" "}
                          {getStatusText(urlStatus)}
                        </span>
                        {urlStatus.lastChecked && (
                          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(urlStatus.lastChecked)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      {urlStatus.headers && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUrlIndex(index);
                            setExpandedCategories({
                              security: true,
                              server: true,
                              caching: false,
                              other: false,
                            });
                          }}
                          className="h-8 w-8 text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                        >
                          <ChevronRight size={16} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        onClick={() => removeUrl(index)}
                        disabled={isPolling}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Log Console - Sticky Bottom with flex distribution */}
            {showLogs && (
              <div className="flex-1 min-h-[120px] max-h-[40%] border-t border-border/50 dark:border-white/10 bg-secondary/5 dark:bg-card flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between p-2 px-4 bg-background/50 dark:bg-white/5 border-b border-border/20 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <h3 className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                      Live Feed
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {logs.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLogs([])}
                        className="h-6 text-[9px] font-bold text-muted-foreground hover:text-foreground"
                      >
                        CLEAR LOGS
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowLogs(false)}
                      className="h-6 w-6 text-muted-foreground hover:bg-secondary dark:hover:bg-white/10"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono">
                  {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <p className="text-[10px] text-muted-foreground font-medium italic">
                        Monitoring for activity...
                      </p>
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 py-1 group border-l-2 border-transparent hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 px-2 rounded-r transition-all"
                      >
                        <span className="text-[9px] font-bold text-muted-foreground/60 w-14 flex-shrink-0">
                          {formatTime(log.timestamp).split(" ")[0]}
                        </span>
                        <div
                          className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${log.status === "online" ? "bg-emerald-500" : "bg-rose-500"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold text-foreground group-hover:text-primary transition-colors truncate`}
                            >
                              {log.url}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase ${log.status === "online" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                            >
                              {log.status}
                            </span>
                          </div>
                          <p
                            className={`text-[10px] font-medium leading-relaxed ${colourStatus(log)} line-clamp-1`}
                          >
                            {log.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/50 dark:border-white/10 bg-background dark:bg-brand-darker flex-shrink-0 space-y-3">
          {/* Add URL Row */}
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Globe className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Paste endpoint URL..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addUrl()}
                disabled={isPolling}
                className="h-9 pl-9 text-xs font-bold bg-white dark:bg-transparent border-border/50 dark:border-white/20 focus-visible:ring-primary/20 rounded-lg text-foreground"
              />
            </div>
            <Button
              onClick={addUrl}
              size="sm"
              className="px-4 font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] dark:bg-primary dark:text-white"
              disabled={isPolling || !newUrl}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              ADD
            </Button>
          </div>

          {/* Execution Controls */}
          <div className="flex gap-2.5">
            <Button
              onClick={togglePolling}
              className={`flex-[2] h-10 font-bold transition-all duration-300 shadow-md transform hover:scale-[1.01] active:scale-[0.99]
                ${
                  isPolling
                    ? "bg-rose-600 hover:bg-rose-700 text-white  dark:bg-rose-600 dark:text-white dark:hover:bg-rose-900"
                    : "bg-brand-bright text-white shadow-lg shadow-brand-bright/20 dark:bg-brand-bright dark:hover:bg-brand-bright/50  dark:text-white"
                }`}
            >
              {isPolling ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  HALT MONITORING
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  RESUME MONITORING
                </>
              )}
            </Button>
            <Button
              onClick={handleCheckAll}
              variant="outline"
              className="flex-1 h-10 font-bold border-2 dark:border-white/10 dark:hover:bg-white/5 transition-all text-foreground"
              disabled={isPolling}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              PULSE
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );

  function colourStatus(log) {
    if (log?.statusCode === 200) {
      return "text-green-700 dark:text-emerald-400";
    } else if (log?.statusCode === 404) {
      return "text-red-700 dark:text-rose-400";
    } else if (log?.statusCode === 500) {
      return "text-yellow-700 dark:text-amber-400";
    }
    return "text-muted-foreground";
  }

  function handleHideHttpChecker() {
    hideUrlChecker();
    // No need to toggle anything - state is already in sync
  }
}
