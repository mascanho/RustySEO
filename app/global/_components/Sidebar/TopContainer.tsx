// @ts-nocheck
import React, { lazy, Suspense } from "react";
import { Tabs } from "@mantine/core";

// Lazy load the components
const GeneralTopSideBarContainer = lazy(
  () => import("./General/GeneralTopSideBarContainer"),
);
const IssuesContainer = lazy(() => import("./Issues/IssuesContainer"));
const RankingInfo = lazy(
  () => import("@/app/global/_components/Sidebar/GSCRankingInfo/RankingInfo"),
);
const ConsoleLog = lazy(() => import("./ConsoleLog/ConsoleLog"));

const TopContainer = () => {
  return (
    <div className="h-full">
      <Tabs defaultValue="first" className="overflow-auto">
        <Tabs.List justify="center" grow className="dark:text-white text-xs">
          <Tabs.Tab value="first">General</Tabs.Tab>
          <Tabs.Tab value="issues">Issues</Tabs.Tab>
          {/* <Tabs.Tab value="gsc">GSC</Tabs.Tab> */}
          <Tabs.Tab value="status">Status</Tabs.Tab>
          {/* <Tabs.Tab value="fourth">Struct</Tabs.Tab>
          <Tabs.Tab value="fifth">Crawls</Tabs.Tab> */}
        </Tabs.List>

        {/* Wrap each panel in Suspense with a fallback */}
        <Suspense fallback={<div>Loading...</div>}>
          <Tabs.Panel value="first">
            <GeneralTopSideBarContainer />
          </Tabs.Panel>
        </Suspense>

        <Suspense fallback={<div>Loading...</div>}>
          <Tabs.Panel value="issues" className="h-full">
            <IssuesContainer />
          </Tabs.Panel>
        </Suspense>

        <Suspense fallback={<div>Loading...</div>}>
          <Tabs.Panel value="gsc">
            <section className="h-[23.1rem] overflow-auto">
              <RankingInfo />
            </section>
          </Tabs.Panel>
        </Suspense>

        <Suspense fallback={<div>Loading...</div>}>
          <Tabs.Panel value="status">
            <ConsoleLog />
          </Tabs.Panel>
        </Suspense>
      </Tabs>
    </div>
  );
};

export default TopContainer;
