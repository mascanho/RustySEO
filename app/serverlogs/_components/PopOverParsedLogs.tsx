// @ts-nocheck
import { useServerLogsStore } from "@/store/ServerLogsGlobalStore";
import {
  FaFileAlt,
  FaCalendarAlt,
  FaClock,
  FaRegFileAlt,
} from "react-icons/fa";
import { FaFile } from "react-icons/fa6";

const PopOverParsedLogs = () => {
  const { uploadedLogFiles } = useServerLogsStore();

  return (
    <div className="flex flex-col   rounded-lg z-20">
      <h2 className="font-semibold mb-1  text-xs font-mono pl-3 pb-2  pt-1 shadow text-brand-bright">
        Analysing Logs:
      </h2>
      <section className="flex flex-col gap-2 max-h-80 overflow-auto px-2 pt-1">
        {Array.isArray(uploadedLogFiles) &&
          uploadedLogFiles.map((logEntry, index) => (
            <div
              key={index}
              className="bg-white rounded shadow-sm flex items-start gap-3 border dark:border-brand-darker p-2 dark:bg-slate-900"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 dark:text-white font-semibold">
                  {/* <span>Added:</span> */}
                  <FaCalendarAlt />
                  <span>{new Date(logEntry.time).toLocaleDateString()}</span>
                  <FaClock className="ml-2" />
                  <span>
                    Time: {new Date(logEntry.time).toLocaleTimeString()}
                  </span>
                </div>

                {/* Display all files in this log entry */}
                {logEntry.name?.map((fileName, fileIndex) => (
                  <div
                    key={fileIndex}
                    className="flex items-center space-x-2 mt-1"
                  >
                    <FaRegFileAlt className="text-gray-500 text-xs dark:text-white" />
                    <div className="text-gray-800 text-xs  dark:text-brand-bright">
                      {fileName}
                    </div>
                  </div>
                ))}

                {/* Display number of log entries */}
                <div className="text-xs text-gray-400 mt-1">
                  Contains {logEntry.contents?.length || 0} log entries
                </div>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
};

export default PopOverParsedLogs;
