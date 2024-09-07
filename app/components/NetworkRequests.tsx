"use client";
import React from "react";
import { useDisclosure } from "@mantine/hooks";
import { Popover, Text } from "@mantine/core";
import openBrowserWindow from "../Hooks/OpenBrowserWindow";

const NetworkRequests = ({
  stat,
  loading,
  url,
}: {
  stat: any;
  loading: boolean;
  url: string;
}) => {
  const [opened, { close, open }] = useDisclosure(false);

  // Extract the number of network requests
  const networkRequestCount =
    stat?.lighthouseResult?.audits?.["network-requests"]?.details?.items
      ?.length || 0;

  // Determine the label based on the number of network requests
  let label = "";
  if (networkRequestCount <= 20) {
    label = "Good";
  } else if (networkRequestCount > 20 && networkRequestCount <= 50) {
    label = "Average";
  } else {
    label = "Poor";
  }

  // Determine the background color and text color based on the label
  const labelClass =
    {
      Poor: "bg-red-500 text-white",
      Average: "bg-orange-500 text-white",
      Good: "bg-green-500 text-white",
    }[label] || "bg-gray-200 text-black";

  return (
    <section className="widget border px-4 py-3 shadow bg-white w-60 xl:w-52 rounded-md space-y-2 relative overflow-hidden">
      <span className="absolute right-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={38}
          height={38}
          color="#a6a5a2"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <ellipse
            cx="12"
            cy="12"
            rx="4"
            ry="10"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M2 12H22"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
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
              color="#000000"
              fill="none"
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
          <Text className="text-black dark:text-white text-xs">
            The HTTP requests made by a browser to fetch resources like HTML,
            CSS, JavaScript, images, and fonts from a server.
          </Text>
        </Popover.Dropdown>
      </Popover>
      <div className="flex flex-col space-y-1.5 h-fit">
        <h2 className="font-bold">Network</h2>
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
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : (
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="font-bold text-xl text-apple-spaceGray/50">
                {(stat && networkRequestCount + " req.") || "..."}
              </span>
              <p
                className={`rounded-full font-semibold ml-1 px-2 text-xs py-[1px] ${!stat && "hidden"} ${labelClass}`}
              >
                {label}
              </p>
            </div>
          )}
        </div>
        <h4
          onClick={() =>
            openBrowserWindow(
              url
                ? `https://pagespeed.web.dev/report?url=${encodeURIComponent(url)}`
                : "No URL provided",
            )
          }
          className="text-xs text-black/50 dark:text-white/50 underline cursor-pointer hover:text-blue-600 transition-colors duration-200 mt-1"
          title="Open PageSpeed Insights report"
        >
          View Detailed Report
        </h4>
      </div>
    </section>
  );
};

export default NetworkRequests;
