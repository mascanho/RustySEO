"use client";
import React from "react";

import { useDisclosure } from "@mantine/hooks";
import { Popover, Text, Button } from "@mantine/core";
import openBrowserWindow from "../Hooks/OpenBrowserWindow";

const LongTasks = ({
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
            d="M13 2.04938C12.6711 2.01672 12.3375 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 11.3151 21.9311 10.6462 21.8 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 11H8.70711C8.25435 11 7.82014 10.8201 7.5 10.5M14 11H15.2929C15.7456 11 16.1799 10.8201 16.5 10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="16"
            r="2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 2H19.9474C20.5675 2 20.8775 2 20.9601 2.20009C21.0427 2.40019 20.8317 2.64023 20.4098 3.1203L17.9846 5.8797C17.5627 6.35977 17.3517 6.59981 17.4343 6.79991C17.5169 7 17.8269 7 18.447 7H21"
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
            Any operations that take a significant amount of time for the
            browser&apos;s main thread to execute.
          </Text>
        </Popover.Dropdown>
      </Popover>
      <div className="flex flex-col space-y-1.5 h-fit">
        <h2 className="font-bold">Long Tasks</h2>
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
              <span className="h-10 font-bold text-2xl text-apple-spaceGray/50">
                {stat?.lighthouseResult?.audits?.["long-tasks"]?.details?.items
                  ? `${stat.lighthouseResult.audits["long-tasks"].details.items.length} tasks`
                  : "..."}
              </span>
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
            Tasks:{" "}
          </h2>
          <span className="inline text-xs">
            {stat?.lighthouseResult?.audits?.["long-tasks"]?.displayValue ||
              "..."}
          </span>
        </div>
      </div>
    </section>
  );
};

export default LongTasks;
