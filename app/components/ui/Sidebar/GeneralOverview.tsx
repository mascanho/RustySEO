// @ts-nocheck
import React, { useCallback, useEffect } from "react";
import Link from "next/link";
import usePageSpeedStore from "@/store/StorePerformance";
import getChecks from "./checks/checks";
import Spinner from "./checks/_components/Spinner";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shadcn/ui";
import useOnPageSeo from "@/store/storeOnPageSeo";

export default function GeneralOverview({
  pageSpeed,
  loading,
  pageTitle,
}: any) {
  const storePageSpeed = usePageSpeedStore();
  const { setChecksData } = usePageSpeedStore();
  const { seoLoading, setSeoLoading } = useOnPageSeo();

  // console.log("SEO is: :", seoLoading);

  // Get All the data from the stores (PageSpeed Performance & SEO)
  const checks = getChecks();

  // filter the ones that Passed
  const passedChecks = checks.filter((check) => check.status === "Passed");

  // Filter the ones that Failed
  const failedChecks = checks.filter((check) => check.status === "Failed");

  const memoizedSetChecksData = useCallback(() => {
    setChecksData(passedChecks, failedChecks);
  }, [pageSpeed]);

  useEffect(() => {
    memoizedSetChecksData();
  }, [memoizedSetChecksData]);

  const iconsGray = pageSpeed === undefined;
  const seoIconsGray = pageTitle[0] === undefined;

  // set the results into the session storage
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
      <section className="w-full h-[23.5rem]  overflow-auto relative mt-0.5 bg-transparent">
        <div className="container mx-auto max-w-4xl h-fit">
          <div className="grid h-full ">
            {/* CHECKS THE CORE WEB VITALS */}
            <details open className="h-fit">
              <summary className="text-xs cursor-pointer bg-gray-100 dark:bg-brand-darker font-semibold dark:text-slate-400 pl-2 py-1">
                Core Web Vitals
              </summary>
              {checks.slice(0, 14).map((check, index) => (
                <div
                  key={check.id}
                  className={`flex items-center justify-between px-4 py-1.5 border-b dark:border-b-white/10 ${
                    index % 2 === 0
                      ? "bg-gray-200 dark:bg-brand-darker dark:text-white"
                      : "bg-gray-100 dark:bg-brand-darker dark:text-white"
                  }`}
                >
                  <div className="flex items-center w-full">
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
                        className={`text-xs  flex-1 ${iconsGray ? "text-gray-400" : ""}`}
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
            </details>

            {/* CHECKS THE SEO */}
            <details className="flex items-center h-full" open>
              <summary className="flex items-center pl-2 py-1 bg-gray-200 dark:text-slate-400 font-semibold dark:bg-brand-darker cursor-pointer">
                SEO
              </summary>
              {checks.slice(14, 25).map((check, index) => (
                <div
                  key={check.id}
                  className={`flex items-center justify-between px-4 py-1.5 border-b dark:border-b-white/10 ${
                    index % 2 === 0
                      ? "bg-gray-100 dark:bg-brand-darker dark:text-white"
                      : "bg-gray-200 dark:bg-brand-darker dark:text-white"
                  }`}
                >
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
                        className={`text-xs  flex-1 ${pageTitle.length <= 0 ? "text-gray-400" : ""}`}
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
                        } ${check.status === "Failed" && pageTitle.length > 0 && "text-red-500"} ${pageTitle.length <= 0 && "text-gray-400"}text-gray-400`}
                      >
                        {pageTitle.length ? check.status : "n/a"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </details>

            {/* CHECKS THE Content */}
            <details className="flex items-center h-full" open>
              <summary className="flex items-center pl-2 py-1 bg-gray-100 dark:text-slate-400 font-semibold dark:bg-brand-darker cursor-pointer">
                Content
              </summary>
              {checks.slice(25, checks.length).map((check, index) => (
                <div
                  key={check.id}
                  className={`flex items-center justify-between px-4 py-1.5 border-b dark:border-b-white/10 ${
                    index % 2 === 0
                      ? "bg-gray-200 dark:bg-brand-darker dark:text-white"
                      : "bg-gray-100 dark:bg-brand-darker dark:text-white"
                  }`}
                >
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
                        className={`text-xs  flex-1 ${pageTitle.length <= 0 ? "text-gray-400" : ""}`}
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
                        } ${check.status === "Failed" && pageTitle.length > 0 && "text-red-500"} ${pageTitle.length <= 0 && "text-gray-400"}text-gray-400`}
                      >
                        {pageTitle.length ? check.status : "n/a"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </details>
          </div>
        </div>
      </section>
      <footer className="absolute bottom-0 w-full font-bold p-1 px-5 bg-brand-dark dark:bg-blue-950 text-white flex justify-center space-x-10">
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
