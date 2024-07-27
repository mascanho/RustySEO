"use client";
import React, { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import PerformanceEl from "./components/Performance";
import replaceDoubleSlash from "./Hooks/DecodeURL";
import SchemaTextEncoder from "./Hooks/SchemaTest";
import OpenGraphCard from "./components/ui/OpenGraphCard";
import GooglePreview from "./components/GooglePreview";
import FcpEl from "./components/Fcp";
import DomElements from "./components/DomElements";
import SpeedIndex from "./components/SpeedIndex";
import ContentSummary from "./components/ui/ContentSummary";
import LinkAnalysis from "./components/ui/LinkAnalysis";
import ImageAnalysis from "./components/ui/ImageAnalysis";
import { HiMagnifyingGlass } from "react-icons/hi2";
import ClsEl from "./components/Cls";
import TbtEl from "./components/Tbt";
import Redirects from "./components/Redirects";
import ServerResponseTime from "./components/ServeResponseTime";
import LongTasks from "./components/LongTasks";
import TtiEl from "./components/TTI";
import Footer from "./components/ui/Footer";
import HeadingsTable from "./components/HeadingsTable";
import SubBar from "./components/ui/SubBar";
import RenderBlocking from "./components/RenderBlocking";
import PageSchemaTable from "./components/ui/PageSchemaTable";
import { useDisclosure } from "@mantine/hooks";
import RedirectsTable from "./components/ui/RedirectsTable";
import ThirdPartyScripts from "./components/ui/ThirdPartyScripts";
import NetworkPayload from "./components/NetworkPayloads";
import TotalByteWeight from "./components/ui/TotalByteWeightTable";
import LCPEl from "./components/LCP";
import NetworkRequests from "./components/NetworkRequests";
import RobotsTable from "./components/ui/RobotsTable";
import ImagesChart from "./components/ui/ShadCharts/ImagesChart";
import { Modal, Tabs } from "@mantine/core";
import KeywordChart from "./components/ui/ShadCharts/KeywordChart";
import { Button } from "@/components/ui/button";
import ThirdPartyScriptChart from "./components/ui/ShadCharts/ThirdPartyScriptChart";
import { useDebounce } from "use-debounce";
import { table } from "console";
import Todo from "./components/ui/Todo";
import { IoSearchCircle } from "react-icons/io5";
import TaskManagerContainer from "./components/ui/TaskManager/TaskManagerContainer";
import CrawlHistory from "./components/ui/CrawlHistory/CrawlHistory";
import HtmlToTextChart from "./components/ui/ShadCharts/HtmlToTextChart";
import { Switch } from "@/components/ui/switch";

const HeadAnalysis = React.lazy(() => import("./components/ui/HeadAnalysis"));

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openedModal, { open: openModal, close: closeModal }] =
    useDisclosure(false);

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
  const [pageSpeed, setPageSpeed] = useState<any[]>([]);
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
  const [robots, setRobots] = useState<string>("");
  const [AiContentAnalysis, setAiContentAnalysis] = useState<any>("");
  const [htmlToTextRatio, setHtmlToTextRatio] = useState<any>("");
  const [DBDATA, setDBDATA] = useState<any>("");
  const [hidden, setHidden] = useState({
    widget: false,
  });

  const [open, { toggle }] = useDisclosure(false);

  const [debouncedURL] = useDebounce(url, 300);

  type DBDataCrawl = {
    url: string | null;
    date: string | null;
    title: string[] | null;
  };

  useEffect(() => {
    invoke("get_db_data").then((result) => {
      setDBDATA(result);
      console.log(result, "This comes from the DB");
    });
  }, [pageTitle]);

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

  const handleClick = (url: string) => {
    // Clear previous results before starting the new crawl

    setLoading(!loading);

    // set the url being searched in the session storage
    sessionStorage.setItem("url", url);

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
    }>("crawl", { url })
      .then((result) => {
        showLinksSequentially(result.links); // Show links one by one
        showHeadingsSequentially(result.headings);
        setPageTitle(result.page_title);
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
        setReadingLevelResults(result.readings);
        setTagManager(result.tag_container);
        setImages(result.images);
        setHeadElements(result.head_elements);
        setBodyElements(result.body_elements);
        setRobots(result.robots);
        setHtmlToTextRatio(result.ratio);
      })
      .catch(console.error);
  };

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

  // Get the AI stuff
  useEffect(() => {
    if (keywords.length > 0) {
      invoke<string>("get_genai", { query: pageTitle[0] })
        .then((result) => {
          console.log(result);
          setAiContentAnalysis(result);
          return result;
        })
        .catch((error) => {
          console.error("Error from get_genai:", error);
          // Handle the error appropriately
        });
    }
  }, [keywords, pageTitle]);

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

  function checkGSC() {
    invoke<{}>("fetch_google_search_console")
      .then((result) => {
        console.log("Starting gsc........");
        console.log(result);
      })
      .catch(console.error);
  }

  const handleSpeed = useCallback(
    (url: string) => {
      invoke<{}>("fetch_page_speed", { url: url, strategy: strategy.strategy })
        .then((result: any) => setPageSpeed(result))
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

  console.log(pageSpeed, "page speed");
  console.log(htmlToTextRatio, "htmlToTextRatio");

  return (
    <>
      <Modal
        opened={openedModal}
        overlayProps={{ backgroundOpacity: 0.5 }}
        closeOnEscape
        closeOnClickOutside
        onClose={closeModal}
        title={openedModal ? "" : "Page Speed Insights API key"}
        centered
      >
        {openedModal && (
          <Todo url={url} close={closeModal} strategy={strategy} />
        )}
      </Modal>

      {/* Fixed Input and Crawl Button */}
      <div className=" fixed top-[27px] z-[1000]  left-0  mx-auto justify-center w-full  items-center py-2 ">
        <section className="flex   items-end justify-end w-[600px] mx-auto relative ">
          <div className="flex justify-center w-full  items-center  overflow-hidden">
            <select
              onChange={(event) => handleStrategyChange(event)}
              className="custom-select  bg-slate-100 dark:bg-white dark:text-black border-0 outline-none rounded-full text-sm h-6"
            >
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
            </select>
            <div className="overflow-hidden">
              <input
                className=" h-6 text-xs min-w-80 w-[40em] pl-5 pt-[2px] rounded-2xl -ml-2  pr-2 placeholder:text-gray-500 relative bg-slate-100 dark:border dark:border-white dark:bg-white "
                type="url"
                placeholder="https://yourwebsite.com"
                // value={url}
                onChange={handleChange}
                style={{ outline: "none", boxShadow: "none" }}
                onKeyPress={(event) => {
                  if (event.key === "Enter") {
                    handleClick(url);
                  }
                }}
              />
              {loading ? (
                <div
                  className="animate-spin cursor-pointer inline-block size-4 border-[3px] border-current border-t-transparent text-blue-600 rounded-full absolute top-1 right-7"
                  role="status"
                  aria-label="loading"
                  onClick={() => window?.location?.reload()}
                ></div>
              ) : (
                <IoSearchCircle
                  onClick={() => handleClick(url)}
                  className="absolute top-0 text-2xl py-[2px] right-6 text-sky-500"
                />
              )}
            </div>
          </div>
        </section>
      </div>
      {/* <SubBar */}
      {/*   domainWithoutLastPart={domainWithoutLastPart} */}
      {/*   url={url} */}
      {/*   strategy={strategy} */}
      {/* /> */}

      {/* TABS SECTION */}
      <section className="mt-2 relative h-full overflow-hidden -mb-14">
        <Tabs defaultValue="first">
          <div className="transition-all  ease-in pt-5 bg-white duration-150 border fixed left-0 right-0 top-16 transform dark:border-0  dark:bg-brand-darker z-10 pb-0">
            <Tabs.List justify="center" className="dark:text-white ">
              <Tabs.Tab value="first"> Diagnostics</Tabs.Tab>
              <Tabs.Tab value="third">Improvements</Tabs.Tab>
              <Tabs.Tab value="fourth">Task Manager</Tabs.Tab>
              <Tabs.Tab value="fifth">Crawl History</Tabs.Tab>
            </Tabs.List>
          </div>

          <Tabs.Panel value="first">
            {/* WIDGET SECTION */}
            <div className="mt-10 flex flex-col flex-wrap items-end">
              <Switch
                checked={!hidden.widget}
                className="mb-5 mr-0"
                onCheckedChange={(checked) => setHidden({ widget: !checked })}
              />
              <section
                className={`grid grid-cols-2 ${hidden.widget ? "hidden" : ""} gap-x-6 sm:grid-cols-2  md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 justify-items-stretch w-full   mb-10 gap-y-5 `}
              >
                <PerformanceEl stat={pageSpeed} loading={loading} url={url} />
                <FcpEl stat={pageSpeed} loading={loading} url={url} />
                <LCPEl stat={pageSpeed} loading={loading} url={url} />
                <TtiEl stat={pageSpeed} loading={loading} url={url} />
                <TbtEl stat={pageSpeed} loading={loading} url={url} />
                <ClsEl stat={pageSpeed} loading={loading} url={url} />
                <DomElements stat={pageSpeed} loading={loading} url={url} />

                <SpeedIndex stat={pageSpeed} loading={loading} url={url} />
                <Redirects stat={pageSpeed} loading={loading} url={url} />
                <ServerResponseTime
                  stat={pageSpeed}
                  loading={loading}
                  url={url}
                />
                <LongTasks stat={pageSpeed} loading={loading} url={url} />
                <RenderBlocking stat={pageSpeed} loading={loading} url={url} />
                <NetworkPayload stat={pageSpeed} loading={loading} url={url} />
                <NetworkRequests stat={pageSpeed} loading={loading} url={url} />
              </section>
            </div>

            {/* CHARTS SECTION */}

            <section className="grid grid-cols-4 gap-6 mb-10">
              <KeywordChart keywords={keywords} url={url} />
              <HtmlToTextChart htmlToTextRatio={htmlToTextRatio} />
              <ImagesChart url={url} images={images} />
              <KeywordChart keywords={keywords} url={url} />
            </section>

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
            />

            {/* TABLES START HERE */}
            <main
              id="tables"
              className="mx-auto w-full flex-col  pt-10 tables rounded-lg text-black relative overflow-auto grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 -mt-16 items-stretch"
            >
              <ContentSummary
                keywords={keywords}
                wordCount={wordCount ? wordCount[0] : ""}
                readingTime={readingTime}
                readingLevelResults={readingLevelResults}
                pageTitle={pageTitle}
                AiContentAnalysis={AiContentAnalysis}
              />
              <GooglePreview
                favicon_url={favicon_url}
                openGraphDetails={openGraphDetails}
                url={url}
              />
              <OpenGraphCard
                linkedInInspect={linkedInInspect}
                openGraphDetails={openGraphDetails}
              />
              <HeadingsTable headings={headings} />
              <LinkAnalysis visibleLinks={visibleLinks} />
              <ImageAnalysis images={images} />
              {/**/}
              <ThirdPartyScripts pageSpeed={pageSpeed} />
              <TotalByteWeight pageSpeed={pageSpeed} />
              <RedirectsTable pageSpeed={pageSpeed} />
              <PageSchemaTable
                pageSchema={pageSchema}
                googleSchemaTestUrl={url}
              />
              <RobotsTable robots={robots} />
            </main>
          </Tabs.Panel>

          <Tabs.Panel value="fourth">
            <TaskManagerContainer />
          </Tabs.Panel>

          <Tabs.Panel value="fifth">
            <CrawlHistory dbdata={DBDATA} />
          </Tabs.Panel>
        </Tabs>
      </section>
      <Footer url={url} loading={loading} />
    </>
  );
};

export default Home;
