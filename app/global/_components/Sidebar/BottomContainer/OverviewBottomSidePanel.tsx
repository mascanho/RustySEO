import React from "react";
import OverviewChart from "./_components/charts/OverviewChart";

import { Tabs, TabsList } from "@mantine/core";

const OverviewBottomSidePanel = () => {
  return (
    <Tabs
      defaultValue="chart1"
      className="h-full flex flex-col justify-between "
    >
      {/* Chart Section */}
      <Tabs.Panel value="chart1" className="h-full dark:bg-gray-900">
        <OverviewChart />
      </Tabs.Panel>

      {/* Tabs Section */}
      {/* <section className="flex text-xs justify-center fixed bottom-10 pt-1 right-0 z-50   border-t w-[17.9rem] dark:border-brand-dark"> */}
      {/*   <Tabs.Tab value="chart1">Barchart</Tabs.Tab> */}
      {/*   <Tabs.Tab value="chart2">Barchart2</Tabs.Tab> */}
      {/* </section> */}
    </Tabs>
  );
};

export default OverviewBottomSidePanel;
