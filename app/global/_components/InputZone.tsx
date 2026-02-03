// @ts-nocheck
"use client";
import MenuDrawer from "@/app/components/ui/MenuDrawer";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import useLoaderStore from "@/store/loadersStore";
import { CiGlobe } from "react-icons/ci";
import { IoIosClose } from "react-icons/io";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  FiGlobe,
  FiSearch,
  FiTrash2,
  FiClock,
  FiCornerDownLeft,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InputZoneProps {
  handleDomainCrawl: (url: string) => void;
}

const InputZone = ({ handleDomainCrawl }: InputZoneProps) => {
  const [url, setUrl] = useState("");
  const { domainCrawlLoading, crawlData, favicon } = useGlobalCrawlStore();
  const [historyUrls, setHistoryUrls] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value.toLowerCase());
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && url.trim() && !domainCrawlLoading) {
      handleDomainCrawl(url.trim());
      setShowHistory(false);
      inputRef.current?.blur();
    }
  };

  const handleButtonCrawl = () => {
    if (url.trim() && !domainCrawlLoading) {
      handleDomainCrawl(url.trim());
      setShowHistory(false);
      inputRef.current?.blur();
    }
  };

  const getHistoryUrls = useCallback(() => {
    const history = localStorage.getItem("searchHistory");
    if (history) {
      try {
        const parsed = JSON.parse(history);
        setHistoryUrls(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setHistoryUrls([]);
      }
    }
  }, []);

  const handleDeleteHistory = (urlToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = historyUrls.filter((u) => u !== urlToDelete);
    setHistoryUrls(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
  };

  useEffect(() => {
    getHistoryUrls();
  }, [crawlData, getHistoryUrls]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed top-[28px] left-0 right-0 z-[2000] h-11 border-b bg-white/95 dark:bg-brand-darker/98 backdrop-blur-md flex items-center px-4 border-gray-100 dark:border-brand-dark transition-all duration-300 shadow-sm dark:bg-brand-darker">
      <MenuDrawer />

      <section className="flex-1 max-w-2xl mx-auto px-4 lg:px-6 transition-all duration-300 border-l h-full border-r flex items-center dark:border-brand-dark w-full">
        <div className="relative group w-full">
          <div
            className={cn(
              "relative flex items-center h-8.5 w-full rounded-xl transition-all duration-500 border overflow-hidden",
              isFocused
                ? "border-brand-bright/40 ring-[3px] ring-brand-bright/5 bg-white dark:bg-brand-darker shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                : "border-gray-200/60 dark:border-white/5 bg-gray-50/30 dark:bg-black/20 hover:border-gray-300 dark:hover:border-white/10",
            )}
          >
            {/* Favicon Area with Separator */}
            <div className="flex items-center justify-center w-10 overflow-hidden  h-full border-r border-gray-100 dark:border-white/5 bg-gray-100/10 dark:bg-brand-darker">
              <AnimatePresence mode="wait">
                {favicon ? (
                  <div className="bg-slate-100 dark:bg-brand-dark h-8 w-full flex justify-center">
                    <motion.img
                      key="favicon"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      src={favicon}
                      alt=""
                      className="w-4  rounded-sm object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <motion.div
                    key="globe"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                  >
                    <CiGlobe
                      className={cn(
                        "w-4 h-7 transition-colors duration-300",
                        isFocused
                          ? "text-brand-bright"
                          : "text-gray-400 dark:text-gray-500",
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              ref={inputRef}
              type="url"
              placeholder="Analyze domain..."
              value={url}
              onFocus={() => {
                setIsFocused(true);
                setShowHistory(true);
              }}
              onBlur={() => setIsFocused(false)}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              className="flex-1 h-full bg-transparent text-[11px] text-gray-900 dark:text-brand-normal placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none font-medium px-3"
            />

            {/* Content Actions */}
            <div className="flex items-center gap-1.5 pr-1">
              <AnimatePresence>
                {url && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => {
                      setUrl("");
                      inputRef.current?.focus();
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    <IoIosClose className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>

              <button
                disabled={domainCrawlLoading || !url.trim()}
                onClick={handleButtonCrawl}
                className={cn(
                  "relative group/btn flex items-center justify-center gap-2 h-6 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:cursor-not-allowed",
                  domainCrawlLoading
                    ? "bg-white dark:bg-brand-dark px-4 border border-gray-200 dark:border-white/10 shadow-none text-brand-bright w-14"
                    : "bg-brand-bright hover:bg-blue-600 text-white shadow-sm border border-brand-bright/20 disabled:opacity-30 disabled:grayscale w-14",
                )}
              >
                {domainCrawlLoading ? (
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-0 border-2 border-brand-bright/10 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-t-brand-bright rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    <span>CRAWL </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Premium History Dropdown */}
          {showHistory && historyUrls.length > 0 && (
            <div
              ref={historyRef}
              initial={{
                opacity: 0,
                y: 10,
                scale: 0.99,
                filter: "blur(4px)",
              }}
              animate={{ opacity: 1, y: 12, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 10, scale: 0.99, filter: "blur(4px)" }}
              className="absolute left-0 right-0 z-[10000] bg-white dark:bg-brand-darker border border-gray-200 dark:border-brand-dark shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden p-1.5"
            >
              <div className="flex items-center justify-between px-3 py-1.5 mb-1.5 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <FiClock className="text-[10px]" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em]">
                    Recently Crawled
                  </span>
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-0.5">
                {historyUrls.map((hUrl, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setUrl(hUrl);
                      handleDomainCrawl(hUrl);
                      setShowHistory(false);
                    }}
                    className="group flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-white/5"
                  >
                    <div className="flex items-center gap-3 overflow-hidden ml-1">
                      <div className="w-5 h-5 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-brand-bright/10 transition-colors">
                        <FiGlobe className="w-3 h-3 text-gray-400 dark:text-gray-600 group-hover:text-brand-bright transition-colors" />
                      </div>
                      <span className="text-[11px] text-gray-600 dark:text-gray-400 truncate font-semibold group-hover:text-black dark:group-hover:text-brand-normal">
                        {hUrl}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => handleDeleteHistory(hUrl, e)}
                        className="p-1.5 hover:bg-rose-500/10 text-gray-300 dark:text-gray-600 hover:text-rose-500 rounded-lg transition-all"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default InputZone;
