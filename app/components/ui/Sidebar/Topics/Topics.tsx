// @ts-nocheck
import { Card, CardContent } from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";

import { BiKey, BiDotsVerticalRounded, BiDotsVertical } from "react-icons/bi";
import TopicsMenu from "./TopicsMenu";

interface Topic {
  keyword: string;
  title: string;
  description: string;
}

interface ComponentProps {
  bodyElements: string[];
}

export default function Component({ bodyElements }: ComponentProps) {
  const [topicsJson, setTopicsJson] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(true);

  useEffect(() => {
    const loadTopics = async () => {
      if (!bodyElements || !bodyElements[0]) {
        setLoadingTopics(false);
        return;
      }

      setLoadingTopics(true);

      try {
        const res = await invoke("generate_ai_topics", {
          body: bodyElements[0],
        });
        console.log("Raw response:", res);

        if (res) {
          let topics = res.toString();
          // Remove any JSON code block markers and quotes
          topics = topics.replace(/```json\n|```/g, "");
          topics = topics.replace(/^"|"$/g, "");

          // Clean the string to ensure it's valid JSON
          topics = topics.trim();
          topics = topics.replace(/\\"/g, '"'); // Replace escaped quotes
          topics = topics.replace(/\\/g, ""); // Remove remaining backslashes

          // Find the first valid JSON array
          const position = topics.indexOf("[");
          if (position !== -1) {
            topics = topics.substring(position);
          }

          console.log("Formatted topics string:", topics);

          try {
            const parsedTopics = JSON.parse(topics) as Topic[];
            console.log("Parsed topics:", parsedTopics);

            if (Array.isArray(parsedTopics) && parsedTopics.length > 0) {
              setTopicsJson(parsedTopics);
            } else if (parsedTopics) {
              setTopicsJson([parsedTopics]);
            }
          } catch (parseError) {
            console.error("Error parsing topics JSON:", parseError);
            setTopicsJson([]);
          }
        } else {
          setTopicsJson([]);
        }
      } catch (error) {
        console.error("Error generating topics:", error);
        setTopicsJson([]);
      } finally {
        setLoadingTopics(false);
      }
    };

    loadTopics();
  }, [bodyElements]);

  console.log(topicsJson, "topicsJson");

  return (
    <div className="w-full dark:bg-brand-darker overflow-y-auto h-[31rem] overflow-x-hidden">
      {loadingTopics && (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600 text-sm">Loading topics...</p>
        </div>
      )}

      {!loadingTopics && (!topicsJson || topicsJson.length === 0) && (
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 overflow-y-auto overflow-x-hidden h-full dark:bg-brand-darker">
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
      )}

      {!loadingTopics && topicsJson && topicsJson.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 dark:bg-brand-darker w-full border-0">
          {topicsJson.map((entry: Topic, index: number) => (
            <Card
              key={index}
              className="dark:bg-brand-darker rounded-none group relative"
            >
              <CardContent className="transition-shadow duration-300 rounded-none dark:bg-brand-darker relative">
                <div className="p-1 py-2 flex flex-col flex-wrap">
                  <div className="flex items-center mb-2">
                    <BiKey className="h-6 w-6 text-blue-600" />
                    <TopicsMenu entry={entry}>
                      <span
                        onClick={() =>
                          openBrowserWindow(
                            `https://www.google.com/search?q=${encodeURIComponent(entry?.keyword || "")}`,
                            "_blank",
                          )
                        }
                        className="ml-1 text-[11px] text-white bg-gray-700 hover:bg-brand-bright hover:text-white px-2 py-1 rounded-full cursor-pointer font-medium"
                      >
                        {entry?.keyword}
                      </span>
                    </TopicsMenu>
                  </div>
                  <h2 className="text-xs font-semibold mb-1.5 text-gray-800 dark:text-white/40">
                    {entry?.title}
                  </h2>
                  <p className="text-xs text-blue-400 mb-1">
                    {entry?.description}
                  </p>
                </div>
                <span className="dark:bg-gray-700 dark:text-white/50 bg-gray-300 text-black/70  text-[8px] rounded-full flex items-center p-1 pt-1.5 w-3 h-3 justify-center absolute right-2 bottom-[12px]">
                  {index + 1}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
