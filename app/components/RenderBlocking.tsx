"use client";
import React from "react";

import { useDisclosure } from "@mantine/hooks";
import { Popover, Text, Button } from "@mantine/core";
import openBrowserWindow from "../Hooks/OpenBrowserWindow";

const RenderBlocking = ({
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
    <section className="widget border p-4  shadow bg-white w-60 xl:w-52 rounded-md space-y-2 relative">
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
            d="M15 2L21 8M21 2L15 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="6"
            cy="19"
            r="3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 5H8.5C6.567 5 5 6.567 5 8.5C5 10.433 6.567 12 8.5 12H15.5C17.433 12 19 13.567 19 15.5C19 17.433 17.433 19 15.5 19H12"
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
            Resources that prevent the browser from displaying any content on
            the screen until they are fully downloaded, parsed, and executed.
          </Text>
        </Popover.Dropdown>
      </Popover>
      <div className="flex flex-col space-y-1 h-fit">
        <h2 className="font-bold -mt-1">Render Blocking</h2>
        <div className="text-xl h-8">
          {loading && (
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
          )}
          {!loading && !url && (
            <span className="h-10 font-bold text-xl text-apple-spaceGray/50">
              ...
            </span>
          )}

          {stat?.lighthouseResult?.audits?.["render-blocking-resources"]
            ?.displayValue && (
            <span className="h-10 font-bold text-2xl text-apple-spaceGray/50">
              {stat.lighthouseResult.audits["render-blocking-resources"].details
                ?.items?.length > 0 &&
                `${stat.lighthouseResult.audits["render-blocking-resources"].details.items.length} tasks`}
            </span>
          )}

          {(stat?.lighthouseResult?.audits?.["render-blocking-resources"]
            ?.details.items?.length < 1 &&
            url && (
              <span className="h-10 font-bold text-2xl text-apple-spaceGray/50">
                0 tasks
              </span>
            )) ||
            ""}
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

export default RenderBlocking;
