import { Tabs } from "@mantine/core";
import React, { useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import RedirectsTable from "../RedirectsTable";
import ContentSummary from "../ContentSummary";
import RobotsTable from "../RobotsTable";
import PageRankChart from "../ShadCharts/PageRankChart";
import SeoChart from "../ShadCharts/SeoChart";
import { IoChevronBackCircleOutline } from "react-icons/io5";
import { useVisibilityStore } from "@/store/VisibilityStore";
import { invoke } from "@tauri-apps/api/tauri";
import { useOllamaStore } from "@/store/store";
import AIFeedbackTab from "./AiAnalysis";
import { useParams } from "next/navigation";
import PopUpTable from "../CrawlHistory/PopUpTable";
import RankingInfo from "./RankingInfo";
import GeneralOverview from "./GeneralOverview";

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
  pageRank: any;
  seo: any;
  htmlToTextRatio: any;
  loading: boolean;
  favicon: string[];
}

const ollama = true;

const SidebarContainer: React.FC<SidebarContainerProps> = ({
  pageSpeed,
  keywords,
  wordCount,
  readingTime,
  readingLevelResults,
  pageTitle,
  robots,
  AiContentAnalysis,
  pageRank,
  seo,
  htmlToTextRatio,
  loading,
  favicon,
}) => {
  const { visibility, showSidebar, hideSidebar } = useVisibilityStore();
  const ollamaStatus = useOllamaStore();

  const params = useParams();

  // CHECK THE STATUS OF OLLAMA AND STORE INTO GLOBAL STATE
  useEffect(() => {
    invoke("check_ollama").then((result: any) => {
      console.log("ollama is: ", result);
      if (result.status === true) {
        ollamaStatus.ollama = true;
      } else {
        ollamaStatus.ollama = false;
      }
    });
  }, []);

  return (
    <aside
      className={`bg-white dark:bg-brand-darker overflow-y-auto overflow-hidden min-h-[100%]  border-l-2 mt-[5px] border-t dark:border-gray-700 flex relative flex-col  transition-all ease-linear delay-75  dark:bg-brand-darker ${visibility.sidebar ? "w-[24.5rem]" : "w-0"}`}
    >
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={220} className="h-[calc(100vh-1.5rem)]">
          <Tabs defaultValue="first" className="text-xs aside-tabs">
            <Tabs.List justify="left" className="dark:text-white text-xs">
              <Tabs.Tab value="first">Content</Tabs.Tab>
              <Tabs.Tab value="third">Ranking</Tabs.Tab>
              <Tabs.Tab value="second">SEO</Tabs.Tab>
              {ollamaStatus.ollama && (
                <Tabs.Tab value="summary">General</Tabs.Tab>
              )}
            </Tabs.List>
            <Tabs.Panel value="first" className="h-full w-full">
              <ContentSummary
                keywords={keywords}
                wordCount={wordCount || ""}
                readingTime={readingTime}
                readingLevelResults={readingLevelResults}
                pageTitle={pageTitle}
                AiContentAnalysis={AiContentAnalysis}
                robots={robots}
                htmlToTextRatio={htmlToTextRatio}
              />
            </Tabs.Panel>
            <Tabs.Panel value="second" className="h-full w-full">
              <SeoChart seo={seo} />
            </Tabs.Panel>

            <Tabs.Panel value="third" className="h-full w-full">
              <RankingInfo keywords={keywords} />
            </Tabs.Panel>

            <Tabs.Panel value="summary" className="h-full w-full">
              <AIFeedbackTab pageSpeed={pageSpeed} />
            </Tabs.Panel>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={200} className="h-[calc(100vh-90rem)]">
          <Tabs defaultValue="first" className="text-xs aside-tabs">
            <Tabs.List
              justify="left"
              className="dark:text-white text-xs sidebar-tabs"
            >
              <Tabs.Tab value="first">Checkllist</Tabs.Tab>
              <Tabs.Tab value="second">Redirects</Tabs.Tab>
              <Tabs.Tab value="third">Robots</Tabs.Tab>
              <Tabs.Tab value="forth">Domain</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="first">
              <GeneralOverview
                pageTitle={pageTitle}
                loading={loading}
                pageSpeed={pageSpeed}
              />
            </Tabs.Panel>

            <Tabs.Panel value="second">
              <RedirectsTable pageSpeed={pageSpeed} />
            </Tabs.Panel>
            <Tabs.Panel value="third">
              <RobotsTable robots={robots} />
            </Tabs.Panel>
            <Tabs.Panel value="forth">
              <PageRankChart pageRank={pageRank} />
            </Tabs.Panel>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </aside>
  );
};

export default SidebarContainer;
