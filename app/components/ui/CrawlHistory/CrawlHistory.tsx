import React from "react";
import PerformanceSection from "./PerformanceSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOtableSection from "./SEOtableSection";

const CrawlHistory = ({ dbdata, loading, crawl }: any) => {
  return (
    <section className="w-full flex justify-end mt-1">
      <Tabs defaultValue="account" className="w-full max-w-7xl mx-auto">
        <TabsList className="text-xs">
          <TabsTrigger className="text-xs" value="account">
            Technical
          </TabsTrigger>
          <TabsTrigger className="text-xs" value="password">
            On-Page
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="mt-2">
          <PerformanceSection dbdata={dbdata} crawl={crawl} />
        </TabsContent>
        <TabsContent value="password" className="mt-2">
          <SEOtableSection dbdata={dbdata} />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default CrawlHistory;
