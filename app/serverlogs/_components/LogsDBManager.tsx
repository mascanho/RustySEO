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
import { invoke } from "@/lib/invoke";
import { FaCalendarAlt, FaClock, FaFile } from "react-icons/fa";
import { FaHourglass } from "react-icons/fa6";
import Spinner from "@/app/components/ui/Sidebar/checks/_components/Spinner";
import { SkeletonLoader } from "./SkeletonLoader";
import { MdErrorOutline } from "react-icons/md";

const formatTimestamp = (timestamp) => {
  if (!timestamp || typeof timestamp !== "string") {
    return "Invalid Timestamp";
  }

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour24: true,
      // timeZone: "GTM",
    });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Invalid Timestamp";
  }
};

export default function LogsDBManager({ closeDialog, dbLogs }: any) {
  const [saveLogs, setSaveLogs] = React.useState(() => {
    const logsStorageValue = localStorage.getItem("logsStorage");
    return logsStorageValue ? JSON.parse(logsStorageValue) : false;
  });
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true); // Set initial loading state to true
  const { setStoringLogs, storedLogsFromDBStore } = useServerLogsStore();
  const [logsFromDB, setLogsFromDB] = React.useState<LogEntry[]>(
    storedLogsFromDBStore,
  );

  useEffect(() => {
    const storedLogs = localStorage.getItem("logsData");
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("logsStorage", JSON.stringify(saveLogs));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "logsStorage",
        newValue: JSON.stringify(saveLogs),
      }),
    );

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
      // setSaveLogs(false);
      handleRefreshLogs();
      toast.success("All logs have been removed from database");
    } catch (error) {
      console.error(error);
      toast.error(error);
    }
  };

  const handleRefreshLogs = async () => {
    setIsLoading(true);
    try {
      const data = await invoke("read_logs_from_db");
      setLogsFromDB(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRefreshLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle the logs being displayed from the storage
  const handleDisplayLogs = async () => {
    try {
      const data = await invoke("get_stored_logs_command");
      console.log(data);
      toast.success("Logs have been retrieved from the database");
    } catch (error) {
      console.error(error);
      toast.error(error);
    }
  };

  return (
    <section className="w-[750px] max-w-5xl mx-auto h-[670px] pt-2">
      <CardContent className="grid grid-cols-1 gap-6 h-[480px]">
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
                  <div className="space-y-4 p-4 border rounded-md bg-muted h-[360px] dark:border-brand-dark">
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
                      When enabled it will incrementally add logs into your
                      local database.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Log Messages */}
              <div>
                <h3 className="text-lg dark:text-white font-semibold text-left">
                  Stored Server Logs
                </h3>
                <div className="border dark:border-brand-dark dark:border-brand rounded-lg h-[460px] overflow-y-auto">
                  {isLoading ? (
                    <SkeletonLoader />
                  ) : logsFromDB.length > 0 ? (
                    logsFromDB.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center text-sm mb-1">
                            <FaFile className="mr-2 text-black dark:text-white" />
                            <p className="text-sm text-brand-bright font-semibold dark:text-brand-bright  truncate -ml-1">
                              {log?.filename}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="inline-block text-xs ml-[1px] text-black dark:text-white" />{" "}
                            <span
                              className={`text-[10px] -ml-[2px] font-mono text-gray-500`}
                            >
                              {formatTimestamp(log?.date)}
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
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <MdErrorOutline className="h-8 w-8 mb-2" />
                      <p className="text-xs">No logs available.</p>
                      <p className="text-xs">
                        Enable DB storage and scan some logs.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end mt-8">
        {/* <Button */}
        {/*   variant="outline" */}
        {/*   onClick={handleDisplayLogs} */}
        {/*   className="dark:bg-brand-bright dark:border-brand-darker dark:text-white" */}
        {/* > */}
        {/*   Display saved Logs */}
        {/* </Button> */}
        <div className="flex gap-2">
          {/* <Button */}
          {/*   onClick={handleRefreshLogs} */}
          {/*   variant="secondary" */}
          {/*   disabled={isLoading} */}
          {/* > */}
          {/*   {isLoading ? ( */}
          {/*     <Loader2 className="h-4 w-4 animate-spin mr-2" /> */}
          {/*   ) : null} */}
          {/*   Refresh */}
          {/* </Button> */}
          <Button onClick={handleRemoveAllLogs} variant="destructive">
            Delete all logs
          </Button>
        </div>
      </CardFooter>
    </section>
  );
}
