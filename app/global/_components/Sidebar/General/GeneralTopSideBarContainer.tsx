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
      <section className="w-full flex justify-end bg-gray-100 font-bold sticky top-0 py-0.5 dark:bg-gray-900">
        <div className="w-full"></div>
        <div className="w-[6em]">Total</div>
        <div className="w-[3em]">%</div>
      </section>
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
