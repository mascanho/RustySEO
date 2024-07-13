import React from "react";
import { FaLongArrowAltDown } from "react-icons/fa";

const RedirectsTable = ({ pageSpeed }: { pageSpeed: any[] }) => {
  const redirects =
    pageSpeed?.lighthouseResult?.audits?.redirects?.details?.items || [];

  return (
    <section
      className={`flex-wrap w-full h-[29rem] space-y-2 p-2 rounded-md relative bg-white shadow`}
    >
      <div className="w-full bg-apple-spaceGray left-0 top-0 rounded-t-md h-7 absolute flex items-center justify-center">
        <h2 className="bg-apple-spaceGray font-semibold text-white relative rounded-t-md w-full text-center pt-1">
          Redirects
        </h2>
      </div>
      <div className="flex flex-col pt-8 px-4">
        {redirects.length === 0 ? (
          <p className="text-center text-gray-500 pt-2">No redirects found.</p>
        ) : (
          redirects.map((item, index) => (
            <div key={item.url || index} className="flex flex-col">
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
