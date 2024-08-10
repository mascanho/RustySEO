"use client";
import React, { useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { FiClipboard } from "react-icons/fi";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/tauri";
import PerformanceImprovements from "./PerformanceImprovements";

const SEOImprovements = ({
  pageTitle,
  pageDescription,
  pageSpeed,
}: {
  pageDescription: string[];
  pageTitle: string[];
  pageSpeed: any;
}) => {
  const [aiPageTitle, setAiPageTitle] = React.useState<string>("");
  const [aiPageDescription, setAiPageDescription] = React.useState<string>("");
  useEffect(() => {
    invoke("generated_page_title", { query: pageTitle[0] }).then(
      (result: any) => {
        console.log(result);
        setAiPageTitle(result);
      },
    );

    invoke("generated_page_description", { query: pageDescription[0] }).then(
      (result: any) => {
        console.log(result);
        setAiPageDescription(result);
      },
    );
  }, [pageTitle, pageDescription]);

  // Helpers
  const description = pageDescription && pageDescription[0];

  const improvements = [
    {
      id: 1,
      title: "Title Tag Optimization",
      failsAdvise:
        "Your page title should have between 10 and 60 characters. Your title length is: ",
      passAdvice: "Title tag is unique and includes primary keywords.",
      improved: pageTitle && pageTitle[0]?.length < 60 ? true : false,
      aiImprovement: aiPageTitle,
      length: pageTitle && pageTitle[0]?.length,
    },
    {
      id: 2,
      title: "Page Description Optimization",
      failsAdvise:
        "Page descriptions are important to improve CTR. Your page title should have between 10 and 160 characters. Your page description length is: ",
      passAdvice: "Title tag is unique and includes primary keywords.",
      improved: description?.length < 160 ? true : false,
      aiImprovement: aiPageDescription,
      length: description?.length,
    },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  };

  console.log(pageTitle, " pageTitle");

  if (!pageSpeed) {
    return (
      <section className="h-[calc(100vh-13rem)] flex items-center justify-center">
        <img className="dark:hidden" src="/loader.gif" alt="Loading..." />
        <div className="loader hidden dark:flex"></div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto">
      <Tabs defaultValue="performance" className="w-full">
        <TabsList>
          <TabsTrigger value="performance">Technical</TabsTrigger>
          <TabsTrigger value="seo">On-Page</TabsTrigger>
        </TabsList>
        <TabsContent value="performance" className="w-full">
          <PerformanceImprovements pageSpeed={pageSpeed} />
        </TabsContent>
        <TabsContent value="seo">
          <div className="bg-gray-300 dark:bg-brand-darker p-6 rounded-lg shadow max-w-7xl mx-auto mt-10">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
              SEO Improvements
            </h2>
            <div className="space-y-4">
              {improvements.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border ${item.improved ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {item.improved ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaExclamationCircle className="text-red-500" />
                    )}
                    <h3
                      className={`text-lg font-semibold ${item.improved ? "text-green-800" : "text-red-800"}`}
                    >
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-gray-700">
                    {item.improved
                      ? item.passAdvice
                      : item.failsAdvise + item.length}
                  </p>
                  <section>
                    {!item.improved && (
                      <Collapsible>
                        <CollapsibleTrigger className="text-xs underline">
                          View suggestion
                        </CollapsibleTrigger>
                        <CollapsibleContent className="bg-gray-200 rounded-md p-1 mt-1 relative min-h-2 h-8">
                          <FiClipboard
                            onClick={() => handleCopy(item.aiImprovement)}
                            className="absolute active:bg-gray-300 active:scale-95 top-2 cursor-pointer right-1 text-gray-800"
                          />
                          {item.aiImprovement}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </section>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default SEOImprovements;
