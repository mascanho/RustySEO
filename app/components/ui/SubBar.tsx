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
    <section className="w-full flex items-center space-x-2 justify-between mt-1 relative">
      <div className="flex items-center space-x-2">
        <div className="uppercase overflow-x-hidden py-1 font-semibold flex items-center space-x-2 border border-apple-spaceGray/60 dark:border-white dark:text-white dark:bg-[#60A8FB] border-2 text-sm shadow px-3 rounded-full">
          {getStrategyIcon(strategy.strategy)}
          <span>{domainWithoutLastPart || "RustySEO"}</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {/* @ts-ignore */}
        {/* <TodoMenu url={url} /> */}
        {/* <MenuEl /> */}
      </div>
    </section>
  );
};

export default SubBar;
