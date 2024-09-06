import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/tauri";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import { BiKey } from "react-icons/bi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BsThreeDotsVertical } from "react-icons/bs";

interface Topic {
  keyword: string;
  title: string;
  description: string;
}

interface ComponentProps {
  bodyElements: string[];
}

// Custom hook to force update on mount
const useUpdateOnMount = () => {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    update();
  }, [update]);

  return update;
};

const Component: React.FC<ComponentProps> = ({ bodyElements }) => {
  const [topicsJson, setTopicsJson] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(true);
  const updateOnMount = useUpdateOnMount();

  const parseTopics = useCallback((topics: string): Topic[] => {
    topics = topics.replace(/^```|```$/g, "").replace(/^["']|["']$/g, "");
    const position = topics.indexOf("{");
    if (position !== -1) {
      topics = topics.substring(position);
    }
    topics = topics.replace(/}\s*{/g, "},\n{");
    topics = `[${topics}]`;

    try {
      return JSON.parse(topics);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return [];
    }
  }, []);

  const fetchTopics = useCallback(async () => {
    setLoadingTopics(true);
    try {
      const res: string = await invoke("generate_ai_topics", {
        body: bodyElements[0],
      });
      if (res) {
        const parsedTopics = parseTopics(res);
        setTopicsJson(parsedTopics);
      } else {
        setTopicsJson([]);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      setTopicsJson([]);
    } finally {
      setLoadingTopics(false);
      console.log("updated Topics");
    }
  }, [bodyElements]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics, updateOnMount]);

  if (loadingTopics) {
    return (
      <div className="dark:bg-brand-darker bg-gradient-to-br bg-transparent dark:bg-brand-darker overflow-y-auto h-[28rem] flex items-center justify-center">
        <p className="text-gray-600 text-sm">Loading topics...</p>
      </div>
    );
  }

  if (topicsJson.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 overflow-y-auto overflow-x-hidden h-[28rem] dark:bg-brand-darker">
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 dark:bg-brand-darker h-full">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white/50">
              No topics to show
            </h1>
            <p className="text-sm text-gray-600 dark:text-white/40">
              Crawl a page to generate topics
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full dark:bg-brand-darker overflow-y-auto h-[28rem] overflow-x-hidden">
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 dark:bg-brand-darker w-full border-0">
        {topicsJson.map((entry, index) => (
          <Card
            key={index}
            className="dark:bg-brand-darker rounded-none group relative"
          >
            <DropdownMenu>
              <DropdownMenuTrigger className="absolute right-1 top-4">
                <BsThreeDotsVertical className="dark:text-white mr-1 z-10" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-brand-darker border shadow shadow-lg px-0.5 bg-white dark:bg-brand-darker dark:border-brand-dark dark:text-white mt-1.5 mr-6 w-fit text-xs">
                <DropdownMenuLabel className="font-semibold text-xs">
                  Check Keyword
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-brand-dark" />
                <DropdownMenuItem
                  onClick={() =>
                    openBrowserWindow(
                      `https://www.google.com/search?q=${encodeURIComponent(entry.keyword)}`,
                    )
                  }
                  className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
                >
                  Google Search
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    openBrowserWindow(
                      `https://trends.google.com/trends/explore?q=${encodeURIComponent(entry.keyword)}`,
                    )
                  }
                  className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight cursor-pointer text-xs"
                >
                  Google Trends
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    openBrowserWindow(
                      `https://www.bing.com/search?q=${encodeURIComponent(entry.keyword)}`,
                    )
                  }
                  className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight cursor-pointer text-xs"
                >
                  Bing
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    openBrowserWindow(
                      `https://duckduckgo.com/?q=${encodeURIComponent(entry.keyword)}`,
                    )
                  }
                  className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight cursor-pointer text-xs"
                >
                  DuckDuckGo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <section className="transition-shadow duration-300 rounded-none dark:bg-brand-darker">
              <div className="p-3 flex flex-col">
                <div className="flex items-center mb-2 mr-1">
                  <BiKey className="h-6 w-6 text-blue-600" />
                  <span
                    onClick={() =>
                      openBrowserWindow(
                        `https://www.google.com/search?q=${encodeURIComponent(entry.keyword)}`,
                        "_blank",
                      )
                    }
                    className="ml-1 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full cursor-pointer font-medium"
                  >
                    {entry.keyword}
                  </span>
                </div>
                <h2 className="text-xs font-semibold mb-1.5 text-gray-800 dark:text-white/40">
                  {entry.title}
                </h2>
                <p className="text-xs text-blue-400 mb-1">
                  {entry.description}
                </p>
              </div>
            </section>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Component;
