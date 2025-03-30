import useCrawlStore from "@/store/GlobalCrawlDataStore";
import { FaSpider } from "react-icons/fa6";
import { useState } from "react";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";

// Constants for crawler types
const CRAWLER_TYPES = {
  SPIDER: "Spider",
  CUSTOM_SEARCH: "Custom Search",
};

const CrawlerType = () => {
  const { crawlerType, setCrawlerType } = useCrawlStore();
  const { setCrawler } = useGlobalConsoleStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toggle between "Spider" and "Custom Search"
  const toggleCrawlerType = () => {
    const newType =
      crawlerType === CRAWLER_TYPES.SPIDER
        ? CRAWLER_TYPES.CUSTOM_SEARCH
        : CRAWLER_TYPES.SPIDER;
    setCrawlerType(newType);
    setCrawler(newType);
  };

  // Determine icon color based on crawlerType
  const iconColorClass =
    crawlerType === CRAWLER_TYPES.CUSTOM_SEARCH
      ? "text-red-500 dark:text-red-500/50 mt-[2px]"
      : "text-black dark:text-white/50 mt-[2px]";

  return (
    <div className="relative">
      {/* Icon Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`transition-colors`}
        title={`Crawler Type: ${crawlerType}`}
        aria-label="Open crawler settings"
      >
        <FaSpider className={`text-sm ${iconColorClass}`} />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          ></div>

          {/* Modal Content */}
          <div
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80 p-4 border border-gray-200 dark:border-gray-700"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3
                id="modal-title"
                className="text-lg font-medium text-gray-900 dark:text-white"
              >
                Crawler Settings
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Crawler Type: {crawlerType}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={crawlerType === CRAWLER_TYPES.CUSTOM_SEARCH}
                  onChange={toggleCrawlerType}
                  className="sr-only peer"
                  aria-label="Toggle crawler type"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Footer */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                aria-label="Close modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrawlerType;
