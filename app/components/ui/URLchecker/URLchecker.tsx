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
} from "lucide-react";
import { useVisibilityStore } from "@/store/VisibilityStore";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

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
}

interface LogEntry {
  timestamp: Date;
  url: string;
  status: "online" | "offline";
  statusCode?: number;
  responseTime?: number;
  message: string;
}

// Interface for Tauri backend response
interface TauriUrlCheckResult {
  url: string;
  status?: number;
  error?: string;
  timestamp: number;
  response_time_ms?: number;
}

export function UrlStatusChecker() {
  const [urls, setUrls] = useState<UrlStatus[]>([
    { url: "https://vercel.com", status: "unknown" },
  ]);
  const [newUrl, setNewUrl] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(30);
  const [stopOnError, setStopOnError] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedUrlIndex, setSelectedUrlIndex] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    security: true,
    caching: false,
    content: false,
    server: false,
    other: false,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { hideUrlChecker, visibility } = useVisibilityStore();

  const addLog = (entry: Omit<LogEntry, "timestamp">) => {
    setLogs((prev) =>
      [{ ...entry, timestamp: new Date() }, ...prev].slice(0, 100),
    ); // Keep last 100 entries
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
          // Note: Tauri backend doesn't return headers yet, so keep existing ones
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
                }
              : u,
          ),
        );

        setSelectedUrlIndex(index);
        setExpandedCategories({
          security: true,
          caching: false,
          content: false,
          server: false,
          other: false,
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
    if (isPolling) {
      // Stop polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
      console.log("Polling stopped");
    } else {
      // Start polling
      setIsPolling(true);
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

  // Helper functions (unchanged)
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
        lowerKey.includes("x-powered-by")
      ) {
        categorized.server[key] = value;
      } else {
        categorized.other[key] = value;
      }
    });

    return categorized;
  };

  const selectedUrl = selectedUrlIndex !== null ? urls[selectedUrlIndex] : null;
  const categorizedHeaders = selectedUrl?.headers
    ? categorizeHeaders(selectedUrl.headers)
    : null;

  return (
    <section className={`${visibility.urlchecker ? "block" : "hidden"}`}>
      {/* Overlay background */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 backdrop-blur-sm"
        onClick={hideUrlChecker}
      />
      <Card className="max-w-full bg-card w-[700px] border-border fixed bottom-10 left-2 z-50 dark:bg-brand-darker bg-white h-[calc(100vh-150px)] max-h-full">
        <div className="p-6 relative">
          <X
            size={14}
            className="text-red-500 absolute top-4 right-4 text-muted-foreground cursor-pointer text-xs"
            onClick={hideUrlChecker}
          />
          <div className="flex items-center gap-3 mb-6">
            <div className="flex pt-4 w-full space-x-2">
              <section className="flex w-full items-center">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground ml-1">
                  HTTP Status Monitor
                </h2>
              </section>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogs(!showLogs)}
                className="flex-shrink-0"
              >
                <ScrollText className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Response Details Panel - This will be empty since Tauri backend doesn't return headers yet */}
          {selectedUrl &&
            selectedUrl.status !== "unknown" &&
            selectedUrl.headers && (
              <div className="mb-2 p-3 rounded-lg bg-secondary/30 border border-border/50 dark:border/50 max-h-[400px] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Response Details
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUrlIndex(null)}
                    className="h-6 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </Button>
                </div>

                <div className="space-y-3">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2 p-2 rounded bg-secondary/50">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(selectedUrl.status)}`}
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="text-sm font-medium text-foreground">
                          {selectedUrl.status === "online"
                            ? "Online"
                            : "Offline"}
                        </p>
                      </div>
                    </div>
                    {selectedUrl.responseTime && (
                      <div className="flex items-center gap-2 p-2 rounded bg-secondary/50">
                        <RefreshCw className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Response Time
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedUrl.responseTime}ms
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Headers Breakdown will only show if headers exist */}
                  {categorizedHeaders && (
                    <div className="space-y-3 pt-3 border-t border-border/50">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        Headers Breakdown
                      </h4>
                      {/* ... rest of headers breakdown code ... */}
                    </div>
                  )}
                </div>
              </div>
            )}

          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-secondary/50 border border-border/50 dark:border-white/30">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-black font-medium">
                  Polling Interval (seconds)
                </label>
              </div>
              <Input
                type="number"
                min="5"
                max="300"
                value={pollingInterval}
                onChange={(e) => setPollingInterval(Number(e.target.value))}
                // disabled={isPolling}
                className="dark:text-white h-8 bg-white text-black disabled:text-blue-900 border-border dark:border-white/50 font-mono text-sm  dark:disabled:text-white"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-muted-foreground font-medium">
                  Stop on error
                </label>
              </div>
              <button
                onClick={() => setStopOnError(!stopOnError)}
                disabled={isPolling}
                className={`h-8 w-full rounded-md border dark:border-white/30 text-sm font-medium transition-colors ${
                  stopOnError
                    ? "bg-brand-bright text-white border-primary dark:border/50"
                    : " border-border dark:border/50"
                }`}
              >
                {stopOnError ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-4 h-[200px] overflow-auto">
            {urls.map((urlStatus, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-1 rounded-lg bg-secondary/30 border transition-colors ${
                  selectedUrlIndex === index
                    ? "border-primary dark:border-white/50"
                    : "border-border/50 dark:border-white/30"
                }`}
              >
                <button
                  onClick={() => handleCheckSingle(index)}
                  className="flex-shrink-0"
                  disabled={urlStatus.status === "checking" || isPolling}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${getStatusColor(urlStatus.status)} ${
                      urlStatus.status === "checking" ? "animate-pulse" : ""
                    }`}
                  />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-foreground truncate">
                      {urlStatus.url}
                    </p>
                    {urlStatus.isSecure && urlStatus.status === "online" && (
                      <Lock className="w-3 h-3 text-success flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">
                      {getStatusText(urlStatus)}
                    </span>
                    {urlStatus.lastChecked && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(urlStatus.lastChecked)}
                      </span>
                    )}
                    {urlStatus.headers &&
                      Object.keys(urlStatus.headers).length > 0 && (
                        <button
                          onClick={() => setSelectedUrlIndex(index)}
                          className="text-xs font-mono text-primary hover:text-primary/80 px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          Headers
                        </button>
                      )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-8 w-8"
                  onClick={() => removeUrl(index)}
                  disabled={isPolling}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="https://example.com"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUrl()}
              disabled={isPolling}
              className="flex-1 bg-secondary border-border text-foreground font-mono text-sm"
            />
            <Button
              onClick={addUrl}
              size="icon"
              className="flex-shrink-0"
              disabled={isPolling}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={togglePolling}
              className={`flex-1 ${
                isPolling
                  ? "bg-red-700 text-white hover:bg-destructive/90 border"
                  : "bg-green-600 text-white hover:bg-success/90 border"
              }`}
            >
              {isPolling ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Polling
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Polling
                </>
              )}
            </Button>
            <Button
              onClick={handleCheckAll}
              variant="outline"
              className="flex-1 bg-transparent"
              disabled={isPolling}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Once
            </Button>
          </div>
        </div>

        {/* LOG CONSOLE OUTPUT */}

        {showLogs && (
          <div className="p-3 rounded-lg bg-gray-200 dark:bg-brand-darker dark:border-white/30 border border-border/50 min-h-[calc(100%-51vh)] max-h-[calc(100%-51vh)] overflow-y-auto mx-4 overflow-clip ">
            <div className="flex items-center justify-between sticky w-full bg-white rounded-full px-2  dark:bg-brand-dark">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Activity Log
              </h3>
              {logs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogs([])}
                  className="h-6 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="space-y-1.5">
              {logs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No activity yet
                </p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <span className="text-muted-foreground font-mono flex-shrink-0 dark:text-brand-bright text-blue-900">
                      {formatTime(log.timestamp)}
                    </span>
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${
                        log.status === "online"
                          ? "bg-success"
                          : "bg-destructive"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-foreground truncate dark:text-brand-highlight text-brand-bright">
                        {log.url}
                      </p>
                      <p className="font-mono text-muted-foreground">
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
