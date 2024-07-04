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
      className={`flex-wrap w-full h-full space-y-2 ${keywords.length === 0 ? "bg-white/40" : "bg-white"} p-2 rounded-md relative h-fit overflow-auto shadow`}
    >
      <div className="w-full bg-apple-spaceGray left-0 top-0  rounded-t-md  h-8 absolute flex items-center justify-center">
        <h2 className=" bg-apple-spaceGray font-semibold text-white p-1 relative px-2 rounded-t-md w-full  text-center pt-2">
          Content Summary
        </h2>
      </div>
      <div className="p-3 pt-10 grid gap-6">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={28}
                height={28}
                color={"#a6a5a2"}
                fill={"none"}
              >
                <circle
                  cx="12"
                  cy="13"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M5 19L3 21M19 19L21 21"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 3.5697L19.5955 3.27195C20.4408 2.84932 20.7583 2.89769 21.4303 3.5697C22.1023 4.2417 22.1507 4.55924 21.728 5.4045L21.4303 6M5 3.5697L4.4045 3.27195C3.55924 2.84932 3.2417 2.89769 2.5697 3.5697C1.89769 4.2417 1.84932 4.55924 2.27195 5.4045L2.5697 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M12 9.5V13.5L14 15.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 3.5V2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 2H14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>{" "}
              <span className="font-semibold pt-1">Reading Time</span>
            </div>
            <span>
              {readingTime === undefined ? "" : readingTime + " min(s)"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Word Count</span>
            <span>{wordCount === undefined ? "" : wordCount + " words"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold">Reading Level</span>
            <span>
              {readingLevelResults[0] ? readingLevelResults[0][1] : ""}
            </span>
          </div>
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
