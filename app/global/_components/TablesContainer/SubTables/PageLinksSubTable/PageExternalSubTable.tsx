// @ts-nocheck
import { message, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

const PageExternalSubTable = forwardRef<
  { exportCSV: () => Promise<void> },
  { data: any; height: number }
>(({ data, height }, ref) => {
  const tableRef = useRef<HTMLTableElement>(null);

  useImperativeHandle(ref, () => ({
    exportCSV: () => exportCSV(),
  }));

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

  const exportCSV = async () => {
    const externalStatusCodes =
      data?.[0]?.inoutlinks_status_codes?.external || [];

    if (!externalStatusCodes.length) {
      await message("No data to export", {
        title: "Export Error",
        type: "error",
      });
      return;
    }

    const headers = ["ID", "Anchor Text", "Link", "Status Code"];

    const csvData = externalStatusCodes.map((item: any, index: number) => [
      index + 1,
      `"${(item.anchor_text || "").replace(/"/g, '""')}"`,
      `"${(item.url || "").replace(/"/g, '""')}"`,
      item.status || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row: string[]) => row.join(",")),
    ].join("\n");

    try {
      const filePath = await save({
        defaultPath: `RustySEO - Page External Links - ${new Date().toISOString().slice(0, 10)}.csv`,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });

      if (filePath) {
        await writeTextFile(filePath, csvContent);
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
    makeResizable(tableRef.current);
  }, []);

  const externalStatusCodes =
    data?.[0]?.inoutlinks_status_codes?.external || [];

  if (!externalStatusCodes.length) {
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
          Select a URL from the HTML table to view details
        </p>
      </div>
    );
  }

  return (
    <section
      className="overflow-auto h-full w-full"
      style={{ height: `${height}px`, minHeight: "100px" }}
    >
      <table
        ref={tableRef}
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead className="text-xs top-0 sticky">
          <tr className="shadow">
            <th
              style={{ width: "50px", textAlign: "left", position: "relative" }}
              className="bg-gray-100 dark:bg-brand-dark"
            >
              ID
            </th>
            <th
              style={{
                textAlign: "left",
                position: "relative",
                minWidth: "200px",
              }}
              className="bg-gray-100 dark:bg-brand-dark"
            >
              Anchor Text
            </th>
            <th
              style={{
                textAlign: "left",
                position: "relative",
                minWidth: "400px",
              }}
              className="bg-gray-100 dark:bg-brand-dark"
            >
              Link
            </th>
            <th
              style={{
                textAlign: "center",
                position: "relative",
                width: "80px",
              }}
              className="bg-gray-100 dark:bg-brand-dark"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {externalStatusCodes.map((item: any, index: number) => (
            <tr key={index}>
              <td style={{ textAlign: "left" }} className="pl-4 border">
                {index + 1}
              </td>
              <td style={{ textAlign: "left" }} className="pl-3 border">
                {item.anchor_text || ""}
              </td>
              <td style={{ textAlign: "left" }} className="pl-3 border">
                {item.url || ""}
              </td>
              <td
                className={`border text-center font-semibold ${
                  item.status === 200 ? "text-green-700" : "text-red-500"
                }`}
              >
                {item.status || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
});

PageExternalSubTable.displayName = "PageExternalSubTable";

export default PageExternalSubTable;
