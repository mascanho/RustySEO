"use client";
import React from "react";

import { useDisclosure } from "@mantine/hooks";
import { Popover, Text, Button } from "@mantine/core";
import openBrowserWindow from "../Hooks/OpenBrowserWindow";

const LCPEl = ({
  stat,
  loading,
  url,
}: {
  stat: any;
  loading: boolean;
  url: string;
}) => {
  const [opened, { close, open }] = useDisclosure(false);
  return (
    <section className="widget border px-4 py-3 shadow bg-white w-60 xl:w-52 rounded-md space-y-2 relative overflow-hidden">
      <span className="absolute right-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={38}
          height={38}
          color={"#a6a5a2"}
          fill={"none"}
        >
          <path
            d="M4 5C4 4.25579 4 3.88369 4.08912 3.58019C4.30005 2.86183 4.86183 2.30005 5.58019 2.08912C5.88369 2 6.25579 2 7 2H14C14.7442 2 15.1163 2 15.4198 2.08912C16.1382 2.30005 16.7 2.86183 16.9109 3.58019C17 3.88369 17 4.25579 17 5C17 5.74421 17 6.11631 16.9109 6.41981C16.7 7.13817 16.1382 7.69995 15.4198 7.91088C15.1163 8 14.7442 8 14 8H7C6.25579 8 5.88369 8 5.58019 7.91088C4.86183 7.69995 4.30005 7.13817 4.08912 6.41981C4 6.11631 4 5.74421 4 5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M12 17.5C12 17.0341 12 16.8011 12.0761 16.6173C12.1776 16.3723 12.3723 16.1776 12.6173 16.0761C12.8011 16 13.0341 16 13.5 16C13.9659 16 14.1989 16 14.3827 16.0761C14.6277 16.1776 14.8224 16.3723 14.9239 16.6173C15 16.8011 15 17.0341 15 17.5V20.5C15 20.9659 15 21.1989 14.9239 21.3827C14.8224 21.6277 14.6277 21.8224 14.3827 21.9239C14.1989 22 13.9659 22 13.5 22C13.0341 22 12.8011 22 12.6173 21.9239C12.3723 21.8224 12.1776 21.6277 12.0761 21.3827C12 21.1989 12 20.9659 12 20.5V17.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M17.249 5C18.1037 5 18.531 5 18.8681 5.15224C19.9978 5.6624 20.0005 6.86278 20.0005 8.00422C20.0005 8.96065 20.0005 9.43886 19.8701 9.84219C19.4513 11.1378 17.7387 11.768 16.0836 12.2373C14.9006 12.5727 14.3091 12.7404 13.9045 13.2756C13.5 13.8107 13.5 14.4389 13.5 15.6952V16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>{" "}
      </span>
      <Popover
        width={200}
        position="bottom"
        withArrow
        shadow="md"
        opened={opened}
      >
        <Popover.Target>
          <button
            onMouseEnter={open}
            onMouseLeave={close}
            className="absolute bottom-3 right-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={18}
              height={18}
              color={"#000000"}
              fill={"none"}
            >
              <path
                d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12.2422 17V12C12.2422 11.5286 12.2422 11.2929 12.0957 11.1464C11.9493 11 11.7136 11 11.2422 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.992 8H12.001"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </Popover.Target>
        <Popover.Dropdown style={{ pointerEvents: "none" }}>
          <Text size="sm">
            This metric shows the performance of the page/URL on Desktop, synced
            from Page Speed Insights.
          </Text>
        </Popover.Dropdown>
      </Popover>
      <div className="flex flex-col space-y-1.5 h-fit">
        <h2 className="font-bold">LCP</h2>
        <div className="text-xl h-8">
          {loading ? (
            <div className="-mt-1">
              <svg
                className="animate-spin h-9 w-9 mb-1"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : (
            <>
              {!stat ? (
                <span className="h-10 font-bold text-2xl text-apple-spaceGray/50">
                  ...
                </span>
              ) : (
                (() => {
                  // Extract score and calculate percentage
                  const score =
                    stat?.lighthouseResult?.audits?.["largest-contentful-paint"]
                      ?.score * 100;
                  if (score === undefined) {
                    return (
                      <span className="h-10 font-bold text-2xl text-apple-spaceGray/50">
                        ...
                      </span>
                    );
                  }

                  // Determine label based on score
                  let label = "";
                  if (score < 50) {
                    label = "Poor";
                  } else if (score >= 50 && score < 70) {
                    label = "Average";
                  } else if (score >= 70) {
                    label = "Good";
                  }

                  // Determine the background color and text color based on the label
                  const labelClass =
                    {
                      Poor: "bg-red-500 text-white",
                      Average: "bg-orange-500 text-white",
                      Good: "bg-green-500 text-white",
                    }[label] || "bg-gray-200 text-black"; // Default styling if label is not found

                  return (
                    <span className="flex items-center">
                      <span className="font-bold text-2xl text-apple-spaceGray/50">
                        {score.toFixed(0)}%
                      </span>{" "}
                      <p
                        className={`rounded-full ml-2 px-2 text-xs py-[1px] ${labelClass}`}
                      >
                        {label}
                      </p>
                    </span>
                  );
                })()
              )}
            </>
          )}{" "}
        </div>
        <div className="flex items-center space-x-1">
          <h2
            onClick={() =>
              openBrowserWindow(
                "https://pagespeed.web.dev/report?url=" + url ||
                  "No URL provided",
              )
            }
            className="text-xs underline  cursor-pointer font-semibold text-gray-500"
          >
            Paint Timing:{" "}
          </h2>
          <span className="inline text-xs">
            {stat?.lighthouseResult?.audits?.["largest-contentful-paint"]
              .displayValue || "..."}
          </span>
        </div>
      </div>
    </section>
  );
};

export default LCPEl;
