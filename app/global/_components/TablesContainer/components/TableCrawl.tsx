import React, { useState, useRef, useEffect } from "react";

const TableCrawl = ({ rows }: { rows: any[] }) => {
  const [columnWidths, setColumnWidths] = useState([
    "90px", // ID
    "600px", // URL
    "600px", // Page Title
    "90px", // Page title length
    "500px", // H1
    "90px", // Title title length
    "100px", // Status Code
    "150px", // Response Time 1
    "150px", // Response Time 2
    "150px", // Response Time 3
  ]);

  const [columnAlignments, setColumnAlignments] = useState([
    "center", // ID
    "left", // URL
    "left", // Page Title
    "center", // Page Title Length
    "left", // H1
    "center", // H1 Length
    "center", // Status Code
    "center", // Response Time 1
    "center", // Response Time 2
    "center", // Response Time 3
  ]);

  const [isResizing, setIsResizing] = useState(null);
  const startXRef = useRef(0);

  const headerTitles = [
    "ID",
    "URL",
    "Page Title",
    "Title Size",
    "H1",
    "H1 Size",
    "Status Code",
    "Response Time 1 (ms)",
    "Response Time 2 (ms)",
    "Response Time 3 (ms)",
  ];

  const handleMouseDown = (index, event) => {
    setIsResizing(index);
    startXRef.current = event.clientX;
    event.preventDefault();
  };

  const handleMouseMove = (event) => {
    if (isResizing === null) return;
    const delta = event.clientX - startXRef.current;
    setColumnWidths((prevWidths) => {
      const newWidths = [...prevWidths];
      const currentWidth = parseInt(newWidths[isResizing]);
      newWidths[isResizing] = `${Math.max(50, currentWidth + delta)}px`;
      return newWidths;
    });
    startXRef.current = event.clientX;
  };

  const handleMouseUp = () => {
    setIsResizing(null);
  };

  const toggleColumnAlignment = (index) => {
    setColumnAlignments((prev) => {
      const newAlignments = [...prev];
      newAlignments[index] =
        newAlignments[index] === "center" ? "left" : "center";
      return newAlignments;
    });
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const totalWidth = columnWidths.reduce((acc, width) => {
    // Convert width to pixels, handling both px and rem
    const numWidth = width.includes("rem")
      ? parseFloat(width) * 16 // 1rem = 16px
      : parseFloat(width);
    return acc + numWidth;
  }, 0);

  return (
    <div className="w-full h-full overflow-auto">
      <div style={{ minWidth: `${totalWidth}px` }}>
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr>
              {headerTitles.map((header, index) => (
                <th
                  key={header}
                  style={{
                    width: columnWidths[index],
                    position: "relative",
                    border: "1px solid #ddd",
                    padding: "8px",
                    userSelect: "none",
                    textAlign: columnAlignments[index],
                  }}
                  onClick={() => toggleColumnAlignment(index)}
                >
                  {header}
                  <div
                    onMouseDown={(e) => handleMouseDown(index, e)}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: "5px",
                      cursor: "col-resize",
                      zIndex: 1,
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.map((row, index) => (
              <tr key={`row-${index}`}>
                {[
                  index + 1,
                  row?.url,
                  row?.title?.[0].title || "",
                  row?.title?.[0].title_len || "",
                  row?.headings?.h1 || "",
                  row?.headings?.h1?.[0].length || "",
                  row?.status_code,
                  row?.responseTime,
                  row?.responseTime,
                  row?.responseTime,
                ].map((cell, cellIndex) => (
                  <td
                    key={`cell-${index}-${cellIndex}`}
                    style={{
                      width: columnWidths[cellIndex],
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: columnAlignments[cellIndex],
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableCrawl;
