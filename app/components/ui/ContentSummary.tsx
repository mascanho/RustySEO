import { Badge } from "lucide-react";
import React from "react";

const ContentSummary = ({
  keywords,
  wordCount,
  readingTime,
  readingLevelResults,
}: {
  keywords: any;
  wordCount: number | undefined;
  readingTime: number | undefined;
  readingLevelResults: any[];
}) => {
  return (
    <section
      className={`flex-wrap w-full space-y-2 ${keywords.length === 0 ? "bg-white/40" : "bg-white"} p-2 rounded-md relative h-fit overflow-auto shadow`}
    >
      <div className="w-full bg-apple-spaceGray left-0 top-0  rounded-t-md  h-8 absolute flex items-center justify-center">
        <h2 className=" bg-apple-spaceGray font-semibold text-white p-1 relative px-2 rounded-t-md w-full  text-center pt-2">
          Content Summary
        </h2>
      </div>
      <div className="p-3 pt-10 grid gap-6">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Reading Time</span>
            <span>
              {readingTime === undefined ? "" : readingTime + " min(s)"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Word Count</span>
            <span>{wordCount === undefined ? "" : wordCount + " words"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Top Keywords</span>
            <div className="flex flex-wrap gap-2 justify-end  w-3/4">
              {keywords[0]?.map((keyword: string, index: number) => (
                <span
                  key={index}
                  className=" text-black py-1  border border-apple-spaceGray rounded-full px-2 text-xs"
                >
                  {keyword[0]}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold">Reading Level</span>
            <span>
              {readingLevelResults[0] ? readingLevelResults[0][1] : ""}
            </span>
          </div>
        </div>
        <div className="grid gap-2">
          <h3 className="text-lg font-semibold">Summary</h3>
          <p className="text-muted-foreground">
            This article provides an overview of the latest advancements in AI
            and machine learning, and how they are transforming various
            industries through automation. It covers the key trends, challenges,
            and opportunities in this rapidly evolving field.
          </p>
        </div>
      </div>{" "}
    </section>
  );
};

export default ContentSummary;
