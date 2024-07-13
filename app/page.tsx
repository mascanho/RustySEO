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
interface HomeProps {}
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
import { Modal } from "@mantine/core";

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
  const [indexType, setIndexType] = useState<string[]>([]);
  const [pageSchema, setPageSchema] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState<number | undefined>();
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

    handleSpeed(url);
    setCrawlResult([]);
    setVisibleLinks([]);
    setHeadings([]);
    setWordCount(0);
    setOpenGraphDetails([]);
    setPageSpeed([]);
    setFavicon_url([]);
    setPageTitle([]);
    setPageDescription([]);
    setCanonical([]);
    setHreflangs([]);
    setResponseCode(undefined);
    setIndexType([]);
    setPageSchema([]);
    setReadingTime(undefined);
    setKeywords([]);
    setReadingLevelResults([]);
    setTagManager([]);
    setImages([]);
    setHeadElements([]);
    setBodyElements([]);

    invoke<{
      links: [];
      headings: [];
      page_title: [];
      page_description: [];
      canonical_url: [];
      hreflangs: [];
      response_code: number;
      index_type: [];
      page_schema: [];
      words_adjusted: number;
      reading_time: number;
      og_details: any[];
      favicon_url: [];
      keywords: [];
      readings: any[];
      tag_container: any[];
      images: any[];
      head_elements: any[];
      body_elements: any[];
    }>("crawl", { url })
      .then((result) => {
        showLinksSequentially(result.links); // Show links one by one
        showHeadingsSequentially(result.headings);
        setPageTitle(result.page_title);
        setPageDescription(result.page_description);
        setCanonical(result.canonical_url);
        setHreflangs(result.hreflangs);
        setResponseCode(result.response_code);
        setIndexType(result.index_type);
        setPageSchema(result.page_schema);
        setWordCount(result.words_adjusted);
        setReadingTime(result.reading_time);
        setOpenGraphDetails(result.og_details);
        setFavicon_url(result.favicon_url);
        setKeywords(result.keywords);
        setReadingLevelResults(result.readings);
        setTagManager(result.tag_container);
        setImages(result.images);
        setHeadElements(result.head_elements);
        setBodyElements(result.body_elements);
      })
      .catch(console.error);
  };

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

  function handleSpeed(url: string) {
    invoke<{}>("fetch_page_speed", { url: url })
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

  /*   console.log("DATA");
  console.log(crawlResult);
  console.log(visibleLinks);
  console.log(headings);
  console.log(pageTitle);
  console.log(pageDescription);
  console.log(canonical);
  console.log(hreflangs);
  console.log(responseCode);
  console.log(indexType);
  console.log(imageLinks);
  console.log(pageSchema, "Page Schema");
  console.log(wordCount, "---- The words");
  console.log(readingTime, "Reading Time"); 
  // console.log(openGraphDetails); */
  // console.log(keywords, "--- Keywords");
  // console.log(readingLevelResults, "--- Reading Level Results");
  // console.log(hreflangs);
  // console.log(favicon_url, "--- Favicon");
  console.log(openGraphDetails, "---- Open Graph Details");
  console.log(images, "---- Images");
  console.log(pageSpeed);
  console.log(headElements, "---- Head Elements");
  console.log(bodyElements, "---- Body Elements");

  return (
    <>
      <Modal opened={openedModal} onClose={closeModal} title="" centered>
        <span>hello</span>
      </Modal>

      {/* Fixed Input and Crawl Button */}
      <div className="fixed top-[34px] z-[1000] left-1/2 transform -translate-x-1/2 flex justify-center items-center py-2 ">
        <div className="relative backdrop-blur-lg">
          <input
            className="border border-gray-800 rounded-full h-6 text-xs min-w-80 w-[29em] pl-7 pt-[2px]   pr-2 placeholder:text-gray-500 relative "
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
          <HiMagnifyingGlass className="absolute top-[5px] text-sm left-2" />
          {loading && (
            <div
              className="animate-spin inline-block size-4 border-[3px] border-current border-t-transparent text-blue-600 rounded-full absolute top-1 right-2"
              role="status"
              aria-label="loading"
            ></div>
          )}
          <button
            onClick={() => handleClick(url)}
            className="absolute -right-[2.2em] top-[1px] rounded-lg px-1 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={20}
              height={20}
              color={"#000000"}
              className="hover:text-blue-500 ease-in-out duration-300"
              fill={"none"}
            >
              <path
                d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M8 12.5L10.5 15L16 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>{" "}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="absolute -right-14  top-[1px] rounded-lg px-1 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={20}
              height={20}
              color={"#000000"}
              fill={"none"}
              className="hover:text-red-400"
            >
              <path
                d="M15.7494 15L9.75 9M9.75064 15L15.75 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22.75 12C22.75 6.47715 18.2728 2 12.75 2C7.22715 2 2.75 6.47715 2.75 12C2.75 17.5228 7.22715 22 12.75 22C18.2728 22 22.75 17.5228 22.75 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>{" "}
          </button>
        </div>
      </div>
      <SubBar domainWithoutLastPart={domainWithoutLastPart} url={url} />

      <section className="grid grid-cols-2 gap-x-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 my-10 gap-y-5 pb-5 mt-6">
        <PerformanceEl stat={pageSpeed} loading={loading} url={url} />
        <FcpEl stat={pageSpeed} loading={loading} url={url} />
        <TtiEl stat={pageSpeed} loading={loading} url={url} />
        <TbtEl stat={pageSpeed} loading={loading} url={url} />
        <ClsEl stat={pageSpeed} loading={loading} url={url} />
        <DomElements stat={pageSpeed} loading={loading} url={url} />

        <SpeedIndex stat={pageSpeed} loading={loading} url={url} />
        <Redirects stat={pageSpeed} loading={loading} url={url} />
        <ServerResponseTime stat={pageSpeed} loading={loading} url={url} />
        <LongTasks stat={pageSpeed} loading={loading} url={url} />
        <RenderBlocking stat={pageSpeed} loading={loading} url={url} />
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
      />

      {/* TABLES START HERE */}

      <main
        id="tables"
        className="mx-auto w-full flex-col my-10 py-10 tables rounded-lg text-black relative overflow-auto grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 -mt-16 items-stretch"
      >
        <ContentSummary
          keywords={keywords}
          wordCount={wordCount}
          readingTime={readingTime}
          readingLevelResults={readingLevelResults}
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
        <LinkAnalysis visibleLinks={visibleLinks} />
        <ImageAnalysis images={images} />
        <HeadingsTable headings={headings} />
        <PageSchemaTable pageSchema={pageSchema} googleSchemaTestUrl={url} />
        <RedirectsTable pageSpeed={pageSpeed} />

        <ThirdPartyScripts pageSpeed={pageSpeed} />
      </main>
      <Footer url={url} loading={loading} />
    </>
  );
};

export default Home;
