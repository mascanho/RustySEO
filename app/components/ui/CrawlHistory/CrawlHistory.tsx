import React from "react";
import PerformanceSection from "./PerformanceSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CrawlHistory = ({ dbdata }: any) => {
  return (
    <section className="w-full flex justify-end mt-10">
      <Tabs defaultValue="account" className="w-full max-w-7xl mx-auto">
        <TabsList>
          <TabsTrigger value="account">Core Vitals</TabsTrigger>
          <TabsTrigger value="password">On Page</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="mt-8">
          <PerformanceSection dbdata={dbdata} />
        </TabsContent>
        <TabsContent value="password">Change your password here.</TabsContent>
      </Tabs>
    </section>
  );
};

export default CrawlHistory;
