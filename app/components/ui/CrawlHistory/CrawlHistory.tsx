import React from "react";
import PerformanceSection from "./PerformanceSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOtableSection from "./SEOtableSection";

const CrawlHistory = ({ dbdata, loading, crawl }: any) => {
  return (
    <section className="w-full flex justify-end -mt-1  dark:bg-transparent pt-2 left-0 right-0 absolute  px-2 h-[100%] overflow-hidden">
      <Tabs defaultValue="account" className="w-full max-w-8xl mx-auto z-10">
        <TabsList className="text-xs z-10 ">
          <TabsTrigger className=" z-10" value="account">
            Technical
          </TabsTrigger>
          <TabsTrigger className=" z-10" value="password">
            On-Page
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="-mt-1">
          {/* @ts-ignore */}
          <PerformanceSection dbdata={dbdata} crawl={crawl} />
        </TabsContent>
        <TabsContent value="password" className="-mt-1 z-10">
          <SEOtableSection dbdata={dbdata} crawl={crawl} />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default CrawlHistory;
