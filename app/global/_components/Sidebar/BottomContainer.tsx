import { Tabs } from "@mantine/core";
import HistoryDomainCrawls from "./BottomContainer/HistoryDomainCrawls";
import OverviewBottomSidePanel from "./BottomContainer/OverviewBottomSidePanel";

const BottomContainer = () => {
  return (
    <div className="border-t dark:border-brand-dark relative h-[38rem] min-h-[28rem] flex flex-col flex-1">
      <Tabs defaultValue="overview" className="overflow-hidden h-full w-full">
        <Tabs.List justify="center" className="dark:text-white text-xs ">
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="third">Robots</Tabs.Tab>
          <Tabs.Tab value="fourth">Sitemaps</Tabs.Tab>
          <Tabs.Tab value="fifth">History</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel
          value="overview"
          className="overflow-auto flex flex-col justify-between relative"
        >
          <OverviewBottomSidePanel />
        </Tabs.Panel>
        <Tabs.Panel value="fifth">
          <div className="flex flex-col gap-y-2">
            <HistoryDomainCrawls />
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default BottomContainer;
