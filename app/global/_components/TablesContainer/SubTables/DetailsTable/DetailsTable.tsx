import { Anchor } from "lucide-react";
import React, { useEffect, useRef } from "react";

const DetailsTable = ({ data }: { data: any }) => {
  console.log(data, "data");

  // Function to make columns resizable
  const makeResizable = (tableRef: HTMLTableElement | null) => {
    if (!tableRef) return;

    const cols = tableRef.querySelectorAll("th");
    cols.forEach((col) => {
      const resizer = document.createElement("div");
      resizer.style.width = "1px";
      resizer.style.height = "100%";
      resizer.style.background = "#39393a26";
      resizer.style.position = "absolute";
      resizer.style.right = "0";
      resizer.style.top = "0";
      resizer.style.cursor = "col-resize";
      resizer.style.userSelect = "none";

      resizer.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const startX = e.pageX;
        const colWidth = col.offsetWidth;

        const onMouseMove = (e: MouseEvent) => {
          const newWidth = colWidth + (e.pageX - startX);
          col.style.width = `${newWidth}px`;
        };

        const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });

      col.appendChild(resizer);
    });
  };

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    makeResizable(tableRef.current);
  }, []);

  return (
    <table ref={tableRef} style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead className="text-xs">
        <tr className="sticky top-0 shadow ">
          <th
            style={{ textAlign: "left", position: "relative", width: "200px" }}
          >
            Name
          </th>
          <th
            style={{ textAlign: "left", position: "relative", width: "500px" }}
          >
            Value
          </th>
        </tr>
      </thead>
      <tbody>
        {data?.map((anchorItem: any, index: number) => {
          return (
            <React.Fragment key={index}>
              <tr>
                <td className="border pl-3">URL</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.url}
                </td>
              </tr>
              <tr>
                <td className="border pl-3">Canonical</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.canonical || ""}
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">Title</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.title?.[0]?.title || ""}
                </td>
              </tr>
              <tr>
                <td className="border pl-3">Title length</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.title?.[0]?.title.length || ""}
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">Meta Description</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.description || ""}
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">Meta Description Length</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.description?.length || ""}
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">Heading H1</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.headings?.h1 || ""}
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">Heading H1 Length</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.headings?.h1?.[0]?.length || ""}
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">Response Code</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.status_code || ""}
                </td>
              </tr>
              <tr>
                <td className="border pl-3">Mobile Optimized</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  <span
                    className={`${anchorItem?.mobile ? "px-2 rounded bg-green-500 text-white" : "text-red-500"}`}
                  >
                    {anchorItem?.mobile ? "Yes" : "No"}
                  </span>
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">Indexable</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.indexability?.indexability > 0.5 ? "Yes" : "No"}
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">Content Type</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.content_type || ""}
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">Word Count</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.word_count || ""}
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">Text Ratio</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {(anchorItem?.text_ratio?.[0]?.text_ratio).toFixed(1) || ""}
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">Top 10 Keywords</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.keywords?.slice(0, 10)?.map((item: any) => (
                    <span
                      className=" pr-2 flex space-x-2 border px-1 pl-2 border-brand-dark/50 rounded "
                      key={item[0]}
                      style={{
                        display: "inline-block",
                        margin: "4px",
                      }}
                    >
                      {item[0]}{" "}
                      <span className="bg-brand-bright text-[10px] rounded-full px-1 text-white">
                        {item[1]}
                      </span>
                    </span>
                  )) || ""}
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">Internal Links</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.anchor_links?.internal?.links?.length || ""}
                </td>
              </tr>{" "}
              <tr>
                <td className="border pl-3">External Links</td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem?.anchor_links?.external?.links?.length || ""}
                </td>
              </tr>{" "}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
};

export default DetailsTable;
