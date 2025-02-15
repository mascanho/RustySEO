// @ts-nocheck
import React, { useEffect, useRef } from "react";

const DetailsTable = ({ data }: { data: any }) => {
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
    <table
      ref={tableRef}
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
      }}
    >
      <thead className="text-xs">
        <tr className="sticky top-0 shadow">
          <th
            style={{
              textAlign: "left",
              position: "relative",
              width: "300px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Name
          </th>
          <th
            style={{
              textAlign: "left",
              position: "relative",
              width: "calc(100% - 300px)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
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
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  URL
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.url}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Canonical
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.canonicals || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Title
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.title?.[0]?.title || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Title length
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.title?.[0]?.title.length || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Meta Description
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.description || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Meta Description Length
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.description?.length || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Heading H1
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.headings?.h1 || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Heading H1 Length
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.headings?.h1?.[0]?.length || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Response Code
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.status_code || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Mobile Optimized
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  <span
                    className={`${
                      anchorItem?.mobile
                        ? "px-2 rounded bg-green-500 text-white"
                        : "text-red-500"
                    }`}
                  >
                    {anchorItem?.mobile ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Indexable
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.indexability?.indexability > 0.5 ? "Yes" : "No"}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Content Type
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.content_type || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Word Count
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.word_count || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Text Ratio
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {(anchorItem?.text_ratio?.[0]?.text_ratio).toFixed(1) || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Top 10 Keywords
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.keywords?.slice(0, 10)?.map((item: any) => (
                    <span
                      className="pr-2 flex border px-1 pl-2 border-brand-dark/50 rounded my-1"
                      key={item[0]}
                      style={{
                        display: "inline-block",
                        marginRight: "8px",
                      }}
                    >
                      {item[0]}{" "}
                      <span className="bg-brand-bright text-[10px] rounded-full px-1 text-white">
                        {item[1]}
                      </span>
                    </span>
                  )) || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Internal Links
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.anchor_links?.internal?.links?.length || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  External Links
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.anchor_links?.external?.links?.length || ""}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Images
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.images?.Ok
                    ? anchorItem?.images?.Ok?.length
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Page Length
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.page_size?.[0]?.length
                    ? anchorItem.page_size[0].length + " bytes"
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Page Size
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.page_size?.[0]?.kb
                    ? anchorItem.page_size[0].kb + " KB"
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Response Time
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.response_time
                    ? anchorItem.response_time + " ms"
                    : "N/A"}
                </td>
              </tr>
              {anchorItem?.hreflangs?.map((lang) => (
                <tr key={lang.id}>
                  <td
                    className="border pl-3"
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {"Hreflang " + lang.code.toUpperCase()}
                  </td>
                  <td
                    style={{
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    className="pl-3 border"
                  >
                    {lang.url}
                  </td>
                </tr>
              ))}
              <tr>
                <td
                  className="border pl-3"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Language
                </td>
                <td
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  className="pl-3 border"
                >
                  {anchorItem?.language || ""}
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
