// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { brownPaper } from "react-syntax-highlighter/dist/esm/styles/hljs"; // Choose a style you like

const RobotsDomain = () => {
  const { crawlData, setRobots, robots } = useGlobalCrawlStore();

  useEffect(() => {
    // handle the event from the crawler
    const unlisten = listen("robots_txt", (event) => {
      const robots = event.payload;
      setRobots(robots);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [crawlData]);

  return (
    <div className="h-96  w-[20rem]  bg-trasnparent dark:bg-brand-darker text-black robotsDomain">
      {robots?.length > 0 && (
        <SyntaxHighlighter language="text" style={brownPaper}>
          {robots}
        </SyntaxHighlighter>
      )}
    </div>
  );
};

export default RobotsDomain;
