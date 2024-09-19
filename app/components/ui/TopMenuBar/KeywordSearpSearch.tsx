"use client";

import React, { useState } from "react";
import Select, { MultiValue } from "react-select";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVisibilityStore } from "@/store/VisibilityStore";

// Mock function to simulate fetching links
const fetchLinks = async (keywords: string[]): Promise<Link[]> => {
  // In a real application, this would be an API call
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
  return keywords.flatMap((keyword) => [
    {
      url: `https://example.com/${keyword}1`,
      heading: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Article 1`,
    },
    {
      url: `https://example.com/${keyword}2`,
      heading: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Article 2`,
    },
  ]);
};

interface Link {
  url: string;
  heading: string;
}

interface KeywordOption {
  value: string;
  label: string;
}

export default function KeywordSearch() {
  const [selectedKeywords, setSelectedKeywords] = useState<KeywordOption[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { visibility } = useVisibilityStore();

  const handleKeywordChange = (selected: MultiValue<KeywordOption>) => {
    setSelectedKeywords(selected as KeywordOption[]);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const keywords = selectedKeywords.map((k) => k.value);
      const fetchedLinks = await fetchLinks(keywords);
      setLinks(fetchedLinks);
    } catch (error) {
      console.error("Error fetching links:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${visibility.serpKeywords ? "" : "hidden"} w-[40rem] p-4 bg-white dark:bg-brand-dark text-black dark:text-white border-2 border-brand-bright mt-40 rounded-md h-full shadow-xl `}
    >
      <h1 className="text-2xl font-bold mb-4">Keyword Links Display</h1>
      <div className="mb-4">
        <Select<KeywordOption, true>
          isMulti
          options={[
            { value: "react", label: "React" },
            { value: "nextjs", label: "Next.js" },
            { value: "typescript", label: "TypeScript" },
            { value: "javascript", label: "JavaScript" },
          ]}
          value={selectedKeywords}
          onChange={handleKeywordChange}
          placeholder="Select keywords..."
          className="basic-multi-select"
          classNamePrefix="select"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={selectedKeywords.length === 0 || isLoading}
        className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? "Loading..." : "Fetch Links"}
      </button>
      <ScrollArea className="h-[400px] mt-4">
        {links.map((link, index) => (
          <Card key={index} className="mb-4">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">{link.heading}</h2>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {link.url}
              </a>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>
  );
}
