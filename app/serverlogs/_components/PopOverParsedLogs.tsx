// @ts-nocheck
import { useServerLogsStore } from "@/store/ServerLogsGlobalStore";
import {
  FaFileAlt,
  FaCalendarAlt,
  FaClock,
  FaRegFileAlt,
} from "react-icons/fa";
import { FaFile } from "react-icons/fa6";

interface LogEntry {
  names: string[];
  time: string;
  individualSizes: number[];
  totalSize: number;
  totalBatchSize: number; // Changed to required since we're using it
}

const PopOverParsedLogs = () => {
  const { uploadedLogFiles } = useServerLogsStore();

  console.log(uploadedLogFiles, "LOGS STORED");

  const totalLogsAnalysed = uploadedLogFiles
    .map((log) => log?.names?.length || 0)
    .reduce((a, b) => a + b, 0);

  const totalSizeinMB = uploadedLogFiles
    .map((log) => (log?.totalSize || 0) / (1024 * 1024)) // Convert bytes to MB
    .reduce((a, b) => a + b, 0);

  const batchSize = uploadedLogFiles
    .map((log) => (log?.totalBatchSize || 0) / (1024 * 1024)) // Convert bytes to MB
    .reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col rounded-lg z-20">
      <h2 className="font-semibold mb-1 text-xs font-mono pl-3 pb-2 pt-1 shadow text-brand-bright">
        Logs: {totalLogsAnalysed} | Batches: {uploadedLogFiles.length} | Size:{" "}
        {totalSizeinMB.toFixed(1)} MB
      </h2>
      <section className="flex flex-col gap-2 max-h-80 overflow-auto px-2 pt-1">
        {Array.isArray(uploadedLogFiles) &&
          uploadedLogFiles.map((logEntry: LogEntry, index: number) => (
            <div
              key={index}
              className="bg-white rounded - flex items-start gap-3 border dark:border-brand-darker p-2 dark:bg-slate-900"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 dark:text-white font-semibold">
                  <FaCalendarAlt />
                  <span>{new Date(logEntry?.time).toLocaleDateString()}</span>
                  <FaClock className="ml-2" />
                  <span>
                    Time: {new Date(logEntry?.time).toLocaleTimeString()}
                  </span>
                </div>

                {/* Display all files in this log entry */}
                {logEntry.names?.map((fileName: string, fileIndex: number) => (
                  <div
                    key={fileIndex}
                    className="flex items-center space-x-2 mt-1"
                  >
                    <FaRegFileAlt className="text-brand-bright text-xs dark:text-white" />
                    <div className="text-brand-bright text-xs dark:text-brand-bright flex items-center space-x-2">
                      <span>{fileName}</span>
                      <span className="text-gray-400 text-[9px]">
                        {(
                          logEntry.individualSizes[fileIndex] /
                          (1024 * 1024)
                        ).toFixed(1)}{" "}
                        MB
                      </span>
                    </div>
                  </div>
                ))}

                {/* Batch size display - moved outside the files loop */}
                <div className="mt-2 text-[9px] text-gray-500 dark:text-gray-400 border-t pt-1">
                  Batch contains {logEntry?.names?.length} files | Total size:{" "}
                  {(
                    logEntry?.individualSizes?.reduce((a, b) => a + b, 0) /
                    (1024 * 1024)
                  ).toFixed(1)}{" "}
                  MB
                </div>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
};

export default PopOverParsedLogs;
