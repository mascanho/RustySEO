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
import { invoke } from "@tauri-apps/api/core";
import { useOllamaStore } from "@/store/store";
import AIFeedbackTab from "./AiAnalysis";
import { useParams } from "next/navigation";
import PopUpTable from "../CrawlHistory/PopUpTable";
import RankingInfo from "./RankingInfo";
import GeneralOverview from "./GeneralOverview";
import Topics from "./Topics/Topics";

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
  bodyElements: any;
  video: any;
  urlLength: any;
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
  bodyElements,
  video,
  urlLength,
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
      className={`pt-1 bg-white dark:bg-brand-darker overflow-y-auto overflow-hidden min-h-[24.6rem]  border-l-4   border-t dark:border-t-brand-dark/60  dark:border-gray-700 flex relative flex-col  transition-all ease-linear delay-75  dark:bg-brand-darker ${visibility.sidebar ? "w-[24.3rem]" : "w-0"}`}
    >
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={220} className="h-[calc(100vh-1.5rem)] ">
          <Tabs defaultValue="summary" className="text-xs aside-tabs">
            <Tabs.List grow justify="left" className="dark:text-white">
              <Tabs.Tab className="text-[8px]" value="summary">
                General
              </Tabs.Tab>
              <Tabs.Tab value="first">Content</Tabs.Tab>
              <Tabs.Tab value="suggestions">Suggestions</Tabs.Tab>
              <Tabs.Tab value="third">Queries</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel
              value="first"
              className="h-full w-full bg-brand-highlight/5 dark:bg-brand-bright"
            >
              <ContentSummary
                keywords={keywords}
                wordCount={wordCount || ""}
                readingTime={readingTime}
                readingLevelResults={readingLevelResults}
                pageTitle={pageTitle}
                AiContentAnalysis={AiContentAnalysis}
                robots={robots}
                htmlToTextRatio={htmlToTextRatio}
                video={video}
              />
            </Tabs.Panel>
            <Tabs.Panel
              value="third"
              className="w-full bg-brand-highlight/5 h-[28rem] "
            >
              <RankingInfo keywords={keywords} pageSpeed={pageSpeed} />
            </Tabs.Panel>

            <Tabs.Panel value="suggestions" className="h-full w-full">
              <Topics bodyElements={bodyElements} />
            </Tabs.Panel>

            <Tabs.Panel value="summary" className="h-full w-full ">
              <AIFeedbackTab
                seo={seo}
                loading={loading}
                pageSpeed={pageSpeed}
              />
            </Tabs.Panel>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={200} className="h-[calc(100vh-90rem)]">
          <Tabs defaultValue="first" className="text-xs aside-tabs">
            <Tabs.List
              grow
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
                urlLength={urlLength}
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
