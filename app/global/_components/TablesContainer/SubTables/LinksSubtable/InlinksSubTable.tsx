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

const InlinksSubTable: React.FC<InlinksSubTableProps> = ({ data, height }) => {
  const tableRef = useRef<HTMLTableElement>(null);

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

  // Export data as CSV
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
      "Anchor Text",
      "Relative Link",
      "Absolute Link",
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

  return (
    <section
      className="overflow-auto h-full"
      style={{ height: `${height - 15}px`, minHeight: "100px" }}
    >
      <button
        onClick={exportCSV}
        className="absolute top-0 -mt-8 dark:-mt-7 right-2 z-50 text-xs border border-brand-bright px-3 h-5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:border-brand-dark dark:text-white/50"
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
              style={{ width: "20px", textAlign: "left", position: "relative" }}
            >
              ID
            </th>
            <th
              style={{
                textAlign: "left",
                position: "relative",
                width: "100px",
              }}
            >
              Anchor Text
            </th>
            <th
              style={{
                textAlign: "left",
                position: "relative",
                width: "100px",
              }}
            >
              Relative Link
            </th>
            <th
              style={{
                textAlign: "left",
                position: "relative",
                width: "300px",
              }}
            >
              Absolute Link
            </th>
            <th
              style={{
                textAlign: "center",
                position: "relative",
                width: "20px",
              }}
            >
              Status Code
            </th>
          </tr>
        </thead>
        <tbody>
          {data?.[0]?.inoutlinks_status_codes?.internal?.map(
            (item: any, index: number) => (
              <tr key={index}>
                <td style={{ textAlign: "left" }} className="pl-4 border">
                  {index + 1}
                </td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {item.anchor_text || ""}
                </td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {item.relative_path || ""}
                </td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {item.url || ""}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    color:
                      item?.status === 200
                        ? "green"
                        : item?.status === 400
                          ? "red"
                          : "orange",
                  }}
                  className="pl-3 border font-semibold"
                >
                  {item.status !== null ? item.status : item.error || "N/A"}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </section>
  );
};

export default React.memo(InlinksSubTable);
