"use client";
import React from "react";
import { useDisclosure } from "@mantine/hooks";
import { Popover, Text, Button } from "@mantine/core";
import openBrowserWindow from "../Hooks/OpenBrowserWindow";

const DomElements = ({
  stat,
  loading,
  url,
}: {
  stat: any;
  loading: boolean;
  url: string;
}) => {
  const [opened, { close, open }] = useDisclosure(false);

  // Extract score and calculate percentage
  const score = Math.floor(
    stat?.lighthouseResult?.audits["dom-size"]?.score * 100,
  );

  // Determine the label based on the score
  let label = "";
  if (score >= 80) {
    label = "Good";
  } else if (score >= 50) {
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
    <section className="widget border p-4 shadow bg-white w-60 xl:w-52 rounded-md space-y-2 relative">
      <span className="absolute right-5">
        {/* SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={38}
          height={38}
          color={"#a6a5a2"}
          fill={"none"}
        >
          <path
            d="M11.1075 5.57624C11.3692 6.02707 11.5 6.25248 11.5 6.5C11.5 6.74752 11.3692 6.97293 11.1075 7.42376L9.85804 9.57624C9.59636 10.0271 9.46551 10.2525 9.25 10.3762C9.03449 10.5 8.7728 10.5 8.24943 10.5H5.75057C5.2272 10.5 4.96551 10.5 4.75 10.3762C4.53449 10.2525 4.40364 10.0271 4.14196 9.57624L2.89253 7.42376C2.63084 6.97293 2.5 6.74752 2.5 6.5C2.5 6.25248 2.63084 6.02707 2.89253 5.57624L4.14196 3.42376C4.40364 2.97293 4.53449 2.74752 4.75 2.62376C4.96551 2.5 5.2272 2.5 5.75057 2.5L8.24943 2.5C8.7728 2.5 9.03449 2.5 9.25 2.62376C9.46551 2.74752 9.59636 2.97293 9.85804 3.42376L11.1075 5.57624Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Additional paths for the SVG icon */}
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
            {/* Small SVG icon */}
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
            The number of elements (nodes) in a webpage&apos;s Document Object
            Model (DOM). A large DOM can negatively impact page performance.
          </Text>
        </Popover.Dropdown>
      </Popover>
      <div className="flex flex-col space-y-1.5 h-fit">
        <h2 className="font-bold -mt-1">DOM Size</h2>
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
                  {(stat && score + "%") || "..."}
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
        <div
          onClick={() =>
            openBrowserWindow(
              "https://pagespeed.web.dev/report?url=" +
                (url || "No URL provided"),
            )
          }
          className="flex underline cursor-pointer"
        >
          <div className="flex items-center">
            <h4 className="text-[12px] font-semibold dark:text-white/50">
              Nodes found:
            </h4>
            <span className="font-bold text-apple-spaceGray/50">
              {stat?.lighthouseResult?.audits?.["dom-size"]?.numericValue
                ? `${stat.lighthouseResult.audits["dom-size"].numericValue}`
                : "..."}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DomElements;
