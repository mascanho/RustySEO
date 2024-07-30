import { Tabs } from "@mantine/core";
import React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import RedirectsTable from "../RedirectsTable";
import ContentSummary from "../ContentSummary";

// Define prop types for better type checking
interface SidebarContainerProps {
  pageSpeed: any;
  keywords: any;
  wordCount: any;
  readingTime: any;
  readingLevelResults: any;
  pageTitle: string[];
  AiContentAnalysis: any;
}

const SidebarContainer: React.FC<SidebarContainerProps> = ({
  pageSpeed,
  keywords,
  wordCount,
  readingTime,
  readingLevelResults,
  pageTitle,
  AiContentAnalysis,
}) => {
  console.log(wordCount, "Wordssssss");

  return (
    <aside className="w-[20rem] md:w-[25rem] h-screen border-l border-2 overflow-y-auto overflow-x-hidden flex flex-col">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={180} className="overflow-scroll">
          <Tabs defaultValue="first" className="text-xs aside-tabs">
            <Tabs.List justify="left" className="dark:text-white text-xs">
              <Tabs.Tab value="first">Content</Tabs.Tab>
              <Tabs.Tab value="third">Improvements</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="first">
              <ContentSummary
                keywords={keywords}
                wordCount={wordCount ? wordCount : ""}
                readingTime={readingTime}
                readingLevelResults={readingLevelResults}
                pageTitle={pageTitle}
                AiContentAnalysis={AiContentAnalysis}
              />
            </Tabs.Panel>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={200}>
          <Tabs defaultValue="first" className="text-xs aside-tabs">
            <Tabs.List justify="left" className="dark:text-white text-xs">
              <Tabs.Tab value="first">Diagnostics</Tabs.Tab>
              <Tabs.Tab value="third">Improvements</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="first">
              <RedirectsTable pageSpeed={pageSpeed} />
            </Tabs.Panel>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </aside>
  );
};

export default SidebarContainer;
