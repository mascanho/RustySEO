"use client";

import PageSpeedInsigthsApi from "@/app/components/PageSpeedInsigthsApi";
import { Tabs } from "@mantine/core";
import PagespeedInsightsApi from "./PagespeedInsigthsApi";
import GoogleAnalyticsConf from "./GoogleAnalyticsConf";
import SearchConsoleConfs from "./SearchConsoleConfs";
import AIConfigurations from "./AIConfigurations";
import ClarityConfs from "./ClarityConfs";

const Configurations = () => {
  return (
    <div className="flex flex-col gap-2 p-2 h-[430px]">
      <Tabs defaultValue="pagespeed" className="-mt-2">
        <Tabs.List className="">
          <Tabs.Tab value="pagespeed" className="pt-2">
            Page Speed Insights
          </Tabs.Tab>
          <Tabs.Tab value="analytics">Google Analytics</Tabs.Tab>
          <Tabs.Tab value="console">Google Search Console</Tabs.Tab>
          <Tabs.Tab value="clarity">MS Clarity</Tabs.Tab>
          <Tabs.Tab value="ai">Ai Model</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="pagespeed">
          <PagespeedInsightsApi />
        </Tabs.Panel>
        <Tabs.Panel value="analytics">
          <GoogleAnalyticsConf />
        </Tabs.Panel>
        <Tabs.Panel value="console">
          <SearchConsoleConfs />
        </Tabs.Panel>
        <Tabs.Panel value="clarity">
          <ClarityConfs />
        </Tabs.Panel>{" "}
        <Tabs.Panel value="ai">
          <AIConfigurations />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default Configurations;
