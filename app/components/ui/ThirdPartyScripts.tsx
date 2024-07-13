import React from "react";

const ThirdPartyScripts = ({ pageSpeed }: { pageSpeed: any }) => {
  const scripts =
    pageSpeed?.lighthouseResult?.audits?.["third-party-summary"]?.details
      ?.items || [];

  return (
    <section className="shadow rounded-md overflow-hidden h-full">
      <h2 className="bg-apple-spaceGray font-semibold text-white pt-1 px-2 rounded-t-md w-full  text-center">
        Third Party
      </h2>

      <div className="overflow-auto h-[25.2rem] shadow">
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
                  <td className="px-4 py-1 text-sm text-blue-600 truncate max-w-full">
                    {item?.entity}
                  </td>
                  <td className="px-4 py-1 text-xs text-gray-700">
                    {item?.mainThreadTime}
                  </td>
                  <td className="px-4 py-1 text-xs text-gray-700">
                    {item?.transferSize} bytes
                  </td>
                  <td className="px-4 py-1  text-xs text-gray-700">
                    {item?.blockingTime}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center  bg-white shadow">
        <span className="bg-transparent border-t flex justify-center items-center text-xs text-center w-full p-2">
          Scripts:{" "}
          <span className="text-blue-500">
            {""}
            <span className="ml-1"> {scripts.length}</span>
          </span>
        </span>
      </div>
    </section>
  );
};

export default ThirdPartyScripts;
