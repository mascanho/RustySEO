import React from "react";

import { useDisclosure } from "@mantine/hooks";
import { Popover, Text, Button } from "@mantine/core";

const WordCountEl = ({ words }: { words: string[] }) => {
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
          <path
            d="M13.2852 19.3647L5.82243 20.7506C4.39103 21.0164 3.67534 21.1493 3.26303 20.737C2.85072 20.3246 2.98362 19.6089 3.24943 18.1774L4.63523 10.7143C4.85745 9.51762 4.96856 8.91925 5.36302 8.5577C5.75749 8.19616 6.47889 8.1256 7.9217 7.98448C9.31227 7.84847 10.6283 7.37177 12 6L18 12.0005C16.6283 13.3723 16.1513 14.6874 16.0151 16.0781C15.8738 17.5211 15.8031 18.2426 15.4416 18.637C15.0801 19.0314 14.4818 19.1425 13.2852 19.3647Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M11 15.2105C10.4405 15.1197 9.92895 14.8763 9.52632 14.4737M9.52632 14.4737C9.12368 14.0711 8.8803 13.5595 8.78947 13M9.52632 14.4737L4 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M12 6C12.7123 4.9491 13.6771 3.1812 15.1065 3.01098C16.0822 2.89479 16.8906 3.70312 18.5072 5.31978L18.6802 5.49277C20.2969 7.10944 21.1052 7.91777 20.989 8.8935C20.8188 10.3229 19.0509 11.2877 18 12"
            stroke="currentColor"
            strokeWidth="1.5"
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
            This popover is shown when user hovers the target element
          </Text>
        </Popover.Dropdown>
      </Popover>
      <div className="flex flex-col space-y-2">
        <h2 className="font-bold">Word Count</h2>
        <span className="text-xl">{words} words</span>
        <h2 className="text-xs underline cursor-pointer">
          View PageSpeed Insights
        </h2>
      </div>
    </section>
  );
};

export default WordCountEl;
