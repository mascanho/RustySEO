// @ts-nocheck
"use client";
import useCrawlStore from "@/store/GlobalCrawlDataStore";
import { FaSpider } from "react-icons/fa6";
import { useEffect, useState } from "react";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";
import { emit } from "@tauri-apps/api/event";
import { IconVolume } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { GiRobotAntennas, GiRobotHelmet, GiSpiderAlt } from "react-icons/gi";

// Constants for crawler types
const CRAWLER_TYPES = {
  SPIDER: "Spider",
  CUSTOM_SEARCH: "Custom Search",
};

const CrawlerType = () => {
  const { crawlerType, setCrawlerType } = useCrawlStore();
  const { setCrawler } = useGlobalConsoleStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // PSI DETAILS
  const [details, setDetails] = useState({
    apiKey: "",
    psiCrawl: false,
  });

  // Toggle between "Spider" and "Custom Search"
  const toggleCrawlerType = () => {
    const newType =
      crawlerType === CRAWLER_TYPES.SPIDER
        ? CRAWLER_TYPES.CUSTOM_SEARCH
        : CRAWLER_TYPES.SPIDER;
    setCrawlerType(newType);
    setCrawler(newType);
  };

  // Toggle PSI Crawl
  const togglePsiCrawl = async () => {
    const newPsiCrawlValue = !details.psiCrawl;

    try {
      // Call the Tauri command with the new value
      await invoke("toggle_page_speed_bulk", { value: newPsiCrawlValue });
      console.log(`PageSpeed Insights toggled: ${newPsiCrawlValue}`);

      // Update local state only after successful invocation
      setDetails((prev) => ({
        ...prev,
        psiCrawl: newPsiCrawlValue,
      }));

      // Update localStorage immediately with the new value
      if (details.apiKey) {
        localStorage.setItem(
          "PSIdetails",
          JSON.stringify({
            apiKey: details.apiKey,
            page_speed_crawl: newPsiCrawlValue,
          }),
        );
        toast.info("Page Speed Insights toggled, please restart RustySEO");
        console.log(
          "LocalStorage updated with new PSI crawl value:",
          newPsiCrawlValue,
        );
      }
    } catch (error) {
      console.error(`Failed to toggle page speed bulk: ${error}`);
    }
  };

  // Determine icon color based on crawlerType and psiCrawl
  const iconColorClass = details.psiCrawl
    ? "text-blue-500 dark:text-blue-500/50 mt-[2px]"
    : crawlerType === CRAWLER_TYPES.CUSTOM_SEARCH
      ? "text-red-500 dark:text-red-500/50 mt-[2px]"
      : "text-black dark:text-white/50 mt-[2px]";

  // HANDLE THE PSI DETAILS TO SHOW THE USER THAT PSI IS ACTIVATED
  useEffect(() => {
    try {
      // Get the PSIdetails from localStorage
      const psidetails = localStorage.getItem("PSIdetails");

      if (!psidetails) {
        console.log("No PSI details found in localStorage");
        return;
      }

      const parsedPSIdetails = JSON.parse(psidetails);
      console.log("Raw localStorage value:", psidetails);
      console.log("Parsed PSI details:", parsedPSIdetails);

      // More robust check for true values
      const isPsiCrawlEnabled =
        parsedPSIdetails.page_speed_crawl === "true" ||
        parsedPSIdetails.page_speed_crawl === true ||
        parsedPSIdetails.page_speed_crawl === 1 ||
        parsedPSIdetails.page_speed_crawl === "1";

      console.log("Is PSI crawl enabled?", isPsiCrawlEnabled);

      setDetails({
        apiKey: parsedPSIdetails.apiKey || "",
        psiCrawl: isPsiCrawlEnabled,
      });

      // Emit initial state on component mount
      emit("page-speed-bulk-toggled", isPsiCrawlEnabled).catch((error) => {
        console.error(
          `Failed to emit initial page-speed-bulk-toggled event: ${error}`,
        );
      });
    } catch (error) {
      console.error("Error parsing PSI details from localStorage:", error);
    }
  }, []);

  console.log("Current details state:", details);

  return (
    <div className="relative">
      {/* Icon Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`transition-colors`}
        title={`Crawler Type: ${crawlerType}`}
        aria-label="Open crawler settings"
      >
        <GiRobotAntennas className={`text-sm p-[1px] ${iconColorClass}`} />
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
                Crawler Methods
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Toggle Switch for Crawler Type */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md mb-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Crawler:{" "}
                <span
                  className={`${crawlerType === CRAWLER_TYPES.SPIDER ? "text-blue-600" : "text-red-500"}`}
                >
                  {" "}
                  {crawlerType}
                </span>
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

            {/* Toggle Switch for PSI Crawl (only shown when API key exists) */}
            {details.apiKey && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  PageSpeed Insights:{" "}
                  <span
                    className={
                      details.psiCrawl
                        ? "text-green-500 font-medium"
                        : "text-red-500 font-medium"
                    }
                  >
                    {details.psiCrawl ? "Enabled" : "Disabled"}
                  </span>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={details.psiCrawl}
                    onChange={togglePsiCrawl}
                    className="sr-only peer"
                    aria-label="Toggle PageSpeed Insights crawl"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  // Save PSI settings before closing
                  if (details.apiKey) {
                    localStorage.setItem(
                      "PSIdetails",
                      JSON.stringify({
                        apiKey: details.apiKey,
                        page_speed_crawl: details.psiCrawl,
                      }),
                    );
                  }
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                aria-label="Close and save settings"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrawlerType;
