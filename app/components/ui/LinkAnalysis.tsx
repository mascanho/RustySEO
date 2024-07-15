import React from "react";

const LinkAnalysis = ({ visibleLinks }: { visibleLinks: any[] }) => {
  return (
    <section>
      <h2 className="bg-apple-spaceGray font-semibold text-white rounded-t-md w-full pt-1">
        Links
      </h2>
      <div className="shadow rounded-b-md h-[30rem] overflow-hidden sticky top-0">
        <section
          className={`mx-auto flex flex-col shadow w-full ${visibleLinks.length === 0 ? "bg-white/40" : "bg-white"}`}
        >
          <div className="relative">
            <table className="w-full">
              <thead className="bg-gray-200 text-center">
                <tr>
                  <th className="w-1/3">Anchor</th>
                  <th className="w-2/3">Link</th>
                </tr>
              </thead>
            </table>
            <div className="overflow-auto h-[26rem]  max-h-[26rem]">
              <table className="w-full">
                <tbody>
                  {visibleLinks.map((link, index) => (
                    <tr key={index} className="align-middle">
                      <td className="border-r border-b">
                        <span className="block py-2 px-3 text-sm w-[180px]">
                          {link[1] || "-"}
                        </span>
                      </td>
                      <td className="border-b">
                        <a
                          href={link[0]}
                          className="block py-2 px-3 text-sm text-blue-500"
                          aria-label={`Link to ${link[0]}`}
                        >
                          {link[0]}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-center border-t bg-white">
            <span
              className={`flex justify-center items-center text-xs w-full p-2 ${visibleLinks.length === 0 ? "bg-white/40" : "bg-white"}`}
            >
              Links Found:{" "}
              <span className="text-blue-500 ml-1">{visibleLinks.length}</span>
            </span>
          </div>
        </section>
      </div>
    </section>
  );
};

export default LinkAnalysis;
