import React from "react";

const ThirdPartyScripts = ({ pageSpeed }: { pageSpeed: any }) => {
  const scripts =
    pageSpeed?.lighthouseResult?.audits?.["third-party-summary"]?.details
      ?.items || [];

  return (
    <section className="table_container">
      <h2 className="text-base text-left pl-1 pt-3 font-bold w-full text-black/60">
        Third Party Scripts
      </h2>

      <div className="overflow-auto h-[33rem] shadow">
        <table className="w-full h-full">
          <thead className="sticky top-0 bg-white shadow">
            <tr>
              <th className="text-xs px-4  w-2/5 border-r">Entity</th>
              <th className="text-xs px-4 w-1/5 border-r">Thread Time</th>
              <th className="text-xs px-4  w-1/5 border-r">T. Size</th>
              <th className="text-xs px-4  w-1/5">Blocking Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 h-[calc(30rem - 3.5rem)] overflow-y-auto">
            {scripts.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-4 text-gray-500 h-full"
                >
                  No third party connections found.
                </td>
              </tr>
            ) : (
              scripts.map((item: any, index: number) => (
                <tr key={item.url || index}>
                  <td className="px-4 py-2 text-sm border text-blue-600 truncate max-w-full">
                    {item?.entity}
                  </td>
                  <td className="px-4 py-1 text-xs border text-gray-700 dark:text-white/50">
                    {Math.round(item?.mainThreadTime)}
                  </td>
                  <td className="px-4 py-1 text-xs text-gray-700 border dark:text-white/50">
                    {item?.transferSize} bytes
                  </td>
                  <td className="px-4 py-1  text-xs text-gray-700 border dark:text-white/50">
                    {Math.round(item?.blockingTime) + " ms"}
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

export default ThirdPartyScripts;
