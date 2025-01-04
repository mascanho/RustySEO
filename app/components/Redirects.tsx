"use client";
import React from "react";

import { useDisclosure } from "@mantine/hooks";
import { Popover, Text, Button } from "@mantine/core";
import openBrowserWindow from "../Hooks/OpenBrowserWindow";

const Redirects = ({
  stat,
  loading,
  url,
}: {
  stat: any;
  loading: boolean;
  url: string;
}) => {
  const [opened, { close, open }] = useDisclosure(false);

  // Calculate the number of redirects
  const numRedirects =
    stat?.lighthouseResult?.audits?.redirects?.details?.items?.length || 0;

  // Determine the label based on the number of redirects
  let label = "";
  if (numRedirects === 0) {
    label = "Good";
  } else if (numRedirects > 0 && numRedirects <= 3) {
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
    <section className="widget border px-4 py-3 bg-white w-60 xl:w-52 rounded-md space-y-2 relative shadow overflow-hidden @container">
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
            d="M20.5 5.5C20.5 7.15685 19.1569 8.5 17.5 8.5C15.8431 8.5 14.5 7.15685 14.5 5.5C14.5 3.84315 15.8431 2.5 17.5 2.5C19.1569 2.5 20.5 3.84315 20.5 5.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M8.5 11.5C8.5 13.1569 7.15685 14.5 5.5 14.5C3.84315 14.5 2.5 13.1569 2.5 11.5C2.5 9.84315 3.84315 8.5 5.5 8.5C7.15685 8.5 8.5 9.84315 8.5 11.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M21.5 18.5C21.5 20.1569 20.1569 21.5 18.5 21.5C16.8431 21.5 15.5 20.1569 15.5 18.5C15.5 16.8431 16.8431 15.5 18.5 15.5C20.1569 15.5 21.5 16.8431 21.5 18.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M14.5348 4.58109C14.1554 4.52765 13.7677 4.5 13.3733 4.5C10.2974 4.5 7.62058 6.18227 6.24054 8.66317M19.7131 7.49453C20.8311 8.86497 21.5 10.6056 21.5 12.5C21.5 13.8758 21.1472 15.1705 20.5258 16.3012M15.8816 20.1117C15.0917 20.3638 14.2486 20.5 13.3733 20.5C9.58287 20.5 6.39853 17.9454 5.5 14.4898"
            stroke="currentColor"
            strokeWidth="1.5"
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
            Occur when a user (or search engine bot) requests one URL, but the
            server responds with a different one.
          </Text>
        </Popover.Dropdown>
      </Popover>
      <div className="flex flex-col space-y-1.5 h-fit">
        <h2 className="font-bold">URL Redirects</h2>
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
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="font-bold text-2xl text-apple-spaceGray/50">
                  {(stat && numRedirects + " items") || "..."}
                </span>
                <p
                  className={`rounded-full font-semibold ml-2 px-2 text-xs py-[1px] ${!stat && "hidden"} ${labelClass}`}
                >
                  {label}
                </p>
              </div>
            </div>
          )}
        </div>
        <h2
          onClick={() =>
            openBrowserWindow(
              "https://pagespeed.web.dev/report?url=" + url ||
                "No URL provided",
            )
          }
          className="text-xs underline cursor-pointer @hidden"
        >
          View PageSpeed
        </h2>
      </div>
    </section>
  );
};

export default Redirects;
