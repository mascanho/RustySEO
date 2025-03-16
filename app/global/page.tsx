// @ts-nocheck
"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Tabs } from "@mantine/core";
import { FaGlobe, FaTasks, FaChartBar } from "react-icons/fa";
import { RiFireLine } from "react-icons/ri";
import { IoKeyOutline } from "react-icons/io5";
import { SlSocialGoogle } from "react-icons/sl";
import { GrPlan } from "react-icons/gr";
import { debounce } from "lodash";
import useLoaderStore from "@/store/loadersStore";
import InputZone from "./_components/InputZone";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import SidebarContainer from "./_components/Sidebar/SidebarContainer";
import { useVisibilityStore } from "@/store/VisibilityStore";
import TaskManagerContainer from "../components/ui/TaskManager/TaskManagerContainer";
import TablesContainer from "./_components/TablesContainer/TablesContainer";
import { listen } from "@tauri-apps/api/event";
import Analytics from "../components/ui/Analytics/Analytics";
import ClarityContainer from "../components/ui/MSClarityModal/ClarityContainer";
import KeywordAnalytics from "../components/ui/KwTracking/KeywordAnalytics";
import GSCcontainer from "../components/ui/GSCcontainer/GSCcontainer";
import ContentPlannerContainer from "../components/ui/ContentPlanner/ContentPlannerContainer";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";
import GlobalSettings from "../components/ui/GeneralSettings/GeneralSettings";

interface CrawlResult {
  url: string;
  title: string;
  h1: string;
  file_type: string;
}

export default function Page() {
  const [data, setData] = useState<CrawlResult | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("first");

  const { loaders, showLoader, hideLoader } = useLoaderStore();
  const {
    crawlData,
    setDomainCrawlLoading,
    clearDomainCrawlData,
    addDomainCrawlResult,
    setSelectedTableURL,
    setIssuesData,
    setFinishedDeepCrawl,
    setCrawlSessionTotalArray,
  } = useGlobalCrawlStore();
  const { setIsGlobalCrawling, setIsFinishedDeepCrawl } =
    useGlobalConsoleStore();
  const { visibility, showSidebar, hideSidebar } = useVisibilityStore();

  const allData = useMemo(() => crawlData, [crawlData]);

  // Load data from sessionStorage on mount
  useEffect(() => {
    const sessionData = sessionStorage.getItem("GlobalCrawldata");
    if (sessionData && JSON.parse(sessionData) !== data) {
      setData(JSON.parse(sessionData));
    }
  }, [crawlData]);

  // Debounced search handler
  const handleSearchChange = useCallback(
    debounce((event: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(event.target.value.toLowerCase());
    }, 300),
    [],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => handleSearchChange.cancel();
  }, [handleSearchChange]);

  // Handle domain crawl
  const handleDomainCrawl = async (url: string) => {
    try {
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
      clearDomainCrawlData();
      setIsGlobalCrawling(true);

      const result = await invoke("domain_crawl_command", { domain: url });
      console.log("%cCrawl Result:", "color: red;", result);
    } catch (error) {
      console.error("Failed to execute domain crawl command:", error);
    } finally {
      setDomainCrawlLoading(false);
      setIsFinishedDeepCrawl(true);
      setIsGlobalCrawling(false);

      const crawledLinks =
        JSON.parse(sessionStorage.getItem("CrawledLinks")) || [];
      if (crawlData?.length) {
        crawledLinks.push(crawlData.length);
        setCrawlSessionTotalArray(crawledLinks);
      } else {
        crawledLinks.push(0);
        setCrawlSessionTotalArray(crawledLinks);
      }
      sessionStorage.setItem("CrawledLinks", JSON.stringify(crawledLinks));
    }
  };

  // Event listener for crawl results
  useEffect(() => {
    let isMounted = true;

    const handleCrawlResult = (event) => {
      if (!isMounted) return;

      const result = event?.payload?.result;
      if (!result || typeof result !== "object") {
        console.error("Invalid result format:", result);
        return;
      }

      addDomainCrawlResult(result);
      console.log("Streamed: ", result);
      setFinishedDeepCrawl(true);
    };

    const unlistenPromise = listen("crawl_result", handleCrawlResult);

    return () => {
      isMounted = false;
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [addDomainCrawlResult, setFinishedDeepCrawl]);

  return (
    <main className="flex h-full w-full">
      <InputZone handleDomainCrawl={handleDomainCrawl} />
      <section className="w-full border-none h-full dark:bg-brand-dark shadow-none rounded-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            className="mb-4 p-2 border rounded text-xs"
          />
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <aside className="absolute top-13 pt-1 left-0 w-full dark:bg-brand-darker z-10 bg-white">
            <Tabs.List
              justify="center"
              className="dark:text-white text-xs border-b dark:border-b-brand-dark h-7"
            >
              <Tabs.Tab value="first">
                <FaGlobe className="inline-block mr-2" />
                Deep Crawl
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

          {activeTab === "first" && (
            <Tabs.Panel
              value="first"
              className="flex flex-col h-screen bg-white dark:bg-brand-darker overflow-auto"
            >
              <TablesContainer />
            </Tabs.Panel>
          )}

          {activeTab === "tasks" && (
            <Tabs.Panel
              value="tasks"
              className="flex flex-col space-y-8 overflow-scroll"
            >
              <section className="mt-[3rem]">
                <TaskManagerContainer />
              </section>
            </Tabs.Panel>
          )}

          {activeTab === "analytics" && (
            <Tabs.Panel
              value="analytics"
              className="pt-9 dark:bg-brand-darker mb-0"
            >
              <Analytics />
            </Tabs.Panel>
          )}

          {activeTab === "clarity" && (
            <Tabs.Panel value="clarity" className="pt-8">
              <section className="h-[calc(100vh-8rem)] overflow-auto">
                <ClarityContainer />
              </section>
            </Tabs.Panel>
          )}

          {activeTab === "kws" && (
            <Tabs.Panel
              value="kws"
              className="h-[calc(100vh-4rem)] pt-9 dark:bg-brand-darker"
            >
              <KeywordAnalytics />
            </Tabs.Panel>
          )}

          {activeTab === "gsc" && (
            <Tabs.Panel
              value="gsc"
              className="h-calc(100vh-8.8rem)] pt-9 dark:bg-brand-darker"
            >
              <GSCcontainer />
            </Tabs.Panel>
          )}

          {activeTab === "content" && (
            <Tabs.Panel
              value="content"
              className="pt-6 h-[calc(100vh-3rem)] overflow-auto"
            >
              <ContentPlannerContainer />
            </Tabs.Panel>
          )}

          {activeTab === "settings" && (
            <Tabs.Panel value="settings">
              <GlobalSettings />
            </Tabs.Panel>
          )}
        </Tabs>
      </section>

      <aside
        className={`transition-all ease-linear delay-100 ${visibility.sidebar ? "w-full max-w-[20.4rem] flex-grow" : "w-0"} h-screen`}
      >
        <SidebarContainer />
      </aside>
    </main>
  );
}
