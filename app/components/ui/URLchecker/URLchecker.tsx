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
  ExternalLink,
  Copy,
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
    caching: true,
    content: true,
    server: true,
    other: true,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { hideUrlChecker, visibility } = useVisibilityStore();

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

          {/* Response Details Panel */}
          {selectedUrl &&
            selectedUrl.status !== "unknown" &&
            selectedUrl.headers && (
              <div className="mb-4 p-4 rounded-lg bg-secondary/20 border border-border/50 dark:border/50 max-h-[400px] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Response Details for {selectedUrl.url}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {totalHeadersCount} headers • {securityHeadersCount}{" "}
                        security headers
                      </span>
                      {selectedUrl.isSecure && (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <Lock className="h-3 w-3" />
                          HTTPS
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
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
                      className="h-7 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUrlIndex(null)}
                      className="h-7 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Close
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Basic Info Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded bg-secondary/50">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(selectedUrl.status)}`}
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="text-sm font-medium text-foreground">
                          {selectedUrl.status === "online"
                            ? "Online"
                            : "Offline"}{" "}
                          ({selectedUrl.statusCode})
                        </p>
                      </div>
                    </div>

                    {selectedUrl.responseTime && (
                      <div className="flex items-center gap-3 p-3 rounded bg-secondary/50">
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

                    {selectedUrl.contentType && (
                      <div className="flex items-center gap-3 p-3 rounded bg-secondary/50">
                        <FileText className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Content Type
                          </p>
                          <p className="text-sm font-medium text-foreground truncate">
                            {selectedUrl.contentType}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Headers Breakdown */}
                  {categorizedHeaders && (
                    <div className="space-y-3 pt-4 border-t border-border/50">
                      {/* Security Headers */}
                      <div className="space-y-2">
                        <button
                          onClick={() => toggleCategory("security")}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-500" />
                            <h4 className="text-sm font-semibold text-foreground">
                              Security Headers (
                              {Object.keys(categorizedHeaders.security).length})
                            </h4>
                          </div>
                          {expandedCategories.security ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>

                        {expandedCategories.security && (
                          <div className="ml-6 space-y-2">
                            {Object.entries(categorizedHeaders.security).map(
                              ([key, value], idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-3 p-2 rounded bg-secondary/30"
                                >
                                  <Check className="h-3 w-3 text-success mt-1 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <code className="text-xs font-mono text-foreground font-medium">
                                        {key}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyToClipboard(value)}
                                        className="h-5 w-5 ml-2"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <div className="mt-1">
                                      <code className="text-xs font-mono text-muted-foreground break-all">
                                        {value}
                                      </code>
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      {/* Server Headers */}
                      <div className="space-y-2">
                        <button
                          onClick={() => toggleCategory("server")}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-blue-500" />
                            <h4 className="text-sm font-semibold text-foreground">
                              Server Headers (
                              {Object.keys(categorizedHeaders.server).length})
                            </h4>
                          </div>
                          {expandedCategories.server ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>

                        {expandedCategories.server && (
                          <div className="ml-6 space-y-2">
                            {Object.entries(categorizedHeaders.server).map(
                              ([key, value], idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-3 p-2 rounded bg-secondary/30"
                                >
                                  <Server className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <code className="text-xs font-mono text-foreground font-medium">
                                        {key}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyToClipboard(value)}
                                        className="h-5 w-5 ml-2"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <div className="mt-1">
                                      <code className="text-xs font-mono text-muted-foreground break-all">
                                        {value}
                                      </code>
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      {/* Caching Headers */}
                      {Object.keys(categorizedHeaders.caching).length > 0 && (
                        <div className="space-y-2">
                          <button
                            onClick={() => toggleCategory("caching")}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4 text-purple-500" />
                              <h4 className="text-sm font-semibold text-foreground">
                                Caching Headers (
                                {Object.keys(categorizedHeaders.caching).length}
                                )
                              </h4>
                            </div>
                            {expandedCategories.caching ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>

                          {expandedCategories.caching && (
                            <div className="ml-6 space-y-2">
                              {Object.entries(categorizedHeaders.caching).map(
                                ([key, value], idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-3 p-2 rounded bg-secondary/30"
                                  >
                                    <Database className="h-3 w-3 text-purple-500 mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <code className="text-xs font-mono text-foreground font-medium">
                                          {key}
                                        </code>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => copyToClipboard(value)}
                                          className="h-5 w-5 ml-2"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <div className="mt-1">
                                        <code className="text-xs font-mono text-muted-foreground break-all">
                                          {value}
                                        </code>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Other Headers */}
                      {Object.keys(categorizedHeaders.other).length > 0 && (
                        <div className="space-y-2">
                          <button
                            onClick={() => toggleCategory("other")}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-gray-500" />
                              <h4 className="text-sm font-semibold text-foreground">
                                Other Headers (
                                {Object.keys(categorizedHeaders.other).length})
                              </h4>
                            </div>
                            {expandedCategories.other ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>

                          {expandedCategories.other && (
                            <div className="ml-6 space-y-2">
                              {Object.entries(categorizedHeaders.other).map(
                                ([key, value], idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-3 p-2 rounded bg-secondary/30"
                                  >
                                    <Info className="h-3 w-3 text-gray-500 mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <code className="text-xs font-mono text-foreground font-medium">
                                          {key}
                                        </code>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => copyToClipboard(value)}
                                          className="h-5 w-5 ml-2"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <div className="mt-1">
                                        <code className="text-xs font-mono text-muted-foreground break-all">
                                          {value}
                                        </code>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Controls section */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-secondary/50 border border-border/50 dark:border-white/30">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-black font-medium dark:text-white">
                  Polling Interval (seconds)
                </label>
              </div>
              <Input
                type="number"
                min="5"
                max="300"
                value={pollingInterval}
                onChange={(e) => setPollingInterval(Number(e.target.value))}
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

          {/* URL List */}
          <div className="space-y-3 mb-4 h-[200px] overflow-auto">
            {urls.map((urlStatus, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border transition-colors ${
                  selectedUrlIndex === index
                    ? "border-primary dark:border-white/50"
                    : "border-border/50 dark:border-white/30"
                }`}
              >
                <button
                  onClick={() => handleCheckSingle(index)}
                  className={`flex-shrink-0 bg-gray-400 rounded-full h-12 ${urlStatus.statusCode === 200 && "bg-green-500 rounded-full"} ${urlStatus.statusCode === 404 && "bg-red-500 rounded-full"} ${urlStatus.statusCode === 500 && "bg-yellow-500 rounded-full"}`}
                  disabled={urlStatus.status === "checking" || isPolling}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(urlStatus.status)} ${
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
                  <div className="flex items-center gap-2 flex-wrap mt-1">
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
                          onClick={() => {
                            setSelectedUrlIndex(index);
                            setExpandedCategories({
                              security: true,
                              caching: true,
                              content: true,
                              server: true,
                              other: true,
                            });
                          }}
                          className="text-xs font-mono text-primary hover:text-primary/80 px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          {Object.keys(urlStatus.headers).length} headers
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

          {/* Add URL */}
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={togglePolling}
              className={`flex-1 ${
                isPolling
                  ? "bg-red-700 text-white hover:bg-destructive/90 border"
                  : "bg-green-600 text-white hover:bg-success/90 border dark:bg-green-600 dark:border-white/20 dark:text-white dark:hover:bg-green-500"
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
              className="flex-1 bg-transparent dark:bg-transparent dark:border-white/30"
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
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs pt-2"
                  >
                    <span className="text-muted-foreground font-mono flex-shrink-0 dark:text-brand-bright text-blue-900">
                      {formatTime(log.timestamp)}
                    </span>
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${
                        log.status === "online"
                          ? "bg-green-500"
                          : "bg-destructive"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-foreground truncate dark:text-brand-highlight text-brand-bright">
                        {log.url}
                      </p>
                      <p
                        className={`font-mono text-muted-foreground ${colourStatus(log)}`}
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
      </Card>
    </section>
  );

  function colourStatus(log) {
    if (log?.statusCode === 200) {
      return "text-green-700";
    } else if (log?.statusCode === 404) {
      return "text-red-700";
    } else if (log?.statusCode === 500) {
      return "text-yellow-700";
    }
    return "text-muted-foreground";
  }
}
