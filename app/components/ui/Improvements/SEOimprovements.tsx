// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
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
import useOnPageSeo from "@/store/storeOnPageSeo";

const SEOImprovements = ({
  pageTitle,
  pageDescription,
  pageSpeed,
  canonical,
  hreflangs,
  opengraph,
  pageSchema,
  favicon: faviconUrl,
  charset,
  indexation,
  images,
  linkStatusCodes,
}: {
  pageTitle: string[];
  pageDescription: string[];
  pageSpeed: any;
  canonical: string[];
  hreflangs: string[];
  opengraph: any;
  pageSchema: any;
  favicon: string[];
  charset: string;
  indexation: any;
  images: any;
  linkStatusCodes: any;
  seoalttags: any;
}) => {
  const [aiPageTitle, setAiPageTitle] = useState<string>("");
  const [aiPageDescription, setAiPageDescription] = useState<string>("");

  const {
    favicon,
    setFavicon,
    setPagetitle,
    setDescription,
    setCanonical,
    setHreflangs,
    setOpengraph,
    setSchema,
    setCharset,
    setSeoIndexability,
    setAltTags,
    setSeoStatusCodes,
  } = useOnPageSeo((state) => ({
    favicon: state.favicon,
    seopagetitle: state.seopagetitle,
    seodescription: state.seodescription,
    setFavicon: state.setFavicon,
    setPagetitle: state.setPagetitle,
    setDescription: state.setDescription,
    setCanonical: state.setCanonical,
    setHreflangs: state.setHreflangs,
    setOpengraph: state.setOpengraph,
    setSchema: state.setSchema,
    setCharset: state.setSeoCharset,
    setSeoIndexability: state.setSeoIndexability,
    setAltTags: state.setAltTags,
    setSeoStatusCodes: state.setSeoStatusCodes,
  }));

  // Update the store
  const updateSeoInfo = () => {
    setFavicon(faviconUrl);
    setPagetitle(pageTitle[0] || "");
    setDescription(pageDescription[0] || "");
    setCanonical(canonical[0] || "");
    setHreflangs(hreflangs);
    setOpengraph(opengraph);
    setSchema(pageSchema);
    setCharset(charset);
    setSeoIndexability(indexation);
    setAltTags(images);
  };

  useEffect(() => {
    updateSeoInfo();
  }, [
    faviconUrl,
    pageTitle,
    pageDescription,
    canonical,
    hreflangs,
    opengraph,
    pageSchema,
    charset,
    indexation,
    images,
    linkStatusCodes,
  ]);

  const seoAltTags = useOnPageSeo((state) => state.seoalttags);
  // @ts-ignore
  const imagesWithoutAltTags = seoAltTags?.filter((image) => !image.alt_text);
  const seoStatusCodes = useOnPageSeo((state) => state.seostatusCodes);
  const seoOpenGraph = useOnPageSeo((state) => state.seoOpenGraph);

  useEffect(() => {
    if (pageTitle[0]) {
      invoke("generated_page_title", { query: pageTitle[0] }).then(
        (result: any) => {
          setAiPageTitle(result);
        },
      );
    }
  }, [pageTitle]);

  useEffect(() => {
    if (pageDescription[0]) {
      invoke("generated_page_description", { query: pageDescription[0] }).then(
        (result: any) => {
          setAiPageDescription(result);
        },
      );
    }
  }, [pageDescription]);

  const description = pageDescription && pageDescription[0];

  const improvements = [
    {
      id: 99,
      title: "Favicon",
      failsAdvise:
        "Favicons help increase your brand awareness and conversions.",
      passAdvice: "Favicon was found for this page.",
      improved: faviconUrl && faviconUrl.length > 0,
      aiImprovement:
        "In the head of the page, add a favicon tag with the URL of your favicon. It to make your website and brand standout on the SERP",
      length: pageTitle[0]?.length,
    },
    {
      id: 1,
      title: "Title Tag Optimization",
      failsAdvise:
        "Your page title should have between 10 and 60 characters. Your title length is: ",
      passAdvice: "Title tag is unique and includes primary keywords.",
      improved: pageTitle[0]?.length <= 60,
      aiImprovement:
        aiPageTitle ||
        "Improve your title tag with a title between 30 and 60 characters",
      length: pageTitle[0]?.length,
    },
    {
      id: 2,
      title: "Page Description Optimization",
      failsAdvise:
        "Page descriptions are important to improve CTR. Your page description should have between 10 and 160 characters. Your page description length is: ",
      passAdvice: "Page description is unique and includes primary keywords.",
      improved: description?.length < 160,
      aiImprovement:
        aiPageDescription ||
        "Add a page description to your page with a description between 10 and 160 characters, this helps with conversions rates and SEO",
      length: description?.length,
    },
    {
      id: 3,
      title: "Canonical Optimization",
      failsAdvise:
        "Canonicals are important to help distinguish between similar content/pages on your website.",
      passAdvice:
        'This page has a canonical tag. This tag is used to tell search engines which version of a webpage is the "preferred" or "canonical" version when there are multiple pages with similar or identical content.',
      improved: canonical[0] !== "No canonical URL found",
      aiImprovement:
        'Canonical tags are often needed in websites, particularly for SEO (Search Engine Optimization) purposes. A canonical tag (<link rel="canonical" href="URL">) is used to tell search engines which version of a webpage is the "preferred" or "canonical" version when there are multiple pages with similar or identical content.',
      length: description?.length,
    },
    {
      id: 4,
      title: "Hreflangs",
      failsAdvise:
        "Hreflangs help search engines to better find your content if you have multiple languages on your website.",
      passAdvice:
        "This page has hreflangs, which are used to differentiate different languages on a website.",
      // @ts-ignore
      improved: hreflangs[0]?.lang !== "No hreflangs found",
      aiImprovement:
        "Check if your hreflangs are well configured if you have multiple languages on your website.",
      length: description?.length,
    },
    {
      id: 5,
      title: "Opengraph",
      failsAdvise:
        "Opengraph tags have not been found on this page. These tags allow social media platforms to better render images from your webpage.",
      passAdvice: "This page contains Opengraph tags.",
      improved: opengraph?.image ? true : false,
      aiImprovement:
        "Verify if your OpenGraph tags are well configured and contain the necessary information to render the image and the data.",
      length: description?.length,
    },
    {
      id: 6,
      title: "Structured Data - Schema",
      failsAdvise:
        "No structured data has been found on this page. Structured Data helps search engines to better understand your page's content.",
      passAdvice: "This page contains structured data (Schema).",
      improved: pageSchema?.length > 0,
      aiImprovement:
        "Verify if your Schema is well configured and contains the necessary information to improve search engine understanding.",
      length: description?.length,
    },
    {
      id: 7,
      title: "Page Charset",
      failsAdvise:
        "No charset has been found on this page. Charset helps ensure that text is properly displayed.",
      passAdvice: "Charset found on this page.",
      improved: charset?.length > 0,
      aiImprovement:
        "Check if your charset tags are defined in the head of your website code.",
      length: description?.length,
    },
    {
      id: 8,
      title: "Indexability",
      failsAdvise:
        "This page is not indexable, meaning search engines will not list your page on the SERPs.",
      passAdvice: "This page is indexable.",
      improved: indexation && indexation[0] === "Indexable",
      aiImprovement:
        "Check if your page is properly configured to be indexed by search engines.",
      length: description?.length,
    },
    {
      id: 10,
      title: "404 Links",
      failsAdvise:
        "Some pages on your site are returning non-200 status codes. This may affect crawling and indexing.",
      passAdvice: "All checked pages are returning 200 OK status codes.",
      improved:
        seoStatusCodes &&
        Object.values(seoStatusCodes).every((code) => code === 200),
      aiImprovement:
        "Review and fix any pages returning non-200 status codes to ensure proper crawling and indexing.",
      length: Object.keys(seoStatusCodes || {}).length,
    },
    {
      id: 9,
      title: "Images Alt Text",
      failsAdvise:
        "Make sure your images have alt text to improve accessibility and search engine rankings.",
      passAdvice: "Your images have alt text!",
      // @ts-ignore
      improved: imagesWithoutAltTags?.length <= 0 ? true : false,
      aiImprovement:
        "Add alt text to your images to make them more accessible and help with SEO.",
      length: description?.length,
    },
    {
      id: 11,
      title: "Opengraph",
      failsAdvise:
        "No OpenGraph tags where found in the page. These tags allow social media platforms to better render images from your webpage.",
      passAdvice: "This page contains OpenGraph tags.",
      // @ts-ignore
      improved: seoOpenGraph?.image ? true : false,
      aiImprovement:
        "Add alt text to your images to make them more accessible and help with SEO.",
      length: description?.length,
    },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  };

  if (!pageSpeed) {
    return (
      <section className="h-[calc(100vh-13rem)] flex flex-col space-y-2 items-center justify-center">
        <img src="loadingDog.png" alt="dog" />
        <span className="block text-brand-dark/40 dark:text-white/20">
          No page crawled
        </span>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto text-xs">
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="text-xs">
          <TabsTrigger value="performance" className="text-xs">
            Technical
          </TabsTrigger>
          <TabsTrigger className="text-xs" value="seo">
            On-Page
          </TabsTrigger>
        </TabsList>
        <TabsContent value="performance" className="w-full">
          <PerformanceImprovements pageSpeed={pageSpeed} />
        </TabsContent>
        <TabsContent value="seo">
          <div className="bg-gray-300 dark:bg-brand-darker pr-2 pl-6 pt-6 pb-6 rounded-lg shadow max-w-7xl mx-auto mt-10">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
              SEO Improvements
            </h2>
            <div className="space-y-3 overflow-auto custom-scrollbar max-h-[40rem] py-2 pr-3 bg-transparent rounded-md dark:bg-brand-darker rounded-lg">
              {improvements.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 px-4 rounded-lg border ${item.improved ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}
                >
                  <div id="og" className="flex items-center space-x-2 mb-1">
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
                    {item.improved ? item.passAdvice : item.failsAdvise}
                  </p>
                  {!item.improved && (
                    <Collapsible>
                      <CollapsibleTrigger className="text-xs underline -mt-2">
                        View suggestion
                      </CollapsibleTrigger>
                      <CollapsibleContent className="bg-gray-200 rounded-md p-0.5 mt-1 relative min-h-2 h-8">
                        <FiClipboard
                          onClick={() => handleCopy(item.aiImprovement || "")}
                          className={`absolute active:bg-gray-300 active:scale-95 top-2 cursor-pointer ${item.id > 2 ? "hidden" : ""} right-1 text-gray-800`}
                        />
                        {item.aiImprovement}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
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
