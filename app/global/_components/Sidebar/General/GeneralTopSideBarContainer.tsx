import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";
import Summary from "./DropDowns/Summary";
import PageTitles from "./DropDowns/PageTitles";
import Images from "./DropDowns/Images";
import Javascript from "./DropDowns/Javascript";

const GeneralTopSideBarContainer = () => {
  const domainCrawlData = useGlobalCrawlStore();

  console.log(typeof domainCrawlData.crawlData);

  return (
    <div className="text-sx w-full space-y-1">
      <Summary />
      <PageTitles />
      <Images />
      <Javascript />
    </div>
  );
};

export default GeneralTopSideBarContainer;
