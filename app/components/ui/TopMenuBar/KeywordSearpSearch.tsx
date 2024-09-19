"use client";

import React, { useState } from "react";
import Select, { MultiValue } from "react-select";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVisibilityStore } from "@/store/VisibilityStore";
import { IoClose } from "react-icons/io5";
import useContentStore from "@/store/storeContent";
import { FaGlobe, FaHeading, FaExternalLinkAlt, FaCopy } from "react-icons/fa";
import { TbH4, TbH5, TbH6 } from "react-icons/tb";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Select as SelectShad,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock function to simulate fetching links
const fetchLinks = async (keywords: string[]): Promise<Link[]> => {
  // In a real application, this would be an API call
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
  return keywords.flatMap((keyword) => [
    {
      url: `https://example.com/${keyword}1`,
      headings: [
        {
          text: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Main Title`,
          type: "h1",
        },
        { text: `${keyword} Subtitle`, type: "h2" },
        { text: `About ${keyword}`, type: "h3" },
        { text: `${keyword} Features`, type: "h4" },
        { text: `${keyword} Benefits`, type: "h5" },
        { text: `${keyword} Conclusion`, type: "h6" },
      ],
    },
    {
      url: `https://example.com/${keyword}2`,
      headings: [
        {
          text: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Guide`,
          type: "h1",
        },
        { text: `Why ${keyword}?`, type: "h2" },
        { text: `Types of ${keyword}`, type: "h3" },
        { text: `How to use ${keyword}`, type: "h4" },
        { text: `${keyword} Tips`, type: "h5" },
        { text: `${keyword} Resources`, type: "h6" },
      ],
    },
    // ... (repeat for other links, following the same pattern)
  ]);
};

interface KeywordOption {
  value: string;
  label: string;
}

interface SerpResult {
  url: string;
  headings: headings[];
}

export default function KeywordSearch() {
  const [selectedKeywords, setSelectedKeywords] = useState<KeywordOption[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serpResults, setSerpResults] = useState<SerpResult[]>([]);
  const { visibility, hideSerpKeywords } = useVisibilityStore();
  const { keywords } = useContentStore();
  const [numberOfPages, setNumberOfPages] = useState(5);

  const handleKeywordChange = (selected: MultiValue<KeywordOption>) => {
    setSelectedKeywords(selected as KeywordOption[]);
  };

  const getHeadingIcon = (headingType: string) => {
    return <FaHeading />;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard");
    });
  };

  // Call the Tauri function
  const handleSerpHeadings = async () => {
    setIsLoading(true);
    try {
      const result = await invoke<string>("scrape_google_headings_command", {
        keywords: selectedKeywords.map((k) => k.value),
        number: numberOfPages,
      });
      console.log(result);
      setSerpResults(result);
    } catch (error) {
      console.error("Error scraping SERP headings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  console.log(serpResults, numberOfPages);

  return (
    <div
      className={`${visibility.serpKeywords ? "" : "hidden"} relative bottom-[50px] transform translate-y-[4rem] transition-all ease-linear duration-75 w-[40rem] py-4 px-1 bg-white dark:bg-brand-dark text-black dark:text-white border-2 border-brand-bright h-[53rem] -ml-2 mb-0 rounded-md shadow-xl overflow-hidden`}
    >
      <IoClose
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 cursor-pointer hover:bg-gray-200 active:rounded-sm"
        onClick={hideSerpKeywords}
      />
      <h1 className="text-2xl font-bold mb-2 pl-2">SERP Heading Results</h1>
      <div className="mb-2 flex w-full items-center pr-4">
        <Select<KeywordOption, true>
          isMulti
          options={
            keywords &&
            keywords[0]?.map((keyword: string[]) => ({
              value: keyword[0],
              label: keyword[0],
            }))
          }
          value={selectedKeywords}
          onChange={handleKeywordChange}
          placeholder="Google search..."
          className="basic-multi-select w-11/12 text-xs pl-2"
          classNamePrefix="select"
        />
        <SelectShad
          onValueChange={(value) => setNumberOfPages(value)}
          defaultValue="uk"
        >
          <SelectTrigger className="w-[90px] text-xs border border-brand-dark/25 ml-1 px-2 h-[38px]">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent className="z-[999999999] text-xs border  w-full">
            <SelectItem value="uk">UK</SelectItem>
            <SelectItem value="nl">NL</SelectItem>
            <SelectItem value="es">ES</SelectItem>
            <SelectItem value="de">DE</SelectItem>
            <SelectItem value="fr">FR</SelectItem>
            <SelectItem value="it">IT</SelectItem>
            <SelectItem value="pt">PT</SelectItem>
            <SelectItem value="us">US</SelectItem>
          </SelectContent>
        </SelectShad>{" "}
        <SelectShad
          onValueChange={(value) => setNumberOfPages(value)}
          defaultValue="en"
        >
          <SelectTrigger className="w-[90px] text-xs border border-brand-dark/25 ml-1 px-2 h-[38px]">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent className="z-[999999999] text-xs border w-10">
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="nl">Dutch</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="it">Italian</SelectItem>
            <SelectItem value="pt">Portuguese</SelectItem>
            <SelectItem value="en-us">English (US)</SelectItem>
          </SelectContent>
        </SelectShad>
        <SelectShad
          onValueChange={(value) => setNumberOfPages(value)}
          defaultValue="5"
        >
          <SelectTrigger className="w-[90px] text-xs border border-brand-dark/25 ml-1 px-2 h-[38px]">
            <SelectValue placeholder="Pages" />
          </SelectTrigger>
          <SelectContent
            className="z-[999999999] text-xs border w-10"
            defaultValue={5}
          >
            <SelectItem value={5}>5</SelectItem>
            <SelectItem value={10}>10</SelectItem>
            <SelectItem value={15}>15</SelectItem>
          </SelectContent>
        </SelectShad>
      </div>
      <div className="w-full pr-6 mb-2">
        <button
          onClick={handleSerpHeadings}
          disabled={selectedKeywords.length === 0 || isLoading}
          className="bg-red-500 text-white py-2 w-full  mx-2 text-primary-foreground  font-semibold rounded disabled:opacity-50 text-xs"
        >
          {isLoading ? "Loading..." : "Crawl Google"}
        </button>
      </div>
      <ScrollArea className="h-[710px] mt-2 pr-4 pl-2 pb-2">
        {serpResults?.pages?.map((key, index) => (
          <section
            key={index}
            className="mb-2 text-xs h-fit border rounded-md overflow-hidden w-full "
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-1">
                <FaGlobe />
                <h2 className="font-bold">
                  {key.url.length > 76
                    ? `${key.url.substring(0, 75)}...`
                    : key.url}
                </h2>
                <span className="text-brand-bright">({index + 1})</span>
                <a href={key.url} target="_blank" rel="noopener noreferrer">
                  <FaExternalLinkAlt className="text-blue-500 hover:text-blue-700" />
                </a>
              </div>
              {key?.headings.map((heading, headingIndex) => (
                <div
                  key={headingIndex}
                  className="flex items-center ml-4 space-x-1 mt-1 group"
                >
                  <span className="relative group">
                    <span className="text-brand-bright uppercase font-bold text-base mr-2">
                      {heading[0]}
                    </span>

                    {heading[1]}
                    <FaCopy
                      className="absolute right-[-20px] top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(heading[1])}
                    />
                  </span>
                </div>
              ))}
            </CardContent>
          </section>
        ))}
      </ScrollArea>
    </div>
  );
}
