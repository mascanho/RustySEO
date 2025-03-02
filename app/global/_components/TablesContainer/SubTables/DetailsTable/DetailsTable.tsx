// @ts-nocheck
import React, { useEffect, useRef } from "react";

const DetailsTable = ({ data, height }) => {
  const tableBodyRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const tableBody = tableBodyRef.current;
      if (tableBody) {
        const header = document.querySelector(".table-header");
        const headerColumns = header.querySelectorAll("th");
        const bodyColumns = tableBody.querySelectorAll("tr:first-child td");

        bodyColumns.forEach((bodyCol, index) => {
          const headerCol = headerColumns[index];
          headerCol.style.width = `${bodyCol.offsetWidth}px`;
        });
      }
    };

    const tableBody = tableBodyRef.current;
    if (tableBody) {
      tableBody.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (tableBody) {
        tableBody.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  if (data.length === 0) {
    return (
      <div
        style={{
          height: `${height - 50}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <p style={{ color: "rgba(0, 0, 0, 0.5)" }}>
          Select a row to view details
        </p>
      </div>
    );
  }

  return (
    <div
      className="domainCrawlParent -mt-2  "
      style={{
        position: "relative",
        height: `${height - 20}px `,
        width: "100%",
      }}
    >
      <div
        className="table-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          backgroundColor: "#f87171",
        }}
      >
        <table
          className="detailsTable text-xs"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  backgroundColor: "#f87171",
                  zIndex: 1,
                  width: "260px",
                }}
              >
                Name
              </th>
              <th
                style={{
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  backgroundColor: "#f87171",
                  zIndex: 1,
                }}
              >
                Value
              </th>
            </tr>
          </thead>
        </table>
      </div>
      <div
        style={{ overflow: "auto", height: `calc(100% - 40px)`, width: "100%" }}
        ref={tableBodyRef}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <tbody>
            {data?.map((anchorItem, index) => {
              return (
                <React.Fragment key={index}>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.url}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.canonicals || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.title?.[0]?.title || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.title?.[0]?.title.length || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.description || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.description?.length || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.headings?.h1 || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.headings?.h1?.[0]?.length || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.status_code || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          backgroundColor: anchorItem?.mobile
                            ? "#10b981"
                            : "#ef4444",
                          color: "#fff",
                        }}
                      >
                        {anchorItem?.mobile ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.indexability?.indexability > 0.5
                        ? "Yes"
                        : "No"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.content_type || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.word_count || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {(anchorItem?.text_ratio?.[0]?.text_ratio).toFixed(1) ||
                        ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.keywords?.slice(0, 10)?.map((item) => (
                        <span
                          key={item[0]}
                          style={{
                            display: "inline-block",
                            marginRight: "8px",
                            border: "1px solid #ddd",
                            padding: "1px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          {item[0]}{" "}
                          <span
                            className="bg-brand-bright"
                            style={{
                              color: "#fff",
                              borderRadius: "9999px",
                              padding: "2px 8px",
                              fontSize: "10px",
                            }}
                          >
                            {item[1]}
                          </span>
                        </span>
                      )) || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.anchor_links?.internal?.links?.length || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.anchor_links?.external?.links?.length || ""}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.images?.Ok
                        ? anchorItem?.images?.Ok?.length
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.page_size?.[0]?.length
                        ? anchorItem?.page_size[0].length + " bytes"
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.page_size?.[0]?.kb
                        ? anchorItem?.page_size[0].kb + " KB"
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.response_time
                        ? anchorItem?.response_time + " ms"
                        : "N/A"}
                    </td>
                  </tr>
                  {anchorItem?.hreflangs?.map((lang) => (
                    <tr key={lang.id}>
                      <td
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          border: "1px solid #ddd",
                          padding: "2px 0",
                          width: "260px",
                          fontWeight: 600,
                        }}
                      >
                        {"Hreflang " + lang?.code?.toUpperCase()}
                      </td>
                      <td
                        style={{
                          textAlign: "left",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          border: "1px solid #ddd",
                          padding: "2px 0",
                        }}
                      >
                        {lang?.url}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        padding: "2px 0",
                        width: "260px",
                        fontWeight: 600,
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
                        border: "1px solid #ddd",
                        padding: "2px 0",
                      }}
                    >
                      {anchorItem?.language || ""}
                    </td>
                  </tr>{" "}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DetailsTable;
