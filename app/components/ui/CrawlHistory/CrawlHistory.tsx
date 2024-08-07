import React from "react";
import PerformanceSection from "./PerformanceSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOtableSection from "./SEOtableSection";

const CrawlHistory = ({ dbdata, loading }: any) => {
  return (
    <section className="w-full flex justify-end mt-2">
      <Tabs defaultValue="account" className="w-full max-w-7xl mx-auto">
        <TabsList>
          <TabsTrigger value="account">Core Vitals</TabsTrigger>
          <TabsTrigger value="password">On Page</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="mt-8">
          <PerformanceSection dbdata={dbdata} />
        </TabsContent>
        <TabsContent value="password" className="mt-8">
          <SEOtableSection dbdata={dbdata} />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default CrawlHistory;
