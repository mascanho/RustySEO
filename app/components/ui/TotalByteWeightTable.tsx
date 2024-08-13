import { GiWeight } from "react-icons/gi";

const TotalByteWeight = ({ pageSpeed }: { pageSpeed: any }) => {
  const scripts =
    pageSpeed?.lighthouseResult?.audits?.["total-byte-weight"]?.details
      ?.items || [];

  return (
    <section className="table_container">
      <h2 className="text-base flex items-center text-left pl-1 pt-3 font-bold w-full">
        <GiWeight className="mr-1.5" /> Total Byte Weight
      </h2>

      <div className="overflow-auto h-[25rem] shadow custom-scrollbar">
        <table className="w-full h-full">
          <thead className="sticky top-0 bg-white dark:bg-transparent shadow">
            <tr>
              <th
                align="left"
                className="text-xs  w-[120px] border-r border-gray-300"
              >
                Transfer Size
              </th>
              <th
                align="left"
                className="text-xs w-1/5 border-r border-gray-300 dark:text-white"
              >
                URL
              </th>
            </tr>
          </thead>
          <tbody className="bg-white  h-[calc(30rem - 3.5rem)] overflow-y-auto">
            {scripts.length === 0 ? (
              <tr className="bg-white">
                <td
                  colSpan={2}
                  className="text-center text-gray-500 pb-8 h-full bg-white dark:bg-brand-darker dark:text-white/50"
                >
                  No third party connections found.
                </td>
              </tr>
            ) : (
              scripts.map((item: any, index: number) => (
                <tr key={item.url || index}>
                  <td className="px-2 text-[6px] text-gray-700 w-[200px] min-w-[95px] dark:text-white border-b border-r">
                    {(Math.floor(item?.totalBytes * 1000) / 1000).toFixed(0) +
                      " KiB"}
                  </td>{" "}
                  <td className="px-4 text-xs text-blue-600 truncate max-w-full border-b">
                    {item?.url}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-2  m-2 rounded-md text-xs flex justify-end text-black/50 space-x-4">
        <p>
          Total URLs:{" "}
          <span className="px-1 py-0.5 bg-gray-400 text-white rounded-md min-w-3">
            {scripts.length}
          </span>
        </p>
      </div>
    </section>
  );
};

export default TotalByteWeight;
