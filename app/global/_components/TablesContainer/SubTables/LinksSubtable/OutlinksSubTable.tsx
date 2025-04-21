// @ts-nocheck
import { message, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const OutlinksSubTable = ({ data }: { data: any }) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const rowHeight = "2px"; // Adjust this value to change row height

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

  // Export data as CSV
  const exportCSV = async () => {
    if (!data?.[0]?.inoutlinks_status_codes?.external?.length) {
      await message("No data to export", {
        title: "Export Error",
        type: "error",
      });
      return;
    }

    const headers = ["ID", "Anchor Text", "URL", "Status Code"];

    const csvData = data[0].inoutlinks_status_codes.external.map(
      (item: any, index: number) => [
        index + 1,
        `"${(item.anchor_text || "").replace(/"/g, '""')}"`,
        item.url || "",
        item.status || "",
      ],
    );

    const csvContent = [
      headers.join(","),
      ...csvData.map((row: string[]) => row.join(",")),
    ].join("\n");

    try {
      // Ask user for save location
      const filePath = await save({
        defaultPath: `RustySEO - Outlinks Export - ${new Date().toISOString().slice(0, 10)}.csv`,
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
    makeResizable(tableRef.current);
  }, []);

  if (
    data?.length === 0 ||
    !data?.[0]?.inoutlinks_status_codes?.external?.length
  ) {
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
    <section>
      <button
        onClick={exportCSV}
        className="absolute top-1   right-2 z-50 text-xs border dark:border-brand-bright  border-brand-bright px-3 h-5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors  dark:text-white/50"
      >
        Export
      </button>
      <Table
        ref={tableRef}
        style={{ width: "100%", borderCollapse: "collapse", zIndex: 99999 }}
      >
        <TableHeader className="text-xs h-2">
          <TableRow className="sticky top-0" style={{ height: rowHeight }}>
            <TableHead
              style={{ width: "10px", textAlign: "left", position: "relative" }}
            >
              ID
            </TableHead>
            <TableHead
              style={{
                textAlign: "left",
                position: "relative",
                width: "100px",
              }}
            >
              Anchor Text
            </TableHead>
            <TableHead
              style={{
                textAlign: "left",
                position: "relative",
                width: "300px",
              }}
            >
              Links
            </TableHead>
            <TableHead
              style={{
                textAlign: "left",
                position: "relative",
                width: "300px",
              }}
            >
              Status Code
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data[0].inoutlinks_status_codes.external.map(
            (anchorItem: any, index: number) => {
              return (
                <TableRow key={index} style={{ height: "10px" }}>
                  <TableCell
                    style={{ textAlign: "left" }}
                    className="pl-4 border w-2 h-2"
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell
                    style={{ textAlign: "left", width: "100px" }}
                    className="pl-3 border"
                  >
                    {anchorItem.anchor_text}
                  </TableCell>
                  <TableCell
                    style={{ textAlign: "left" }}
                    className="pl-3 border"
                  >
                    {anchorItem.url}
                  </TableCell>
                  <TableCell
                    style={{ textAlign: "left" }}
                    className={`pl-3 border font-semibold ${
                      anchorItem.status === 200
                        ? "text-green-700"
                        : "text-red-500"
                    }`}
                  >
                    {anchorItem.status}
                  </TableCell>
                </TableRow>
              );
            },
          )}
        </TableBody>
      </Table>
    </section>
  );
};

export default OutlinksSubTable;
