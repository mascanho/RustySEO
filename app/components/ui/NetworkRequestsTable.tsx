import useStore from "@/store/Panes";
import { BsHddNetwork } from "react-icons/bs";

const NetworkRequestsTable = ({ pageSpeed }: { pageSpeed: any }) => {
  const { Visible } = useStore();

  const nr =
    pageSpeed?.lighthouseResult?.audits?.["network-requests"]?.details?.items ||
    [];

  const urlSize = 150;

  return (
    <section
      className={`table_container network-requests ${Visible.networkRequests ? "block" : "hidden"}`}
    >
      <h2 className="text-base flex items-center text-left pl-1 pt-3 font-bold w-full">
        <BsHddNetwork className="mr-1.5" /> Network Requests
      </h2>

      <div className="h-full overflow-hidden">
        <section className="mx-auto flex flex-col w-full bg-white">
          <div className="relative">
            {/* Separate table for header */}
            <table className="w-full">
              <thead className="text-xs text-left">
                <tr>
                  <th className="w-[110px] border-r border-gray-300">
                    Mime Type
                  </th>
                  <th className="border-r border-gray-300">URL</th>
                </tr>
              </thead>
            </table>

            {/* Scrollable body container */}
            <div className="overflow-auto custom-scrollbar h-[23.5rem]">
              <table className="w-full">
                <tbody>
                  {nr.map((item: any, index: number) => (
                    <tr key={index} className="align-middle">
                      <td className="px-2 text-[6px] text-gray-700 w-[120px] dark:text-white/50 border-r border-b">
                        {item?.mimeType}
                      </td>
                      <td className="border-b">
                        <span className="px-4 text-xs text-blue-600 truncate dark:text-blue-600 block py-1">
                          {item?.url?.length > urlSize
                            ? `${item.url.slice(0, urlSize)}...`
                            : item?.url}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <div className="pt-2 m-2 rounded-md text-xs flex justify-end text-black/50 space-x-4">
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
