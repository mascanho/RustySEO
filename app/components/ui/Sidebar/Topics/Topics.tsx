// @ts-nocheck
import { Card, CardContent } from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";

import { BiKey, BiDotsVerticalRounded, BiDotsVertical } from "react-icons/bi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BsThreeDotsVertical } from "react-icons/bs";

export default function Component({ bodyElements }: any) {
  const [topicsJson, setTopicsJson] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(true);

  useEffect(() => {
    setLoadingTopics(true); // Set loading state to true initially

    invoke("generate_ai_topics", { body: bodyElements[0] })
      .then((res: any) => {
        let topics = res;

        if (topics) {
          topics = topics?.replace(/^```|```$/g, ""); // Remove surrounding backticks
          topics = topics?.replace(/^["']|["']$/g, ""); // Remove surrounding quotes

          const position = topics?.indexOf("{");
          if (position !== -1) {
            topics = topics?.substring(position);
          }

          topics = topics?.replace(/}\s*{/g, "},\n{"); // Add commas between objects
          topics = `[${topics}]`; // Wrap string in brackets to form a valid JSON array

          try {
            const parsedTopics = JSON?.parse(topics);
            setTopicsJson(parsedTopics);
          } catch (error) {
            console.error("Error parsing JSON:", error);
            setTopicsJson([]);
          }
        } else {
          setTopicsJson([]);
        }
      })
      .finally(() => {
        setLoadingTopics(false); // Set loading state to false after processing
      });
  }, [bodyElements]); // Dependency on bodyElements

  useEffect(() => {
    setTopicsJson(topicsJson);
  }, [loadingTopics]);

  if (loadingTopics) {
    return (
      <div className="dark:bg-brand-darker bg-gradient-to-br bg-transparent dark:bg-brand-darker overflow-y-auto h-[28rem] flex items-center justify-center">
        <p className="text-gray-600 text-sm">Loading topics...</p>
      </div>
    );
  }

  if (!topicsJson || topicsJson.length === 0) {
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
    <div className="w-full dark:bg-brand-darker  overflow-y-auto  h-[28rem] overflow-x-hidden">
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
              <DropdownMenuContent className="bg-brand-darker border shadow shadow-lg  px-0.5 bg-white dark:bg-brand-darker  dark:border-brand-dark dark:text-white mt-1.5 mr-6 w-fit text-xs">
                <DropdownMenuLabel className="font-semibold text-xs">
                  Check Keyword
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openBrowserWindow(testURL)}
                  className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight text-xs cursor-pointer"
                >
                  Google
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-brand-dark" />

                <DropdownMenuItem
                  onClick={() => openBrowserWindow(testURL)}
                  className="dark:hover:bg-brand-dark hover:text-white hover:bg-brand-highlight cursor-pointer text-xs"
                >
                  Documentation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <section className="transition-shadow duration-300 rounded-none dark:bg-brand-darker">
              <div className="p-3 flex flex-col">
                <div className="flex items-center mb-2">
                  <BiKey className="h-6 w-6 text-blue-600" />

                  <span
                    onClick={() =>
                      openBrowserWindow(
                        `https://www.google.com/search?q=${encodeURIComponent(entry?.keyword || "")}`,
                        "_blank",
                      )
                    }
                    className="ml-1 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full cursor-pointer font-medium"
                  >
                    {entry?.keyword}
                  </span>
                </div>
                <h2 className="text-xs font-semibold mb-1.5 text-gray-800 dark:text-white/40">
                  {entry?.title}
                </h2>
                <p className="text-xs text-blue-400 mb-1">
                  {entry?.description}
                </p>
              </div>
            </section>
          </Card>
        ))}
      </div>
    </div>
  );
}
