import useStore from "@/store/Panes";
import { BsHddNetwork } from "react-icons/bs";

import { BiLoaderCircle } from "react-icons/bi";

const LongTasksTable = ({ pageSpeed }: { pageSpeed: any }) => {
  const { Visible } = useStore();

  const lt =
    pageSpeed?.lighthouseResult?.audits?.["long-tasks"]?.details?.items || [];

  const totalTime = lt.reduce((total: any, item: any) => {
    return total + item.duration;
  }, 0);

  let urlSize = 150;

  return (
    <section
      className={`table_container long-tasks ${Visible.longTasks ? "block" : "hidden"}`}
    >
      <h2 className="text-base flex items-center text-left pl-1 pt-3 font-bold w-full">
        <BiLoaderCircle className="mr-1.5" /> Long Tasks
      </h2>

      <div className="overflow-y-auto h-[25.3rem] shadow custom-scrollbar overflow-x-auto">
        <table className="w-fit h-full">
          <thead className="sticky top-0 bg-white dark:bg-transparent shadow">
            <tr>
              <th align="left" className="text-xs border-r border-gray-300">
                <span className="-ml-1 ">Duration</span>
              </th>
              <th
                align="left"
                className="text-xs max-w-[100%] w-full border-r border-gray-300 dark:text-white"
              >
                URL
              </th>
            </tr>
          </thead>
          <tbody className="bg-white  h-[calc(30rem - 3.5rem)] overflow-y-auto">
            {lt.map((item: any, index: number) => (
              <tr key={item.url || index}>
                <td className="px-2 text-[6px] text-gray-700 w-[90px] min-w-[70px] dark:text-white border-b border-r">
                  {item?.duration.toFixed(0)} ms
                </td>{" "}
                <td className="px-4 text-xs text-blue-600 w-[100vw] flex-1  border-b max-w-[1900px]">
                  <span className="w-full">
                    {item?.url?.length > 80
                      ? item?.url?.slice(0, urlSize) + "..."
                      : item?.url}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-2  m-2 rounded-md text-xs flex justify-end text-black/50 space-x-4">
        <p>
          Long Tasks:{" "}
          <span className="px-1 py-0.5 bg-gray-400 text-white rounded-md min-w-3">
            {lt?.length}
          </span>
        </p>
        <p>
          Total Time:{""}
          <span className="px-1 ml-1 py-0.5 bg-gray-400 text-white rounded-md min-w-3">
            {totalTime.toFixed(1)} {totalTime && "ms"}
          </span>
        </p>
      </div>
    </section>
  );
};

export default LongTasksTable;
