// @ts-nocheck
"use client";
export const dynamic = "force-static";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import replaceDoubleSlash from "./Hooks/DecodeURL";
import SchemaTextEncoder from "./Hooks/SchemaTest";
import OpenGraphCard from "./components/ui/OpenGraphCard";
import GooglePreview from "./components/GooglePreview";
import FcpEl from "./components/Fcp";
import DomElements from "./components/DomElements";
import SpeedIndex from "./components/SpeedIndex";
import LinkAnalysis from "./components/ui/LinkAnalysis";
import ImageAnalysis from "./components/ui/ImageAnalysis";
import ClsEl from "./components/Cls";
import TbtEl from "./components/Tbt";
import Redirects from "./components/Redirects";
import ServerResponseTime from "./components/ServeResponseTime";
import LongTasks from "./components/LongTasks";
import TtiEl from "./components/TTI";
import HeadingsTable from "./components/HeadingsTable";
import RenderBlocking from "./components/RenderBlocking";
import PageSchemaTable from "./components/ui/PageSchemaTable";
import { useDisclosure } from "@mantine/hooks";
import ThirdPartyScripts from "./components/ui/ThirdPartyScripts";
import NetworkPayload from "./components/NetworkPayloads";
import TotalByteWeight from "./components/ui/TotalByteWeightTable";
import LCPEl from "./components/LCP";
import NetworkRequests from "./components/NetworkRequests";
import RobotsTable from "./components/ui/RobotsTable";
import ImagesChart from "./components/ui/ShadCharts/ImagesChart";
import { Modal, Tabs } from "@mantine/core";
import KeywordChart from "./components/ui/ShadCharts/KeywordChart";
import { useDebounce } from "use-debounce";
import Todo from "./components/ui/Todo";
import { IoSearchCircle } from "react-icons/io5";
import TaskManagerContainer from "./components/ui/TaskManager/TaskManagerContainer";
import CrawlHistory from "./components/ui/CrawlHistory/CrawlHistory";
import HtmlToTextChart from "./components/ui/ShadCharts/HtmlToTextChart";
import { Switch } from "@/components/ui/switch";
import SEOImprovements from "./components/ui/Improvements/SEOimprovements";

import SidebarContainer from "./components/ui/Sidebar/SidebarContainer";
import MenuDrawer from "./components/ui/MenuDrawer";
import PageRankChart from "./components/ui/ShadCharts/PageRankChart";
import PerformanceEl from "./components/Performance";
import { FaChevronDown, FaDesktop, FaMobile } from "react-icons/fa";
import { CgLayoutGrid } from "react-icons/cg";
import { CiGlobe } from "react-icons/ci";
import LinksCharts from "./components/ui/ShadCharts/LinksCharts";
import RenderBlockingResources from "./components/ui/RenderBlockingResources";
import useOnPageSeo from "@/store/storeOnPageSeo";
import useStore from "@/store/Panes";
import TableMenus from "./components/ui/CrawlHistory/TableMenus";
import NetworkRequestsTable from "./components/ui/NetworkRequestsTable";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import { AiOutlineRise } from "react-icons/ai";
import { MdOutlineTaskAlt } from "react-icons/md";
import { GoTable } from "react-icons/go";

import { CgPerformance } from "react-icons/cg";

