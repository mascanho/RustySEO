// @ts-nocheck
import React, { useEffect, useRef, useCallback } from "react";
import { message, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

interface InlinksSubTableProps {
  data: {
    anchor_links: {
      internal: {
        anchors: string[];
        links: string[];
      };
    };
    inoutlinks_status_codes: {
      internal: {
        anchor_text: string;
        url: string;
        relative_path: string | null;
        status: number | null;
        error: string | null;
      }[];
    };
  }[];
}

const InnerLinksDetailsTable: React.FC<InlinksSubTableProps> = ({
  data,
  height,
}) => {
  const tableRef = useRef<HTMLTableElement>(null);

  console.log(data, "FROM THE INLINKS TABLE BOTTOM");

  const urlsWithPageAsInternalLink = data
    .map((page) => page?.inoutlinks_status_codes?.internal)
    .flat()
    .map((link) => link?.url);

  // Memoize the makeResizable function
  const makeResizable = useCallback((tableRef: HTMLTableElement | null) => {
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

      const onMouseMove = (e: MouseEvent) => {
        const newWidth = col.offsetWidth + (e.pageX - startX);
        col.style.width = `${newWidth}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      let startX: number;

      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        startX = e.pageX;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      };

      resizer.addEventListener("mousedown", onMouseDown);

      col.appendChild(resizer);

      // Cleanup function for each resizer
      return () => {
        resizer.removeEventListener("mousedown", onMouseDown);
        col.removeChild(resizer);
      };
    });
  }, []);

  // Expor data as CSV
  const exportCSV = async () => {
    if (!data?.[0]?.inoutlinks_status_codes?.internal?.length) {
      await message("No data to export", {
        title: "Export Error",
        type: "error",
      });
      return;
    }

    const headers = [
      "ID",
      "From",
      "Relative Link",
      "Absolute Link",
      "Rel",
      "Target",
      "Title",
      "Status Code",
    ];

    const csvData = data[0].inoutlinks_status_codes.internal.map(
      (item: any, index: number) => [
        index + 1,
        `"${(item.anchor_text || "").replace(/"/g, '""')}"`,
        `"${(item.relative_path || "").replace(/"/g, '""')}"`,
        `"${(item.url || "").replace(/"/g, '""')}"`,
        item.status !== null ? item.status : item.error || "N/A",
      ],
    );

    const csvContent = [
      headers.join(","),
      ...csvData.map((row: string[]) => row.join(",")),
    ].join("\n");

    try {
      // Ask user for save location
      const filePath = await save({
        defaultPath: `RustySEO - Inlinks Export - ${new Date().toISOString().slice(0, 10)}.csv`,
        filters: [
          {
            name: "CSV",
            extensions: ["csv"],
          },
        ],
      });

      if (filePath) {
        await writeTextFile(filePath, csvContent);

        // Show success message
        await message("CSV file saved successfully!", {
          title: "Export Complete",
          type: "info",
        });
      }
    } catch (error) {
      console.error("Export failed:", error);
      await message(`Failed to export CSV: ${error}`, {
        title: "Export Error",
        type: "error",
      });
    }
  };

  useEffect(() => {
    const table = tableRef.current;
    if (table) {
      const cleanupResizers = makeResizable(table);

      // Cleanup function for the entire table
      return () => {
        if (cleanupResizers) {
          cleanupResizers();
        }
      };
    }
  }, [makeResizable]);

  // Move localStorage access into useEffect to avoid re-renders
  useEffect(() => {
    const isDark = localStorage.getItem("dark-mode");
    console.log("Dark mode:", isDark); // Example usage
  }, []);

  if (data?.length === 0) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <p className="dark:text-white/50 text-black/50 text-xs">
          Select a URL from the HTML table to view details
        </p>
      </div>
    );
  }

  function getAnchorText(obj, targetUrl) {
    console.log("object:", obj?.url);

    const anchorTexts = obj?.inoutlinks_status_codes?.internal

      .filter((item) => item.url === targetUrl)
      .map((item) => item.anchor_text);

    return anchorTexts;
  }

  function getStatusCode(obj, targetUrl) {
    console.log("object:", obj?.url);

    const anchorTexts = obj?.inoutlinks_status_codes?.internal

      .filter((item) => item.url === targetUrl)
      .map((item) => item.status);

    return anchorTexts;
  }

  return (
    <section
      className="overflow-auto h-full w-full"
      style={{
        height: `${height}px`,
        minHeight: "100px",
      }}
    >
      <button
        onClick={exportCSV}
        className="absolute -top-8   right-1 z-50 text-xs border border-brand-bright dark:border-brand-bright px-3 h-5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors  dark:text-white/50"
      >
        Export
      </button>
      <table
        ref={tableRef}
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead className="text-xs top-0 sticky">
          <tr className="shadow">
            <th
              style={{
                width: "20px",
                textAlign: "center",
                position: "relative",
                paddingRight: "10px",
              }}
            >
              ID
            </th>
            <th
              style={{
                textAlign: "left",
                position: "relative",
                minWidth: "230px",
              }}
            >
              From
            </th>
            <th
              style={{
                textAlign: "left",
                position: "relative",
                minWidth: "230px",
              }}
            >
              To
            </th>
            <th
              style={{
                textAlign: "left",
                position: "relative",
                minWidth: "230px",
              }}
            >
              Anchor Text
            </th>
            <th
              style={{
                textAlign: "center",
                position: "relative",
                minWidth: "80px",
              }}
            >
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {data?.[1].map((item: any, index: number) => {
            // Determine the background color class based on the index
            const rowColorClass =
              index % 2 === 0
                ? "bg-gray-100 dark:bg-brand-dark"
                : "bg-white dark:bg-brand-darker";

            return (
              <tr key={index} className={`${rowColorClass} text-xs border`}>
                <td className="text-center border border-l ">{index + 1}</td>
                <td className="pl-3 border border-l">{item?.url}</td>
                <td className="pl-3 border border-l">{data?.[0].url}</td>
                <td className="pl-3 border border-l ">
                  {getAnchorText(item, data?.[0].url)}
                </td>
                <td className="pl-3 text-center">
                  {getStatusCode(item, data?.[0].url)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

export default React.memo(InnerLinksDetailsTable);
