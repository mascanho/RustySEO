import { useOllamaStore } from "@/store/store";
import React from "react";

const ContentSummary = ({
  keywords,
  wordCount,
  readingTime,
  readingLevelResults,
  AiContentAnalysis,
  htmlToTextRatio,
}: any) => {
  const ollamaStatus = useOllamaStore();

  // @ts-ignore
  const generateFallbackSummary = (
    keywords: any,
    wordCount: any,
    readingTime: any,
    readingLevelResult: any,
    htmlToTextRatio: any,
  ) => {
    const topKeywords = keywords[0]
      ?.slice(0, 5)
      // @ts-ignore
      .map((k): any => k[0])
      .join(", ");
    const wordCountNum = wordCount ? wordCount[0] : 0;
    const readingTimeMin = wordCount ? wordCount[2] : 0;
    const readingLevel = readingLevelResults[0]
      ? readingLevelResults[0][1]
      : "Unknown";
    const textRatio =
      htmlToTextRatio && htmlToTextRatio[0]
        ? Math.round(htmlToTextRatio[0][0] * 100)
        : 0;

    return `This content contains approximately ${wordCountNum} words and takes about ${readingTimeMin} minutes to read. 
  The text is written at a ${readingLevel} reading level. 
  The main topics covered, based on keyword analysis, are: ${topKeywords}. 
  The content has a text-to-HTML ratio of ${textRatio}%, which ${textRatio > 50 ? "indicates good content density" : "suggests there might be room for more textual content"}.
  ${readingTimeMin > 7 ? "Consider breaking longer sections into smaller, more digestible parts for improved readability." : "The content length seems appropriate for quick consumption."}
  ${readingLevel === "College Graduate" ? "The advanced reading level may limit accessibility for some audiences." : "The reading level appears suitable for a general audience."}`;
  };

  return (
    <section className="flex-wrap min-h-[calc(96rem - 2.5rem)] h-full space-y-1 bg-transparent dark:bg-brand-darker dark:text-white p-2 rounded-md relative">
      <div className="px-2 py-0.5 grid gap-5 overflow-y-scroll w-full h-full">
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg
                className="text-sky-dark"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={18}
                height={18}
                fill="none"
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
              </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={18}
                height={18}
                className="text-sky-dark mt-[5px]"
                fill="none"
              >
                <path
                  d="M14 19L11.1069 10.7479C9.76348 6.91597 9.09177 5 8 5C6.90823 5 6.23652 6.91597 4.89309 10.7479L2 19M4.5 12H11.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21.9692 13.9392V18.4392M21.9692 13.9392C22.0164 13.1161 22.0182 12.4891 21.9194 11.9773C21.6864 10.7709 20.4258 10.0439 19.206 9.89599C18.0385 9.75447 17.1015 10.055 16.1535 11.4363M21.9692 13.9392L19.1256 13.9392C18.6887 13.9392 18.2481 13.9603 17.8272 14.0773C15.2545 14.7925 15.4431 18.4003 18.0233 18.845C18.3099 18.8944 18.6025 18.9156 18.8927 18.9026C19.5703 18.8724 20.1955 18.545 20.7321 18.1301C21.3605 17.644 21.9692 16.9655 21.9692 15.9392V13.9392Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-semibold mt-2">Word Count</span>
            </div>
            <span>{wordCount ? wordCount[0] + " words" : ""}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={18}
                height={18}
                className="text-sky-dark"
                fill="none"
              >
                <path
                  d="M21 21H10C6.70017 21 5.05025 21 4.02513 19.9749C3 18.9497 3 17.2998 3 14V3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="8"
                  cy="8"
                  r="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle
                  cx="11.5"
                  cy="15.5"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle
                  cx="17.5"
                  cy="7.5"
                  r="3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="font-semibold">Reading Level</span>
            </div>
            <span>
              {readingLevelResults[0] ? readingLevelResults[0][1] : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between -mt-1">
          <div className="flex items-center space-x-2 -mt-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={18}
              height={18}
              className="text-sky-dark mt-1"
              fill="none"
            >
              <path
                d="M3 12H21"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <path
                d="M14.5 5.5C14.5 6.88071 13.3807 8 12 8C10.6193 8 9.5 6.88071 9.5 5.5C9.5 4.11929 10.6193 3 12 3C13.3807 3 14.5 4.11929 14.5 5.5Z"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M14.5 18.5C14.5 19.8807 13.3807 21 12 21C10.6193 21 9.5 19.8807 9.5 18.5C9.5 17.1193 10.6193 16 12 16C13.3807 16 14.5 17.1193 14.5 18.5Z"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
            <span className="font-semibold mt-2">Text Ratio</span>
          </div>
          <span>
            {htmlToTextRatio
              ? htmlToTextRatio[0] &&
                Math.round(htmlToTextRatio[0][0] * 100) + "%"
              : ""}{" "}
          </span>
        </div>

        <div className="flex items-start justify-start flex-col mt-4">
          <div className="flex items-start space-x-2">
            <div className="flex flex-col w-full justify-center">
              <div className="flex items-center mb-3 -mt-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width={18}
                  height={18}
                  className="text-sky-dark mt-1"
                  fill="none"
                >
                  <path
                    d="M12 17C10.3264 17 8.86971 18.265 8.11766 20.1312C7.75846 21.0225 8.27389 22 8.95877 22H15.0412C15.7261 22 16.2415 21.0225 15.8823 20.1312C15.1303 18.265 13.6736 17 12 17Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18.5 5H19.7022C20.9031 5 21.5035 5 21.8168 5.37736C22.13 5.75472 21.9998 6.32113 21.7393 7.45395L21.3485 9.15307C20.7609 11.7086 18.6109 13.6088 16 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.5 5H4.29779C3.09692 5 2.49649 5 2.18324 5.37736C1.86999 5.75472 2.00024 6.32113 2.26075 7.45395L2.65148 9.15307C3.23914 11.7086 5.38912 13.6088 8 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 17C15.0208 17 17.565 12.3379 18.3297 5.99089C18.5412 4.23558 18.647 3.35793 18.0868 2.67896C17.5267 2 16.6223 2 14.8134 2H9.18658C7.37775 2 6.47333 2 5.91317 2.67896C5.35301 3.35793 5.45875 4.23558 5.67025 5.99089C6.435 12.3379 8.97923 17 12 17Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-semibold block ml-2">Top Keywords</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords[0]?.map((keyword: any, index: any) => (
                  <span
                    key={index}
                    className="text-xs bg-slate-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-1 rounded-full border border-gray-400 dark:border-none"
                  >
                    {keyword[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-1 overflow-y-auto mt-4">
            <h3 className="text-xs font-semibold dark:text-sky-dark">
              Page Summary
            </h3>
            <p className="text-muted-foreground text-xs mt-1">
              {ollamaStatus.ollama && AiContentAnalysis}
              {/* {!ollamaStatus.ollama && keywords && keywords.length > 0 */}
              {/*   ? generateFallbackSummary( */}
              {/*       keywords, */}
              {/*       wordCount, */}
              {/*       readingTime, */}
              {/*       readingLevelResults, */}
              {/*       htmlToTextRatio, */}
              {/*     ) */}
              {/*   : ""} */}
            </p>
            {!ollamaStatus.ollama && keywords && keywords.length > 0 && (
              <div className="text-black/50 dark:text-white/50">
                <p>AI Model Not Available</p>
                <p>
                  Go to <kbd>Menu</kbd> &gt; <kbd>Connectors</kbd> &gt;{" "}
                  <kbd>Ollama</kbd>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContentSummary;
