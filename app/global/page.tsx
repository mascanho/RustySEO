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
  const { visibility, showSidebar, hideSidebar } = useVisibilityStore();
  const domainCrawlData = useGlobalCrawlStore();
  const allData = domainCrawlData.crawlData;

  useEffect(() => {
    const sessionData = sessionStorage.getItem("GlobalCrawldata");
    if (sessionData) {
      setData(JSON.parse(sessionData));
    }
  }, [crawlData]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value.toLowerCase());
  };

  const handleDomainCrawl = async () => {
    try {
      showLoader("domainCrawl");
      const result = await invoke("domain_crawl_command", {
        domain: "https://www.algarvewonders.com/",
      });
      domainCrawlData.setDomainCrawlData(result);
      console.log("Crawl Result:", result);
      hideLoader("domainCrawl");
    } catch (error) {
      console.error("Failed to execute domain crawl command:", error);
      hideLoader("domainCrawl");
    }
  };

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
