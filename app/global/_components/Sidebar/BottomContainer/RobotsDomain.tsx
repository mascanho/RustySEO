// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { brownPaper } from "react-syntax-highlighter/dist/esm/styles/hljs"; // Choose a style you like

const RobotsDomain = () => {
  const { crawlData, setRobots, robots } = useGlobalCrawlStore();

  useEffect(() => {
    let unlisten: () => void;

    listen<[string, any]>("robots", ({ payload }) => {
      const [domain, robots] = payload;
      console.log(robots, "THE ROBOTS");
      setRobots(robots);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [robots, crawlData]);

  return (
    <div className="h-96 w-[20rem] text-[9px] bg-transparent dark:bg-brand-darker text-black robotsDomain">
      {robots && robots.length > 0 && robots[0] ? (
        <SyntaxHighlighter language="text" style={brownPaper}>
          {robots[0]}
        </SyntaxHighlighter>
      ) : (
        <>
          <span>No robots.txt loaded yet</span>
        </>
      )}
    </div>
  );
};

export default RobotsDomain;
