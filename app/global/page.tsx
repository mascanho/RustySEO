"use client";
import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import useLoaderStore from "@/store/loadersStore";
import InputZone from "./_components/InputZone";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

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
      <section className="w-full border-none h-full p-10 dark:bg-brand-dark shadow-none rounded-md overflow-hidden">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={handleSearchChange}
          className="mb-4 p-2 border rounded"
        />
        <section className="border text-white mt-10 h-96 overflow-auto rounded-md">
          {loaders.globalCrawler ? (
            <p>Loading...</p>
          ) : data ? (
            <div>
              <h2 className="text-xl font-bold mb-4">Visited URLs</h2>
              <table className="w-full">
                <thead>
                  <tr>
                    <th
                      className="text-left cursor-pointer"
                      onClick={() => handleSortChange("url")}
                    >
                      URL{" "}
                      {sortField === "url" && (sortOrder === "asc" ? "↑" : "↓")}
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
                      {sortField === "h1" && (sortOrder === "asc" ? "↑" : "↓")}
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

              <h2 className="text-xl font-bold mt-8 mb-4">All Files</h2>
              <table className="w-full">
                <thead>
                  <tr>
                    <th
                      className="text-left cursor-pointer"
                      onClick={() => handleSortChange("url")}
                    >
                      URL{" "}
                      {sortField === "url" && (sortOrder === "asc" ? "↑" : "↓")}
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
          ) : (
            <p>No data available. Click "Crawl Domain" to start.</p>
          )}
        </section>
      </section>
    </>
  );
}
