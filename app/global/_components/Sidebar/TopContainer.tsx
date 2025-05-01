// @ts-nocheck
import { Tabs } from "@mantine/core";

// Import components directly
import GeneralTopSideBarContainer from "./General/GeneralTopSideBarContainer";
import IssuesContainer from "./Issues/IssuesContainer";
import RankingInfo from "@/app/global/_components/Sidebar/GSCRankingInfo/RankingInfo";
import ConsoleLog from "./ConsoleLog/ConsoleLog";

const TopContainer = () => {
  return (
    <div className="h-full">
      <Tabs defaultValue="first" className="overflow-auto">
        <Tabs.List justify="center" grow className="dark:text-white text-xs">
          <Tabs.Tab value="first">General</Tabs.Tab>
          <Tabs.Tab value="issues">Issues</Tabs.Tab>
          {/* <Tabs.Tab value="gsc">GSC</Tabs.Tab> */}
          <Tabs.Tab value="status">Status</Tabs.Tab>
          {/* <Tabs.Tab value="fourth">Struct</Tabs.Tab>
          <Tabs.Tab value="fifth">Crawls</Tabs.Tab> */}
        </Tabs.List>

        {/* Render components directly */}
        <Tabs.Panel value="first">
          {/* <GeneralTopSideBarContainer /> */}
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
