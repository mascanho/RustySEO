// @ts-nocheck
import React, { useCallback, useEffect } from "react";
import Link from "next/link";
import usePageSpeedStore from "@/store/StorePerformance";
import getChecks from "./checks/checks";
import Spinner from "./checks/_components/Spinner";

export default function GeneralOverview({ pageSpeed, loading }: any) {
  const storePageSpeed = usePageSpeedStore();
  const { setChecksData } = usePageSpeedStore();

  console.log(storePageSpeed);

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

  return (
    <>
      <section className="w-full h-[22.5rem] pb-12 overflow-auto relative mt-0.5">
        <div className="container mx-auto max-w-4xl h-full">
          <div className="grid h-full pb-12">
            {checks.map((check, index) => (
              <div
                key={check.id}
                className={`flex items-center justify-between px-4 py-1.5 border-b dark:border-b-white/10 ${
                  index % 2 === 0
                    ? "bg-gray-100 dark:bg-brand-darker dark:text-white"
                    : "bg-gray-200 dark:bg-brand-darker dark:text-white"
                }`}
              >
                <div className="flex items-center w-full">
                  {loading ? (
                    <Spinner />
                  ) : (
                    <>
                      {check.status === "Passed" ? (
                        <CheckIcon
                          className={`w-5 h-5 ${iconsGray ? "text-gray-400" : "text-green-500"}`}
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
                      className={`text-xs font-semibold flex-1 ${iconsGray ? "text-gray-400" : ""}`}
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
          </div>
        </div>
      </section>
      <footer className="absolute bottom-0 w-full font-bold p-1 px-4 bg-brand-bright dark:bg-brand-bright text-white flex justify-between">
        <div>
          <span>Passed:</span>{" "}
          <span className="font-bold">
            {iconsGray ? "-" : passedChecks.length}
          </span>
        </div>
        <div>
          <span>Failed:</span>{" "}
          <span className="font-bold">
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
