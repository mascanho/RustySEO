import { useOllamaStore } from "@/store/store";
import useOnPageSeo from "@/store/storeOnPageSeo";
import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import useContentStore from "@/store/storeContent";
import {
  FiClock,
  FiType,
  FiBarChart2,
  FiSliders,
  FiBookOpen,
  FiImage,
} from "react-icons/fi";
import { PiVideo } from "react-icons/pi";

const ContentSummary = ({
  keywords,
  wordCount,
  readingTime,
  readingLevelResults,
  htmlToTextRatio,
  pageTitle,
  video,
}: any) => {
  const { setSeoContentQuality } = useOnPageSeo();
  const [AiContentAnalysis, setAiContentAnalysis] = useState("");
  const setReadingTime = useContentStore((state) => state.setReadingTime);
  const setWordCount = useContentStore((state) => state.setWordCount);
  const setReadingLevel = useContentStore((state) => state.setReadingLevel);
  const setTextRatio = useContentStore((state) => state.setTextRatio);
  const setKeywords = useContentStore((state) => state.setKeywords);
  const setVideo = useContentStore((state) => state.setVideo);

  useEffect(() => {
    if (!keywords) {
      setSeoContentQuality({
        keywords,
        wordCount,
        readingTime,
        readingLevelResults,
        htmlToTextRatio,
      });
    }

    // Set THE CONTENT STORE
    setWordCount(wordCount);
    setReadingTime(wordCount);
    setReadingLevel(readingLevelResults);
    setTextRatio(htmlToTextRatio);
    setKeywords(keywords);
    setVideo(video);
  }, [keywords, readingTime, readingLevelResults]);

  console.log(readingLevelResults, "READING LEVEL RESULTS FROM EL");

  useEffect(() => {
    setAiContentAnalysis("");
  }, [keywords]);

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

  console.log(video, "VIDEO");

  return (
    <section className="flex-wrap min-h-[calc(96rem - 2.5rem)] h-[28rem] space-y-1  dark:bg-slate-900 dark:text-white  px-0.5 py-0.5  relative">
      <div className="px-2 py-1.5 grid gap-5  dark:text-white">
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiClock className="text-sky-dark" size={18} />
              <span className="font-semibold pt-1">Reading Time</span>
            </div>
            <span>
              {wordCount === undefined
                ? ""
                : wordCount[2]
                  ? `${wordCount[2]} min(s)`
                  : ""}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 -mt-2">
              <FiType className="text-sky-dark mt-[5px]" size={18} />
              <span className="font-semibold mt-2">Word Count</span>
            </div>
            <span>{wordCount ? wordCount[0] + " words" : ""}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 ">
              <FiBarChart2 className="text-sky-dark" size={18} />
              <span className="font-semibold">Reading Level</span>
            </div>
            <span>
              {readingLevelResults[0] ? readingLevelResults[0][1] : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between -mt-1">
          <div className="flex items-center space-x-2 -mt-3">
            <FiSliders className="text-sky-dark mt-1" size={18} />
            <span className="font-semibold mt-2">Text Ratio</span>
          </div>
          <span>
            {htmlToTextRatio
              ? htmlToTextRatio[0] &&
                Math.round(htmlToTextRatio[0][0] * 100) + "%"
              : ""}{" "}
          </span>
        </div>

        <div className="flex items-center justify-between -mt-2">
          <div className="flex items-center space-x-2">
            <PiVideo className="text-sky-dark" size={20} />
            <span className="font-semibold">Media</span>
          </div>
          <span>
            {keywords.length > 0 &&
              video &&
              video[0] === "Yes" &&
              "Found Video"}
            {keywords.length > 0 && video && video[0] === "No" && "No Video"}
          </span>
        </div>

        <div className="flex items-start justify-start flex-col mt-4 h-full ">
          <div className="flex items-start space-x-2">
            <div className="flex flex-col w-full justify-center">
              <div className="flex items-center mb-3 -mt-6">
                <FiBookOpen className="text-sky-dark mt-1" size={18} />
                <span className="font-semibold block ml-2 pt-0.5">
                  Top Keywords
                </span>
              </div>
              <div className="flex flex-wrap gap-2 min-h-12">
                {keywords[0]?.map((keyword: any, index: any) => (
                  <div
                    key={index}
                    className="dark:bg-gray-700 bg-slate-200 w-fit px-1.5 py-1 rounded-lg text-xs"
                  >
                    <span className="bg-brand-bright px-1 py-[1px] rounded-full text-white text-xs">
                      {keyword[1]}
                    </span>
                    <span className="ml-1" key={index}>
                      {keyword[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-1 overflow-y-auto mt-4 h-full">
            <h3 className="text-[10px] font-semibold dark:text-sky-dark">
              Page Summary
            </h3>
            <p className="text-muted-foreground text-xs -mt-1">
              {AiContentAnalysis}
            </p>
            {AiContentAnalysis === "" && keywords && keywords.length > 0 && (
              <div className="text-black/50 dark:text-white/50 space-y-1">
                <p>AI Model Not Available</p>
                <p>
                  Go to <kbd>Menu</kbd> &gt; <kbd>Connectors</kbd>
                </p>
                <p>Then select your AI Model</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContentSummary;
