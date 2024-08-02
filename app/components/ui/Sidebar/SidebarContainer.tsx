import { Tabs } from "@mantine/core";
import React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import RedirectsTable from "../RedirectsTable";
import ContentSummary from "../ContentSummary";
import RobotsTable from "../RobotsTable";
import PageRankChart from "../ShadCharts/PageRankChart";

// Define prop types for better type checking
interface SidebarContainerProps {
  pageSpeed: any;
  keywords: any;
  wordCount: any;
  readingTime: any;
  readingLevelResults: any;
  pageTitle: string[];
  AiContentAnalysis: any;
  robots: any;
}

const SidebarContainer: React.FC<SidebarContainerProps> = ({
  pageSpeed,
  keywords,
  wordCount,
  readingTime,
  readingLevelResults,
  pageTitle,
  robots,
  AiContentAnalysis,
}) => {
  return (
    <aside className="w-[20rem] md:w-[25rem] h-screen border-l dark:border-l-white/20  overflow-y-auto overflow-hidden flex flex-col bg-white dark:bg-brand-darker">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={180}>
          <Tabs defaultValue="first" className="text-xs aside-tabs">
            <Tabs.List justify="left" className="dark:text-white text-xs">
              <Tabs.Tab value="first">Content</Tabs.Tab>
              <Tabs.Tab value="third">Ranking</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="first" className="h-full w-full">
              <ContentSummary
                keywords={keywords}
                wordCount={wordCount ? wordCount : ""}
                readingTime={readingTime}
                readingLevelResults={readingLevelResults}
                pageTitle={pageTitle}
                AiContentAnalysis={AiContentAnalysis}
                robots={robots}
              />
            </Tabs.Panel>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={200} className="h-[calc(100vh-1.5rem)]">
          <Tabs defaultValue="first" className="text-xs aside-tabs">
            <Tabs.List justify="left" className="dark:text-white text-xs">
              <Tabs.Tab value="first">Redirects</Tabs.Tab>
              <Tabs.Tab value="second">Robots</Tabs.Tab>
              <Tabs.Tab value="third">Domain</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="first">
              <RedirectsTable pageSpeed={pageSpeed} />
            </Tabs.Panel>

            <Tabs.Panel value="second">
              <RobotsTable robots={robots} />
            </Tabs.Panel>
            <Tabs.Panel value="third">
              <PageRankChart />
            </Tabs.Panel>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </aside>
  );
};

export default SidebarContainer;