const HeadAnalysis = React.lazy(() => import("./components/ui/HeadAnalysis"));

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openedModal, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const [linkStatusCodes, setLinkStatusCodes] = useState<any[]>([]);
  const [url, setUrl] = useState<string>("");
  const [crawlResult, setCrawlResult] = useState<string[]>([]);
  const [visibleLinks, setVisibleLinks] = useState<string[]>([]);
  const [headings, setHeadings] = useState<string[]>([]);
  const [pageTitle, setPageTitle] = useState<string[]>([]);
  const [pageDescription, setPageDescription] = useState<string[]>([]);
  const [canonical, setCanonical] = useState<string[]>([]);
  const [hreflangs, setHreflangs] = useState<string[]>([]);
  const [responseCode, setResponseCode] = useState<number | undefined>();
  const [indexation, setIndexation] = useState<string[]>([]);
  const [pageSchema, setPageSchema] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState<any>([]);
  const [readingTime, setReadingTime] = useState<number | undefined>();
  const [openGraphDetails, setOpenGraphDetails] = useState<any[]>([]);
  let [pageSpeed, setPageSpeed] = useState<any[]>([]);
  const [favicon_url, setFavicon_url] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [readingLevelResults, setReadingLevelResults] = useState<any[]>([]);
  const [tagManager, setTagManager] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [headElements, setHeadElements] = useState<any[]>([]);
  const [bodyElements, setBodyElements] = useState<any[]>([]);
  const [strategy, setStrategy] = useState<any>({
    strategy: "DESKTOP",
  });
  const [charset, setCharset] = useState<any[]>([]);
  const [pageRank, setPageRank] = useState<any[]>([]);
  const [robots, setRobots] = useState<string>("");
  const [AiContentAnalysis, setAiContentAnalysis] = useState<any>("");
  const [htmlToTextRatio, setHtmlToTextRatio] = useState<any>("");
  const [DBDATA, setDBDATA] = useState<any>("");
  const [hidden, setHidden] = useState({
    widget: false,
  });
  const [linkStatusCodeStatus, setLinkStatusCodeStatus] = useState(false);
  const [video, setVideo] = useState<any[]>([]);

  const [open, { toggle }] = useDisclosure(false);

  const [debouncedURL] = useDebounce(url, 300);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const seoIsLoading = useOnPageSeo();

  // Panes Store
  const { Visible } = useStore();

  // Get the status from localstorage

  type DBDataCrawl = {
    url: string | null;
    date: string | null;
    title: string[] | null;
  };

  useEffect(() => {
    invoke("get_db_data").then((result) => {
      setDBDATA(result);
    });
  }, [pageSpeed]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setUrl(event.target.value);
    },
    [],
  );

  useEffect(() => {
    if (debouncedURL) {
      const lowercaseURL = debouncedURL.toLowerCase();
      if (
        !lowercaseURL.includes("https://") &&
        !lowercaseURL.includes("http://")
      ) {
        setUrl("https://" + debouncedURL);
      } else {
        setUrl(lowercaseURL);
      }
    }
  }, [debouncedURL]);

  // Set the URL globally on session storage
  useEffect(() => {
    sessionStorage.setItem("url", debouncedURL);
    // @ts-ignore
    sessionStorage.setItem("loading", loading);
  }, [debouncedURL, loading]);

  const handleClick = (url: string) => {
    // Clear previous results before starting the new crawl

    // page speed loading
    setLoading(!loading);
    // set SEO LOADING
    seoIsLoading.setSeoLoading(!seoIsLoading.seoLoading);

    // set the url beng searched in the session storage
    sessionStorage.setItem("url", url || "No URL");
    const sessionUrl = sessionStorage.getItem("url");
    setSessionUrl(sessionUrl);
    window.dispatchEvent(new Event("sessionStorageUpdated"));

    setCrawlResult([]);
    setVisibleLinks([]);
    setHeadings([]);
    setWordCount([]);
    setOpenGraphDetails([]);
    setPageSpeed([]);
    setFavicon_url([]);
    setPageTitle([]);
    setPageDescription([]);
    setCanonical([]);
    setHreflangs([]);
    setResponseCode(undefined);
    setIndexation([]);
    setPageSchema([]);
    setReadingTime(undefined);
    setKeywords([]);
    setReadingLevelResults([]);
    setTagManager([]);
    setImages([]);
    setHeadElements([]);
    setBodyElements([]);
    setAiContentAnalysis("");
    setRobots("");
    handleSpeed(url);
    setHtmlToTextRatio([]);
    setPageRank([]);
    setLinkStatusCodes([]);
    setVideo([]);

    invoke<{
      links: [];
      headings: [];
      page_title: [];
      page_description: [];
      canonical_url: [];
      hreflangs: [];
      response_code: number;
      indexation: [];
      page_schema: [];
      words_arr: number;
      reading_time: number;
      og_details: any[];
      favicon_url: [];
      keywords: [];
      readings: any[];
      tag_container: any[];
      images: any[];
      head_elements: any[];
      body_elements: any[];
      robots: string;
      ratio: any;
      page_rank: any[];
      charset_arr: any[];
      video: any[];
    }>("crawl", { url })
      .then((result) => {
        handleLinkStatusCheck(url);
        showLinksSequentially(result.links); // Show links one by one
        showHeadingsSequentially(result.headings);
        setPageTitle(result.page_title);
        // stop the loading of SEO
        seoIsLoading.setSeoLoading(false);
        setPageDescription(result.page_description);
        setCanonical(result.canonical_url);
        setHreflangs(result.hreflangs);
        setResponseCode(result.response_code);
        setIndexation(result.indexation);
        setPageSchema(result.page_schema);
        setWordCount(result.words_arr);
        setReadingTime(result.reading_time);
        setOpenGraphDetails(result.og_details);
        setFavicon_url(result.favicon_url);
        setKeywords(result.keywords);
        setCharset(result.charset_arr);
        setReadingLevelResults(result.readings);
        setTagManager(result.tag_container);
        setImages(result.images);
        setHeadElements(result.head_elements);
        setBodyElements(result.body_elements);
        setRobots(result.robots);
        setHtmlToTextRatio(result.ratio);
        setPageRank(result.page_rank);
        setVideo(result.video);
      })
      .catch(console.error);
  };

  // GET THE THEME AND SET IT
  useEffect(() => {
    // On component mount, check local storage for dark mode preference
    const darkMode = localStorage.getItem("dark-mode") === "true";
    setIsDarkMode(darkMode);

    // Add or remove the dark class on the root element
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // KEYBOARD PRESS TO OPEN THE TASKS
  useEffect(() => {
    // Function to handle keydown events
    const handleKeyDown = (event: any) => {
      // Check if Control + T are pressed
      if (event.ctrlKey && event.key === "t") {
        event.preventDefault(); // Prevent the default action (e.g., opening a new tab)
        console.log("Control + T was pressed");

        // Open the tasks
        openModal();
      }
    };

    // Add event listener when the component mounts
    window.addEventListener("keydown", handleKeyDown);

    // Clean up event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    // Define the handler function
    const handleKeyDown = (event: any) => {
      if (event.ctrlKey === "r") {
        // Perform the action when Escape key is pressed
        console.log("Escape key pressed!");
        window?.location?.reload();
      }
    };

    // Add the event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []); //

  // UPDATE THE WIDGETS PANEL VISIBILITY
  useEffect(() => {
    const widgetsElement = document.querySelector("widgets");
    if (widgetsElement) {
      widgetsElement.classList.toggle("hidden", !Visible.widgets);
    }
  }, [Visible]);

  // clear session storage on page reload
  // Check for the system settings
  useEffect(() => {
    sessionStorage?.clear();
    const checkSystem = async () => {
      try {
        const result = await invoke<{}>("check_system");
        console.log(result);
        if (result === null) {
        }
      } catch (error) {
        console.error("Error checking system", error);
      }
    };
    checkSystem();
  }, []);

  // CONNECT TO GOOGLE SEARCH console
  useEffect(() => {
    try {
      invoke<{}>("call_google_search_console")
        .then((result) => {
          console.log(result);
        })
        .catch((error) => {
          if (error instanceof Error) {
            console.error("Google Search Console API error:", error.message);
          } else {
            console.error("An unknown error occurred:", error);
          }
        });
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error invoking Google Search Console:", error.message);
      } else {
        console.error("An unexpected error occurred:", error);
      }
    }
  }, []);

  const handleLinkStatusCheck = (url: any) => {
    setLinkStatusCodeStatus(true);
    invoke<{}>("check_link_status", { url: url })
      .then((result: any) => {
        setLinkStatusCodes(result);
      })
      .then(() => setLinkStatusCodeStatus(false));
  };

  const handleSpeed = useCallback(
    (url: string) => {
      invoke<{}>("fetch_page_speed", { url: url, strategy: strategy.strategy })
        .then((result: any) => {
          setPageSpeed(result);
        })
        .then(() => setLoading(false))
        .catch(console.error);
    },
    [strategy.strategy, setPageSpeed, setLoading],
  );

  const showLinksSequentially = useCallback((links: string[]) => {
    links.forEach((link, index) => {
      setTimeout(() => {
        setVisibleLinks((prevVisibleLinks) => [...prevVisibleLinks, link]);
      }, index * 50);
    });
  }, []);

  const showHeadingsSequentially = useCallback((headings: string[]) => {
    headings.forEach((heading, index) => {
      setTimeout(() => {
        setHeadings((prevHeadings) => [...prevHeadings, heading]);
      }, index * 50);
    });
  }, []);

  // Generates a codified URL to use LinkedIn's social post tool
  const originalURL = url;
  const linkedInInspect: any = replaceDoubleSlash(originalURL);
  const googleSchemaTestUrl: any = SchemaTextEncoder(originalURL);

  // Extract the domain without protocol or subdomain
  const domain = url
    .replace("https://", "")
    .replace("http://", "")
    .replace("www.", "")
    .split(/[/?#]/)[0];

  // Find the last dot in the domain
  const lastDotIndex = domain.lastIndexOf(".");

  // Remove everything after the last dot
  const domainWithoutLastPart = domain.substring(0, lastDotIndex);

  const handleStrategyChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setStrategy((prev: any) => ({
        ...prev,
        strategy: event.target.value,
      }));
      window?.sessionStorage.setItem("strategy", event.target.value);
    },
    [],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("DESKTOP");

  const options = [
    {
      value: "DESKTOP",
      label: "Desktop",
      icon: <FaDesktop />,
    },
    {
      value: "mobile",
      label: "Mobile",
      icon: <FaMobile />,
    },
  ];

  const handleSelect = (value: any) => {
    setSelectedOption(value);
    setIsOpen(false);
    setStrategy((prev: any) => ({
      ...prev,
      strategy: value,
    }));
  };

  const seoPageSpeed = pageSpeed && pageSpeed[1];
  pageSpeed = pageSpeed && pageSpeed[0];

  console.log(pageSpeed, "PAGE SPEED");

  return (
    <section className="h-full overflow-y-clip flex">
      <div className="w-full">
        <Modal
          opened={openedModal}
          overlayProps={{ backgroundOpacity: 0.5 }}
          closeOnEscape
          closeOnClickOutside
          onClose={closeModal}
          title=""
          centered
          // zIndex={"10000"}
        >
          <Todo url={debouncedURL} close={closeModal} strategy={strategy} />
        </Modal>
        {/* Fixed Input and Crawl Button */}
        <div className="fixed top-[28px] left-0 right-0 z-[2000] h-11 border-b  bg-white dark:bg-brand-darker flex items-center px-4 dark:border-b-brand-dark">
          <MenuDrawer />
          <section className="flex items-center justify-end mx-auto relative w-full max-w-[600px] border-r border-l pl-4 dark:border-l-brand-dark dark:border-r-brand-dark h-full pr-4">
            <div className="flex items-center w-full">
              <div className="relative inline-block text-left z-[900000]">
                <div className="-mr-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex justify-center w-[98px] border-l border-b border-t  rounded-l-md border-gray-200 dark:border-white/20 shadow-sm px-2  bg-white dark:bg-brand-darker text-xs font-medium text-gray-700 dark:text-white/50 hover:bg-gray-50 focus:outline-none focus:ring-0 h-7 mb-[1px] py-[5px] focus:ring-offset-0 focus:ring-offset-gray-100 focus:ring-indigo-500 items-center mt-[1px] "
                    id="options-menu"
                    aria-haspopup="true"
                    aria-expanded="true"
                  >
                    {
                      options?.find((opt) => opt?.value === selectedOption)
                        ?.icon
                    }
                    <span className="ml-2">
                      {
                        options.find((opt) => opt.value === selectedOption)
                          ?.label
                      }
                    </span>
                    <FaChevronDown
                      className="ml-1 -mr-1 h-2 w-2 text-xs text-black/50 dark:text-white/50"
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {isOpen && (
                  <div className="origin-top-right absolute top-6 -right-4 mt-2 w-[7rem] rounded-md shadow-lg bg-white dark:bg-brand-darker dark:border dark:border-white/10 ring-0 ring-black ring-opacity-5  dark:bg-brand-white m-1 hover:text-white  dark:text-white z-[9000000000]">
                    <div
                      className="py-1 z-[90000000000] "
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="options-menu"
                    >
                      {options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleSelect(option.value)}
                          className="flex items-center px-4 py-1 p-1 hover:text-white  text-sm text-gray-700 hover:bg-brand-bright  dark:hover:bg-brand-bright dark:hover:text-white w-full dark:text-white/50 text-left  hover:rounded-md z-[1000000000000000000]"
                          role="menuitem"
                        >
                          {option.icon}
                          <span className="ml-2 z-[1000000000000] p-1">
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative flex items-center ml-2 flex-grow">
                <CiGlobe className="absolute ml-3 text-gray-400" />
                <input
                  type="url"
                  required
                  placeholder={sessionUrl || "https://yourwebsite.com"}
                  onChange={handleChange}
                  onKeyPress={(event) => {
                    if (event.key === "Enter") {
                      handleClick(url);
                    }
                  }}
                  className="w-full h-7 text-xs pl-8 rounded-l-md bg-slate-100 dark:bg-blue-900/5 dark:bg-brand-darker dark:border dark:border-white/20 dark:text-white placeholder:text-gray-500 border rounded-r-md"
                  style={{ outline: "none", boxShadow: "none" }}
                />

                <button
                  onClick={() => handleClick(url)}
                  className="rounded w-24 h-7 active:scale-95 text-sm relative inline-flex group py-[4px] items-center justify-center ml-3 cursor-pointer border-b-4 border-l-2 active:border-blue-600 active:shadow-none bg-gradient-to-tr from-brand-bright to-blue-500 border-blue-700 text-white transition-transform duration-200"
                >
                  <span className="relative text-xs">
                    {loading ? (
                      <div
                        onClick={() => window.location.reload()}
                        className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white shadow-md"
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
        {/* TABS SECTION */}
        <section className="mt-1 relative h-[calc(100vh-9.0rem)] overflow-x-hidden pt-6 px-1.5 side-scrollbar  ">
          <Tabs defaultValue="first">
            <div className="transition-all   ease-in  bg-white duration-150 border-t dark:border-brand-dark  fixed left-0 right-0 pt-1 top-[70px]  transform dark:bg-brand-darker  pb-0">
              <Tabs.List justify="center" className="dark:text-white">
                <Tabs.Tab value="first">
                  <CgPerformance className="inline-block text-sm mr-1 mb-[1px]" />{" "}
                  Diagnostics
                </Tabs.Tab>
                <Tabs.Tab value="third">
                  <AiOutlineRise className="inline-block mr-1 text-sm mb-[2px]" />{" "}
                  Improvements
                </Tabs.Tab>
                <Tabs.Tab value="fourth">
                  <MdOutlineTaskAlt className="inline-block mr-1 text-sm mb-[2px]" />{" "}
                  Task Manager
                </Tabs.Tab>
                <Tabs.Tab value="fifth">
                  <GoTable className="inline-block mr-1 text-sm mb-[2px]" />{" "}
                  Crawl History
                </Tabs.Tab>
              </Tabs.List>
            </div>

            <Tabs.Panel value="first">
              {/* WIDGET SECTION */}

              <div
                className={`-mt-[20px] widgets ${Visible.widgets ? "block" : "hidden"} mb-2.5`}
              >
                <h2 className="bottom-0 text-black/20 dark:text-white/20 font-semibold pb-1 ml-1 text-sm">
                  Widgets
                </h2>

                <section
                  className={`grid grid-cols-2  gap-x-3 md:gap-x-4 sm:grid-cols-3  md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-7 2xl:gap-x-2 justify-items-stretch w-full  gap-y-3  relative`}
                >
                  <PerformanceEl
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />

                  <FcpEl
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                  <LCPEl
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                  <TtiEl
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                  <TbtEl
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                  <ClsEl
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                  <SpeedIndex
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                  <ServerResponseTime
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                  <NetworkPayload
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                  <DomElements
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                  <Redirects
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                  <LongTasks
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                  <RenderBlocking
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                  <NetworkRequests
                    stat={pageSpeed}
                    loading={loading}
                    url={debouncedURL}
                  />
                </section>
              </div>

              {/* Head starts here */}
              <HeadAnalysis
                pageTitle={pageTitle}
                pageDescription={pageDescription}
                canonical={canonical}
                hreflangs={hreflangs}
                pageSchema={pageSchema}
                openGraphDetails={openGraphDetails}
                tagManager={tagManager}
                favicon_url={favicon_url}
                code={headElements}
                indexation={indexation}
                charset={charset}
                crawl={handleClick}
                url={url}
              />

              {/* CHARTS SECTION */}
              <section
                className={`charts grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 ${Visible.charts ? "grid" : "hidden"}`}
              >
                <KeywordChart keywords={keywords} url={debouncedURL} />
                <HtmlToTextChart htmlToTextRatio={htmlToTextRatio} />
                <ImagesChart url={debouncedURL} images={images} />
                {/* @ts-ignore */}
                <LinksCharts
                  linkStatusCodeStatuses={linkStatusCodeStatus}
                  linkStatusCodes={linkStatusCodes}
                />
              </section>

              {/* TABLES START HERE */}
              <main
                id="tables"
                className={`mx-auto w-full flex-col  pt-10 tables rounded-lg text-black relative overflow-auto grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-2 -mt-16 items-stretch pb-2 ${!Visible.charts && "-mt-[40px]"}`}
              >
                <GooglePreview
                  favicon_url={favicon_url}
                  pageTitle={pageTitle}
                  pageDescription={pageDescription}
                  url={debouncedURL}
                />
                <OpenGraphCard
                  linkedInInspect={linkedInInspect}
                  openGraphDetails={openGraphDetails}
                />
                <HeadingsTable headings={headings} />
                <LinkAnalysis
                  links={linkStatusCodes}
                  visibleLinks={visibleLinks}
                />
                <ImageAnalysis images={images} />
                {/**/}
                <NetworkRequestsTable pageSpeed={pageSpeed} />
                <ThirdPartyScripts pageSpeed={pageSpeed} />
                <TotalByteWeight pageSpeed={pageSpeed} />
                <RenderBlockingResources pageSpeed={pageSpeed} />
                <PageSchemaTable
                  pageSchema={pageSchema}
                  googleSchemaTestUrl={debouncedURL}
                />
              </main>
            </Tabs.Panel>

            <Tabs.Panel value="third">
              <SEOImprovements
                pageTitle={pageTitle}
                // seo={seoPageSpeed}
                pageSpeed={pageSpeed}
                pageDescription={pageDescription}
                hreflangs={hreflangs}
                canonical={canonical}
                crawl={handleClick}
                opengraph={openGraphDetails}
                pageSchema={pageSchema}
                favicon={favicon_url}
                charset={charset}
                indexation={indexation}
                images={images}
                linkStatusCodes={linkStatusCodes}
              />
            </Tabs.Panel>

            <Tabs.Panel value="fourth">
              <TaskManagerContainer strategy={strategy} />
            </Tabs.Panel>

            <Tabs.Panel value="fifth">
              <CrawlHistory
                crawl={handleClick}
                loading={loading}
                dbdata={DBDATA}
              />
            </Tabs.Panel>
          </Tabs>
        </section>
      </div>
      <SidebarContainer
        pageSpeed={pageSpeed}
        keywords={keywords}
        wordCount={wordCount ? wordCount[0] : ""}
        readingTime={readingTime}
        readingLevelResults={readingLevelResults}
        pageTitle={pageTitle}
        AiContentAnalysis={AiContentAnalysis}
        robots={robots}
        pageRank={pageRank}
        seo={seoPageSpeed}
        htmlToTextRatio={htmlToTextRatio}
        loading={loading}
        bodyElements={bodyElements}
        video={video}
      />
    </section>
  );
};

export default Home;
