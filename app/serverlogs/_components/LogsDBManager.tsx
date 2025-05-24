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
import { FaCalendarAlt, FaClock, FaFile } from "react-icons/fa";
import { FaHourglass } from "react-icons/fa6";

const formatTimestamp = (timestamp) => {
  if (!timestamp || typeof timestamp !== "string") {
    return "Invalid Timestamp";
  }

  try {
    // Parse the ISO-8601 string (works even with microseconds)
    const date = new Date(timestamp);

    // Check if the date is invalid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    // Format in a readable way (24-hour format, UTC)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour24: true,
      timeZone: "UTC", // Ensures no timezone conversion
    });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Invalid Timestamp";
  }
};

export default function LogsDBManager({ closeDialog, dbLogs }: any) {
  // Initialize saveLogs directly from localStorage
  const [saveLogs, setSaveLogs] = React.useState(() => {
    const logsStorageValue = localStorage.getItem("logsStorage");
    return logsStorageValue ? JSON.parse(logsStorageValue) : false;
  });
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const { setStoringLogs } = useServerLogsStore();
  const [logsFromDB, setLogsFromDB] = React.useState<LogEntry[]>(dbLogs);

  // READ LOGS FROM LOCALSTORAGE BEFORE SETTING
  useEffect(() => {
    // Read logs from localStorage first
    const storedLogs = localStorage.getItem("logsData");
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    }
  }, []);
  console.log(logsFromDB, "logsFromDB");

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

      setSaveLogs(false);
      handleRefreshLogs();
      toast.success("All logs have been removed from database");
    } catch (error) {
      console.error(error);
      toast.error(error);
    }
  };

  // REFRESH LOGS
  const handleRefreshLogs = async () => {
    setIsLoading(true);

    try {
      const data = await invoke("read_logs_from_db");
      console.log(data, "Data from logs DB");
      setLogsFromDB(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE SINGLE LOG
  const handleDeleteLog = async (id: string) => {
    try {
      await invoke("delete_log_from_db", { id });
      toast.success("Log deleted successfully");
      handleRefreshLogs();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete log");
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
                <h3 className="text-lg dark:text-white font-semibold text-left">
                  Stored Server Logs
                </h3>
                <div className="border dark:border-gray-700 rounded-lg h-[370px] overflow-y-auto">
                  {logsFromDB.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center text-sm mb-1">
                          <FaFile className="mr-2 text-black" />
                          <p className="text-sm dark:text-white truncate -ml-1">
                            {log?.filename}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="inline-block text-xs ml-[1px] text-black" />{" "}
                          <span
                            className={`text-[10px] -ml-[2px] font-mono text-gray-500`}
                          >
                            {formatTimestamp(log?.date)}
                            {/* {log?.timestamp} */}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove log"
                        disabled={isLoading}
                        className="h-8 w-8 ml-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                        onClick={() => handleDeleteLog(log.id)}
                      >
                        <X className="h-4 w-4 text-gray-500 dark:text-red-400" />
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
