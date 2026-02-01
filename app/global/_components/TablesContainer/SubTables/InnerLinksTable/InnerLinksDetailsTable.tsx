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
        "Source URL", // From
        "Target URL", // To
        "Anchor Text",
        "Status Code",
      ];

      // Prepare CSV data matching the table structure
      const csvData = data[1].map((item, index) => {
        const sourceUrl = item?.url || "N/A";
        const targetUrl = data[0]?.url || "N/A";
        const anchorTexts = getAnchorText(item, targetUrl);
        const statusCodes = getStatusCode(item, targetUrl);

        // Extract just the status code number (removes the JSX span element)
        const statusCodeValue = Array.isArray(statusCodes?.props?.children)
          ? statusCodes.props.children[0]
          : statusCodes?.props?.children || "N/A";

        return [
          index + 1,
          `"${sourceUrl.replace(/"/g, '""')}"`,
          `"${targetUrl.replace(/"/g, '""')}"`,
          `"${(Array.isArray(anchorTexts) ? anchorTexts.join(", ") : anchorTexts || "N/A").replace(/"/g, '""')}"`,
          statusCodeValue,
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

  function normalizeUrl(url) {
    if (!url) return "";
    try {
      let u = url.toString().trim().toLowerCase();
      // Remove protocol
      u = u.replace(/^(?:https?:\/\/)?/i, "");
      // Remove www
      u = u.replace(/^www\./i, "");

      // Remove query params and hash
      const queryIdx = u.indexOf("?");
      if (queryIdx !== -1) u = u.substring(0, queryIdx);

      const hashIdx = u.indexOf("#");
      if (hashIdx !== -1) u = u.substring(0, hashIdx);

      // Remove trailing slash
      if (u.endsWith("/")) u = u.slice(0, -1);
      return u;
    } catch (e) {
      console.error("Error normalizing URL:", e);
      return "";
    }
  }

  function getAnchorText(obj, targetUrl) {
    const normalizedTargetUrl = normalizeUrl(targetUrl);

    const anchorTexts = obj?.inoutlinks_status_codes?.internal
      ?.filter((item) => {
        const normalizedItemUrl = normalizeUrl(item.url);
        return normalizedItemUrl === normalizedTargetUrl;
      })
      .map((item) => item.anchor_text);

    return [...new Set(anchorTexts)].join(", ");
  }

  function getStatusCode(obj, targetUrl) {
    const normalizedTargetUrl = normalizeUrl(targetUrl);

    const rawStatuses = obj?.inoutlinks_status_codes?.internal
      ?.filter((item) => {
        const normalizedItemUrl = normalizeUrl(item.url);
        return normalizedItemUrl === normalizedTargetUrl;
      })
      .map((item) => item.status);

    const processedStatuses = new Set<number>();

    // Helper to process a single status value
    const addStatus = (val: any) => {
      if (val === null || val === undefined) return;
      if (Array.isArray(val)) {
        val.forEach(addStatus);
        return;
      }

      const str = String(val).trim();
      // If it looks like a concatenated status string (e.g. "200200")
      if (str.length > 3 && /^\d+$/.test(str) && str.length % 3 === 0) {
        for (let i = 0; i < str.length; i += 3) {
          const chunk = parseInt(str.substring(i, i + 3), 10);
          if (!isNaN(chunk)) processedStatuses.add(chunk);
        }
      } else {
        const num = parseInt(str, 10);
        if (!isNaN(num)) processedStatuses.add(num);
      }
    };

    if (Array.isArray(rawStatuses)) {
      rawStatuses.forEach(addStatus);
    }

    // Remove 429 as requested
    processedStatuses.delete(429);

    const uniqueStatusCodes = Array.from(processedStatuses);

    if (uniqueStatusCodes.length === 0) return <span className="text-gray-400">-</span>;

    return (
      <span className="font-semibold">
        {uniqueStatusCodes.map((code, idx) => (
          <React.Fragment key={code}>
            <span
              className={`
                ${code === 200 ? "text-green-700" : ""}
                ${code === 404 ? "text-red-700" : ""}
                ${code === 403 ? "text-orange-700" : ""}
              `}
            >
              {code}
            </span>
            {idx < uniqueStatusCodes.length - 1 && ", "}
          </React.Fragment>
        ))}
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
      <button
        onClick={exportCSV}
        className="absolute top-1 right-2 z-50 text-xs border border-brand-bright dark:border-brand-bright px-2 py-0.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-white/80 bg-white dark:bg-brand-dark"
      >
        Export
      </button>

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
            {data?.[1].map((item: any, index: number) => {
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
                    title={data?.[0].url}
                  >
                    {data?.[0].url}
                  </td>
                  <td
                    className="px-2 border-r border-gray-200 dark:border-gray-700 py-1 truncate max-w-0"
                    title={item?.url}
                  >
                    {item?.url}
                  </td>
                  <td
                    className="px-2 border-r border-gray-200 dark:border-gray-700 py-1 truncate max-w-0"
                    title={getAnchorText(item, data?.[0].url)}
                  >
                    {getAnchorText(item, data?.[0].url)}
                  </td>
                  <td className="px-2 text-center py-1">
                    {getStatusCode(item, data?.[0].url)}
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

export default React.memo(InnerLinksDetailsTable);
