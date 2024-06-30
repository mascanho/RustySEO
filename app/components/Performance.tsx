import React from "react";

import { useDisclosure } from "@mantine/hooks";
import { Popover, Text, Button } from "@mantine/core";

const PerformanceEl = ({ stat }: { stat: number }) => {
  const [opened, { close, open }] = useDisclosure(false);
  return (
    <section className="border p-4 border-apple-spaceGray shadow bg-white w-60 rounded-md space-y-2 relative">
      <span className="absolute right-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={38}
          height={38}
          color={"#a6a5a2"}
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
          <Text size="sm">
            This metric shows the performance of the page/URL, synced from Page
            Speed Insights.
          </Text>
        </Popover.Dropdown>
      </Popover>
      <div className="flex flex-col space-y-2">
        <h2 className="font-bold">Performance</h2>
        <span className="text-xl">{stat * 100}%</span>
        <h2 className="text-xs underline cursor-pointer">
          View PageSpeed Insights
        </h2>
      </div>
    </section>
  );
};

export default PerformanceEl;
