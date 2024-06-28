"use client";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import PerformanceEl from "./components/Performance";

import { CiImageOn } from "react-icons/ci";
import ResponseCodeEl from "./components/ResponseCode";
import Indexation from "./components/Indexation";

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [url, setUrl] = useState<string>("https://markwarrior.dev");
  const [crawlResult, setCrawlResult] = useState<string[]>([]);
  const [visibleLinks, setVisibleLinks] = useState<string[]>([]);
  const [headings, setHeadings] = useState<string[]>([]);
  const [altTexts, setAltTexts] = useState<string[]>([]);
  const [indexation, setIndexation] = useState<string[]>([]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const handleClick = (url: string) => {
    // Clear previous results before starting the new crawl
    setCrawlResult([]);
    setVisibleLinks([]);
    setHeadings([]);
    setAltTexts([]);

    invoke<{ links: []; headings: []; alt_texts: []; indexation: [] }>(
      "crawl",
      { url },
    )
      .then((result) => {
        showLinksSequentially(result.links); // Show links one by one
        showHeadingsSequentially(result.headings);
        showAltTextsSequentially(result.alt_texts);
        setIndexation(result.indexation);
      })
      .catch(console.error);
  };

  const showLinksSequentially = (links: string[]) => {
    links.forEach((link, index) => {
      setTimeout(() => {
        setVisibleLinks((prevVisibleLinks) => [...prevVisibleLinks, link]);
      }, index * 500); // Adjust timing for each link appearance
    });
  };

  const showHeadingsSequentially = (headings: string[]) => {
    headings.forEach((heading, index) => {
      setTimeout(() => {
        setHeadings((prevHeadings) => [...prevHeadings, heading]);
      }, index * 500); // Adjust timing for each link appearance
    });
  };

  const showAltTextsSequentially = (alt_texts: string[]) => {
    alt_texts.forEach((alt_text, index) => {
      setTimeout(() => {
        setAltTexts((prevAltTexts) => [...prevAltTexts, alt_text]);
      }, index * 500); // Adjust timing for each link appearance
    });
  };

  console.log("DATA");
  console.log(crawlResult);
  console.log(visibleLinks);
  console.log(headings);
  console.log(indexation);

  return (
    <>
      {/* Fixed Input and Crawl Button */}
      <div className="fixed top-0 flex justify-center items-center  py-4 z-10 bg-apple-silver backdrop-blur-xl backdrop-blur w-full">
        <div className="relative backdrop-blur-lg">
          <input
            className="border border-gray-300 rounded-lg h-10 w-80 pl-3 pt-1 pr-10 placeholder:text-gray-500"
            type="text"
            placeholder="https://yourwebsite.com"
            value={url}
            onChange={handleChange}
            style={{ outline: "none", boxShadow: "none" }}
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
            className="absolute -right-20  top-[8px] rounded-lg px-1 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={24}
              height={24}
              color={"#000000"}
              fill={"none"}
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
      <section className="grid grid-cols-5">
        <PerformanceEl stat={1} />
        <ResponseCodeEl res={200} />
        <PerformanceEl stat={1} />
        <PerformanceEl stat={1} />
        <Indexation index={indexation} />
      </section>
      <main className="mx-auto w-full flex flex-col my-10 items-center rounded-lg text-black overflow-auto grid grid-cols-3 gap-x-6 gap-y-12">
        <div>
          <h2 className="mb-4">Links</h2>
          <section className="mx-auto h-96 w-full rounded-md overflow-auto bg-white/40 relative">
            {visibleLinks.map((link) => (
              <div className="crawl-item" key={link}>
                <a className="block py-1 px-2 bg-white border-b w-full">
                  {link}
                </a>
              </div>
            ))}
          </section>
          <div className="mx-auto text-center mt-4">
            <span>Pages Crawled:</span>{" "}
            <span className="text-apple-blue">{visibleLinks.length}</span>
          </div>
        </div>
        <div>
          <h2 className="mb-4">Alt Text</h2>
          <section className="mx-auto h-96 w-full rounded-md overflow-auto bg-white/40 relative">
            {altTexts.map((link) => (
              <div className="crawl-item" key={link}>
                <a className="block py-1 px-2 bg-white border-b w-full flex items-center">
                  <CiImageOn className="mr-1" /> {link}
                </a>
              </div>
            ))}
          </section>
          <div className="mx-auto text-center mt-4">
            <span>Pages Crawled:</span>{" "}
            <span className="text-apple-blue">{visibleLinks.length}</span>
          </div>
        </div>
        <div>
          <h2 className="mb-4">Links</h2>
          <section className="mx-auto h-96 w-full rounded-md overflow-auto bg-white/40 relative">
            {headings.map((link) => {
              const [headingType, headingText] = link.split(": ", 2);
              return (
                <div className="crawl-item" key={link}>
                  <a className="block py-1 px-2 bg-white border-b w-full">
                    <span className="font-bold text-apple-blue tex-base">
                      {headingType}:{" "}
                    </span>
                    <span className="heading-text">{headingText}</span>
                  </a>
                </div>
              );
            })}
          </section>
          <div className="mx-auto text-center mt-4">
            <span>Headings Found:</span>{" "}
            <span className="text-apple-blue">{headings.length}</span>
          </div>
        </div>
        <div>
          <h2 className="mb-4">Links</h2>
          <section className="mx-auto h-96 w-full rounded-md overflow-auto bg-white/40 relative">
            {headings.map((link) => {
              const [headingType, headingText] = link.split(": ", 2);
              return (
                <div className="crawl-item" key={link}>
                  <a className="block py-1 px-2 bg-white border-b w-full">
                    <span className="font-bold text-apple-blue tex-base">
                      {headingType}:{" "}
                    </span>
                    <span className="heading-text">{headingText}</span>
                  </a>
                </div>
              );
            })}
          </section>
          <div className="mx-auto text-center mt-4">
            <span>Headings Found:</span>{" "}
            <span className="text-apple-blue">{headings.length}</span>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
