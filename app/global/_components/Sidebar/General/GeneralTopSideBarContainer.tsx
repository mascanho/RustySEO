import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";
import Summary from "./DropDowns/Summary";
import PageTitles from "./DropDowns/PageTitles";
import Images from "./DropDowns/Images";
import Javascript from "./DropDowns/Javascript";
import Schema from "./DropDowns/Schema";
import Css from "./DropDowns/Css";
import Iframes from "./DropDowns/Iframes";

const GeneralTopSideBarContainer = () => {
  const domainCrawlData = useGlobalCrawlStore();

  console.log(typeof domainCrawlData.crawlData);

  return (
    <div className="text-xs w-full space-y-1 h-[28rem] overflow-y-auto">
      <Summary />
      <PageTitles />
      <Images />
      <Css />
      <Iframes />
      <Javascript />
      <Schema />
    </div>
  );
};

export default GeneralTopSideBarContainer;
