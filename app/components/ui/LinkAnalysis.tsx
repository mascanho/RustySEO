import React from "react";

const LinkAnalysis = ({ visibleLinks }: { visibleLinks: any[] }) => {
  return (
    <div className="shadow overflow-auto rounded-md h-full">
      <h2 className="bg-apple-spaceGray font-semibold text-white rounded-t-md w-full h-7 pt-1 text-center">
        Link Analysis
      </h2>

      <section
        className={`mx-auto flex flex-col shadow w-full  relative h-full ${visibleLinks.length === 0 ? "bg-white/40" : "bg-white"}`}
        style={{ minHeight: "20rem", maxHeight: "30.2rem", overflowY: "auto" }}
      >
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white shadow">
              <tr>
                <th className="text-xs w-1/5 border-r px-2">Anchor Text</th>
                <th className="text-xs px-2  w-2/3">Href</th>
              </tr>
            </thead>
            <tbody>
              {visibleLinks.map((link, index) => (
                <tr key={index} className="align-middle">
                  <td className="crawl-item border-r border-b">
                    <span className="block py-1 px-2 text-sm flex items-center w-[180px]">
                      {link[1] || "-"}
                    </span>
                  </td>
                  <td className="border-b">
                    <a
                      href={link[0]}
                      className="block py-1 px-2 text-sm flex items-center"
                    >
                      {link[0]}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center border-t bg-white">
          <span
            className={`bg-transparent border-t flex justify-center items-center text-xs text-center w-full p-2 ${
              visibleLinks.length === 0 ? "bg-white/40" : "bg-white"
            }`}
          >
            Links Found:{" "}
            <span className="text-blue-500">{visibleLinks.length}</span>
          </span>
        </div>
      </section>
    </div>
  );
};

export default LinkAnalysis;
