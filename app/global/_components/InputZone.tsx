// @ts-nocheck
"use client";
import MenuDrawer from "@/app/components/ui/MenuDrawer";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import useLoaderStore from "@/store/loadersStore";
import { CiGlobe } from "react-icons/ci";
import { IoIosClose } from "react-icons/io";
import React, { useEffect, useRef, useState } from "react";

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
      console.log("History:", parsedHistory);
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
                className="absolute dark:bg-brand-darker border dark:border-white/20  cursor-pointer top-8 left-0 z-[10000] bottom-1.5 text-red-500 block h-44 max-h-50 bg-slate-50 shadow-md w-[32.5rem] rounded-md overflow-scroll pt-1"
              >
                {historyUrls.map((historyUrl, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-2 pt-1"
                  >
                    <span
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 flex items-center  w-full text-sm  bg-blue-500/20 rounded-sm px-1 my-0.5 ml-1 mr-2  pr-3  max-w-[calc(100%-4rem)] truncate dark:hover:text-white h-8 pl-2 justify-between"
                      onClick={(e) => {
                        handleDomainCrawl(historyUrl);
                        setUrl(historyUrl);
                        setShowHistory(false);
                      }}
                    >
                      {historyUrl}
                    </span>
                    <button
                      onClick={() => handleDeleteHistory(historyUrl)}
                      className="  text-xs bg-red-500 text-white px-2 py-1  rounded-md absolute right-0 mr-2"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default InputZone;
