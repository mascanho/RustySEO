// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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
import SidebarContainer from "./_components/Sidebar/SidebarContainer";
import { useVisibilityStore } from "@/store/VisibilityStore";
import TaskManagerContainer from "../components/ui/TaskManager/TaskManagerContainer";
import TablesContainer from "./_components/TablesContainer/TablesContainer";
import { listen } from "@tauri-apps/api/event";
import { Domain } from "domain";

// LISTEN TO THE PROGRESS UPDATE EVENT
listen("progress_update", (event) => {
  const progressData = event.payload;
  // console.log("Progress Data:", progressData);
});

export default function Page() {
  const [data, setData] = useState<CrawlResult | null>(null);
  const [search, setSearch] = useState(""); // Search filter
  const [sortField, setSortField] = useState<
    "url" | "title" | "h1" | "file_type"
  >("url");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { loaders, showLoader, hideLoader } = useLoaderStore();
  const {
    crawlData,
    setDomainCrawlLoading,
    clearDomainCrawlData,
    addDomainCrawlResult,
  } = useGlobalCrawlStore();
  const { visibility, showSidebar, hideSidebar } = useVisibilityStore();
  const allData = crawlData;

  useEffect(() => {
    const sessionData = sessionStorage.getItem("GlobalCrawldata");
    if (sessionData) {
      setData(JSON.parse(sessionData));
    }
  }, [crawlData]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value.toLowerCase());
  };

  console.log("domainCrawlLoading:", setDomainCrawlLoading.toString());

  const handleDomainCrawl = async (url) => {
    try {
      // Set loading
      setDomainCrawlLoading(true);
      // Clear the store before crawling
      clearDomainCrawlData();
      console.log("Crawling domain...");
      const result = await invoke("domain_crawl_command", {
        domain: url,
      });
      // domainCrawlData.setDomainCrawlData(result);
      console.log("Crawl Result:", result);
    } catch (error) {
      console.error("Failed to execute domain crawl command:", error);
      console.log("failed to crawl:", url);
    } finally {
      setDomainCrawlLoading(false);
    }
  };

  useEffect(() => {
    const unlisten = listen("crawl_result", (event) => {
      const result = event?.payload?.result;

      if (!result || typeof result !== "object") {
        console.error("Invalid result format:", result);
        return;
      }

      addDomainCrawlResult(result);
    });

    return () => {
      unlisten.then((fn) => fn()); // Properly remove listener on unmount
    };
  }, [addDomainCrawlResult]);

  return (
    <main className="flex h-full w-full">
      <InputZone handleDomainCrawl={handleDomainCrawl} />
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
        <Tabs defaultValue="first" className="ovefflow-auto">
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
              <Tabs.Tab value="tasks">
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
            className="flex flex-col h-screen bg-white overflow-auto"
          >
            <TablesContainer />
          </Tabs.Panel>

          <Tabs.Panel
            value="tasks"
            className="flex flex-col space-y-8 overflow-scroll"
          >
            <section className="mt-[5rem]">
              <TaskManagerContainer />
            </section>
          </Tabs.Panel>
        </Tabs>
      </section>
      <aside
        className={`transition-all ease-linear delay-100  ${visibility.sidebar ? "w-[24.3rem] flex-grow" : "w-0 "} h-[58.6rem] `}
      >
        <SidebarContainer />
      </aside>
    </main>
  );
}
