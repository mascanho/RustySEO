// @ts-nocheck
import React, { useState } from "react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OpenGraphPreviewProps {
  height: number;
}

const OpenGraphPreview: React.FC<OpenGraphPreviewProps> = ({ height }) => {
  const { selectedTableURL } = useGlobalCrawlStore();
  const [activeTab, setActiveTab] = useState("facebook");

  if (!selectedTableURL?.[0]) {
    return (
      <div className="text-base text-black/50 dark:text-white/50 flex justify-center items-center m-auto w-full h-full">
        <span className="text-xs">
          Select a URL from the HTML table to view OpenGraph preview
        </span>
      </div>
    );
  }

  const ogData = selectedTableURL[0]?.opengraph || {};
  const url = selectedTableURL[0]?.url || "";

  // Extract OpenGraph data with fallbacks
  const ogTitle =
    ogData["og:title"] || selectedTableURL[0]?.title?.[0]?.title || "No title";
  const ogDescription =
    ogData["og:description"] ||
    selectedTableURL[0]?.description ||
    "No description available";
  const ogImage = ogData["og:image"] || "";
  const ogUrl = ogData["og:url"] || url;
  const ogSiteName = ogData["og:site_name"] || new URL(url).hostname;
  const ogType = ogData["og:type"] || "website";

  // Twitter card data
  const twitterCard = ogData["twitter:card"] || "summary_large_image";
  const twitterTitle = ogData["twitter:title"] || ogTitle;
  const twitterDescription = ogData["twitter:description"] || ogDescription;
  const twitterImage = ogData["twitter:image"] || ogImage;

  return (
    <div className="h-full w-full flex bg-gray-50 dark:bg-brand-darker overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-full w-full flex overflow-hidden"
      >
        {/* Vertical Tabs List */}
        <TabsList className="flex flex-col h-full w-40 shrink-0 justify-start items-stretch bg-white dark:bg-brand-dark border-r dark:border-gray-700 rounded-none p-2 space-y-1">
          <TabsTrigger
            value="facebook"
            className="justify-start px-3 py-2 data-[state=active]:bg-brand-bright data-[state=active]:text-white"
          >
            Facebook
          </TabsTrigger>
          <TabsTrigger
            value="twitter"
            className="justify-start px-3 py-2 data-[state=active]:bg-brand-bright data-[state=active]:text-white"
          >
            Twitter
          </TabsTrigger>
          <TabsTrigger
            value="linkedin"
            className="justify-start px-3 py-2 data-[state=active]:bg-brand-bright data-[state=active]:text-white"
          >
            LinkedIn
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="justify-start px-3 py-2 data-[state=active]:bg-brand-bright data-[state=active]:text-white"
          >
            Raw Data
          </TabsTrigger>
        </TabsList>

        {/* Content Area - Fixed positioning to prevent shifting */}
        <div className="flex-1 relative overflow-hidden">
          {/* Facebook Preview */}
          <TabsContent
            value="facebook"
            className="absolute inset-0 m-0 flex items-center justify-center p-6"
          >
            <div className="w-full max-w-2xl h-full flex flex-col justify-center">
              {/* <h2 className="text-lg font-semibold mb-4 dark:text-white shrink-0">Facebook / OpenGraph Preview</h2> */}
              <div
                className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                style={{ maxHeight: "calc(100% - 3rem)" }}
              >
                {ogImage && (
                  <div
                    className="w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden flex items-center justify-center shrink-0"
                    style={{ maxHeight: "70%" }}
                  >
                    <img
                      src={ogImage}
                      alt={ogTitle}
                      className="w-full h-auto max-h-full object-contain"
                      style={{ maxHeight: "400px" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement.innerHTML =
                          '<div class="flex items-center justify-center h-32 text-gray-400 dark:text-gray-600 text-sm">Image not available</div>';
                      }}
                    />
                  </div>
                )}
                <div className="p-3 bg-gray-50 dark:bg-brand-dark/50 border-t border-gray-200 dark:border-gray-700 shrink-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1 truncate">
                    {ogSiteName}
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {ogTitle}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {ogDescription}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Twitter Preview */}
          <TabsContent
            value="twitter"
            className="absolute inset-0 m-0 flex items-center justify-center p-6"
          >
            <div className="w-full max-w-2xl h-full flex flex-col justify-center">
              {/* <h2 className="text-lg font-semibold mb-4 dark:text-white shrink-0"> */}
              {/*   Twitter Card Preview */}
              {/* </h2> */}
              <div
                className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                style={{ maxHeight: "calc(100% - 3rem)" }}
              >
                {twitterImage && (
                  <div
                    className="w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden flex items-center justify-center shrink-0"
                    style={{ maxHeight: "70%" }}
                  >
                    <img
                      src={twitterImage}
                      alt={twitterTitle}
                      className="w-full h-auto max-h-full object-contain"
                      style={{ maxHeight: "400px" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement.innerHTML =
                          '<div class="flex items-center justify-center h-32 text-gray-400 dark:text-gray-600 text-sm">Image not available</div>';
                      }}
                    />
                  </div>
                )}
                <div className="p-3 shrink-0">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">
                    {new URL(ogUrl).hostname}
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {twitterTitle}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {twitterDescription}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* LinkedIn Preview */}
          <TabsContent
            value="linkedin"
            className="absolute inset-0 m-0 flex items-center justify-center p-6"
          >
            <div className="w-full max-w-2xl h-full flex flex-col justify-center">
              {/* <h2 className="text-lg font-semibold mb-4 dark:text-white shrink-0"> */}
              {/*   LinkedIn Preview */}
              {/* </h2> */}
              <div
                className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                style={{ maxHeight: "calc(100% - 3rem)" }}
              >
                {ogImage && (
                  <div
                    className="w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden flex items-center justify-center shrink-0"
                    style={{ maxHeight: "70%" }}
                  >
                    <img
                      src={ogImage}
                      alt={ogTitle}
                      className="w-full h-auto max-h-full object-contain"
                      style={{ maxHeight: "400px" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement.innerHTML =
                          '<div class="flex items-center justify-center h-32 text-gray-400 dark:text-gray-600 text-sm">Image not available</div>';
                      }}
                    />
                  </div>
                )}
                <div className="p-3 bg-white dark:bg-brand-dark shrink-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {ogTitle}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {new URL(ogUrl).hostname}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Raw Data - Full width layout */}
          <TabsContent
            value="data"
            className="absolute inset-0 m-0 overflow-auto p-6"
          >
            <div className="w-full h-full">
              {/* <h2 className="text-lg font-semibold mb-4 dark:text-white"> */}
              {/*   OpenGraph Data */}
              {/* </h2> */}
              <div className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                {Object.keys(ogData).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(ogData).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row text-xs"
                      >
                        <span className="font-mono font-semibold text-brand-bright min-w-[200px]">
                          {key}:
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 break-all">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No OpenGraph data found for this URL
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default OpenGraphPreview;
