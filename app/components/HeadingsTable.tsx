import useStore from "@/store/Panes";
import useOnPageSeo from "@/store/storeOnPageSeo";
import React, { useEffect } from "react";
import { LiaHeadingSolid } from "react-icons/lia";

const HeadingsTable = ({ headings }: { headings: string[] }) => {
  const { Visible } = useStore();
  const setRepeatedHeadings = useOnPageSeo((state) => state.setHeadings);

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

  const repeated: any = findDuplicates(headings);

  console.log(repeated, "Repated stuff");

  useEffect(() => {
    setRepeatedHeadings(repeated);
  }, [headings]);

  return (
    <section
      className={`table_container headings  ${Visible.headings ? "block" : "hidden"} `}
    >
      <h2 className="text-base text-left pl-1 pt-3 font-bold w-full text-black/60 flex items-center ">
        <LiaHeadingSolid className="mr-1.5" /> Headings
      </h2>

      <section className="flex flex-col flex-grow">
        <table className="w-full">
          <thead className="text-xs text-left">
            <tr className="w-full">
              <th>Anchor</th>
              <th align="left" className="ml-0 w-[20px]" colSpan={8}>
                Text
              </th>
            </tr>
          </thead>
        </table>
        <div className="flex-grow custom-scrollbar overflow-auto h-[23rem]">
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
        <footer className="pb-1 border-t border-t-gray-100  dark:border-0 text-xs flex justify-end text-black/50 space-x-4 pt-2">
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
