// @ts-nocheck
"use client";
import MenuDrawer from "@/app/components/ui/MenuDrawer";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import useLoaderStore from "@/store/loadersStore";
import { CiGlobe } from "react-icons/ci";
import { IoIosClose } from "react-icons/io";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { FiGlobe, FiSearch, FiTrash2, FiClock } from "react-icons/fi";
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
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed top-[28px] left-0 right-0 z-[2000] h-11 border-b bg-white/95 dark:bg-brand-darker/98 backdrop-blur-md flex items-center px-4 border-gray-100 dark:border-brand-dark transition-all duration-300 shadow-sm">
      <MenuDrawer />

      <section className="flex-1 max-w-2xl mx-auto px-4 lg:px-10 transition-all duration-300">
        <div className="relative group">
          <div className={cn(
            "relative flex items-center h-8.5 w-full rounded-xl transition-all duration-500 border overflow-hidden",
            isFocused
              ? "border-brand-bright/50 ring-2 ring-brand-bright/10 bg-white dark:bg-brand-dark shadow-lg"
              : "border-gray-200/50 dark:border-white/5 bg-gray-50/30 dark:bg-zinc-900/40 hover:border-gray-300 dark:hover:border-white/10"
          )}>

            {/* Favicon or Globe Container */}
            <div className="flex items-center justify-center w-10 h-full">
              <AnimatePresence mode="wait">
                {favicon ? (
                  <motion.img
                    key="favicon"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    src={favicon}
                    alt=""
                    className="w-4 h-4 rounded-sm object-contain"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <motion.div
                    key="globe"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <CiGlobe className={cn("w-4 h-4 transition-colors duration-300", isFocused ? "text-brand-bright" : "text-gray-400")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              ref={inputRef}
              type="url"
              placeholder="Analyze domain..."
              value={url}
              onFocus={() => { setIsFocused(true); setShowHistory(true); }}
              onBlur={() => setIsFocused(false)}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              className="flex-1 h-full bg-transparent text-[11px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600 outline-none font-medium px-3"
            />

            {/* Content Actions */}
            <div className="flex items-center gap-1.5 pr-1">
              <AnimatePresence>
                {url && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => { setUrl(""); inputRef.current?.focus(); }}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
                  >
                    <IoIosClose className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>

              <button
                disabled={domainCrawlLoading || !url.trim()}
                onClick={handleButtonCrawl}
                className={cn(
                  "flex items-center justify-center gap-2 h-7 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed",
                  "bg-gradient-to-tr from-brand-bright to-blue-600 hover:from-blue-600 hover:to-brand-bright text-white shadow-md shadow-brand-bright/10 border border-white/10"
                )}
              >
                {domainCrawlLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <>
                    <FiSearch className="text-[10px] stroke-[3px]" />
                    <span>Analyze</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Enhanced History Dropdown */}
          <AnimatePresence>
            {showHistory && historyUrls.length > 0 && (
              <motion.div
                ref={historyRef}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 12, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="absolute left-0 right-0 z-[10000] bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-dark shadow-2xl rounded-2xl overflow-hidden p-1.5"
              >
                <div className="flex items-center justify-between px-3 py-2 mb-1 opacity-50">
                  <div className="flex items-center gap-2">
                    <FiClock className="text-[10px]" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Crawl History</span>
                  </div>
                </div>

                <div className="max-h-[320px] overflow-y-auto custom-scrollbar space-y-0.5">
                  {historyUrls.map((hUrl, index) => (
                    <motion.div
                      key={hUrl}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      role="button"
                      tabIndex={0}
                      onClick={() => { setUrl(hUrl); handleDomainCrawl(hUrl); setShowHistory(false); }}
                      className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-white/5"
                    >
                      <div className="flex items-center gap-3 overflow-hidden ml-1">
                        <FiGlobe className="w-4 h-4 text-gray-300 group-hover:text-brand-bright transition-colors flex-none" />
                        <span className="text-xs text-gray-600 dark:text-zinc-400 truncate font-semibold group-hover:text-black dark:group-hover:text-zinc-100">
                          {hUrl}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteHistory(hUrl, e)}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-gray-300 hover:text-rose-500 rounded-lg transition-all"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default InputZone;
