// @ts-nocheck
import { Tabs } from "@mantine/core";

// Import components directly
import GeneralTopSideBarContainer from "./General/GeneralTopSideBarContainer";
import IssuesContainer from "./Issues/IssuesContainer";
import RankingInfo from "@/app/global/_components/Sidebar/GSCRankingInfo/RankingInfo";
import ConsoleLog from "./ConsoleLog/ConsoleLog";
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
          {/* <Tabs.Tab value="gsc">GSC</Tabs.Tab> */}
          <Tabs.Tab value="status">Status</Tabs.Tab>
          {/* <Tabs.Tab value="fourth">Struct</Tabs.Tab>
          <Tabs.Tab value="fifth">Crawls</Tabs.Tab> */}
        </Tabs.List>

        {/* Render components directly */}
        <Tabs.Panel value="first">
          <GeneralTopSideBarContainer />
        </Tabs.Panel>

        <Tabs.Panel value="issues" className="h-full">
          <IssuesContainer />
        </Tabs.Panel>

        <Tabs.Panel value="gsc">
          <section className="h-[23.1rem] overflow-auto">
            <RankingInfo />
          </section>
        </Tabs.Panel>

        <Tabs.Panel value="status">
          <ConsoleLog />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default TopContainer;
