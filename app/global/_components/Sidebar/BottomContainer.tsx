import { Tabs } from "@mantine/core";
import HistoryDomainCrawls from "./BottomContainer/HistoryDomainCrawls";
import OverviewBottomSidePanel from "./BottomContainer/OverviewBottomSidePanel";
import RobotsDomain from "./BottomContainer/RobotsDomain";
import SitemapDomain from "./BottomContainer/SitemapDomain";
import FixesContainer from "./BottomContainer/Fixes/FixesContainer";

const BottomContainer = () => {
  return (
    <div className="relative h-full flex flex-col dark:bg-gray-900 bg-slate-100">
      <Tabs defaultValue="overview" className="overflow-hidden h-full w-full">
        <Tabs.List
          justify="center"
          grow
          className="dark:text-white text-xs bg-slate-100 dark:bg-gray-900"
        >
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          {/* <Tabs.Tab value="robotsTab">Fixes</Tabs.Tab> */}
          {/* <Tabs.Tab value="sitemaps">Sitemaps</Tabs.Tab> */}
          <Tabs.Tab value="fixes">Fixes</Tabs.Tab>
          <Tabs.Tab value="history">History</Tabs.Tab>
          <Tabs.Tab value="robots">Robots</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel
          value="overview"
          className="overflow-auto flex flex-col justify-between relative dark:bg-gray-900"
        >
          <OverviewBottomSidePanel />
        </Tabs.Panel>

        {/*<Tabs.Panel value="sitemaps" className="h-[28rem]">
          <SitemapDomain />
        </Tabs.Panel>*/}

        <Tabs.Panel value="fixes">
          <div className="flex flex-col gap-y-2 dark:bg-gray-900">
            <FixesContainer />
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="history">
          <div className="flex flex-col gap-y-2 dark:bg-gray-900">
            <HistoryDomainCrawls />
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="robots">
          <RobotsDomain />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default BottomContainer;
