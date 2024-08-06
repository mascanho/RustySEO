"use client";
import React from "react";

import { useDisclosure } from "@mantine/hooks";
import { Popover, Text, Button } from "@mantine/core";
import openBrowserWindow from "../Hooks/OpenBrowserWindow";

const FcpEl = ({
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
          color={"#a6a5a2"}
          fill={"none"}
        >
          <path
            d="M10 4C10 2.89543 10.8954 2 12 2H13C14.1046 2 15 2.89543 15 4V6.55337C15 7.86603 15.8534 9.02626 17.1065 9.41722L17.8935 9.66278C19.1466 10.0537 20 11.214 20 12.5266V14C20 14.5523 19.5523 15 19 15H6C5.44772 15 5 14.5523 5 14V12.5266C5 11.214 5.85339 10.0537 7.10648 9.66278L7.89352 9.41722C9.14661 9.02626 10 7.86603 10 6.55337V4Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M6.00217 15C6.15797 16.3082 5.4957 19.5132 4 21.8679C4 21.8679 14.2924 23.0594 15.6851 17.9434V19.8712C15.6851 20.8125 15.6851 21.2831 15.9783 21.5755C16.5421 22.1377 19.1891 22.1531 19.7538 21.5521C20.0504 21.2363 20.0207 20.7819 19.9611 19.8731C19.8629 18.3746 19.5932 16.4558 18.8523 15"
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
            The time it takes for the browser to render any part of the page's
            content. This includes text, images, or background colors
          </Text>
        </Popover.Dropdown>
      </Popover>
      <div className="flex flex-col space-y-1.5 h-fit">
        <h2 className="font-bold">FCP</h2>
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
            <span className="h-10 font-bold text-2xl text-apple-spaceGray/50">
              {stat?.lighthouseResult?.audits?.["first-contentful-paint"]
                ?.score !== undefined ? (
                (() => {
                  const score = Math.floor(
                    stat.lighthouseResult.audits["first-contentful-paint"]
                      .score * 100,
                  );
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
                      <span className="font-bold text-2xl">{score}%</span>{" "}
                      <p
                        className={`rounded-full ml-2 px-2 text-xs py-[1px] ${labelClass}`}
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
            {stat?.lighthouseResult?.audits?.["first-contentful-paint"]
              .displayValue || "..."}
          </span>
        </div>
      </div>
    </section>
  );
};

export default FcpEl;
