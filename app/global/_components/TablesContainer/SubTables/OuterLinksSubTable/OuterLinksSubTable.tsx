// @ts-nocheck
// BOTTOM OUTLINKS TABLE
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

const OuterLinksSubTable: React.FC<InlinksSubTableProps> = ({
  data,
  height,
}) => {
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
        const anchorTexts = getAnchorText(item, sourceUrl);
        const statusCodes = getStatusCode(item, sourceUrl);

        return [
          index + 1,
          `"${sourceUrl.replace(/"/g, '""')}"`,
          `"${targetUrl.replace(/"/g, '""')}"`,
          `"${(Array.isArray(anchorTexts) ? anchorTexts.join(", ") : anchorTexts || "N/A").replace(/"/g, '""')}"`,
          Array.isArray(statusCodes)
            ? statusCodes.join(", ")
            : statusCodes || "N/A",
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

  function normalizeUrl(url) {
    // Remove "https://" and "www." for comparison
    let normalized = url.replace(/^https?:\/\/(www\.)?/, "");
    // Ensure the normalized URL starts with "www."
    return `https://www.${normalized}`;
  }

  function getAnchorText(obj, targetUrl) {
    const normalizedTargetUrl = normalizeUrl(targetUrl);

    const anchorTexts = obj?.inoutlinks_status_codes?.internal
      .filter((item) => {
        const normalizedItemUrl = normalizeUrl(item.url);
        return normalizedItemUrl === normalizedTargetUrl;
      })
      .map((item) => item.anchor_text);

    return anchorTexts;
  }

  function getStatusCode(obj, targetUrl) {
    const normalizedTargetUrl = normalizeUrl(targetUrl);

    const statusCodes = obj?.inoutlinks_status_codes?.internal
      .filter((item) => {
        const normalizedItemUrl = normalizeUrl(item.url);
        return normalizedItemUrl === normalizedTargetUrl;
      })
      .map((item) => item.status);

    return (
      <span
        className={` font-semibold

${statusCodes?.[0] === 200 && "text-green-700"}

${statusCodes?.[0] === 404 && "text-red-700"}

${statusCodes?.[0] === 403 && "text-orange-700"}

`}
      >
        {statusCodes}
      </span>
    );
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
        className="absolute -top-6   right-1 z-50 text-xs border border-brand-bright dark:border-brand-bright px-3 h-5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors  dark:text-white/50"
      >
        Export
      </button>
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

            return (
              <tr key={index} className={`${rowColorClass} text-xs border`}>
                <td className="text-center border border-l ">{index + 1}</td>
                <td className="pl-3 border border-l">{data?.[0].url}</td>
                <td className="pl-3 border border-l">{item?.url}</td>
                <td className="pl-3 border border-l ">
                  {getAnchorText(item, data?.[0].url)}
                </td>
                <td className={`pl-3 text-center font-semibold`}>
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

export default React.memo(OuterLinksSubTable);
