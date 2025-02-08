import { Tabs } from "@mantine/core";
import HistoryDomainCrawls from "./BottomContainer/HistoryDomainCrawls";
import OverviewBottomSidePanel from "./BottomContainer/OverviewBottomSidePanel";

const BottomContainer = () => {
  return (
    <div className="border-t dark:border-brand-dark relative h-full">
      <Tabs defaultValue="overview" className="overflow-auto">
        <Tabs.List
          justify="center"
          className="dark:text-white text-xs font-bold"
        >
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="third">Improv</Tabs.Tab>
          <Tabs.Tab value="fourth">Task</Tabs.Tab>
          <Tabs.Tab value="fifth">History</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel
          value="overview"
          className="h-[calc(24rem-20px)] flex flex-col justify-between relative"
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
