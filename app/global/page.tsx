// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import useLoaderStore from "@/store/loadersStore";
import InputZone from "./_components/InputZone";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { Tabs } from "@mantine/core";
import { IoIosClose } from "react-icons/io";
import {
  FaGlobe,
  FaTools,
  FaTasks,
  FaHistory,
  FaChartBar,
} from "react-icons/fa"; // Import relevant icons

// Define the expected type of the result from the `crawl_domain` function
interface PageDetails {
  title: string;
  h1: string;
}

interface CrawlResult {
  visited_urls: Record<string, PageDetails>;
  all_files: Record<string, { url: string; file_type: string }>;
}

export default function Page() {
  const [data, setData] = useState<CrawlResult | null>(null);
  const [search, setSearch] = useState(""); // Search filter
  const [sortField, setSortField] = useState<
    "url" | "title" | "h1" | "file_type"
  >("url");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { loaders, showLoader, hideLoader } = useLoaderStore();
  const { crawlData } = useGlobalCrawlStore();

  useEffect(() => {
    const sessionData = sessionStorage.getItem("GlobalCrawldata");
    if (sessionData) {
      setData(JSON.parse(sessionData));
    }
  }, [crawlData]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value.toLowerCase());
  };

  const handleSortChange = (field: "url" | "title" | "h1" | "file_type") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filterData = (data: Record<string, PageDetails>) => {
    return Object.entries(data).filter(([url, details]) => {
      return (
        url.toLowerCase().includes(search) ||
        details.title.toLowerCase().includes(search) ||
        details.h1.toLowerCase().includes(search)
      );
    });
  };

  const sortData = (data: [string, PageDetails][]) => {
    return data.sort(([aUrl, aDetails], [bUrl, bDetails]) => {
      let aValue, bValue;
      if (sortField === "url") {
        aValue = aUrl;
        bValue = bUrl;
      } else if (sortField === "title") {
        aValue = aDetails.title;
        bValue = bDetails.title;
      } else if (sortField === "h1") {
        aValue = aDetails.h1;
        bValue = bDetails.h1;
      } else {
        // Handling file_type sort for the all_files table
        aValue = aDetails.file_type;
        bValue = bDetails.file_type;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const visitedUrlsEntries = data ? filterData(data.visited_urls) : [];
  const sortedVisitedUrls = sortData(visitedUrlsEntries);

  const allFilesEntries = data ? Object.entries(data.all_files) : [];
  const sortedAllFiles = sortData(allFilesEntries);

  return (
    <>
      <InputZone />
      <section className="w-full border-none h-full  dark:bg-brand-dark shadow-none rounded-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            className="mb-4 p-2 border rounded text-xs"
          />
        </div>

        {/* Tabs Component */}
        <Tabs defaultValue="first" className="overflow-auto">
          <aside className="absolute top-11 pt-1 left-0 w-full dark:bg-brand-darker z-10 bg-white">
            <Tabs.List justify="center" className="dark:text-white text-xs">
              <Tabs.Tab value="first">
                <FaGlobe className="inline-block mr-2" />
                Domain
              </Tabs.Tab>
              <Tabs.Tab value="third">
                <FaTools className="inline-block mr-2" />
                Improvements
              </Tabs.Tab>
              <Tabs.Tab value="fourth">
                <FaTasks className="inline-block mr-2" />
                Task Manager
              </Tabs.Tab>
              <Tabs.Tab value="fifth">
                <FaHistory className="inline-block mr-2" />
                Crawl History
              </Tabs.Tab>
              <Tabs.Tab value="analytics">
                <FaChartBar className="inline-block mr-2" />
                Analytics
              </Tabs.Tab>
            </Tabs.List>
          </aside>

          {/* Tabs Panel for Domain */}
          <Tabs.Panel
            value="first"
            className="flex flex-col space-y-8 overflow-scroll"
          >
            <section className="text-white h-full overflow-auto dark:bg-brand-darker mt-6">
              <div className="h-full w-full">
                {/* <h2 className="text-xl font-bold mb-4">Visited URLs</h2> */}
                <div className="h-96 overflow-auto  w-full border-b border-b-brand-darker">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th
                          className="text-left cursor-pointer text-xs"
                          onClick={() => handleSortChange("url")}
                        >
                          URL{" "}
                          {sortField === "url" &&
                            (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          className="text-left cursor-pointer"
                          onClick={() => handleSortChange("title")}
                        >
                          Title{" "}
                          {sortField === "title" &&
                            (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          className="text-left cursor-pointer"
                          onClick={() => handleSortChange("h1")}
                        >
                          H1{" "}
                          {sortField === "h1" &&
                            (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedVisitedUrls.map(([url, details]) => (
                        <tr key={url} className="border-t">
                          <td className="py-2">{url}</td>
                          <td className="py-2">{details.title}</td>
                          <td className="py-2">{details.h1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h2 className="text-xs font-bold mt-8 mb-4">All Files</h2>
                <div className="h-96 overflow-auto border-0 rounded-md">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th
                          className="text-left cursor-pointer"
                          onClick={() => handleSortChange("url")}
                        >
                          URL{" "}
                          {sortField === "url" &&
                            (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          className="text-left cursor-pointer"
                          onClick={() => handleSortChange("file_type")}
                        >
                          File Type{" "}
                          {sortField === "file_type" &&
                            (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAllFiles.map(([url, details]) => (
                        <tr key={url} className="border-t">
                          <td className="py-2">{details.url}</td>
                          <td className="py-2">{details.file_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </Tabs.Panel>
        </Tabs>
      </section>
    </>
  );
}
