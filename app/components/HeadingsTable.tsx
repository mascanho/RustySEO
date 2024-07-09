import React from "react";

const HeadingsTable = ({ headings }: { headings: string[] }) => {
  return (
    <div
      className={`flex flex-col h-[32rem] ${headings.length === 0 ? "bg-white/40" : "bg-white"} shadow rounded-md overflow-hidden`}
    >
      <h2 className="bg-apple-spaceGray font-semibold text-white p-1 px-2 rounded-t-md w-full pb-2 text-center">
        Headings
      </h2>
      <section className="flex flex-col flex-grow overflow-hidden">
        <div className="overflow-auto flex-grow">
          <table className="crawl-item w-full">
            <thead>
              <tr>
                <th className="text-xs w-1/5 border-r align-middle">
                  Heading Type
                </th>
                <th className="text-xs px-2 py-1 w-2/3 align-middle">
                  Heading Text
                </th>
              </tr>
            </thead>
            <tbody>
              {headings.map((link, index) => {
                const [headingType, headingText] = link.split(": ", 2);
                return (
                  <tr key={index} className="align-middle">
                    <td className="crawl-item border-r font-semibold text-apple-blue border-b w-1/5 text-center h-full">
                      {headingType}{" "}
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
        <footer
          className={`${headings.length === 0 ? "bg-white/40" : "bg-white"} border-t py-2 text-sm flex justify-center items-center`}
        >
          <span>Headings Found: </span>{" "}
          <span className="text-apple-blue">{headings.length}</span>
        </footer>
      </section>
    </div>
  );
};

export default HeadingsTable;
