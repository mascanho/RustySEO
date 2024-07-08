"use client";
import React from "react";

import { useDisclosure } from "@mantine/hooks";
import { Popover, Text, Button } from "@mantine/core";
import openBrowserWindow from "../Hooks/OpenBrowserWindow";

const TtiEl = ({
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
    <section className="border px-4 py-3 border-apple-spaceGray shadow bg-white w-60 rounded-md space-y-2 relative overflow-hidden">
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
            d="M7 7.99678H6.17647C4.67907 7.99678 3.93037 7.99678 3.46518 7.55782C3 7.11886 3 6.41236 3 4.99937C3 3.58638 3 2.87988 3.46518 2.44091C3.93037 2.00195 4.67907 2.00195 6.17647 2.00195H17.8235C19.3209 2.00195 20.0696 2.00195 20.5348 2.44091C21 2.87988 21 3.58638 21 4.99937C21 6.41236 21 7.11886 20.5348 7.55782C20.0696 7.99678 19.3209 7.99678 17.8235 7.99678H16.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.0296 21.9923C17.9799 20.2784 18.1199 20.0528 18.2514 19.6716C18.3828 19.2903 19.1984 17.9367 19.5236 16.9543C20.576 13.7762 19.7712 13.2388 18.5104 12.2733C17.0658 11.1671 14.6208 10.6042 13.0946 10.7258V6.63564C13.0946 5.77305 12.2692 5.02246 11.3432 5.02246C10.4172 5.02246 9.59704 5.77305 9.59704 6.63564V14.3876L7.62568 12.7102C7.0938 12.1728 6.24275 12.222 5.62664 12.6287C5.43494 12.7553 5.27952 12.9329 5.18075 13.1403C4.90045 13.7288 4.98135 14.3952 5.42292 14.9406L6.54372 16.3853M9.52799 21.9981V21.0516C9.60063 19.8892 8.54484 18.9558 7.42153 17.517M7.42153 17.517C7.34059 17.4133 7.49821 17.6139 7.42153 17.517ZM7.42153 17.517C7.08118 17.0866 6.81124 16.7089 6.54372 16.3853M7.42153 17.517L8.52852 18.8708M7.42153 17.517L6.54372 16.3853"
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
        <h2 className="font-bold">TTI</h2>
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
                {stat?.lighthouseResult?.audits?.interactive?.displayValue ||
                  "..."}
              </span>
            </>
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

export default TtiEl;
