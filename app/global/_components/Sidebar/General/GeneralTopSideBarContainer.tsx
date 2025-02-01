import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";
import Summary from "./DropDowns/Summary";
import PageTitles from "./DropDowns/PageTitles";
import Images from "./DropDowns/Images";
import Javascript from "./DropDowns/Javascript";
import Schema from "./DropDowns/Schema";
import Css from "./DropDowns/Css";
import Iframes from "./DropDowns/Iframes";
import StatusCodes from "./DropDowns/StatusCodes";
import MetaDescriptions from "./DropDowns/MetaDescriptions";
import H1 from "./DropDowns/H1";

const GeneralTopSideBarContainer = () => {
  const domainCrawlData = useGlobalCrawlStore();

  return (
    <div className="text-xs w-full space-y-1 h-[27rem] overflow-y-scroll overflow-x-hidden relative">
      <section className="w-full flex justify-end bg-gradient-to-r from-gray-100 to-white font-bold sticky top-0 py-0.5 dark:bg-gradient-to-r dark:from-gray-900 dark:to-white shadow">
        <div className="w-full"></div>
        <div className="w-[7em]">Total</div>
        <div className="w-[3.5em]">%</div>
      </section>
      <div className="overflow-hidden">
        <Summary />
        <PageTitles />
        <MetaDescriptions />
        <H1 />
        <Images />
        <Css />
        <Iframes />
        <Javascript />
        <Schema />
        <StatusCodes />
      </div>
    </div>
  );
};

export default GeneralTopSideBarContainer;
