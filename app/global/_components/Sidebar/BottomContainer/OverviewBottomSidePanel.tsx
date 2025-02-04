import React from "react";
import OverviewChart from "./_components/charts/OverviewChart";

import { Tabs, TabsList } from "@mantine/core";

const OverviewBottomSidePanel = () => {
  return (
    <Tabs defaultValue="chart1" className="h-full flex flex-col">
      {/* Chart Section */}
      <section className="flex h-[calc(20rem-1.1em)]">
        <Tabs.Panel value="chart1" className="h-full">
          <div className="h-full my-auto pt-[3.5em] dark:bg-brand-darker">
            <OverviewChart />
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="chart2" className="h-full">
          <div className="h-full">
            <OverviewChart />
          </div>
        </Tabs.Panel>
      </section>

      {/* Tabs Section */}
      <section className="flex text-xs justify-center  border-t dark:border-brand-dark">
        <Tabs.Tab value="chart1">Barchart</Tabs.Tab>
        <Tabs.Tab value="chart2">Barchart2</Tabs.Tab>
      </section>
    </Tabs>
  );
};

export default OverviewBottomSidePanel;
