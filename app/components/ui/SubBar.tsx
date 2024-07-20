import React, { useEffect } from "react";
import { CgWebsite } from "react-icons/cg";
import { FaDesktop, FaMobileAlt } from "react-icons/fa";
import MenuEl from "./Menu";
import { useDisclosure } from "@mantine/hooks";
import TodoMenu from "./TodoMenu";

const SubBar = ({
  domainWithoutLastPart,
  url,
  strategy,
}: {
  domainWithoutLastPart: string;
  url: string;
  strategy: { strategy: string };
}) => {
  const [opened, { open, close }] = useDisclosure(true);

  useEffect(() => {
    console.log("Current strategy in SubBar:", strategy);
  }, [strategy]);

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case "desktop":
        return <FaDesktop />;
      case "mobile":
        return <FaMobileAlt />;
      default:
        return <CgWebsite />;
    }
  };

  return (
    <section className="w-full flex items-center space-x-2 justify-between mt-1">
      <div className="flex items-center space-x-2">
        <div className="uppercase overflow-x-hidden py-1 font-semibold flex items-center space-x-2 border border-apple-spaceGray border-2 text-sm shadow px-3 rounded-full">
          {getStrategyIcon(strategy.strategy)}
          <span>{domainWithoutLastPart || "RustySEO"}</span>
        </div>
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={16}
            height={16}
            color={"#000000"}
            fill={"none"}
          >
            <path
              d="M20 12L4 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 17C15 17 20 13.3176 20 12C20 10.6824 15 7 15 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="flex items-center space-x-1">
          <span className="mt-1">{url}</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {/* @ts-ignore */}
        <TodoMenu url={url} />
        <MenuEl />
      </div>
    </section>
  );
};

export default SubBar;
