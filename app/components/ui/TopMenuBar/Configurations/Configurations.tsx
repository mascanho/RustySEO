"use client";

import PageSpeedInsigthsApi from "@/app/components/PageSpeedInsigthsApi";
import { Tabs } from "@mantine/core";
import PagespeedInsightsApi from "./PagespeedInsigthsApi";
import GoogleAnalyticsConf from "./GoogleAnalyticsConf";

const Configurations = () => {
  return (
    <div className="flex flex-col gap-2 p-2 h-[400px]">
      <Tabs defaultValue="pagespeed">
        <Tabs.List>
          <Tabs.Tab value="pagespeed">Page Speed Insights</Tabs.Tab>
          <Tabs.Tab value="analytics">Google Analytics</Tabs.Tab>
          <Tabs.Tab value="console">Google Search Console</Tabs.Tab>
          <Tabs.Tab value="ollama">Ai Models</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="pagespeed">
          <PagespeedInsightsApi />
        </Tabs.Panel>

        <Tabs.Panel value="analytics">
          <GoogleAnalyticsConf />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default Configurations;
