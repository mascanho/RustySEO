import React from "react";
import { FaLongArrowAltDown } from "react-icons/fa";

const RedirectsTable = ({ pageSpeed }: { pageSpeed: any }) => {
  const redirects =
    pageSpeed?.lighthouseResult?.audits?.redirects?.details?.items || [];

  return (
    <section className="naked_table">
      <h2>Redirects</h2>
      <div className="flex flex-col pt-8 px-4">
        {redirects.length === 0 ? (
          <p className="text-center text-gray-500 pt-2">No redirects found.</p>
        ) : (
          redirects.map((item: any, index: any) => (
            <div key={item.url || index} className="flex flex-col">
              <div className="flex items-center mb-2 relative pl-10">
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full 
                    ${
                      index === redirects.length - 1
                        ? "bg-green-500"
                        : "bg-white border border-blue-500"
                    }`}
                />
                <span className="text-xl text-blue-600 px-3 py-1 bg-blue-100 rounded-full truncate max-w-full hover:text-clip hover:overflow-visible">
                  {item.url}
                </span>
              </div>
              {index < redirects.length - 1 && (
                <div className="flex items-center h-8 -ml-2 -mt-1">
                  <FaLongArrowAltDown className="w-8 h-8 text-gray-400" />
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
