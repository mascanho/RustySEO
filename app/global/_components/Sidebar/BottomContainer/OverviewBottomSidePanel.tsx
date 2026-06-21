import OverviewChart from "./_components/charts/OverviewChart";
import GenericIssueChart from "./_components/charts/GenericIssueChart";
import { Tabs } from "@mantine/core";
import useCrawlStore from "@/store/GlobalCrawlDataStore";

const OverviewBottomSidePanel = () => {
  const issuesView = useCrawlStore((state) => state.issuesView);
  const genericChart = useCrawlStore((state) => state.genericChart);

  return (
    <Tabs
      defaultValue="chart1"
      className="h-full flex flex-col"
    >
      <Tabs.Panel value="chart1" className="h-full dark:bg-gray-900">
        {issuesView && genericChart !== "general" ? (
          <GenericIssueChart />
        ) : (
          <OverviewChart />
        )}
      </Tabs.Panel>
    </Tabs>
  );
};

export default OverviewBottomSidePanel;
