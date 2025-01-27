import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";
import Summary from "./DropDowns/Summary";
import PageTitles from "./DropDowns/PageTitles/PageTitles";

const GeneralTopSideBarContainer = () => {
  const domainCrawlData = useGlobalCrawlStore();

  console.log(typeof domainCrawlData.crawlData);

  return (
    <div className="text-sx w-full">
      <Summary />
      <PageTitles />
    </div>
  );
};

export default GeneralTopSideBarContainer;
