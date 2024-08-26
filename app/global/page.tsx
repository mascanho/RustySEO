"use client";

import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import useLoaderStore from "@/store/loadersStore";

// Define the expected type of the result from the `crawl_domain` function
interface CrawlResult {
  visited_urls: string[];
}

export default function Page() {
  const [visitedUrls, setVisitedUrls] = useState<string[]>([]);
  const { loaders, showLoader, hideLoader } = useLoaderStore();

  const handleDomainCrawl = async () => {
    showLoader("globalCrawler");
    try {
      const result: CrawlResult = await invoke("crawl_domain", {
        url: "https://markwarrior.dev",
      });
      setVisitedUrls(result.visited_urls);
      console.log(result, "Global crawl");
    } catch (error) {
      console.error("Error during crawl:", error);
    } finally {
      hideLoader("globalCrawler");
    }
  };

  return (
    <section className="w-full border-none rounded-none h-full p-10 dark:bg-brand-dark shadow-none">
      <button onClick={handleDomainCrawl}>Crawl Domain</button>
      <section className="border text-white mt-10 h-96 overflow-auto">
        {loaders.globalCrawler ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Visited URLs</th>
              </tr>
            </thead>
            <tbody>
              {visitedUrls.map((url) => (
                <tr key={url}>
                  <td>{url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}
