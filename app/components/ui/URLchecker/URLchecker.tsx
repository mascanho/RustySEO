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
  const [checking, setChecking] = useState(false);
  const { hideUrlChecker, showUrlChecke, visibility } = useVisibilityStore();

  const addLog = (entry: Omit<LogEntry, "timestamp">) => {
    setLogs((prev) =>
      [{ ...entry, timestamp: new Date() }, ...prev].slice(0, 100),
    ); // Keep last 100 entries
  };

  useEffect(() => {
    if (isPolling) {
      const poll = async () => {
        const results = await checkAllUrls();

        // Stop polling if any URL is offline and stopOnError is enabled
        if (stopOnError && results.some((r) => r.status === "offline")) {
          setIsPolling(false);
        }
      };

      // Run immediately
      poll();

      // Then run at intervals
      intervalRef.current = setInterval(poll, pollingInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPolling, pollingInterval, stopOnError]);

  const checkUrl = async (url: string): Promise<UrlStatus> => {
    const startTime = performance.now();

    try {
      const response = await fetch("/api/check-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const endTime = performance.now();
      const data = await response.json();

      const status = data.ok ? "online" : "offline";
      const responseTime = Math.round(endTime - startTime);
      addLog({
        url,
        status,
        statusCode: data.status,
        responseTime,
        message:
          status === "online"
            ? `${data.status} • ${responseTime}ms`
            : `Failed with status ${data.status}`,
      });

      return {
        url,
        status,
        statusCode: data.status,
        responseTime,
        lastChecked: new Date(),
        headers: data.headers,
        securityHeaders: data.securityHeaders,
        contentType: data.contentType,
        server: data.server,
        isSecure: data.isSecure,
        isRedirect: data.isRedirect,
        redirectLocation: data.redirectLocation,
      };
    } catch (error) {
      addLog({
        url,
        status: "offline",
        message: "Connection failed",
      });

      return {
        url,
        status: "offline",
        lastChecked: new Date(),
      };
    }
  };

  const checkAllUrls = async () => {
    setUrls((prev) => prev.map((u) => ({ ...u, status: "checking" })));
    setChecking(true);
    const results = await Promise.all(urls.map((u) => checkUrl(u.url)));
    setUrls(results);
    setChecking(false);
    return results;
  };

  const handleCheckAll = async () => {
    await checkAllUrls();
  };

  const handleCheckSingle = async (index: number) => {
    setUrls((prev) =>
      prev.map((u, i) => (i === index ? { ...u, status: "checking" } : u)),
    );
    setChecking(true);
    const result = await checkUrl(urls[index].url);
    setUrls((prev) => prev.map((u, i) => (i === index ? result : u)));
    setSelectedUrlIndex(index);
    // Reset expanded categories when selecting a new URL
    setExpandedCategories({
      security: true,
      caching: false,
      content: false,
      server: false,
      other: false,
    });
    setChecking(false);
  };

  const togglePolling = () => {
    setIsPolling(!isPolling);
  };

  const addUrl = () => {
    if (newUrl.trim() && !urls.find((u) => u.url === newUrl)) {
      setUrls([...urls, { url: newUrl.trim(), status: "unknown" }]);
      setNewUrl("");
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
    if (selectedUrlIndex === index) {
      setSelectedUrlIndex(null);
    }
  };

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

  return (
    <section className={`${visibility.urlchecker ? "block" : "hidden"}`}>
      <Card className="max-w-full bg-card w-[700px] border-border fixed bottom-10 left-4 z-50 dark:bg-brand-bright bg-white h-[40rem] max-h-[90rem]">
        <div className="p-6 relative ">
          <X
            className="absolute top-4 right-4 text-muted-foreground cursor-pointer"
            onClick={hideUrlChecker}
          />
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                Status Monitor
              </h2>
              <p className="text-sm text-muted-foreground">
                Real-time endpoint health
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLogs(!showLogs)}
              className="flex-shrink-0"
            >
              <ScrollText className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {showLogs && (
            <div className="mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
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
                      <span className="text-muted-foreground font-mono flex-shrink-0">
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
                        <p className="font-mono text-foreground truncate">
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

          {selectedUrl && selectedUrl.status !== "unknown" && (
            <div className="mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50 max-h-[400px] overflow-y-auto">
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
                        {selectedUrl.status === "online" ? "Online" : "Offline"}
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

                {/* Security Info */}
                {selectedUrl.isSecure !== undefined && (
                  <div className="flex items-start gap-2 p-2 rounded bg-secondary/50">
                    <Lock
                      className={`w-4 h-4 mt-0.5 ${selectedUrl.isSecure ? "text-success" : "text-warning"}`}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">
                        {selectedUrl.isSecure ? "HTTPS Enabled" : "HTTP Only"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedUrl.isSecure
                          ? "Secure connection"
                          : "Insecure connection"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Redirect Info */}
                {selectedUrl.isRedirect && selectedUrl.redirectLocation && (
                  <div className="flex items-start gap-2 p-2 rounded bg-secondary/50">
                    <RefreshCw className="w-4 h-4 mt-0.5 text-warning" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">
                        Redirect Detected
                      </p>
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        {selectedUrl.redirectLocation}
                      </p>
                    </div>
                  </div>
                )}

                {/* Content Type */}
                {selectedUrl.contentType && (
                  <div className="flex items-start gap-2 p-2 rounded bg-secondary/50">
                    <FileText className="w-4 h-4 mt-0.5 text-primary" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">
                        Content Type
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedUrl.contentType}
                      </p>
                    </div>
                  </div>
                )}

                {/* Server */}
                {selectedUrl.server && (
                  <div className="flex items-start gap-2 p-2 rounded bg-secondary/50">
                    <Server className="w-4 h-4 mt-0.5 text-primary" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">
                        Server
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedUrl.server}
                      </p>
                    </div>
                  </div>
                )}

                {/* Security Headers Summary */}
                {selectedUrl.securityHeaders && (
                  <div className="flex items-start gap-2 p-2 rounded bg-secondary/50">
                    <Shield className="w-4 h-4 mt-0.5 text-primary" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground mb-1">
                        Security Headers ({countSecurityHeaders(selectedUrl)}/5)
                      </p>
                      <div className="space-y-1">
                        {Object.entries(selectedUrl.securityHeaders).map(
                          ([key, value]) => (
                            <div key={key} className="flex items-start gap-1.5">
                              <div
                                className={`w-1.5 h-1.5 rounded-full mt-1 ${value ? "bg-success" : "bg-muted-foreground"}`}
                              />
                              <p className="text-xs text-muted-foreground font-mono flex-1">
                                {key}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Headers Breakdown */}
                {categorizedHeaders && (
                  <div className="space-y-3 pt-3 border-t border-border/50">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      Headers Breakdown
                    </h4>

                    {/* Security Headers Category */}
                    {Object.keys(categorizedHeaders.security).length > 0 && (
                      <div className="border border-border/50 rounded-md overflow-hidden">
                        <button
                          onClick={() => toggleCategory("security")}
                          className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-success" />
                            <span className="text-sm font-medium text-foreground">
                              Security Headers
                            </span>
                            <span className="text-xs text-muted-foreground bg-success/10 px-2 py-0.5 rounded-full">
                              {Object.keys(categorizedHeaders.security).length}
                            </span>
                          </div>
                          {expandedCategories.security ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        {expandedCategories.security && (
                          <div className="p-3 bg-success/5 border-t border-border/50 space-y-2">
                            {Object.entries(categorizedHeaders.security).map(
                              ([key, value]) => (
                                <div key={key} className="text-xs">
                                  <div className="flex items-start gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success mt-1 flex-shrink-0" />
                                    <span className="text-foreground font-semibold font-mono">
                                      {key}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground font-mono ml-4 break-all">
                                    {value}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Caching Headers Category */}
                    {Object.keys(categorizedHeaders.caching).length > 0 && (
                      <div className="border border-border/50 rounded-md overflow-hidden">
                        <button
                          onClick={() => toggleCategory("caching")}
                          className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">
                              Caching Headers
                            </span>
                            <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">
                              {Object.keys(categorizedHeaders.caching).length}
                            </span>
                          </div>
                          {expandedCategories.caching ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        {expandedCategories.caching && (
                          <div className="p-3 bg-primary/5 border-t border-border/50 space-y-2">
                            {Object.entries(categorizedHeaders.caching).map(
                              ([key, value]) => (
                                <div key={key} className="text-xs">
                                  <div className="flex items-start gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 flex-shrink-0" />
                                    <span className="text-foreground font-semibold font-mono">
                                      {key}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground font-mono ml-4 break-all">
                                    {value}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content Headers Category */}
                    {Object.keys(categorizedHeaders.content).length > 0 && (
                      <div className="border border-border/50 rounded-md overflow-hidden">
                        <button
                          onClick={() => toggleCategory("content")}
                          className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-warning" />
                            <span className="text-sm font-medium text-foreground">
                              Content Headers
                            </span>
                            <span className="text-xs text-muted-foreground bg-warning/10 px-2 py-0.5 rounded-full">
                              {Object.keys(categorizedHeaders.content).length}
                            </span>
                          </div>
                          {expandedCategories.content ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        {expandedCategories.content && (
                          <div className="p-3 bg-warning/5 border-t border-border/50 space-y-2">
                            {Object.entries(categorizedHeaders.content).map(
                              ([key, value]) => (
                                <div key={key} className="text-xs">
                                  <div className="flex items-start gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1 flex-shrink-0" />
                                    <span className="text-foreground font-semibold font-mono">
                                      {key}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground font-mono ml-4 break-all">
                                    {value}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Server Headers Category */}
                    {Object.keys(categorizedHeaders.server).length > 0 && (
                      <div className="border border-border/50 rounded-md overflow-hidden">
                        <button
                          onClick={() => toggleCategory("server")}
                          className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Cloud className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              Server Headers
                            </span>
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                              {Object.keys(categorizedHeaders.server).length}
                            </span>
                          </div>
                          {expandedCategories.server ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        {expandedCategories.server && (
                          <div className="p-3 bg-secondary/30 border-t border-border/50 space-y-2">
                            {Object.entries(categorizedHeaders.server).map(
                              ([key, value]) => (
                                <div key={key} className="text-xs">
                                  <div className="flex items-start gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1 flex-shrink-0" />
                                    <span className="text-foreground font-semibold font-mono">
                                      {key}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground font-mono ml-4 break-all">
                                    {value}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Other Headers Category */}
                    {Object.keys(categorizedHeaders.other).length > 0 && (
                      <div className="border border-border/50 rounded-md overflow-hidden">
                        <button
                          onClick={() => toggleCategory("other")}
                          className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              Other Headers
                            </span>
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                              {Object.keys(categorizedHeaders.other).length}
                            </span>
                          </div>
                          {expandedCategories.other ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        {expandedCategories.other && (
                          <div className="p-3 bg-secondary/30 border-t border-border/50 space-y-2">
                            {Object.entries(categorizedHeaders.other).map(
                              ([key, value]) => (
                                <div key={key} className="text-xs">
                                  <div className="flex items-start gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1 flex-shrink-0" />
                                    <span className="text-foreground font-semibold font-mono">
                                      {key}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground font-mono ml-4 break-all">
                                    {value}
                                  </p>
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

          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-secondary/50 border border-border/50">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-muted-foreground font-medium">
                  Interval (seconds)
                </label>
              </div>
              <Input
                type="number"
                min="5"
                max="300"
                value={pollingInterval}
                onChange={(e) => setPollingInterval(Number(e.target.value))}
                disabled={isPolling}
                className="h-8 bg-background border-border text-foreground font-mono text-sm"
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
                className={`h-8 w-full rounded-md border text-sm font-medium transition-colors ${
                  stopOnError
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border"
                }`}
              >
                {stopOnError ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {urls.map((urlStatus, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border transition-colors ${
                  selectedUrlIndex === index
                    ? "border-primary"
                    : "border-border/50"
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
                    {urlStatus.isRedirect && (
                      <RefreshCw className="w-3 h-3 text-warning flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {urlStatus.statusCode && (
                      <span className="text-xs font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-secondary/50">
                        {urlStatus.statusCode}
                      </span>
                    )}
                    {urlStatus.responseTime && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {urlStatus.responseTime}ms
                      </span>
                    )}
                    {urlStatus.headers &&
                      Object.keys(urlStatus.headers).length > 0 && (
                        <button
                          onClick={() => setSelectedUrlIndex(index)}
                          className="text-xs font-mono text-primary hover:text-primary/80 px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          {Object.keys(urlStatus.headers).length} headers
                        </button>
                      )}
                    {urlStatus.securityHeaders && (
                      <span className="text-xs font-mono text-success px-1.5 py-0.5 rounded bg-success/10 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {countSecurityHeaders(urlStatus)}/5
                      </span>
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
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-success text-success-foreground hover:bg-success/90"
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
              disabled={urls.some((u) => u.status === "checking") || isPolling}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Once
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
