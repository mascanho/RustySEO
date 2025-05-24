// @ts-nocheck
"use client";

import React, { useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useServerLogsStore } from "@/store/ServerLogsGlobalStore";
import { invoke } from "@tauri-apps/api/core";

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: "info" | "warn" | "error";
}

export default function LogsDBManager({ closeDialog }) {
  // Initialize saveLogs directly from localStorage
  const [saveLogs, setSaveLogs] = React.useState(() => {
    const logsStorageValue = localStorage.getItem("logsStorage");
    return logsStorageValue ? JSON.parse(logsStorageValue) : false;
  });
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const { setStoringLogs } = useServerLogsStore();

  // READ LOGS FROM LOCALSTORAGE BEFORE SETTING
  useEffect(() => {
    // Read logs from localStorage first
    const storedLogs = localStorage.getItem("logsData");
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    }
  }, []);

  useEffect(() => {
    // Write to localStorage only when saveLogs changes
    localStorage.setItem("logsStorage", JSON.stringify(saveLogs));
    // Dispatch a proper StorageEvent if needed
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "logsStorage",
        newValue: JSON.stringify(saveLogs),
      }),
    );

    // Save logs to localStorage when saveLogs is true
    if (saveLogs) {
      localStorage.setItem("logsData", JSON.stringify(logs));
    } else {
      localStorage.removeItem("logsData");
    }

    setStoringLogs(saveLogs);
  }, [saveLogs, logs]);

  const handleRemoveAllLogs = () => {
    try {
      invoke("remove_all_logs_from_serverlog_db", { dbName: "serverlog.db" });

      toast.success("All logs have been removed from database");
      setSaveLogs(false);
    } catch (error) {
      console.error(error);
      toast.error(error);
    }
  };

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
    <section className="w-[650px] max-w-5xl mx-auto h-[670px] pt-2">
      <CardContent className="grid grid-cols-1 gap-6 h-[380px]">
        <div className="space-y-4">
          <div className="rounded-md h-[580px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column - Toggle Settings */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2 text-left dark:text-white">
                    Log Settings
                  </h3>
                  <div className="bg-gray-200 dark:bg-brand-dark dark:text-white p-2 rounded-md mb-3">
                    <span className=" text-xs leading-none">
                      By default logs are not stored in the database. You can
                      toggle this option to store them in your local machine and
                      incrementally upload them.
                    </span>
                  </div>
                  <div className="space-y-4 p-4 border rounded-md bg-muted h-[16.9rem] dark:border-brand-dark">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="save-logs"
                        checked={saveLogs}
                        onCheckedChange={setSaveLogs}
                        className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-blue-700"
                      />
                      <Label htmlFor="save-logs" className="dark:text-white">
                        Store Logs in DB
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground dark:text-white/50">
                      When enabled, logs will automatically refresh every 30
                      seconds.
                    </p>

                    <div className="pt-1">
                      <h4 className="text-xs font-medium mb-2 dark:text-white">
                        Log Level Filter
                      </h4>
                      <div className="space-y-2 dark:text-white/50">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-errors"
                            className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-blue-700"
                            defaultChecked
                          />
                          <Label htmlFor="show-errors">Show Errors</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-warnings"
                            defaultChecked
                            className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-blue-700"
                          />
                          <Label htmlFor="show-warnings">Show Warnings</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-info"
                            defaultChecked
                            className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-blue-700"
                          />
                          <Label htmlFor="show-info">Show Info</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Log Messages */}
              <div>
                <h3 className="text-sm dark:text-white font-medium mb-2 text-left">
                  Stored Server Logs
                </h3>
                <div className="border dark:border-brand-dark rounded-md h-[370px] overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between px-3 py-2 border-b dark:border-b-brand-dark"
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
                        <X className="h-3 w-3 text-muted-foreground dark:text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => toast.info("Export feature coming soon")}
          className="dark:bg-brand-bright dark:border-brand-darker dark:text-white"
        >
          Display Logs
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
          <Button onClick={handleRemoveAllLogs} variant="destructive">
            Clear database
          </Button>
        </div>
      </CardFooter>
    </section>
  );
}
