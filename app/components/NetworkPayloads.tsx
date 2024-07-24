"use client";
import React from "react";

import { useDisclosure } from "@mantine/hooks";
import { Popover, Text, Button } from "@mantine/core";
import openBrowserWindow from "../Hooks/OpenBrowserWindow";

const NetworkPayload = ({
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
    <section className="border px-4 py-3 border-apple-spaceGray shadow bg-white w-60 xl:w-52 rounded-md space-y-2 relative">
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
            d="M12 11L12 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M14 9C14 10.1046 13.1046 11 12 11C10.8954 11 10 10.1046 10 9C10 7.89543 10.8954 7 12 7C13.1046 7 14 7.89543 14 9Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M16.9588 6C17.6186 6.86961 18 7.89801 18 9C18 10.102 17.6186 11.1304 16.9588 12M7.04117 6C6.38143 6.86961 6 7.89801 6 9C6 10.102 6.38143 11.1304 7.04117 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20.3159 4C21.3796 5.43008 22 7.14984 22 9C22 10.8502 21.3796 12.5699 20.3159 14M3.68409 4C2.62036 5.43008 2 7.14984 2 9C2 10.8502 2.62036 12.5699 3.68409 14"
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
        <h2 className="font-bold">Large Payloads</h2>
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
              {stat?.lighthouseResult?.audits?.["total-byte-weight"]?.details
                ?.items.length || "..."}
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
          View PageSpeed Insights
        </h2>
      </div>
    </section>
  );
};

export default NetworkPayload;
