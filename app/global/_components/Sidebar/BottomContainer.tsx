import { Tabs } from "@mantine/core";
import HistoryDomainCrawls from "./BottomContainer/HistoryDomainCrawls";
import OverviewBottomSidePanel from "./BottomContainer/OverviewBottomSidePanel";
import RobotsDomain from "./BottomContainer/RobotsDomain";
import SitemapDomain from "./BottomContainer/SitemapDomain";

const BottomContainer = () => {
  return (
    <div className="border-t dark:border-brand-dark relative h-[38rem] min-h-[30rem] flex flex-col">
      <Tabs defaultValue="overview" className="overflow-hidden h-full w-full">
        <Tabs.List justify="center" grow className="dark:text-white text-xs ">
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="robotsTab">Robots</Tabs.Tab>
          <Tabs.Tab value="sitemaps">Sitemaps</Tabs.Tab>
          <Tabs.Tab value="history">History</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel
          value="overview"
          className="overflow-auto flex flex-col justify-between relative"
        >
          <OverviewBottomSidePanel />
        </Tabs.Panel>

        <Tabs.Panel value="robotsTab" className="h-[28rem] overflow-auto">
          <RobotsDomain />
        </Tabs.Panel>

        <Tabs.Panel value="sitemaps" className="h-[28rem]">
          <SitemapDomain />
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <div className="flex flex-col gap-y-2">
            <HistoryDomainCrawls />
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default BottomContainer;
