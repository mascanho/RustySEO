import React from "react";
import OverviewChart from "./_components/charts/OverviewChart";

import { Tabs, TabsList } from "@mantine/core";
import useCrawlStore from "@/store/GlobalCrawlDataStore";
import { BiDuplicate } from "react-icons/bi";
import DuplicatedTitlesChart from "./_components/charts/DuplicatedTitlesChart";

const OverviewBottomSidePanel = () => {
  const { issuesView, genericChart } = useCrawlStore();

  return (
    <Tabs
      defaultValue="chart1"
      className="h-full flex flex-col justify-between"
    >
      {/* Chart Section */}
      <Tabs.Panel value="chart1" className="h-full dark:bg-gray-900">
        {issuesView === "Duplicated Titles" && genericChart !== "general" && (
          <DuplicatedTitlesChart />
        )}

        {issuesView === "404 Response" && genericChart !== "general" && "hello"}

        {genericChart === "general" && <OverviewChart />}
      </Tabs.Panel>
    </Tabs>
  );
};

export default OverviewBottomSidePanel;
