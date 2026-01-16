// @ts-nocheck
"use client";
import useCrawlStore from "@/store/GlobalCrawlDataStore";
import { FaSpider } from "react-icons/fa6";
import { useEffect, useState, useCallback } from "react";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";
import { emit } from "@tauri-apps/api/event";
import { IconVolume } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { GiRobotAntennas, GiRobotHelmet, GiSpiderAlt } from "react-icons/gi";
import useSettingsStore from "@/store/SettingsStore";
import { Tooltip, Stack, Text, Group, Badge } from "@mantine/core";

// Constants for crawler types
const CRAWLER_TYPES = {
  SPIDER: "Spider",
  CUSTOM_SEARCH: "Custom Search",
};

const CrawlerType = () => {
  const { crawlerType, setCrawlerType } = useCrawlStore();
  const { setCrawler } = useGlobalConsoleStore();
  const { triggerRefresh } = useSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load crawler type from localStorage on mount
  useEffect(() => {
    const savedType = localStorage.getItem("crawlerType");
    if (
      savedType &&
      (savedType === CRAWLER_TYPES.SPIDER ||
        savedType === CRAWLER_TYPES.CUSTOM_SEARCH)
    ) {
      setCrawlerType(savedType);
      setCrawler(savedType);
    }
  }, [setCrawlerType, setCrawler]);
  // PSI DETAILS
  const [details, setDetails] = useState({
    apiKey: "",
    psiCrawl: false,
  });
  const [javascriptRendering, setJavascriptRendering] = useState(false);

  const toggleJavascriptRendering = async () => {
    const newValue = !javascriptRendering;
    setJavascriptRendering(newValue);
    try {
      await invoke("toggle_javascript_rendering", { value: newValue });
      triggerRefresh();
      toast.success("Javascript Rendering toggled successfully");
    } catch (error) {
      console.error("Failed to toggle javascript rendering:", error);
      setJavascriptRendering(!newValue);
      toast.error("Failed to toggle Javascript Rendering");
    }
  };

  // Load PSI details from localStorage (fallback)
  const loadPSIDetailsFromLocalStorage = useCallback(() => {
    try {
      const psidetails = localStorage.getItem("PSIdetails");
      if (!psidetails) {
        console.log("No PSI details found in localStorage");
        return;
      }

      const parsedPSIdetails = JSON.parse(psidetails);
      const isPsiCrawlEnabled =
        parsedPSIdetails.page_speed_crawl === "true" ||
        parsedPSIdetails.page_speed_crawl === true ||
        parsedPSIdetails.page_speed_crawl === 1 ||
        parsedPSIdetails.page_speed_crawl === "1";

      setDetails({
        apiKey: parsedPSIdetails.apiKey || "",
        psiCrawl: isPsiCrawlEnabled,
      });
    } catch (error) {
      console.error("Error parsing PSI details from localStorage:", error);
    }
  }, []);

  // Fetch backend state when modal opens
  const fetchBackendState = useCallback(async () => {
    try {
      const backendDetails = await invoke("check_page_speed_bulk");
      setDetails({
        apiKey: backendDetails.apiKey || "",
        psiCrawl: backendDetails.page_speed_crawl,
      });

      const settings = await invoke<any>("get_settings_command");
      setJavascriptRendering(settings.javascript_rendering);
    } catch (error) {
      console.error("Error fetching backend state:", error);
      // Fallback to localStorage if backend fetch fails
      loadPSIDetailsFromLocalStorage();
    }
  }, [loadPSIDetailsFromLocalStorage]);

  // Toggle between "Spider" and "Custom Search"
  const toggleCrawlerType = () => {
    const newType =
      crawlerType === CRAWLER_TYPES.SPIDER
        ? CRAWLER_TYPES.CUSTOM_SEARCH
        : CRAWLER_TYPES.SPIDER;
    setCrawlerType(newType);
    setCrawler(newType);
    // Save to localStorage
    localStorage.setItem("crawlerType", newType);
  };

  // Toggle PSI Crawl
  const togglePsiCrawl = async () => {
    const newPsiCrawlValue = !details.psiCrawl;

    // Update local state immediately for UI responsiveness
    setDetails((prev) => ({
      ...prev,
      psiCrawl: newPsiCrawlValue,
    }));

    try {
      // Call the Tauri command with the new value
      await invoke("toggle_page_speed_bulk", { value: newPsiCrawlValue });

      // Trigger settings refresh to update UI
      triggerRefresh();

      // Update localStorage with the new value (save as boolean, not string)
      if (details.apiKey) {
        localStorage.setItem(
          "PSIdetails",
          JSON.stringify({
            apiKey: details.apiKey,
            page_speed_crawl: newPsiCrawlValue, // Always save as boolean
          }),
        );
        toast.success("Page Speed Insights toggled successfully");
      }
    } catch (error) {
      console.error(`Failed to toggle page speed bulk: ${error}`);
      // Revert state on error
      setDetails((prev) => ({
        ...prev,
        psiCrawl: !newPsiCrawlValue,
      }));
    }
  };

  // Determine icon color/animation based on active settings
  const getIconClass = () => {
    const isPsi = details.psiCrawl && details.apiKey;
    const isJs = javascriptRendering;

    if (isPsi && isJs) return "animate-cycle-purple-orange mt-[2px]";
    if (isPsi) return "animate-pulse-purple mt-[2px]";
    if (isJs) return "animate-flash-orange mt-[2px]";

    // Fallback to existing logic
    return crawlerType === CRAWLER_TYPES.CUSTOM_SEARCH
      ? "text-red-500 dark:text-red-500/50 mt-[2px]"
      : "text-black dark:text-white/50 mt-[2px]";
  };

  const iconColorClass = getIconClass();

  // HANDLE THE PSI DETAILS TO SHOW THE USER THAT PSI IS ACTIVATED
  // Fetch backend state on component mount to update icon color immediately
  useEffect(() => {
    fetchBackendState();
  }, [fetchBackendState]);

  // Fetch backend state when modal opens (to ensure fresh data)
  useEffect(() => {
    if (isModalOpen) {
      fetchBackendState();
    }
  }, [isModalOpen, fetchBackendState]);

  return (
    <div className="relative">
      <style>{`
        @keyframes pulse-purple {
          0%, 100% { color: #a855f7; opacity: 1; }
          50% { color: #c084fc; opacity: 0.7; }
        }
        @keyframes flash-orange {
          0%, 100% { color: #f97316; opacity: 1; }
          50% { color: #fb923c; opacity: 0.4; }
        }
        @keyframes cycle-purple-orange {
          0% { color: #a855f7; }
          50% { color: #f97316; }
          100% { color: #a855f7; }
        }
        .animate-pulse-purple { animation: pulse-purple 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-flash-orange { animation: flash-orange 1s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-cycle-purple-orange { animation: cycle-purple-orange 3s linear infinite; }
      `}</style>

      {/* Icon Button details tooltip */}
      <Tooltip
        label={
          <Stack gap="xs" p={4}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Configured Settings
            </Text>

            <Group justify="space-between" gap="xl" align="center">
              <Text size="xs" fw={500}>
                Crawler Type
              </Text>
              <Badge
                size="sm"
                variant="light"
                color={crawlerType === CRAWLER_TYPES.SPIDER ? "blue" : "red"}
              >
                {crawlerType}
              </Badge>
            </Group>

            <Group justify="space-between" gap="xl" align="center">
              <Text size="xs" fw={500}>
                Javascript Mode
              </Text>
              <Badge
                size="sm"
                variant="dot"
                color={javascriptRendering ? "orange" : "gray"}
              >
                {javascriptRendering ? "Active" : "Disabled"}
              </Badge>
            </Group>

            {details.apiKey && (
              <Group justify="space-between" gap="xl" align="center">
                <Text size="xs" fw={500}>
                  PSI
                </Text>
                <Badge
                  size="sm"
                  variant="dot"
                  color={details.psiCrawl ? "violet" : "gray"}
                >
                  {details.psiCrawl ? "Enabled" : "Disabled"}
                </Badge>
              </Group>
            )}
          </Stack>
        }
        position="top"
        withArrow
        transitionProps={{ duration: 200, transition: "pop" }}
        multiline
        w={240}
        color="dark"
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className={`transition-colors`}
          aria-label="Open crawler settings"
        >
          <GiRobotAntennas className={`text-sm p-[1px] ${iconColorClass}`} />
        </button>
      </Tooltip>

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

            {/* Toggle Switch for Javascript Rendering */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md mb-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Javascript Mode:{" "}
                <span
                  className={
                    javascriptRendering
                      ? "text-green-500 font-medium"
                      : "text-red-500 font-medium"
                  }
                >
                  {javascriptRendering ? "On" : "Off"}
                </span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={javascriptRendering}
                  onChange={toggleJavascriptRendering}
                  className="sr-only peer"
                  aria-label="Toggle Javascript Rendering"
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
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                aria-label="Close and save settings"
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
