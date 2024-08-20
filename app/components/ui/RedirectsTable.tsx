import React from "react";
import { FaLongArrowAltDown } from "react-icons/fa";

const RedirectsTable = ({ pageSpeed }: { pageSpeed: any }) => {
  const redirects =
    pageSpeed?.lighthouseResult?.audits?.redirects?.details?.items || [];

  if (!redirects) {
    <div className="h-[20rem] flex items-center ">
      <span className="text-black/50 darK:text-white/50 m-auto text-center translate-y-1/2 h-full">
        No page crawled
      </span>
    </div>;
  }

  return (
    <section className="h-full border-0">
      <div className="flex flex-col pt-2 px-4">
        {redirects.length === 0 ? (
          <div className="h-[20rem] flex items-center overflow-hidden ">
            <span className="text-black/50 darK:text-white/50 m-auto text-center translate-y-1/2 h-full">
              No Redirects Found
            </span>
          </div>
        ) : (
          redirects.map((item: any, index: any) => (
            <div key={item.url || index} className="flex flex-col text-xs">
              <div className="flex items-center mb-2 relative pl-4">
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full 
                    ${
                      index === redirects.length - 1
                        ? "bg-green-500"
                        : "bg-white border border-blue-500"
                    }`}
                />
                <span className="text-xs text-blue-600 px-2 py-1 bg-blue-100 rounded-full truncate max-w-full hover:text-clip hover:overflow-visible">
                  {item.url}
                </span>
              </div>
              {index < redirects.length - 1 && (
                <div className="flex items-center h-6 -ml-1 -mt-1">
                  <FaLongArrowAltDown className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default RedirectsTable;
