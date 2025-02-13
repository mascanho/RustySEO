import React, { useEffect, useRef } from "react";

interface InlinksSubTableProps {
  data: {
    anchor_links: {
      internal: {
        anchors: string[];
        links: string[];
      };
    };
  }[];
}

const InlinksSubTable: React.FC<InlinksSubTableProps> = ({ data }) => {
  console.log(data, "data");

  const isDark = localStorage.getItem("dark-mode");

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

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    makeResizable(tableRef.current);
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
            style={{ textAlign: "left", position: "relative", width: "300px" }}
          >
            Links
          </th>
        </tr>
      </thead>
      <tbody>
        {data?.[0]?.anchor_links?.internal?.anchors?.map(
          (anchorItem: string, index: number) => {
            const linkItem = data?.[0]?.anchor_links?.internal?.links?.[index];
            return (
              <tr key={index}>
                <td style={{ textAlign: "left" }} className="pl-4 border">
                  {index + 1}
                </td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {anchorItem}
                </td>
                <td style={{ textAlign: "left" }} className="pl-3 border">
                  {linkItem}
                </td>
              </tr>
            );
          },
        )}
      </tbody>
    </table>
  );
};

export default InlinksSubTable;
