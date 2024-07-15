import React from "react";

const HeadingsTable = ({ headings }: { headings: string[] }) => {
  return (
    <div
      className={`flex flex-col h-[32rem] ${headings.length === 0 ? "bg-white/40" : "bg-white"} shadow rounded-md overflow-hidden`}
    >
      <h2 className="bg-apple-spaceGray font-semibold text-white rounded-t-md w-full pt-1 text-center">
        Headings
      </h2>
      <section className="flex flex-col flex-grow">
        <div className="flex-grow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-200 text-center">
              <tr>
                <th className="text-xs w-1/5 border-r align-middle">
                  Heading Type
                </th>
                <th className="text-xs px-2 py-1 w-2/3 align-middle">
                  Heading Text
                </th>
              </tr>
            </thead>
          </table>
          <div className="overflow-auto h-full">
            <table className="w-full">
              <tbody>
                {headings.map((link, index) => {
                  const [headingType, headingText] = link.split(": ", 2);
                  return (
                    <tr key={index} className="align-middle">
                      <td className="crawl-item border-r font-semibold text-apple-blue border-b w-1/5 text-center h-full">
                        {headingType}
                      </td>
                      <td className="h-full w-full border-b crawl-item pl-3">
                        {headingText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <footer
          className={`${headings.length === 0 ? "bg-white/40" : "bg-white"} border-t py-2 text-xs flex justify-center items-center`}
        >
          <span>Headings Found: </span>
          <span className="text-apple-blue ml-1">{headings.length}</span>
        </footer>
      </section>
    </div>
  );
};

export default HeadingsTable;
