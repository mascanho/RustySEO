// @ts-nocheck
"use client";

import React from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: "info" | "warn" | "error";
}

export default function LogsDBManager({ closeDialog }) {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [autoRefresh, setAutoRefresh] = React.useState(false);

  // Generate 15 placeholder logs
  React.useEffect(() => {
    const placeholderLogs: LogEntry[] = [
      {
        id: "1",
        timestamp: "10:23:45 AM",
        message: "Server started successfully on port 8080",
        level: "info",
      },
      {
        id: "2",
        timestamp: "10:24:12 AM",
        message: "Database connection established",
        level: "info",
      },
      {
        id: "3",
        timestamp: "10:25:03 AM",
        message: "User session created for user_id: 1234",
        level: "info",
      },
      {
        id: "4",
        timestamp: "10:26:47 AM",
        message: "Cache initialized with 256MB memory",
        level: "info",
      },
      {
        id: "5",
        timestamp: "10:28:15 AM",
        message: "High memory usage detected (85%)",
        level: "warn",
      },
      {
        id: "6",
        timestamp: "10:30:22 AM",
        message: "API request received: GET /api/users",
        level: "info",
      },
      {
        id: "7",
        timestamp: "10:31:05 AM",
        message: "Failed to load resource from CDN: /assets/image.jpg",
        level: "warn",
      },
      {
        id: "8",
        timestamp: "10:32:18 AM",
        message: "Database query took longer than expected (1200ms)",
        level: "warn",
      },
      {
        id: "9",
        timestamp: "10:33:42 AM",
        message: "Authentication failed for user: admin@example.com",
        level: "error",
      },
      {
        id: "10",
        timestamp: "10:35:11 AM",
        message: "New user registered: user_id: 5678",
        level: "info",
      },
      {
        id: "11",
        timestamp: "10:36:29 AM",
        message: "Scheduled backup completed successfully",
        level: "info",
      },
      {
        id: "12",
        timestamp: "10:38:03 AM",
        message: "SSL certificate renewed",
        level: "info",
      },
      {
        id: "13",
        timestamp: "10:39:57 AM",
        message: "Rate limit exceeded for IP: 192.168.1.100",
        level: "warn",
      },
      {
        id: "14",
        timestamp: "10:41:22 AM",
        message: "System temperature within normal range",
        level: "info",
      },
      {
        id: "15",
        timestamp: "10:42:45 AM",
        message: "Starting maintenance tasks",
        level: "info",
      },
    ];

    setLogs(placeholderLogs);
  }, []);

  const handleRefreshLogs = async () => {
    setIsLoading(true);
    try {
      // Simulate loading fresh logs
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Logs refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh logs");
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-500";
      case "warn":
        return "text-yellow-500";
      default:
        return "text-green-500";
    }
  };

  return (
    <section className="w-[650px] max-w-5xl mx-auto h-[670px] pt-1">
      <CardContent className="grid grid-cols-1 gap-6 h-[380px]">
        <div className="space-y-4">
          <div className="rounded-md h-[580px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center h-full flex items-center justify-center">
                No logs available
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column - Toggle Settings */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-4 text-left">
                      Log Settings
                    </h3>
                    <div className="space-y-4 p-4 border rounded-md bg-muted">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto-refresh"
                          checked={autoRefresh}
                          onCheckedChange={setAutoRefresh}
                        />
                        <Label htmlFor="auto-refresh">Auto Refresh</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        When enabled, logs will automatically refresh every 30
                        seconds.
                      </p>

                      <div className="pt-4">
                        <h4 className="text-xs font-medium mb-2">
                          Log Level Filter
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch id="show-errors" defaultChecked />
                            <Label htmlFor="show-errors">Show Errors</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="show-warnings" defaultChecked />
                            <Label htmlFor="show-warnings">Show Warnings</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="show-info" defaultChecked />
                            <Label htmlFor="show-info">Show Info</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Log Messages */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-left">
                    Server Logs
                  </h3>
                  <div className="border rounded-md h-[370px] overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start justify-between p-3 border-b"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-mono ${getLevelColor(log.level)}`}
                            >
                              [{log.timestamp}]
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${getLevelColor(log.level)} bg-opacity-20 ${log.level === "error" ? "bg-red-500" : log.level === "warn" ? "bg-yellow-500" : "bg-green-500"}`}
                            >
                              {log.level.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs dark:text-white/80 truncate">
                            {log.message}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove log"
                          disabled={isLoading}
                          className="h-6 w-6 ml-2"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => toast.info("Export feature coming soon")}
        >
          Export Logs
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={handleRefreshLogs}
            variant="secondary"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Refresh
          </Button>
          <Button
            onClick={() => toast.info("Clear logs feature coming soon")}
            variant="destructive"
          >
            Clear Logs
          </Button>
        </div>
      </CardFooter>
    </section>
  );
}
