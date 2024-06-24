"use client";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [url, setUrl] = useState<string>("");
  const [crawlResult, setCrawlResult] = useState<string[]>([]);
  const [visibleLinks, setVisibleLinks] = useState<string[]>([]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const handleClick = (url: string) => {
    // Clear previous results before starting the new crawl
    setCrawlResult([]);
    setVisibleLinks([]);

    invoke<{ links: string[] }>("crawl", { url })
      .then((result) => {
        setCrawlResult(result.links);
        showLinksSequentially(result.links); // Show links one by one
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

  console.log("DATA");
  console.log(crawlResult);

  return (
    <>
      {/* Fixed Input and Crawl Button */}
      <div className="fixed top-1 left-0 right-0 flex justify-center items-center  py-4 z-10">
        <div className="relative">
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
            className="absolute -right-[3.2em] top-[6px] rounded-lg px-4 flex items-center"
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
            onClick={() => handleClick(url)}
            className="absolute -right-20  top-[6px] rounded-lg px-4 flex items-center"
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

      <>
        <main className="h-[800px] w-[600px] mx-auto overflow-auto flex flex-col my-10 items-center bg-apple-white rounded-lg text-black p-6">
          {crawlResult.length > 0 && (
            <section className="w-full h-[200px] mx-auto">
              {visibleLinks.map((link) => (
                <div className="w-full h-fit crawl-item" key={link}>
                  <a className="block py-[2px]">{link}</a>
                </div>
              ))}
            </section>
          )}
        </main>
        <div className="mx-auto text-center">
          <span>Pages Crawled:</span>{" "}
          <span className="text-apple-blue">{visibleLinks.length}</span>
        </div>
      </>
    </>
  );
};

export default Home;
