import React from "react";

const LinkAnalysis = ({ visibleLinks }: { visibleLinks: any[] }) => {
  return (
    <div className="shadow overflow-hidden rounded-md">
      <h2 className="bg-apple-spaceGray font-semibold text-white p-1 px-2 rounded-t-md w-full pb-2 text-center -mb-1">
        Link Analysis
      </h2>

      <section
        className={`mx-auto flex flex-col h-[30em] shadow w-full rounded-t-md relative ${visibleLinks.length === 0 ? "bg-white" : "bg-white/40"} bg-white/40`}
      >
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-xs w-1/5 border-r align-middle">
                  Anchor Text
                </th>
                <th className="text-xs px-2 py-1 w-2/3 align-middle">Href</th>
              </tr>
            </thead>
            <tbody>
              {visibleLinks.map((link, index) => (
                <tr key={index} className="align-middle">
                  <td className="crawl-item border-r border-b h-full">
                    <span className="block py-1 text-apple-blue px-2 text-sm flex items-center w-[180px]">
                      {link[1] || "-"}
                    </span>
                  </td>
                  <td className="h-full w-1/3 border-b">
                    <a
                      href={link[0]}
                      className="py-1 px-2 bg-white text-sm flex items-center"
                    >
                      {link[0]}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span
          className={`bg-transparent text-center p-2 ${visibleLinks.length === 0 ? "bg-white/40" : "bg-white"}`}
        >
          Links Found: {visibleLinks.length}
        </span>
      </section>
    </div>
  );
};

export default LinkAnalysis;
