import { Tabs } from "@mantine/core";
import HistoryDomainCrawls from "./BottomContainer/HistoryDomainCrawls";

const BottomContainer = () => {
  return (
    <div className="border-t">
      <Tabs defaultValue="first" className="overflow-auto">
        <Tabs.List
          justify="center"
          className="dark:text-white text-xs font-bold"
        >
          <Tabs.Tab value="first">Domain</Tabs.Tab>
          <Tabs.Tab value="third">Improv</Tabs.Tab>
          <Tabs.Tab value="fourth">Task</Tabs.Tab>
          <Tabs.Tab value="fifth">History</Tabs.Tab>
        </Tabs.List>

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
