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
  totalBatchSize: number;
  lineCount?: number;
}

const PopOverParsedLogs = () => {
  const { uploadedLogFiles } = useServerLogsStore();

  const totalLogsAnalysed = (
    Array.isArray(uploadedLogFiles) ? uploadedLogFiles : []
  )
    .map((log) => log?.names?.length || 0)
    .reduce((a, b) => a + b, 0);

  const totalHits = (Array.isArray(uploadedLogFiles) ? uploadedLogFiles : [])
    .map((log) => log?.lineCount || 0)
    .reduce((a, b) => a + b, 0);

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col rounded-lg z-20">
      <h2 className="font-semibold mb-1 text-xs font-mono pl-3 pb-2 pt-1 shadow text-brand-bright">
        Files: {totalLogsAnalysed} | Total Size:{" "}
        {(() => {
          const totalBytes = (
            Array.isArray(uploadedLogFiles) ? uploadedLogFiles : []
          )
            .map((log) => log?.totalSize || 0)
            .reduce((a, b) => a + b, 0);
          return formatFileSize(totalBytes);
        })()}
      </h2>
      <div className="text-[10px] pl-3 py-1 bg-brand-bright/5 text-brand-bright/70 font-mono border-b dark:border-brand-dark">
        Registered Entries: {totalHits.toLocaleString()}
      </div>
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
                        {formatFileSize(logEntry?.individualSizes?.[fileIndex])}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Batch size display - moved outside the files loop */}
                <div className="mt-2 text-[9px] text-gray-500 dark:text-gray-400 border-t dark:border-t-gray-800 pt-1 flex flex-col">
                  <span className="mt-1">
                    Batch: {logEntry?.names?.length} files | Size:{" "}
                    {formatFileSize(
                      logEntry?.individualSizes?.reduce((a, b) => a + b, 0),
                    )}
                  </span>
                  {logEntry.lineCount && (
                    <span className="text-brand-bright font-semibold">
                      Hits in this batch: {logEntry.lineCount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
};

export default PopOverParsedLogs;
