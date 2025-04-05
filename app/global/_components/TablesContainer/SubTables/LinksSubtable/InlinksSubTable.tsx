// @ts-nocheck
import React, { useEffect, useRef, useCallback } from "react";

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

const InlinksSubTable: React.FC<InlinksSubTableProps> = ({ data }) => {
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

  return (
    <table ref={tableRef} style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead className="text-xs">
        <tr className="sticky top-0 shadow">
          <th
            style={{ width: "20px", textAlign: "left", position: "relative" }}
          >
            ID
          </th>
          <th
            style={{ textAlign: "left", position: "relative", width: "100px" }}
          >
            Anchor Text
          </th>
          <th
            style={{ textAlign: "left", position: "relative", width: "150px" }}
          >
            Relative URL
          </th>
          <th
            style={{ textAlign: "left", position: "relative", width: "300px" }}
          >
            Absolute URL
          </th>
          <th
            style={{ textAlign: "left", position: "relative", width: "30px" }}
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
              <td style={{ textAlign: "left" }} className="pl-3 border">
                {item.status !== null ? item.status : item.error || "N/A"}
              </td>
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
};

export default React.memo(InlinksSubTable);
