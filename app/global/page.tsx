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
import { PiShuffleAngularLight } from "react-icons/pi";
import { LuMicroscope } from "react-icons/lu";
import { useDiffStore } from "@/store/DiffStore";
// import KeywordTrackingDeepCrawlContainer from "./_components/KeywordTracking/KeywordTrackingDeepCrawlContainer";

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
  const { setBulkDiffData } = useDiffStore();

  const allData = useMemo(() => crawlData, [crawlData]);

  //POWERBI
  const [powerBiUrl, setPowerBiUrl] = useState("");
  const [error, setError] = useState("");

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
      // console.log("%cCrawl Result:", "color: red;", result);
    } catch (error) {
      console.error("Failed to execute domain crawl command:", error);
    } finally {
      setDomainCrawlLoading(false);
      setIsFinishedDeepCrawl(true);
      setIsGlobalCrawling(false);

      // Get the differences between crawls
      const diff = await invoke("get_url_diff_command");
      setBulkDiffData(diff);

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
    console.log("Initializing crawl event listener...");

    const unlistenPromise = listen("crawl_result", (event) => {
      // The payload structure is { result: DomainCrawlResults }
      const payload = event.payload;
      console.log("Payload:", payload);

      if (payload && typeof payload === "object") {
        const result = payload.result;

        if (result && typeof result === "object") {
          addDomainCrawlResult(result);
          setFinishedDeepCrawl(true);
          setIsFinishedDeepCrawl(true);
        } else {
          console.warn("⚠️ Result is not an object:", result);
        }
      } else {
        console.error("❌ Invalid payload:", payload);
      }
    });

    // Also listen to progress updates
    listen("progress_update", (event) => {
      // console.log("📈 Progress:", event.payload);
    }).catch(console.error);

    listen("crawl_complete", () => {
      console.log("🏁 Crawl complete!", result);
    }).catch(console.error);

    return () => {
      unlistenPromise
        .then((unlisten) => {
          console.log("Cleaning up listeners");
          unlisten();
        })
        .catch(console.error);
    };
  }, [addDomainCrawlResult, setFinishedDeepCrawl, setIsFinishedDeepCrawl]);

  // TODO: Keep an eye on the crawl size and warn the user if it is too big
  const crawlDataLength = crawlData.length;

  // POWERBI eMBED HANDLING FROM LOCALSTORAGE
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("powerBiUrl");
      if (savedUrl) {
        setPowerBiUrl(savedUrl);
      }
    }
  }, []);

  // CHECK WHAT IS THE STATUS OF THE PAGESPEED DETAILS - API KEY and TRUE or FALSE to show on the front end.
  useEffect(() => {
    const check_psi_status = async () => {
      try {
        const psiDetails = await invoke("check_page_speed_bulk");
        localStorage.setItem("PSIdetails", JSON.stringify(psiDetails));
      } catch (error) {
        console.error("Error checking PageSpeed Insights status:", error);
      }
    };

    check_psi_status();
  }, []);

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
          <aside className="absolute top-13 pt-1 left-0 w-full dark:bg-brand-darker z-[200] bg-white">
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
              {powerBiUrl && (
                <Tabs.Tab value="powerbi">
                  <LuMicroscope className="inline-block mr-2 mb-[2px] text-sm" />
                  Power BI
                </Tabs.Tab>
              )}
              <Tabs.Tab value="gsc">
                <SlSocialGoogle className="inline-block mr-2 mb-[2px] text-sm" />
                Search Console
              </Tabs.Tab>
              <Tabs.Tab value="kws">
                <IoKeyOutline className="inline-block mr-2 mb-[2px] text-sm" />
                Tracking
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

          {activeTab === "powerbi" && (
            <Tabs.Panel
              value="powerbi"
              className="w-full  flex-none  overflow-auto  flex justify-center items-center  bg-white "
            >
              <div className="flex justify-center items-center w-full h-screen overflow-auto">
                {powerBiUrl ? (
                  <div className="relative w-full h-[calc(100vh-7.9rem)] -mt-20 mb-1  max-w-full max-h-full aspect-[32/15]">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full border-0"
                      src={powerBiUrl}
                      frameBorder="0"
                      allowFullScreen={true}
                      title="Power BI Report"
                    ></iframe>
                  </div>
                ) : null}
              </div>
            </Tabs.Panel>
          )}

          <Tabs.Panel
            value="kws"
            className="h-[calc(100vh-5rem)] pt-9 dark:bg-brand-darker overflow-hidden"
          >
            <KeywordAnalytics />
          </Tabs.Panel>

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
              className="pt-6 h-[calc(100vh-3rem)] overflow-auto "
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
        className={`${visibility.sidebar ? "  max-w-[20.4rem] w-[20.4rem] flex-grow " : "w-0"} h-screen`}
      >
        <SidebarContainer />
      </aside>
    </main>
  );
}
