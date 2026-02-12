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
import CustomSearch from "./DropDowns/CustomSearch";
import Security from "./DropDowns/Security";
import URLinfo from "./DropDowns/URLinfo";
import Content from "./DropDowns/Content";
import Canonicals from "./DropDowns/Canonicals";
import WordCount from "./DropDowns/WordCount";
import Language from "./DropDowns/Language";
import Mobile from "./DropDowns/Mobile";
import Redirects from "./DropDowns/Redirects";
import OpenGraph from "./DropDowns/OpenGraph";
import Cookies from "./DropDowns/Cookies";
import Indexing from "./DropDowns/Indexing";
import Performance from "./DropDowns/Performance";
import ResponseTime from "./DropDowns/ResponseTime";
import CrawlDepth from "./DropDowns/CrawlDepth";

const GeneralTopSideBarContainer = () => {
  return (
    <div className="text-xs w-full space-y-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col">
      <section className="w-full flex justify-end bg-gradient-to-r from-gray-100 to-white font-bold sticky top-0 py-0.5 dark:bg-gradient-to-l dark:from-brand-darker dark:to-blue-950/50 shadow dark:text-blue-600 flex-none z-10">
        <div className="w-full"></div>
        <div className="w-[7em]">Total</div>
        <div className="w-[3.5em]">%</div>
      </section>
      <div className="overflow-y-auto overflow-x-hidden not-selectable flex-1">
        <Summary />
        <CrawlDepth />
        {/* TODO: Needs to be finished */}
        {/* <Content /> */}
        <PageTitles />
        <MetaDescriptions />
        <H1 />
        <H2 />
        <WordCount />
        <Images />
        <Css />
        {/* <Iframes /> */}
        <Javascript />
        <Schema />
        <Indexing />
        <Canonicals />
        <OpenGraph />
        <Cookies />
        <Language />
        <Mobile />
        <Security />
        <Performance />
        <ResponseTime />
        <URLinfo />
        <StatusCodes />
        <Redirects />
        <CustomSearch />
      </div>
    </div>
  );
};

export default GeneralTopSideBarContainer;
