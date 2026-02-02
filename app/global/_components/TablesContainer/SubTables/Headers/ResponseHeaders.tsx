// @ts-nocheck
import React, { useEffect, useRef } from "react";

interface ResponseHeadersProps {
  data: {
    headers: [string, string][];
  }[];
  height: number;
}

const ResponseHeaders: React.FC<ResponseHeadersProps> = ({ data, height }) => {
  const tableBodyRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const tableBody = tableBodyRef.current;
      if (tableBody) {
        const header = document.querySelector(".table-header-headers");
        if (header) {
          const headerColumns = header.querySelectorAll("th");
          const bodyColumns = tableBody.querySelectorAll("tr:first-child td");

          bodyColumns.forEach((bodyCol, index) => {
            const headerCol = headerColumns[index];
            if (headerCol) {
              headerCol.style.width = `${bodyCol.offsetWidth}px`;
            }
          });
        }
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

  if (!data?.[0]?.headers) {
    return (
      <div
        style={{
          height: `${height - 15}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <p className="dark:text-white/50 text-black/50 text-xs">
          Select a URL from the HTML table to view response headers
        </p>
      </div>
    );
  }

  const headers = data[0].headers;

  return (
    <div
      className="domainCrawlParent flex flex-col"
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden"
      }}
    >
      <div
        className="table-header table-header-headers shrink-0"
        style={{
          zIndex: 10,
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
                  width: "260px",
                  padding: "4px 8px",
                  color: "#fff"
                }}
              >
                Header Name
              </th>
              <th
                style={{
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  backgroundColor: "#f87171",
                  padding: "4px 8px",
                  color: "#fff"
                }}
              >
                Value
              </th>
            </tr>
          </thead>
        </table>
      </div>
      <div
        className="flex-1"
        style={{
          overflow: "auto",
          width: "100%",
          padding: "0 0 3px 0",
        }}
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
            {headers &&
              headers.map((header, index) => {
                return (
                  <tr key={index}>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        border: "1px solid #ddd",
                        width: "260px",
                        fontWeight: 600,
                        padding: "2px 0",
                      }}
                    >
                      {header[0]}
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
                      {header[1]}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(ResponseHeaders);
