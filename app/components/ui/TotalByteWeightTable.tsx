import React from "react";

const TotalByteWeight = ({ pageSpeed }: { pageSpeed: any }) => {
  const scripts =
    pageSpeed?.lighthouseResult?.audits?.["total-byte-weight"]?.details
      ?.items || [];

  return (
    <section className="table_container">
      <h2 className="text-base text-left pl-1 pt-3 font-bold w-full ">
        Total Byte Weight
      </h2>

      <div className="overflow-auto h-[33.1rem] shadow">
        <table className="w-full h-full">
          <thead className="sticky top-0 bg-white shadow">
            <tr>
              <th align="left" className="text-xs px-4  w-2/5 border-r">
                Trasnfer Size
              </th>
              <th
                align="left"
                className="text-xs px-4 w-1/5 border-r dark:text-white"
              >
                URL
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 h-[calc(30rem - 3.5rem)] overflow-y-auto">
            {scripts.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="text-center py-4 text-gray-500 h-full dark:text-white"
                >
                  No third party connections found.
                </td>
              </tr>
            ) : (
              scripts.map((item: any, index: number) => (
                <tr key={item.url || index}>
                  <td className="px-3  text-[6px] text-gray-700 dark:text-white ">
                    {(
                      Math.round(item?.totalBytes * 1000) / 1000
                    ).toLocaleString() + " KiB"}
                  </td>{" "}
                  <td className="px-4  text-xs text-blue-600 truncate max-w-full">
                    {item?.url}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pb-3 m-2 rounded-md text-xs flex justify-end text-black/50 space-x-4">
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
