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
      className={`h-full w-full overflow-hidden ${showSidebar ? "block" : "hidden"}`}
    >
      <Tabs defaultValue="first">
        <Tabs.List
          justify="center"
          grow
          className="dark:text-white text-xs border-0"
        >
          <Tabs.Tab value="first">General</Tabs.Tab>
          <Tabs.Tab value="issues">Issues</Tabs.Tab>
          <Tabs.Tab value="queries">Queries</Tabs.Tab>
          <Tabs.Tab value="status">Status</Tabs.Tab>
          <Tabs.Tab value="tree">Tree</Tabs.Tab>
        </Tabs.List>

        {/* Render components directly */}
        <Tabs.Panel value="first">
          <GeneralTopSideBarContainer />
        </Tabs.Panel>

        <Tabs.Panel value="issues" className="h-full">
          <IssuesContainer />
        </Tabs.Panel>

        <Tabs.Panel value="queries">
          <RankingInfo />
        </Tabs.Panel>

        <Tabs.Panel value="status">
          <ConsoleLog />
        </Tabs.Panel>

        <Tabs.Panel value="tree">
          <section className="h-[calc(100vh-12rem)] overflow-auto">
            <URLTreeContainer />
          </section>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default TopContainer;
