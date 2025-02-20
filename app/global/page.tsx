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
import { RiFireLine } from "react-icons/ri";
import { IoKeyOutline } from "react-icons/io5";
import { SlSocialGoogle } from "react-icons/sl";
import { GrPlan } from "react-icons/gr";
import Analytics from "../components/ui/Analytics/Analytics";
import ClarityContainer from "../components/ui/MSClarityModal/ClarityContainer";
import KeywordAnalytics from "../components/ui/KwTracking/KeywordAnalytics";
import GSCcontainer from "../components/ui/GSCcontainer/GSCcontainer";
import ContentPlannerContainer from "../components/ui/ContentPlanner/ContentPlannerContainer";

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
    setSelectedTableURL,
    setIssuesData,
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

  const handleDomainCrawl = async (url) => {
    try {
      // Set loading

      if (sessionStorage.getItem("crawlNumber")) {
        sessionStorage.setItem(
          "crawlNumber",
          Number(sessionStorage.getItem("crawlNumber")) + 1,
        );
      } else {
        sessionStorage.setItem("crawlNumber", "1");
      }

      setSelectedTableURL([]);
      setDomainCrawlLoading(true);
      setIssuesData([]);
      // Clear the store before crawling
      clearDomainCrawlData();
      console.log("Crawling domain...");
      const result = await invoke("domain_crawl_command", {
        domain: url,
      });
      console.log("Crawl Result:", result);
    } catch (error) {
      console.error("Failed to execute domain crawl command:", error);
      console.log("failed to crawl:", url);
    } finally {
      setDomainCrawlLoading(false);

      // Retrieve the existing crawled links from sessionStorage or initialize an empty array
      const crawledLinks =
        JSON.parse(sessionStorage.getItem("CrawledLinks")) || [];

      // Add the length of the new crawlData (if it exists) to the crawledLinks array
      if (crawlData?.length) {
        crawledLinks.push(crawlData.length);
      }

      // Save the updated crawledLinks array back to sessionStorage
      sessionStorage.setItem("CrawledLinks", JSON.stringify(crawledLinks));
    }
  };

  useEffect(() => {
    let isMounted = true; // Flag to track if the component is mounted

    const setupEventListener = async () => {
      const unlisten = await listen("crawl_result", (event) => {
        if (!isMounted) return; // Skip if component is unmounted

        const result = event?.payload?.result;

        if (!result || typeof result !== "object") {
          console.error("Invalid result format:", result);
          return;
        }

        addDomainCrawlResult(result);
      });

      return unlisten; // Return the cleanup function
    };

    const cleanupPromise = setupEventListener();

    return () => {
      isMounted = false; // Set flag to false on unmount
      cleanupPromise.then((unlisten) => unlisten()); // Cleanup the event listener
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
            <Tabs.List
              justify="center"
              className="dark:text-white text-xs dark:border-brand-darker"
            >
              <Tabs.Tab value="first">
                <FaGlobe className="inline-block mr-2" />
                Deep crawl
              </Tabs.Tab>
              <Tabs.Tab value="tasks">
                <FaTasks className="inline-block mr-1 text-sm mb-[2px]" /> Task
                Manager
              </Tabs.Tab>
              <Tabs.Tab value="analytics">
                <FaChartBar className="inline-block mr-2" />
                GA4
              </Tabs.Tab>
              <Tabs.Tab value="clarity">
                <RiFireLine className="inline-block mr-2 mb-[2px] text-sm" />
                Clarity
              </Tabs.Tab>
              <Tabs.Tab value="kws">
                <IoKeyOutline className="inline-block mr-2 mb-[2px] text-sm" />
                Tracking
              </Tabs.Tab>
              <Tabs.Tab value="gsc">
                <SlSocialGoogle className="inline-block mr-2 mb-[2px] text-sm" />
                Search Console
              </Tabs.Tab>
              <Tabs.Tab value="content">
                <GrPlan className="inline-block mr-2 mb-[2px] text-sm" />
                Content
              </Tabs.Tab>
            </Tabs.List>
          </aside>
          {/* Tabs Panel for Domain */}
          <Tabs.Panel
            value="first"
            className="flex flex-col h-screen bg-white dark:bg-brand-darker overflow-auto"
          >
            <TablesContainer />
          </Tabs.Panel>
          <Tabs.Panel
            value="tasks"
            className="flex flex-col space-y-8 overflow-scroll"
          >
            <section className="mt-[3rem]">
              <TaskManagerContainer />
            </section>
          </Tabs.Panel>
          <Tabs.Panel value="analytics mt-10">
            <Analytics />
          </Tabs.Panel>
          <Tabs.Panel
            value="clarity"
            className="h-[calc(100vh-8.8rem)] mt-8 overflow-auto"
          >
            <ClarityContainer />
          </Tabs.Panel>{" "}
          <Tabs.Panel value="kws" className="h-[calc(100vh-8.8rem)] mt-9">
            <KeywordAnalytics />
          </Tabs.Panel>{" "}
          <Tabs.Panel value="gsc" ls>
            <GSCcontainer />
          </Tabs.Panel>{" "}
          <Tabs.Panel value="content" className="mt-9 h-screen">
            <ContentPlannerContainer />
          </Tabs.Panel>{" "}
        </Tabs>
      </section>
      <aside
        className={`transition-all ease-linear delay-100  ${visibility.sidebar ? "w-full max-w-[20.4rem] flex-grow" : "w-0 "} h-screen `}
      >
        <SidebarContainer />
      </aside>
    </main>
  );
}
