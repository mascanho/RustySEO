import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { useEffect } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { brownPaper } from "react-syntax-highlighter/dist/esm/styles/hljs"; // Choose a style you like

const RobotsDomain = () => {
  const { crawlData, setRobots, robots } = useGlobalCrawlStore();

  const robotsData = crawlData.filter((item) => item?.robots);

  console.log(robots, "");

  useEffect(() => {
    setRobots(robotsData);
  }, [crawlData]);

  return (
    <div className="h-96  w-[20.9rem]  bg-trasnparent dark:bg-brand-darker text-black">
      {robots.length > 0 && (
        <SyntaxHighlighter language="text" style={brownPaper}>
          {robots[0].robots}
        </SyntaxHighlighter>
      )}
    </div>
  );
};

export default RobotsDomain;
