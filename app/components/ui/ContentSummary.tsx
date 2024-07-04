import { Badge } from "lucide-react";
import React from "react";

const ContentSummary = ({
  keywords,
  wordCount,
}: {
  keywords: any;
  wordCount: number | undefined;
}) => {
  return (
    <section
      className={`mb-10 flex-wrap w-full space-y-2 ${keywords.length === 0 ? "bg-white/40" : "bg-white"} p-2 rounded-b-md relative`}
    >
      <div className="w-full bg-apple-spaceGray left-0 -top-5 rounded-t-md  h-8 absolute flex items-center justify-center">
        <h2 className="text-center font-semibold text-white">
          Content Summary
        </h2>
      </div>
      <div className="p-6 grid gap-6">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Reading Time</span>
            <span>5 min</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Word Count</span>
            <span>{wordCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Keywords</span>
            <div className="flex flex-wrap gap-2 justify-end  w-3/4">
              {keywords[0]?.map((keyword: string, index: number) => (
                <span
                  key={index}
                  className=" text-black py-1  border border-apple-spaceGray rounded-full px-2 text-xs"
                >
                  {keyword[0]} ({keyword[1]})
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Reading Level</span>
            <span>Intermediate</span>
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
