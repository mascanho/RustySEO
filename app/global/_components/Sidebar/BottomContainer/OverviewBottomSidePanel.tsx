import React from "react";
import OverviewChart from "./_components/charts/OverviewChart";

import { Tabs, TabsList } from "@mantine/core";
import useCrawlStore from "@/store/GlobalCrawlDataStore";
import { BiDuplicate } from "react-icons/bi";
import DuplicatedTitlesChart from "./_components/charts/DuplicatedTitlesChart";
import PageTitleTooLargeChart from "./_components/charts/PageTitleTooLargeChart";
import PageTitleTooShortChart from "./_components/charts/PageTitleTooShortChart";
import Response404 from "./_components/charts/Response404Chart";
import DuplicatedDescriptionsChart from "./_components/charts/DuplicatedDescriptionsChart";
import DescriptionsTooLongChart from "./_components/charts/DescriptionsTooLongChart";
import H1MissingChart from "./_components/charts/H1MissingChart";
import H2MissingChart from "./_components/charts/H2MissingChart";
import LowContentChart from "./_components/charts/LowContentChart";
import MissingSchemaChart from "./_components/charts/MissingSchemaChart";
import ImagesTooBigChart from "./_components/charts/ImagesTooBitChart.tsx";
import Response5XXChart from "./_components/charts/Response5XXChart";
import MissingTitlesChart from "./_components/charts/MissingTitlesChart";
import MissingDescriptionsChart from "./_components/charts/MissingDescriptionsChart";

const OverviewBottomSidePanel = () => {
  const { issuesView, genericChart } = useCrawlStore();

  return (
    <Tabs
      defaultValue="chart1"
      className="h-full flex flex-col justify-between pt-4"
    >
      {/* Chart Section */}
      <Tabs.Panel value="chart1" className="h-full dark:bg-gray-900">
        {issuesView === "Missing Page Title" && genericChart !== "general" && (
          <MissingTitlesChart />
        )}
        {issuesView === "Duplicated Titles" && genericChart !== "general" && (
          <DuplicatedTitlesChart />
        )}
        {issuesView === "Page Title > 60 Chars" &&
          genericChart !== "general" && <PageTitleTooLargeChart />}
        {issuesView === "Page Title < 30 Chars" &&
          genericChart !== "general" && <PageTitleTooShortChart />}
        {issuesView === "Missing Description" && genericChart !== "general" && (
          <MissingDescriptionsChart />
        )}
        {issuesView === "Duplicated Descriptions" &&
          genericChart !== "general" && <DuplicatedDescriptionsChart />}
        {issuesView === "Descriptions > 160 Chars" &&
          genericChart !== "general" && <DescriptionsTooLongChart />}
        {issuesView === "404 Response" && genericChart !== "general" && (
          <Response404 />
        )}
        {issuesView === "5XX Response" && genericChart !== "general" && (
          <Response5XXChart />
        )}
        {issuesView === "H1 Missing" && genericChart !== "general" && (
          <H1MissingChart />
        )}
        {issuesView === "H2 Missing" && genericChart !== "general" && (
          <H2MissingChart />
        )}{" "}
        {issuesView === "Low Content" && genericChart !== "general" && (
          <LowContentChart />
        )}{" "}
        {issuesView === "Missing Schema" && genericChart !== "general" && (
          <MissingSchemaChart />
        )}{" "}
        {issuesView === "Large Images" && genericChart !== "general" && (
          <ImagesTooBigChart />
        )}{" "}
        {genericChart === "general" && <OverviewChart />}
      </Tabs.Panel>
    </Tabs>
  );
};

export default OverviewBottomSidePanel;
