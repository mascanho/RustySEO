"use client";
import React from "react";

import { useDisclosure } from "@mantine/hooks";
import { Popover, Text, Button } from "@mantine/core";
import openBrowserWindow from "../Hooks/OpenBrowserWindow";

const PerformanceEl = ({
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
    <section className="widget border px-4 py-3  shadow bg-white w-60 xl:w-52 rounded-md space-y-2 relative">
      <span className="absolute right-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={38}
          height={38}
          fill={"none"}
        >
          <circle
            cx="12"
            cy="18"
            r="3"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M12 15V10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M22 13C22 7.47715 17.5228 3 12 3C6.47715 3 2 7.47715 2 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
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
          <Text size="xs">
            A score between 0 and 100 indicating how well your page performs in
            terms of speed and optimization.
          </Text>
        </Popover.Dropdown>
      </Popover>
      <div className="flex flex-col space-y-1.5 h-fit">
        <h2 className="font-bold">Performance</h2>
        <div className="text-xl h-8">
          {loading ? (
            <div className="-mt-1">
              <svg
                className="animate-spin h-9 w-9 mb-1 dark:text-white"
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
            <span className="h-10 font-bold text-2xl">
              <span>
                {stat?.lighthouseResult?.categories?.performance?.score ? (
                  (() => {
                    const score = Math.floor(
                      stat?.lighthouseResult?.categories?.performance?.score *
                        100,
                    );
                    let label = "";

                    if (score < 50) {
                      label = "Poor";
                    } else if (score >= 50 && score < 70) {
                      label = "Average";
                    } else if (score >= 70) {
                      label = "Good";
                    }

                    return (
                      <span className="flex items-center">
                        {score}%{" "}
                        <p
                          className={` rounded-full ml-2 px-2 text-xs py-[1px] text-white ${label === "Poor" && "bg-red-500 text-white"} ${label === "Good" && "bg-green-500 text-white"}text-white ${label === "Average" && "bg-orange-500 text-white"}`}
                        >
                          {label}
                        </p>
                      </span>
                    );
                  })()
                ) : (
                  <span className="text-gray-400">...</span>
                )}
              </span>
            </span>
          )}{" "}
        </div>
        <h2
          onClick={() =>
            openBrowserWindow(
              "https://pagespeed.web.dev/report?url=" + url ||
                "No URL provided",
            )
          }
          className="text-xs underline cursor-pointer"
        >
          PageSpeed Insights
        </h2>
      </div>
    </section>
  );
};

export default PerformanceEl;
