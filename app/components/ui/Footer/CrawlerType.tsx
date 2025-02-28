import useCrawlStore from "@/store/GlobalCrawlDataStore";
import { FaSpider } from "react-icons/fa6";
import { useState } from "react";

const CrawlerType = () => {
  const { crawlerType, setCrawlerType } = useCrawlStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleCrawlerType = () => {
    const newType = crawlerType === "spider" ? "extractor" : "spider";
    setCrawlerType(newType);
  };

  // Determine icon color based on crawlerType
  const iconColorClass =
    crawlerType === "extractor"
      ? "text-red-500 dark:text-red-500/50"
      : "text-black dark:text-white/50";

  return (
    <div className="relative">
      {/* Icon Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`transition-colors`}
        title={`Crawler Type: ${crawlerType}`}
      >
        <FaSpider className={`text-sm ${iconColorClass}`} />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80 p-4 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Crawler Settings
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                  checked={crawlerType === "extractor"}
                  onChange={toggleCrawlerType}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Footer */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
