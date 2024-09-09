import useStore from "@/store/Panes";
import { BsHddNetwork } from "react-icons/bs";

const NetworkRequestsTable = ({ pageSpeed }: { pageSpeed: any }) => {
  const { Visible } = useStore();

  const nr =
    pageSpeed?.lighthouseResult?.audits?.["network-requests"]?.details?.items ||
    [];

  let urlSize = 150;

  return (
    <section
      className={`table_container network-requests ${Visible.networkRequests ? "block" : "hidden"}`}
    >
      <h2 className="text-base flex items-center text-left pl-1 pt-3 font-bold w-full">
        <BsHddNetwork className="mr-1.5" /> Network Requests
      </h2>

      <div className="overflow-y-auto h-[25.3rem] shadow custom-scrollbar overflow-x-auto">
        <table className="w-fit h-full">
          <thead className="sticky top-0 bg-white dark:bg-transparent shadow">
            <tr>
              <th align="left" className="text-xs border-r border-gray-300">
                <span className="-ml-1 ">Mime Type</span>
              </th>
              <th
                align="left"
                className="text-xs max-w-[200px] border-r border-gray-300 dark:text-white"
              >
                URL
              </th>
            </tr>
          </thead>
          <tbody className="bg-white  h-[calc(30rem - 3.5rem)] overflow-y-auto">
            {nr.length === 0 ? (
              <tr className="bg-white">
                <td
                  colSpan={2}
                  className="text-center text-gray-500 pb-8 h-full bg-white dark:bg-brand-darker dark:text-white/50"
                >
                  No third party connections found.
                </td>
              </tr>
            ) : (
              nr.map((item: any, index: number) => (
                <tr key={item.url || index}>
                  <td className="px-2 text-[6px] text-gray-700 w-[200px] min-w-[95px] dark:text-white border-b border-r">
                    {item?.mimeType}
                  </td>{" "}
                  <td className="px-4 text-xs text-blue-600 truncate border-b">
                    <span className="max-w-[400px] ">
                      {item?.url?.length > 50
                        ? item?.url?.slice(0, urlSize) + "..."
                        : item?.url}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-2  m-2 rounded-md text-xs flex justify-end text-black/50 space-x-4">
        <p>
          Total Requests:{" "}
          <span className="px-1 py-0.5 bg-gray-400 text-white rounded-md min-w-3">
            {nr.length}
          </span>
        </p>
      </div>
    </section>
  );
};

export default NetworkRequestsTable;
