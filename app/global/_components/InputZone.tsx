"use client";
import MenuDrawer from "@/app/components/ui/MenuDrawer";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import useCrawlStore from "@/store/GlobalCrawlDataStore";
import useLoaderStore from "@/store/loadersStore";
import { invoke } from "@tauri-apps/api/core";
import React, { useState } from "react";
import { CiGlobe } from "react-icons/ci";
import { IoIosClose } from "react-icons/io";

interface PageDetails {
  title: string;
  h1: string;
}

interface CrawlResult {
  visited_urls: Record<string, PageDetails>;
  all_files: Record<string, { url: string; file_type: string }>;
}

interface InputZoneProps {
  handleeDomainCrawl: () => void;
}

const InputZone = ({ handleDomainCrawl }: InputZoneProps) => {
  const { loaders, showLoader, hideLoader } = useLoaderStore();
  const [url, setUrl] = useState("");
  const { setCrawlData } = useGlobalCrawlStore();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value.toLowerCase());
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleDomainCrawl();
    }
  };

  return (
    <div className="fixed top-[28px] left-0 right-0 z-[2000] h-11 border-b  bg-white dark:bg-brand-darker flex items-center px-4 dark:border-b-brand-dark">
      <MenuDrawer />
      <section className="flex items-center justify-end mx-auto relative w-full max-w-[40rem] border-r border-l pl-4 dark:border-l-brand-dark dark:border-r-brand-dark h-full pr-4">
        <div className="flex items-center w-full">
          <div className="relative inline-block text-left z-[900000]"></div>
          <div className="relative flex items-center ml-2 flex-grow">
            <CiGlobe className="absolute ml-3 text-gray-400" />
            <input
              type="url"
              required
              placeholder="https://yourwebsite.com"
              value={url}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full h-7 text-xs pl-8 rounded-l-md bg-slate-100 dark:bg-blue-900/5 dark:bg-brand-darker dark:border dark:border-white/20 dark:text-white placeholder:text-gray-500 border rounded-r-md lowercase"
              style={{ outline: "none", boxShadow: "none" }}
            />
            <IoIosClose
              onClick={() => setUrl("")}
              className={`absolute cursor-pointer right-[5.5rem] z-[10000] bottom-1.5 text-red-500 inline-block ${url ? "block" : "hidden"}`}
            />{" "}
            <button
              onClick={handleDomainCrawl}
              className="rounded w-20 active:scale-95 text-sm relative inline-flex group py-[3px] items-center justify-center  ml-3 cursor-pointer border-b-4 border-l-2 active:border-blue-600 active:shadow-none bg-gradient-to-tr from-brand-bright to-blue-500 border-blue-700 text-white"
            >
              <span className="relative text-xs">
                {loaders.globalCrawler ? (
                  <div
                    className="top-0.5 right-4 z-[32423454] w-4 h-4 border-4 border-t-transparent border-white rounded-full animate-spin cursor-pointer"
                    role="status"
                    aria-label="loading"
                    onClick={() => window.location.reload()}
                  />
                ) : (
                  "Crawl"
                )}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InputZone;
