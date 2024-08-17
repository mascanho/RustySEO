"use client";
import React from "react";

import { useDisclosure } from "@mantine/hooks";
import { Popover, Text, Button } from "@mantine/core";
import openBrowserWindow from "../Hooks/OpenBrowserWindow";

const ServerResponseTime = ({
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
    <section className="widget border px-4 py-3  shadow bg-white w-60 xl:w-52 rounded-md space-y-2 relative overflow-hidden">
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
            d="M17.4776 8.00005C17.485 8.00002 17.4925 8 17.5 8C19.9853 8 22 10.0147 22 12.5C22 14.9853 19.9853 17 17.5 17H7C4.23858 17 2 14.7614 2 12C2 9.40034 3.98398 7.26407 6.52042 7.0227M17.4776 8.00005C17.4924 7.83536 17.5 7.66856 17.5 7.5C17.5 4.46243 15.0376 2 12 2C9.12324 2 6.76233 4.20862 6.52042 7.0227M17.4776 8.00005C17.3753 9.1345 16.9286 10.1696 16.2428 11M6.52042 7.0227C6.67826 7.00768 6.83823 7 7 7C8.12582 7 9.16474 7.37209 10.0005 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 20.75V20.5C14 19.9477 13.5523 19.5 13 19.5H12M14 20.75V21C14 21.5523 13.5523 22 13 22H11C10.4477 22 10 21.5523 10 21V20.75M14 20.75H19M10 20.75V20.5C10 19.9477 10.4477 19.5 11 19.5H12M10 20.75H5M12 19.5V17"
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
            The time it takes for a web server to process a request and send a
            response back to the client
          </Text>
        </Popover.Dropdown>
      </Popover>
      <div className="flex flex-col space-y-1.5 h-fit">
        <h2 className="font-bold">Server Status</h2>
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
                  const score = Math.floor(
                    stat?.lighthouseResult.audits["server-response-time"]
                      .score * 100,
                  );
                  let label = "";

                  // Determine label based on score
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
                        {score}%
                      </span>{" "}
                      <p
                        className={`rounded-full font-semibold ml-2 px-2 text-xs py-[1px] ${labelClass}`}
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
            Response time:{" "}
          </h2>
          <span className="inline text-xs">
            {stat &&
              stat?.lighthouseResult?.audits?.["server-response-time"]
                .numericValue + " ms"}
          </span>
        </div>
      </div>
    </section>
  );
};

export default ServerResponseTime;
