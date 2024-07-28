import React from "react";

const HeadingsTable = ({ headings }: { headings: string[] }) => {
  const findDuplicates = (array: any) => {
    const count: any = {};
    const duplicates = [];

    array.forEach((element: any) => {
      count[element] = (count[element] || 0) + 1;
    });

    for (const element in count) {
      if (count[element] > 1) {
        duplicates.push(element);
      }
    }

    return duplicates;
  };

  return (
    <section className="table_container">
      <h2 className="text-base text-left pl-1 pt-3 font-bold w-full text-black/60">
        Headings
      </h2>

      <section className="flex flex-col flex-grow">
        <table className="w-full">
          <thead className="text-xs text-left">
            <tr className="w-full">
              <th className="w-1/6">Anchor</th>
              <th className="w-5/6">Link</th>
            </tr>
          </thead>
        </table>
        <div className="flex-grow overflow-auto h-[30.8rem]">
          <table className="w-full">
            <tbody>
              {headings.map((link, index) => {
                const [headingType, headingText] = link.split(": ", 2);
                return (
                  <tr key={index} className="">
                    <td className="crawl-item border-r py-1 font-semibold text-apple-blue border-b w-2 pl-5 pr-6 h-full">
                      {headingType}
                    </td>
                    <td className="h-full w-full border-b crawl-item pl-8">
                      {headingText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className="pb-1 border-t dark:border-0 text-xs flex justify-end text-black/50 space-x-4 pt-2">
          <p className="text-xs">
            Headings Found:{" "}
            <span className="px-1 py-0.5 bg-gray-400 text-white rounded-md">
              {headings?.length}
            </span>
          </p>
          {/* Find duplicated headings. */}
          <p>
            Duplicates Found:{" "}
            <span className="px-1 py-0.5 bg-red-400 text-white rounded-md mr-2">
              {findDuplicates(headings).length}
            </span>
          </p>
        </footer>
      </section>
    </section>
  );
};

export default HeadingsTable;
