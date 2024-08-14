import { SiOctanerender } from "react-icons/si";

const RenderBlockingResources = ({ pageSpeed }: { pageSpeed: any }) => {
  const scripts =
    pageSpeed?.lighthouseResult?.audits?.["render-blocking-resources"]?.details
      ?.items || [];

  return (
    <section className="table_container">
      <h2 className="text-base text-left pl-1 flex items-center pt-3 font-bold w-full text-black/60">
        <SiOctanerender className="mr-1.5" /> Render Blocking
      </h2>

      <div className="overflow-auto custom-scrollbar overflow-x-hidden h-[25rem] ">
        <table className="w-full ">
          <thead>
            <tr>
              <th align="left" className="text-xs  ">
                URL
              </th>
              <th align="left" className="text-xs ">
                Total Bytes
              </th>
              <th align="left" className="text-xs min-w-[80px] ">
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
                  No third party connections found.
                </td>
              </tr>
            ) : (
              scripts.map((item: any, index: number) => (
                <tr key={item.url || index}>
                  <td className="px-4 py-2 text-sm border-b  border-b-gray-100 text-blue-600 truncate">
                    {item?.url}
                  </td>
                  <td className="px-4  text-xs border text-gray-700 dark:text-white/50">
                    {Math.round(item?.totalBytes)}
                  </td>
                  <td className="px-4 text-xs border text-gray-700 dark:text-white/50">
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
          Total scripts:{" "}
          <span className="px-1 py-0.5 bg-gray-400 text-white rounded-md min-w-3">
            {scripts.length}
          </span>
        </p>
      </footer>
    </section>
  );
};

export default RenderBlockingResources;
