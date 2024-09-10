import useStore from "@/store/Panes";
import useOnPageSeo from "@/store/storeOnPageSeo";
import { useEffect } from "react";
import { SiOctanerender } from "react-icons/si";

const RenderBlockingResources = ({ pageSpeed }: { pageSpeed: any }) => {
  const { Visible } = useStore();
  const setSeoRenderBlocking = useOnPageSeo(
    (state) => state.setSeoRenderBlocking,
  );

  const scripts =
    pageSpeed?.lighthouseResult?.audits?.["render-blocking-resources"]?.details
      ?.items || [];

  const totalBytes = scripts?.reduce(
    (acc: number, item: any) => acc + item.totalBytes,
    0,
  );

  const wastedMs = scripts?.reduce(
    (acc: number, item: any) => acc + item.wastedMs,
    0,
  );

  return (
    <section
      className={`render-blocking table_container ${Visible.renderBlocking ? "block" : "hidden"}`}
    >
      <h2 className="text-base text-left pl-1 flex items-center pt-3 font-bold w-full text-black/60">
        <SiOctanerender className="mr-1.5" /> Render Blocking
      </h2>

      <div className="overflow-auto custom-scrollbar  h-[25.3rem] ">
        <table className="w-full ">
          <thead>
            <tr>
              <th align="left" className="text-xs  ">
                URL
              </th>
              <th align="left" className="text-xs ">
                Total Bytes
              </th>
              <th align="left" className="text-xs min-w-[90px] ">
                Wasted Ms
              </th>
            </tr>
          </thead>
          <tbody>
            {scripts.length === 0 ? (
              <tr className="w-full h-full border-none">
                <td
                  colSpan={4}
                  rowSpan={8}
                  className="text-gray-500 dark:text-white/50 text-center bg-white dark:bg-brand-darker pt-[10rem] border-none"
                >
                  No Render Blocking Resources Found on This Page
                </td>
              </tr>
            ) : (
              scripts.map((item: any, index: number) => (
                <tr key={item.url || index}>
                  <td className="px-4 py-2 text-sm border-b  border-b-gray-100 text-blue-600 truncate">
                    {item?.url}
                  </td>
                  <td className="px-4  text-xs border-b text-gray-700 dark:text-white/50">
                    {Math.round(item?.totalBytes)}
                  </td>
                  <td className="px-4 text-xs border-b text-gray-700 dark:text-white/50">
                    {item?.wastedMs} ms
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="pb-1 m-2 rounded-md text-xs flex justify-end text-black/50 space-x-4">
        <p>
          Total wasted:{" "}
          <span
            className={`px-1 py-0.5 bg-gray-400 ${scripts.length > 0 && "bg-red-400"} text-white rounded-md min-w-3`}
          >
            {wastedMs + " ms"}
          </span>
        </p>
        <p>
          Total Bytes:{" "}
          <span
            className={`px-1 py-0.5 bg-gray-400 ${scripts.length > 0 && "bg-red-400"} text-white rounded-md min-w-3`}
          >
            {(totalBytes / 1048576).toFixed(2) + " MB"}
          </span>
        </p>
        <p>
          Blocking:{" "}
          <span
            className={`px-1 py-0.5 bg-gray-400 ${scripts.length > 0 && "bg-red-400"} text-white rounded-md min-w-3`}
          >
            {scripts.length}
          </span>
        </p>
      </footer>
    </section>
  );
};

export default RenderBlockingResources;
