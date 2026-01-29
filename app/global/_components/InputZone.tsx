// @ts-nocheck
"use client";
import MenuDrawer from "@/app/components/ui/MenuDrawer";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import useLoaderStore from "@/store/loadersStore";
import { CiGlobe } from "react-icons/ci";
import { IoIosClose } from "react-icons/io";
import React, { useEffect, useRef, useState } from "react";
import { FiGlobe } from "react-icons/fi";

interface InputZoneProps {
  handleDomainCrawl: (url: string) => void; // Fixed prop type
}

const InputZone = ({ handleDomainCrawl }: InputZoneProps) => {
  const { loaders, showLoader, hideLoader } = useLoaderStore();
  const [url, setUrl] = useState("");
  const { setCrawlData, domainCrawlLoading, crawlData } = useGlobalCrawlStore();
  const [historyUrls, setHistoryUrls] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value.toLowerCase());
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      console.log("Sending to crawl:", url);
      handleDomainCrawl(url);
      setShowHistory(false);
    }
  };

  const handleButtonCrawl = () => {
    handleDomainCrawl(url);
    setShowHistory(false);
  };

  // GET THE HISTORY URLS FROM LOCALSTORAGE
  function getHistoryUrls() {
    const history = localStorage.getItem("searchHistory");
    if (history) {
      const parsedHistory = JSON.parse(history);
      // console.log("History:", parsedHistory);
      setHistoryUrls(parsedHistory);
    }
    return [];
  }

  const handleDeleteHistory = (urlToDelete: string) => {
    const updatedHistory = historyUrls.filter((url) => url !== urlToDelete);
    setHistoryUrls(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
  };

  useEffect(() => {
    getHistoryUrls();
  }, [crawlData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        historyRef.current &&
        !historyRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed top-[28px] left-0 right-0 z-[2000] h-11 border-b  bg-white dark:bg-brand-darker flex items-center px-4 dark:border-b-brand-dark">
      <MenuDrawer />
      <section className="flex items-center justify-end mx-auto relative w-full max-w-[40rem] border-r border-l pl-4 dark:border-l-brand-dark dark:border-r-brand-dark h-full pr-4">
        <div className="flex items-center w-full">
          <div className="relative flex items-center ml-2 flex-grow">
            <CiGlobe className="absolute ml-3 text-gray-400" />
            <input
              type="url"
              required
              placeholder="www.yourwebsite.com"
              value={url}
              onClick={() => setShowHistory(!showHistory)}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              className="w-full h-7 text-xs pl-8 rounded-l-md bg-slate-100 dark:bg-blue-900/5 dark:bg-brand-darker dark:border dark:border-white/20 dark:text-white placeholder:text-gray-500 border rounded-r-md lowercase "
              style={{ outline: "none", boxShadow: "none" }}
            />
            <IoIosClose
              onClick={() => setUrl("")}
              className={`absolute cursor-pointer right-[5.5rem] z-[10000] bottom-1.5 text-red-500 inline-block ${url ? "block" : "hidden"}`}
            />
            <button
              onClick={handleButtonCrawl}
              className="rounded w-20 active:scale-95 text-sm relative inline-flex group py-[3px] items-center justify-center ml-3 cursor-pointer border-b-4 border-l-2 active:border-blue-600 active:shadow-none bg-gradient-to-tr from-brand-bright to-blue-500 border-blue-700 text-white"
            >
              <span className="relative text-xs">
                {domainCrawlLoading ? (
                  <div
                    className="top-0.5 right-4 z-[32423454] w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin cursor-pointer"
                    role="status"
                    aria-label="loading"
                    // onClick={() => window.location.reload()}
                  />
                ) : (
                  "Crawl"
                )}
              </span>
            </button>
            {showHistory && historyUrls.length > 0 && (
              <section
                ref={historyRef}
                className="absolute dark:bg-brand-darker border dark:border-white/20 top-8 left-0 z-[10000] bg-white dark:bg-gray-900 shadow-lg w-[32.5rem] rounded-lg overflow-hidden"
              >
                <div className="max-h-48 overflow-y-auto">
                  {historyUrls.map((historyUrl, index) => (
                    <div
                      key={index}
                      className="group flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <span
                        className="flex-1 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 cursor-pointer truncate transition-colors duration-150 hover:font-semibold"
                        onClick={(e) => {
                          handleDomainCrawl(historyUrl);
                          setUrl(historyUrl);
                          setShowHistory(false);
                        }}
                      >
                        <div className="flex items-center">
                          <FiGlobe className="mr-2" />
                          {historyUrl}
                        </div>
                      </span>
                      <button
                        onClick={() => handleDeleteHistory(historyUrl)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-3 py-3 transition-all duration-150"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default InputZone;
