import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useEffect } from "react";
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
import H2 from "./DropDowns/H2";

const GeneralTopSideBarContainer = () => {
  return (
    <div className="text-xs w-full space-y-1 min-h-[23rem] h-[calc(100vh-39rem)] overflow-y-auto overflow-x-hidden relative">
      <section className="w-full flex justify-end  bg-gradient-to-r from-gray-100 to-white font-bold sticky top-0 py-0.5 dark:bg-gradient-to-l dark:from-brand-darker dark:to-blue-950/50 shadow dark:text-blue-600">
        <div className="w-full"></div>
        <div className="w-[7em]">Total</div>
        <div className="w-[3.5em]">%</div>
      </section>
      <div className="overflow-hidden">
        <Summary />
        <PageTitles />
        <MetaDescriptions />
        <H1 />
        <H2 />
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
