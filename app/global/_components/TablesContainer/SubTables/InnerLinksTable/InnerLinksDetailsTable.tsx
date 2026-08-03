// @ts-nocheck
import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { message, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import LinkContextMenu from "../../components/LinkContextMenu";

interface InlinksSubTableProps {
  data: any[]; // [TargetPageObject, SourcePagesArray]
}

const InnerLinksDetailsTable = forwardRef<{ exportCSV: () => Promise<void> }, InlinksSubTableProps>(({ data, height }, ref) => {
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
        "Source URL", // From
        "Target URL", // To
        "Anchor Text",
        "Status Code",
      ];

      // Prepare CSV data matching the table structure
      const csvData = data[1].map((item, index) => {
        const sourceUrl = item?.url || "N/A";
        const targetUrl = data[0]?.url || "N/A";
        const anchorText = getAnchorText(item) || "N/A";
        const statusCode = item?.status ?? "N/A";

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
        defaultPath: `RustySEO-InnerLinks-Export-${new Date().toISOString().slice(0, 10)}.csv`,
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

  // Backend pre-computes these fields — no per-row URL scanning needed.
  function getAnchorText(obj) {
    return obj?.anchor_text || "";
  }

  // Shared parsing so the context menu's status badge matches the cell exactly.
  function parseStatusCode(raw) {
    if (raw === null || raw === undefined) return null;

    const str = String(raw).trim();
    let code: number | null = null;

    // Handle concatenated status strings stored by older crawl runs (e.g. "200429")
    if (str.length > 3 && /^\d+$/.test(str) && str.length % 3 === 0) {
      const codes: number[] = [];
      for (let i = 0; i < str.length; i += 3) {
        const chunk = parseInt(str.substring(i, i + 3), 10);
        if (!isNaN(chunk)) codes.push(chunk);
      }
      if (codes.includes(200)) code = 200;
      else if (codes.includes(429)) code = 429;
      else code = codes[0] ?? null;
    } else {
      const n = parseInt(str, 10);
      code = isNaN(n) ? null : n;
    }

    return code;
  }

  function getStatusCode(obj) {
    const code = parseStatusCode(obj?.status);

    if (code === null) return <span className="text-gray-400">-</span>;

    return (
      <span
        className={`font-semibold
          ${code === 200 ? "text-green-700" : ""}
          ${code === 404 ? "text-red-700" : ""}
          ${code === 403 ? "text-orange-700" : ""}
          ${code === 429 ? "text-red-500 font-bold" : ""}
          ${code >= 400 && code !== 429 && code !== 404 && code !== 403 ? "text-red-600" : ""}
        `}
      >
        {code}
      </span>
    );
  }

  return (
    <div
      className="relative w-full flex flex-col"
      style={{
        height: "100%",
      }}
    >

      <div className="flex-1 min-h-0 overflow-auto w-full">
        <table
          ref={tableRef}
          className="w-full border-collapse table-fixed text-xs"
        >
          <thead className="sticky top-0 z-20">
            <tr className="shadow bg-white dark:bg-brand-dark">
              <th
                className="border border-gray-200 dark:border-gray-700 py-1"
                style={{
                  width: "40px",
                  textAlign: "center",
                }}
              >
                ID
              </th>
              <th
                className="border border-gray-200 dark:border-gray-700 py-1 px-2 text-left"
                style={{ width: "25%" }}
              >
                From
              </th>
              <th
                className="border border-gray-200 dark:border-gray-700 py-1 px-2 text-left"
                style={{ width: "25%" }}
              >
                To
              </th>
              <th
                className="border border-gray-200 dark:border-gray-700 py-1 px-2 text-left"
                style={{ width: "auto" }} // Flexible width
              >
                Anchor Text
              </th>
              <th
                className="border border-gray-200 dark:border-gray-700 py-1 px-2 text-center"
                style={{ width: "100px" }}
              >
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {data?.[1]?.map((item: any, index: number) => {
              const rowColorClass =
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-brand-dark/20"
                  : "bg-white dark:bg-brand-darker";

              return (
                <tr key={index} className={`${rowColorClass} border-b dark:border-brand-dark/50 hover:opacity-80`}>
                  <td className="text-center border-r border-gray-200 dark:border-gray-700 py-1">
                    {index + 1}
                  </td>
                  <td
                    className="px-2 border-r border-gray-200 dark:border-gray-700 py-1 truncate max-w-0"
                    title={item?.url}
                  >
                    <LinkContextMenu
                      url={item?.url}
                      role="source"
                      anchorText={getAnchorText(item)}
                      statusCode={parseStatusCode(item?.status)}
                    >
                      {item?.url}
                    </LinkContextMenu>
                  </td>
                  <td
                    className="px-2 border-r border-gray-200 dark:border-gray-700 py-1 truncate max-w-0"
                    title={data?.[0].url}
                  >
                    <LinkContextMenu
                      url={data?.[0].url}
                      role="target"
                      anchorText={getAnchorText(item)}
                    >
                      {data?.[0].url}
                    </LinkContextMenu>
                  </td>
                  <td
                    className="px-2 border-r border-gray-200 dark:border-gray-700 py-1 truncate max-w-0"
                    title={getAnchorText(item)}
                  >
                    {getAnchorText(item)}
                  </td>
                  <td className="px-2 text-center py-1">
                    {getStatusCode(item)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default React.memo(InnerLinksDetailsTable);
