"use client";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import PerformanceEl from "./components/Performance";
import ResponseCodeEl from "./components/ResponseCode";
import Indexation from "./components/Indexation";
// import openBrowserWindow from "./Hooks/OpenBrowserWindow";
import replaceDoubleSlash from "./Hooks/DecodeURL";
import SchemaTextEncoder from "./Hooks/SchemaTest";
import { CgWebsite } from "react-icons/cg";
import MenuEl from "./components/ui/Menu";
import { useDisclosure } from "@mantine/hooks";

import WordCountEl from "./components/WordCount";
import ReadingTimeEl from "./components/ReadingTime";
import OpenGraphCard from "./components/ui/OpenGraphCard";
import GooglePreview from "./components/GooglePreview";
import FcpEl from "./components/Fcp";
import DomElements from "./components/DomElements";
import SpeedIndex from "./components/SpeedIndex";

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  // Mantine Collapse
  const [opened, { toggle }] = useDisclosure(false);

  const [url, setUrl] = useState<string>("https://markwarrior.dev");
  const [crawlResult, setCrawlResult] = useState<string[]>([]);
  const [visibleLinks, setVisibleLinks] = useState<string[]>([]);
  const [headings, setHeadings] = useState<string[]>([]);
  const [altTexts, setAltTexts] = useState<string[]>([]);
  const [pageTitle, setPageTitle] = useState<string[]>([]);
  const [pageDescription, setPageDescription] = useState<string[]>([]);
  const [canonical, setCanonical] = useState<string[]>([]);
  const [hreflangs, setHreflangs] = useState<string[]>([]);
  const [responseCode, setResponseCode] = useState<number | undefined>();
  const [indexType, setIndexType] = useState<string[]>([]);
  const [imageLinks, setImageLinks] = useState<string[]>([]);
  const [pageSchema, setPageSchema] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState<number | undefined>();
  const [readingTime, setReadingTime] = useState<number | undefined>();
  const [openGraphDetails, setOpenGraphDetails] = useState<any[]>([]);
  const [pageSpeed, setPageSpeed] = useState<any[]>([]);
  const [favicon_url, setFavicon_url] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const userinput = event.target.value;
    const lowercaseURL = userinput.toLowerCase();

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
    handleSpeed(url);
    setCrawlResult([]);
    setVisibleLinks([]);
    setHeadings([]);
    setAltTexts([]);
    setImageLinks([]);
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

    invoke<{
      links: [];
      headings: [];
      alt_texts: [];
      page_title: [];
      page_description: [];
      canonical_url: [];
      hreflangs: [];
      response_code: number;
      index_type: [];
      image_links: [];
      page_schema: [];
      words_adjusted: number;
      reading_time: number;
      og_details: any[];
      favicon_url: [];
    }>("crawl", { url })
      .then((result) => {
        showLinksSequentially(result.links); // Show links one by one
        showHeadingsSequentially(result.headings);
        showAltTextsSequentially(result.alt_texts);
        setPageTitle(result.page_title);
        setPageDescription(result.page_description);
        setCanonical(result.canonical_url);
        setHreflangs(result.hreflangs);
        setResponseCode(result.response_code);
        setIndexType(result.index_type);
        showImageLinksSequentially(result.image_links);
        setPageSchema(result.page_schema);
        setWordCount(result.words_adjusted);
        setReadingTime(result.reading_time);
        setOpenGraphDetails(result.og_details);
        setFavicon_url(result.favicon_url);
      })
      .catch(console.error);
  };

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

  const showAltTextsSequentially = (alt_texts: string[]) => {
    alt_texts.forEach((alt_text, index) => {
      setTimeout(() => {
        setAltTexts((prevAltTexts) => [...prevAltTexts, alt_text]);
      }, index * 50); // Adjust timing for each link appearance
    });
  };

  const showImageLinksSequentially = (image_links: string[]) => {
    image_links.forEach((image_link, index) => {
      setTimeout(() => {
        setImageLinks((prevImageLinks) => [...prevImageLinks, image_link]);
      }, index * 50); // Adjust timing for each link appearance
    });
  };

  // Generates a codified URL to use LinkedIn's social post tool
  const originalURL = url;
  const linkedInInspect: any = replaceDoubleSlash(originalURL);
  const googleSchemaTestUrl = SchemaTextEncoder(originalURL);

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
  console.log(openGraphDetails); */
  console.log(pageSpeed);

  return (
    <>
      {/* Fixed Input and Crawl Button */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 flex justify-center items-center py-5 z-40 ">
        <div className="relative backdrop-blur-lg">
          <input
            className="border border-gray-300 rounded-lg h-10 min-w-80 w-96 pl-3  pr-2 placeholder:text-gray-500"
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
          <button
            onClick={() => handleClick(url)}
            className="absolute -right-[3.2em] top-[8px] rounded-lg px-1 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={24}
              height={24}
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
            // onClick={() => window.location.reload()}
            className="absolute -right-20  top-[8px] rounded-lg px-1 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={24}
              height={24}
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
          {visibleLinks.length}
        </div>
      </div>
      <section className="w-full flex items-center space-x-2 justify-between">
        <div className="flex items-center space-x-2">
          <div className="uppercase overflow-x-hidden py-1 font-semibold flex items-center space-x-2 border border-apple-spaceGray border-2 text-sm shadow px-3 rounded-full">
            <CgWebsite />
            <span>{domainWithoutLastPart || "RustySEO"}</span>
          </div>
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={16}
              height={16}
              color={"#000000"}
              fill={"none"}
            >
              <path
                d="M20 12L4 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 17C15 17 20 13.3176 20 12C20 10.6824 15 7 15 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>{url}</span>
        </div>
        <div>
          <MenuEl />
        </div>
      </section>
      <section className="grid grid-cols-2 gap-x-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 my-10 gap-y-5 pb-5">
        <PerformanceEl stat={pageSpeed} loading={loading} url={url} />
        <FcpEl stat={pageSpeed} loading={loading} url={url} />
        <DomElements stat={pageSpeed} loading={loading} url={url} />

        <SpeedIndex stat={pageSpeed} loading={loading} url={url} />
        <ResponseCodeEl res={responseCode} />
        <Indexation index={indexType} />
        <WordCountEl words={wordCount} />
        <ReadingTimeEl readingTime={readingTime} />
      </section>

      {/* Head starts here */}

      <section
        className={`mb-10 flex-wrap w-full space-y-2 ${pageTitle[0]?.length > 0 ? "bg-white" : "bg-white/40"} p-4 rounded-b-md relative`}
      >
        <div className="w-full bg-apple-spaceGray left-0 -top-5 rounded-t-md  h-8 absolute flex items-center justify-center">
          <h2 className="text-center font-semibold text-white">Head</h2>
          <span className="pt-1 absolute right-2 bg-blue-400 rounded-md flex items-center text-xs px-2 text-white">
            Preview
          </span>
        </div>
        <div className="flex items-center">
          <span
            className={`flex font-semibold ${pageTitle[0]?.length > 60 && "bg-red-500"} ${pageTitle[0]?.length < 60 && "bg-green-500"}   bg-apple-spaceGray text-white p-1 px-2 rounded-md`}
          >
            Page Title
          </span>
          <span className="flex ml-2 text-black/80">{pageTitle[0]}</span>
          {pageTitle.length > 0 ? (
            <span
              className={`flex ml-4 ${pageTitle[0].length > 60 ? "text-red-500" : "text-green-500"}`}
            >
              {pageTitle[0].length} / 60
            </span>
          ) : (
            ""
          )}
        </div>
        <div className="flex items-center">
          <span
            className={`flex mr-2 font-semibold ${pageTitle[0]?.length > 160 && "bg-red-500"} ${pageTitle[0]?.length < 160 && "bg-green-500"}  } ${pageDescription.length === 0 && "bg-apple-spaceGray"}   bg-apple-spaceGray text-white p-1 px-2 rounded-md`}
          >
            Meta Description
          </span>
          <span className="text-black/80"> {pageDescription[0]}</span>
          {pageDescription[0]?.length > 0 ? (
            <span
              className={`flex ml-4 ${pageDescription.length > 160 ? "text-red-500" : "text-green-500"}`}
            >
              {pageDescription[0].length} / 160
            </span>
          ) : (
            <span className="ml-2"></span>
          )}
        </div>
        <div className="flex items-center">
          <span className="font-semibold  bg-apple-spaceGray text-white p-1 px-2 rounded-md">
            Canonical URL
          </span>
          {<span className="ml-2">{canonical}</span>}
        </div>
        <div className="flex items-center">
          <span className="mr-1 font-semibold bg-apple-spaceGray text-white p-1 px-2 rounded-md">
            Hreflangs
          </span>
          <div className="flex">
            {hreflangs[0] === "No hreflang found"
              ? "No hreflang found"
              : hreflangs.map((hreflang) => (
                  <span
                    className="flex ml-2  bg-apple-gold text-white p-1 px-2 rounded-md"
                    key={hreflang}
                  >
                    {hreflang}
                  </span>
                ))}
          </div>
        </div>
        <div className="flex items-center">
          <span
            className={`flex mr-2 font-semibold ${pageTitle[0]?.length > 160 && "bg-red-500"} ${pageTitle[0]?.length < 160 && "bg-green-500"}   bg-apple-spaceGray text-white p-1 px-2 rounded-md`}
          >
            OpenGraph
          </span>
          <span className="text-black/80"> {pageDescription[0]}</span>
          {pageDescription[0]?.length > 0 ? (
            <span
              className={`flex ml-4 ${pageDescription.length > 160 ? "text-red-500" : "text-green-500"}`}
            >
              {pageDescription[0].length} / 160
            </span>
          ) : (
            <span className="ml-2"></span>
          )}
        </div>
      </section>

      {/* TABLES START HERE */}

      <main
        id="tables"
        className="mx-auto w-full flex-col my-20 items-center tables rounded-lg text-black relative overflow-auto grid grid-cols-1 gap-8 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 -mt-2 "
      >
        <GooglePreview
          favicon_url={favicon_url}
          openGraphDetails={openGraphDetails}
          url={url}
        />
        <div>
          <h2 className=" bg-apple-spaceGray font-semibold text-white p-1 relative px-2 rounded-t-md w-full  text-center pt-2">
            Social Media Preview
          </h2>

          <section className="mx-auto h-96 w-full rounded-md overflow-auto relative bg-white/40">
            {Object.keys(openGraphDetails).length > 0 && (
              <OpenGraphCard
                linkedInInspect={linkedInInspect}
                openGraphDetails={openGraphDetails}
              />
            )}
          </section>
        </div>
        <div>
          <h2 className=" bg-apple-spaceGray font-semibold text-white p-1 px-2 rounded-t-md w-full pb-2 text-center -mb-1">
            Link Analysis
          </h2>

          <section className="mx-auto h-96 w-full rounded-t-md overflow-auto relative bg-white/40">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-xs w-1/5  border-r align-middle">
                    Anchor Text
                  </th>
                  <th className="text-xs px-2 py-1 w-2/3 align-middle">Href</th>
                </tr>
              </thead>
              <tbody>
                {visibleLinks.map((link, index) => (
                  <tr key={index} className="align-middle">
                    <td className="crawl-item border-r border-b h-full">
                      <span className="block py-1 text-apple-blue px-2 text-sm flex items-center w-[180px]">
                        {link[1] || "-"}
                      </span>
                    </td>
                    <td className="h-full w-1/3 border-b">
                      <a
                        href={link[0]}
                        className="py-1 px-2 bg-white  text-sm flex items-center"
                      >
                        {link[0]}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <div className="mx-auto text-center  bg-white/40 py-1 rounded-b-md ">
            <span>Links Found:</span>{" "}
            <span className="text-apple-blue">{visibleLinks.length}</span>
          </div>
        </div>
        <div>
          <h2 className=" bg-apple-spaceGray font-semibold text-white p-1 px-2 rounded-t-md w-full pb-2 text-center -mb-1">
            Image Analysis
          </h2>

          <section className="overflow-auto h-96 bg-white bg-opacity-40 rounded-md">
            {imageLinks.length > 0 || url === "" ? (
              <table className="w-full text-sm overflow-auto">
                <thead>
                  <tr>
                    <th className="text-xs w-1/5 border-r px-2 items-center align-middle">
                      Image
                    </th>
                    <th className="text-xs w-2/5 px-2 border-r align-middle">
                      Alt Text
                    </th>
                    <th className="text-xs w-2/5 px-2 align-middle">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {imageLinks.map((image: any, index) => (
                    <tr className="crawl-item" key={index}>
                      <td className="px-2 py-1 text-center min-w-16">
                        <a href={image.link} className="block w-full h-full">
                          <img
                            src={image.link}
                            alt={image.alt_text}
                            className="m-auto w-16 h-12 object-contain"
                          />
                        </a>
                      </td>
                      <td className="px-2 py-1 text-xs">{image.alt_text}</td>
                      <td
                        onClick={() => {
                          // openBrowserWindow(image.link);
                        }}
                        className="px-2 py-1 cursor-pointer text-sm"
                      >
                        {image.link}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-96 flex items-center justify-center">
                <p className="text-center">No images found</p>
              </div>
            )}
          </section>
          <div className="mx-auto text-center mt-4">
            <span>Images Found:</span>{" "}
            <span className="text-apple-blue">{altTexts.length}</span>
          </div>
        </div>
        <div>
          <h2 className=" bg-apple-spaceGray font-semibold text-white p-1 px-2 rounded-t-md w-full pb-2 text-center -mb-1">
            Headings
          </h2>
          <section className="mx-auto h-96 w-full rounded-md overflow-auto bg-white/40 relative">
            <table className="crawl-item">
              <thead>
                <tr>
                  <th className="text-xs w-1/5 border-r align-middle">
                    Heading Type
                  </th>
                  <th className="text-xs px-2 py-1 w-2/3 align-middle">
                    Heading Text
                  </th>
                </tr>
              </thead>
              <tbody>
                {headings.map((link, index) => {
                  const [headingType, headingText] = link.split(": ", 2);
                  return (
                    <tr key={index} className="align-middle">
                      <td className="crawl-item border-r font-semibold text-apple-blue border-b w-1/5 text-center h-full">
                        {headingType}{" "}
                      </td>
                      <td className="h-full w-full border-b crawl-item pl-3">
                        {headingText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
          <div className="mx-auto text-center mt-4">
            <span>Headings Found:</span>{" "}
            <span className="text-apple-blue">{headings.length}</span>
          </div>
        </div>
        <div>
          <h2
            onClick={() => {
              // openBrowserWindow(googleSchemaTestUrl);
            }}
            className=" bg-apple-spaceGray font-semibold text-white p-1 px-2 rounded-t-md w-full text-center"
          >
            Page Schema
          </h2>

          <section className="mx-auto h-96 w-full rounded-md overflow-auto bg-white/40 relative">
            {pageSchema.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-center m-auto">No Schema Found</p>
              </div>
            ) : (
              <pre className="bg-white w-full overflow-scroll ">
                {pageSchema}
              </pre>
            )}
          </section>
          <div className="mx-auto text-center mt-4">
            <span>Headings Found:</span>{" "}
            <span className="text-apple-blue">{headings.length}</span>
          </div>
        </div>{" "}
        <a
          onClick={() => {
            // openBrowserWindow(linkedInInspect);
          }}
        >
          View preview
        </a>
      </main>
    </>
  );
};

export default Home;
