"use client";
import { useEffect, useState } from "react";
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
import HeadAnalysis from "./components/ui/HeadAnalysis";
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
import { Tabs } from "@mantine/core";
import KeywordChart from "./components/ui/ShadCharts/KeywordChart";
import { Button } from "@/components/ui/button";
import ReadingLevel from "./components/ui/ShadCharts/ReadingLevel";
import ThirdPartyScriptChart from "./components/ui/ShadCharts/ThirdPartyScriptChart";

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
  const [open, { toggle }] = useDisclosure(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const userinput = event.target.value;
    const lowercaseURL = userinput.toLowerCase();
    setFavicon_url([]);

    if (
      !lowercaseURL.includes("https://") &&
      !lowercaseURL.includes("http://")
    ) {
      setUrl("https://" + userinput);
    } else {
      setUrl(lowercaseURL);
    }
  };

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
      })
      .catch(console.error);
  };

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
  }, ["random"]);

  function checkGSC() {
    invoke<{}>("fetch_google_search_console")
      .then((result) => {
        console.log("Starting gsc........");
        console.log(result);
      })
      .catch(console.error);
  }

  function handleSpeed(url: string) {
    invoke<{}>("fetch_page_speed", { url: url, strategy: strategy.strategy })
      .then((result: any) => setPageSpeed(result))
      .then(() => setLoading(false))
      .catch(console.error);
  }

  const showLinksSequentially = (links: string[]) => {
    links.forEach((link, index) => {
      setTimeout(() => {
        setVisibleLinks((prevVisibleLinks) => [...prevVisibleLinks, link]);
      }, index * 50); // Adjust timing for each link appearance
    });
  };

  const showHeadingsSequentially = (headings: string[]) => {
    headings.forEach((heading, index) => {
      setTimeout(() => {
        setHeadings((prevHeadings) => [...prevHeadings, heading]);
      }, index * 50); // Adjust timing for each link appearance
    });
  };

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

  function handleStrategychange(event: any) {
    console.log(event.target.value);
    setStrategy((prev: any) => ({
      ...prev,
      strategy: event.target.value,
    }));
    window?.sessionStorage.setItem("strategy", event.target.value);
  }

  return (
    <>
      {/* Fixed Input and Crawl Button */}
      <div className="fixed top-[27px] z-[1000] left-1/2 transform -translate-x-1/2 flex justify-center  items-center py-2 ">
        <div className="flex items-center bg-white rounded-xl border overflow-hidden custom-select">
          <select
            onChange={(event) => handleStrategychange(event)}
            className=" bg-white border-0 outline-none text-sm h-full"
          >
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
          <div className="overflow-hidden">
            <input
              className=" h-6 text-xs min-w-80 w-[40em] pl-7 pt-[2px] rounded-xl  pr-2 placeholder:text-gray-500 relative "
              type="text"
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
          </div>
          <div className="absolute top-2 -right-32 space-x-2 flex">
            <Button
              onClick={() => handleClick(url)}
              className=" top-[2px] rounded-lg px-2 h-4 py-3 flex items-center bg-green-300"
            >
              crawl
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className=" top-[2px] rounded-lg px-2 h-4 flex py-3 items-center"
            >
              cancel
            </Button>
          </div>
          <HiMagnifyingGlass className="absolute top-[15px] text-sm left-20 ml-3" />
          {loading && (
            <div
              className="animate-spin inline-block size-4 border-[3px] border-current border-t-transparent text-blue-600 rounded-full absolute t3333 right-2"
              role="status"
              aria-label="loading"
            ></div>
          )}
        </div>
      </div>
      <SubBar
        domainWithoutLastPart={domainWithoutLastPart}
        url={url}
        strategy={strategy}
      />

      {/* TABS SECTION */}

      <Tabs defaultValue="first">
        <Tabs.List justify="center">
          <Tabs.Tab value="first">Diagnostics</Tabs.Tab>
          <Tabs.Tab value="third">Improvements</Tabs.Tab>
          <Tabs.Tab value="fourth">Task Manager</Tabs.Tab>
          <Tabs.Tab value="fifth">Crawl History</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="first">
          {/* WIDGET SECTION */}
          <section className="grid grid-cols-2 gap-x-6 sm:grid-cols-2  md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7  my-10 gap-y-5 mt-12">
            <PerformanceEl stat={pageSpeed} loading={loading} url={url} />
            <FcpEl stat={pageSpeed} loading={loading} url={url} />
            <LCPEl stat={pageSpeed} loading={loading} url={url} />
            <TtiEl stat={pageSpeed} loading={loading} url={url} />
            <TbtEl stat={pageSpeed} loading={loading} url={url} />
            <ClsEl stat={pageSpeed} loading={loading} url={url} />
            <DomElements stat={pageSpeed} loading={loading} url={url} />

            <SpeedIndex stat={pageSpeed} loading={loading} url={url} />
            <Redirects stat={pageSpeed} loading={loading} url={url} />
            <ServerResponseTime stat={pageSpeed} loading={loading} url={url} />
            <LongTasks stat={pageSpeed} loading={loading} url={url} />
            <RenderBlocking stat={pageSpeed} loading={loading} url={url} />
            <NetworkPayload stat={pageSpeed} loading={loading} url={url} />
            <NetworkRequests stat={pageSpeed} loading={loading} url={url} />
          </section>

          {/* CHARTS SECTION */}

          <section className="grid grid-cols-3 gap-6 mb-10">
            <KeywordChart keywords={keywords} url={url} />
            <ImagesChart url={url} images={images} />
            <ThirdPartyScriptChart url={url} />
          </section>

          {/* Head starts here */}
          <HeadAnalysis
            pageTitle={pageTitle}
            pageDescription={pageDescription}
            canonical={canonical}
            hreflangs={hreflangs}
            pageSchema={pageSchema}
            openGraphDetails={openGraphDetails}
            url={url}
            tagManager={tagManager}
            favicon_url={favicon_url}
            code={headElements}
            indexation={indexation}
          />

          {/* TABLES START HERE */}
          <main
            id="tables"
            className="mx-auto w-full flex-col my-10 py-10 tables rounded-lg text-black relative overflow-auto grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 -mt-16 items-stretch"
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
      </Tabs>
      <Footer url={url} loading={loading} />
    </>
  );
};

export default Home;
