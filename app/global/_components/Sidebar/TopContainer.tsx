// @ts-nocheck
import { Tabs } from "@mantine/core";

// Import components directly
import GeneralTopSideBarContainer from "./General/GeneralTopSideBarContainer";
import IssuesContainer from "./Issues/IssuesContainer";
import RankingInfo from "@/app/global/_components/Sidebar/GSCRankingInfo/RankingInfo";
import ConsoleLog from "./ConsoleLog/ConsoleLog";
import URLTreeContainer from "../URLTree/URLTreeContainer";
import { useVisibilityStore } from "@/store/VisibilityStore";

const TopContainer = () => {
  const { showSidebar } = useVisibilityStore();

  return (
    <div
      className={`h-full w-full overflow-hidden flex flex-col ${showSidebar ? "block" : "hidden"}`}
    >
      <Tabs defaultValue="first" className="flex flex-col flex-1 min-h-0">
        <Tabs.List
          justify="center"
          grow
          className="dark:text-white text-xs border-0 flex-none"
        >
          <Tabs.Tab value="first">General</Tabs.Tab>
          <Tabs.Tab value="issues">Issues</Tabs.Tab>
          <Tabs.Tab value="queries">Queries</Tabs.Tab>
          <Tabs.Tab value="status">Status</Tabs.Tab>
          <Tabs.Tab value="tree">Tree</Tabs.Tab>
        </Tabs.List>

        {/* Render components directly */}
        <Tabs.Panel value="first" className="flex-1 overflow-auto">
          <GeneralTopSideBarContainer />
        </Tabs.Panel>

        <Tabs.Panel value="issues" className="flex-1 overflow-auto h-full">
          <IssuesContainer />
        </Tabs.Panel>

        <Tabs.Panel value="queries" className="flex-1 overflow-auto">
          <RankingInfo />
        </Tabs.Panel>

        <Tabs.Panel value="status" className="flex-1 overflow-auto">
          <ConsoleLog />
        </Tabs.Panel>

        <Tabs.Panel value="tree" className="flex-1 overflow-auto">
          <URLTreeContainer />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default TopContainer;
