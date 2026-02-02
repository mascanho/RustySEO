// @ts-nocheck
// BOTTOM OUTLINKS TABLE
import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
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

const OuterLinksSubTable = forwardRef<{ exportCSV: () => Promise<void> }, InlinksSubTableProps>(({ data, height }, ref) => {
  const tableRef = useRef<HTMLTableElement>(null);

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
    try {
      // Check if we have valid data to export
      if (!data || data.length < 2 || !data[1]?.length) {
        await message("No data to export", {
          title: "Export Error",
          type: "error",
        });
        return;
      }

      const headers = [
        "ID",
        "Source URL",
        "Target URL",
        "Anchor Text",
        "Status Code",
      ];

      // Prepare CSV data matching the table structure
      const csvData = data[1].map((item, index) => {
        const sourceUrl = data[0]?.url || "N/A";
        const targetUrl = item?.url || "N/A";
        const anchorText = item?.anchor_text || "N/A";
        const statusCode = item?.status || "N/A";

        return [
          index + 1,
          `"${sourceUrl.replace(/"/g, '""')}"`,
          `"${targetUrl.replace(/"/g, '""')}"`,
          `"${anchorText.replace(/"/g, '""')}"`,
          statusCode,
        ];
      });

      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => row.join(",")),
      ].join("\n");

      // Ask user for save location
      const filePath = await save({
        defaultPath: `RustySEO-Outlinks-Export-${new Date().toISOString().slice(0, 10)}.csv`,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });

      if (filePath) {
        await writeTextFile(filePath, csvContent);
        await message("CSV exported successfully!", {
          title: "Export Complete",
          type: "info",
        });
      }
    } catch (error) {
      console.error("Export failed:", error);
      await message(
        `Export failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          title: "Export Error",
          type: "error",
        },
      );
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

  // Expose exportCSV to parent via ref
  useImperativeHandle(ref, () => ({
    exportCSV
  }));

  // useEffect(() => {
  //   const isDark = localStorage.getItem("dark-mode");
  // }, []);

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

  // Removed unused helper functions (normalizeUrl, getAnchorText, getStatusCode)

  return (
    <section
      className="overflow-auto h-full w-full"
      style={{
        height: "100%",
        minHeight: "100px",
      }}
    >
      <table
        ref={tableRef}
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead className="text-xs top-6 sticky">
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
                ? "bg-gray-50 dark:bg-brand-dark/20"
                : "bg-white dark:bg-brand-darker";

            // Format status code color
            const statusCode = item.status;
            let statusColor = "";
            if (statusCode >= 200 && statusCode < 300) statusColor = "text-green-700";
            else if (statusCode >= 300 && statusCode < 400) statusColor = "text-orange-700"; // Redirects often orange/yellow
            else if (statusCode === 403) statusColor = "text-orange-700";
            else if (statusCode >= 400) statusColor = "text-red-700";

            return (
              <tr key={index} className={`${rowColorClass} text-xs border`}>
                <td className="text-center border border-l ">{index + 1}</td>
                <td className="pl-3 border border-l">{data?.[0].url}</td>
                <td className="pl-3 border border-l">{item?.url}</td>
                <td className="pl-3 border border-l ">
                  {item.anchor_text || "N/A"}
                </td>
                <td className={`pl-3 text-center font-semibold ${statusColor}`}>
                  {statusCode || "N/A"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
});

export default React.memo(OuterLinksSubTable);
