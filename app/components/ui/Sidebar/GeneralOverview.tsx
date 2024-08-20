import React from "react";

const checks = [
  {
    id: "1",
    name: "Meta Tags",
    status: "Passed",
  },
  {
    id: "2",
    name: "Page Speed",
    status: "Failed",
  },
  {
    id: "3",
    name: "Robots.txt",
    status: "Passed",
  },
  {
    id: "4",
    name: "Crawl History",
    status: "Passed",
  },
  {
    id: "5",
    name: "Mobile Friendliness",
    status: "Passed",
  },
  {
    id: "6",
    name: "Alt Tags for Images",
    status: "Passed",
  },
  {
    id: "7",
    name: "SSL Certificate",
    status: "Passed",
  },
  {
    id: "8",
    name: "Broken Links",
    status: "Failed",
  },
  {
    id: "9",
    name: "Structured Data",
    status: "Passed",
  },
  {
    id: "10",
    name: "Accessibility",
    status: "Passed",
  },
  {
    id: "11",
    name: "XML Sitemap",
    status: "Passed",
  },
  {
    id: "12",
    name: "Cache Control",
    status: "Passed",
  },
];

export default function GeneralOverview() {
  return (
    <section className="w-full h-[26rem] pb-1 overflow-auto">
      <div className="container ">
        <div className="mx-auto max-w-4xl">
          <div className="grid">
            {checks.map((check, index) => (
              <div
                key={check.id}
                className={`flex items-center justify-between px-4 py-1 border-b pr-5 ${
                  index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"
                }`}
              >
                <div className="flex justify-between w-full text-xs">
                  {check.status === "Passed" ? (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XIcon className="w-5 h-5 text-red-500" />
                  )}
                  <div className="flex justify-between w-full ml-2 items-center">
                    <span className="text-xs font-semibold w-full flex-1">
                      {check.name}
                    </span>
                    <span
                      className={`text-xs ${
                        check.status === "Passed"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {check.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckIcon(props) {
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

function XIcon(props) {
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
