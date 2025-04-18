// @ts-nocheck
import React, { useCallback, useEffect } from "react";
import Link from "next/link";
import usePageSpeedStore from "@/store/StorePerformance";
import getChecks from "./checks/checks";
import Spinner from "./checks/_components/Spinner";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import useOnPageSeo from "@/store/storeOnPageSeo";

export default function GeneralOverview({
  pageSpeed,
  loading,
  pageTitle,
  urlLength,
}: any) {
  const storePageSpeed = usePageSpeedStore();
  const { setChecksData } = usePageSpeedStore();
  const { seoLoading, setSeoLoading } = useOnPageSeo();
  const { setSeoUrlLength } = useOnPageSeo();

  console.log(urlLength, "URL length");

  useEffect(() => {
    if (pageTitle.length > 0) {
      setSeoUrlLength(urlLength[0]);
    }
  }, [pageTitle, urlLength]);

  const checks = getChecks();
  const passedChecks = checks.filter((check) => check.status === "Passed");
  const failedChecks = checks.filter((check) => check.status === "Failed");

  const memoizedSetChecksData = useCallback(() => {
    setChecksData(passedChecks, failedChecks);
  }, [pageSpeed]);

  useEffect(() => {
    memoizedSetChecksData();
  }, [memoizedSetChecksData]);

  const iconsGray = pageSpeed === undefined;
  const seoIconsGray = pageTitle[0] === undefined;

  useEffect(() => {
    const scoring = [
      {
        name: "global Scoring",
        passed: passedChecks.length,
        failed: failedChecks.length,
        total: passedChecks.length + failedChecks.length,
      },
    ];
    window.sessionStorage.setItem("score", JSON.stringify(scoring));
  }, [pageSpeed, checks]);

  return (
    <>
      <section className="w-full h-[calc(52vh-160px)] overflow-auto relative mt-0.5 bg-transparent">
        <div className="container mx-auto max-w-4xl h-2">
          <div className="grid h-full relative">
            {/* CHECKS THE CORE WEB VITALS */}
            <Collapsible defaultOpen className="h-fit relative z-10">
              <CollapsibleTrigger className="w-full text-left group sticky top-0 bg-white dark:bg-brand-darker z-20">
                <div className="flex items-center  text-xs cursor-pointer font-semibold dark:text-slate-400 pl-2 py-1">
                  <CollapsibleChevron />
                  <span className="ml-2">Core Web Vitals</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="relative z-0">
                {checks.slice(0, 14).map((check, index) => (
                  <div
                    key={check.id}
                    className={`flex items-center justify-between px-4 py-1.5 border-b dark:border-b-white/10 ${
                      index % 2 === 0
                        ? "bg-gray-200 dark:bg-brand-darker dark:text-white"
                        : "bg-gray-100 dark:bg-brand-darker dark:text-white"
                    }`}
                  >
                    {/* ... rest of the content ... */}
                    <div className="flex items-center w-full hover:bg-red-500">
                      {loading ? (
                        <Spinner />
                      ) : (
                        <>
                          {check.status === "Passed" ? (
                            <FaCheckCircle
                              className={`w-4 h-4 ${iconsGray ? "text-gray-400" : "text-green-500"}`}
                            />
                          ) : (
                            <XIcon
                              className={`w-5 h-5 ${iconsGray ? "text-gray-400" : "text-red-500"}`}
                            />
                          )}
                        </>
                      )}
                      <div className="flex justify-between w-full ml-2 items-center">
                        <span
                          className={`text-xs flex-1 ${iconsGray ? "text-gray-400" : ""}`}
                        >
                          {check.name}
                        </span>
                        {iconsGray ? (
                          <span className="text-black/50 dark:text-white/50">
                            n/a
                          </span>
                        ) : (
                          <span
                            className={`text-xs ${
                              check.status === "Passed"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {check.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* CHECKS THE SEO */}
            <Collapsible defaultOpen className="h-fit relative z-10">
              <CollapsibleTrigger className="w-full text-left group sticky top-0 bg-white dark:bg-brand-darker z-20">
                <div className="flex items-center  text-xs cursor-pointer font-semibold dark:text-slate-400 pl-2 py-1">
                  <CollapsibleChevron />
                  <span className="ml-2">SEO</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="relative z-0">
                {checks.slice(14, 26).map((check, index) => (
                  <div
                    key={check.id}
                    className={`flex items-center justify-between px-4 py-1.5 border-b dark:border-b-white/10 ${
                      index % 2 === 0
                        ? "bg-gray-100 dark:bg-brand-darker dark:text-white"
                        : "bg-gray-200 dark:bg-brand-darker dark:text-white"
                    }`}
                  >
                    {/* ... rest of the content ... */}
                    <div className="flex items-center w-full">
                      {seoLoading ? (
                        <Spinner />
                      ) : (
                        <>
                          {check.status === "Passed" ? (
                            <FaCheckCircle
                              className={`w-4 h-4 ${seoIconsGray ? "text-gray-400" : "text-green-500"}`}
                            />
                          ) : (
                            <XIcon
                              className={`w-5 h-5 ${seoIconsGray ? "text-gray-400" : "text-red-500"}`}
                            />
                          )}
                        </>
                      )}
                      <div className="flex justify-between w-full ml-2 items-center">
                        <span
                          className={`text-xs flex-1 ${pageTitle.length <= 0 ? "text-gray-400" : ""}`}
                        >
                          {check.name}
                        </span>
                        {!pageTitle && (
                          <span className="text-black/50 dark:text-white/50">
                            n/a
                          </span>
                        )}
                        <span
                          className={`text-xs text-gray-400 ${
                            check.status === "Passed" &&
                            pageTitle.length > 0 &&
                            "text-green-500"
                          } ${check.status === "Failed" && pageTitle.length > 0 && "text-red-500"} ${
                            pageTitle.length <= 0 && "text-gray-400"
                          }`}
                        >
                          {pageTitle.length ? check.status : "n/a"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* CHECKS THE Content */}
            <Collapsible defaultOpen className="h-fit relative z-10">
              <CollapsibleTrigger className="w-full text-left group sticky top-0 bg-white dark:bg-brand-darker z-20">
                <div className="flex items-center text-xs cursor-pointer font-semibold dark:text-slate-400 pl-2 py-1">
                  <CollapsibleChevron />
                  <span className="ml-2">Content</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="relative z-0">
                {checks.slice(26, checks.length).map((check, index) => (
                  <div
                    key={check.id}
                    className={`flex items-center justify-between px-4 py-1.5 border-b dark:border-b-white/10 ${
                      index % 2 === 0
                        ? "bg-gray-100 dark:bg-brand-darker dark:text-white"
                        : "bg-gray-200 dark:bg-brand-darker dark:text-white"
                    }`}
                  >
                    {/* ... rest of the content ... */}
                    <div className="flex items-center w-full">
                      {seoLoading ? (
                        <Spinner />
                      ) : (
                        <>
                          {check.status === "Passed" ? (
                            <FaCheckCircle
                              className={`w-4 h-4 ${seoIconsGray ? "text-gray-400" : "text-green-500"}`}
                            />
                          ) : (
                            <XIcon
                              className={`w-5 h-5 ${seoIconsGray ? "text-gray-400" : "text-red-500"}`}
                            />
                          )}
                        </>
                      )}
                      <div className="flex justify-between w-full ml-2 items-center">
                        <span
                          className={`text-xs flex-1 ${pageTitle.length <= 0 ? "text-gray-400" : ""}`}
                        >
                          {check.name}
                        </span>
                        {!pageTitle && (
                          <span className="text-black/50 dark:text-white/50">
                            n/a
                          </span>
                        )}
                        <span
                          className={`text-xs text-gray-400 ${
                            check.status === "Passed" &&
                            pageTitle.length > 0 &&
                            "text-green-500"
                          } ${check.status === "Failed" && pageTitle.length > 0 && "text-red-500"} ${
                            pageTitle.length <= 0 && "text-gray-400"
                          }`}
                        >
                          {pageTitle.length ? check.status : "n/a"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </section>
      <footer className="absolute bottom-0 z-10 w-full font-bold p-1 px-5 bg-brand-dark dark:bg-blue-950 text-white flex justify-center space-x-10">
        <div className="flex items-center">
          <FaCheckCircle className="mr-1 text-green-500" />
          <span>Passed: </span>{" "}
          <span className="font-bold ml-1">
            {iconsGray ? "-" : passedChecks.length}
          </span>
        </div>
        <div className="flex items-center">
          <span className="flex items-center">
            <FaTimesCircle className="mr-1 text-red-500" /> Failed:
          </span>{" "}
          <span className="font-bold ml-1">
            {iconsGray ? "-" : failedChecks.length}
          </span>
        </div>
      </footer>
    </>
  );
}

function CheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function CollapsibleChevron() {
  return (
    <>
      <FaChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:hidden" />
      <FaChevronUp className="w-3 h-3 transition-transform duration-200 group-data-[state=closed]:hidden" />
    </>
  );
}
