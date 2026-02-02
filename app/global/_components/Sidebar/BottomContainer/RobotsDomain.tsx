// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { arta } from "react-syntax-highlighter/dist/esm/styles/hljs";

const RobotsDomain = () => {
  const { crawlData, setRobots, robots } = useGlobalCrawlStore();

  useEffect(() => {
    let unlisten: () => void;

    listen<[string, any]>("robots", ({ payload }) => {
      const [domain, robotsPayload] = payload;
      // console.log(robotsPayload, "THE ROBOTS");
      setRobots(robotsPayload);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [setRobots]);

  return (
    <div className="absolute inset-0 w-full h-full bg-white dark:bg-brand-darker text-gray-900 dark:text-gray-50 robotsDomain">
      {robots && robots.length > 0 && robots[0] ? (
        <SyntaxHighlighter
          language="text"
          style={arta}
          className="robots-content" // Avoid global pre styles
          customStyle={{
            margin: 0,
            padding: "1rem", // Add comfortable padding inside the scrollable area
            height: "100%",
            width: "100%",
            fontSize: "12px", // Slightly larger for readability
            lineHeight: "1.5",
            background: "transparent",
            color: "inherit", // Inherit high-contrast color from parent
            boxSizing: "border-box", // Ensure padding doesn't affect dimensions
          }}
          wrapLongLines={true}
        >
          {robots[0]}
        </SyntaxHighlighter>
      ) : (
        <section className="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
          <span>No robots.txt loaded yet</span>
        </section>
      )}
    </div>
  );
};

export default RobotsDomain;
