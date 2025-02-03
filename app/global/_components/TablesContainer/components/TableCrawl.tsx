// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"; // Import shadcn components
import {
  initialColumnWidths,
  initialColumnAlignments,
  headerTitles,
} from "./tableLayout.ts";

// Reusable TruncatedCell Component
const TruncatedCell = ({ text, maxLength = 90, width = "auto" }) => {
  const truncatedText =
    text && text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

  return (
    <div
      style={{
        width,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {truncatedText}
    </div>
  );
};

// Reusable ResizableDivider Component
const ResizableDivider = ({ onMouseDown }) => {
  return (
    <div
      onMouseDown={onMouseDown}
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
  );
};

// Reusable TableHeader Component
const TableHeader = ({
  headers,
  columnWidths,
  columnAlignments,
  onResize,
  onAlignToggle,
  columnVisibility,
}) => {
  return (
    <thead className="sticky top-0 z-10 domainCrawl border">
      <tr>
        {headers.map((header, index) =>
          columnVisibility[index] ? (
            <th
              key={header}
              style={{
                width: columnWidths[index],
                position: "relative",
                border: "1px solid #ddd",
                padding: "8px",
                userSelect: "none",
                minWidth: columnWidths[index],
                textAlign: columnAlignments[index],
              }}
              onClick={() => onAlignToggle(index)}
            >
              {header}
              <ResizableDivider onMouseDown={(e) => onResize(index, e)} />
            </th>
          ) : null,
        )}
      </tr>
    </thead>
  );
};

// Reusable TableRow Component
const TableRow = ({
  row,
  index,
  columnWidths,
  columnAlignments,
  columnVisibility,
}) => {
  const rowData = [
    index + 1,
    row?.url,
    row?.title?.[0].title || "",
    row?.title?.[0].title_len || "",
    row?.headings?.h1 || "",
    row?.headings?.h1?.[0].length || "",
    row?.headings?.h2 || "",
    row?.headings?.h2?.[0].length || "",
    row?.status_code,
    row?.word_count,
    row?.mobile ? "Yes" : "No",
  ];

  return (
    <tr key={`row-${index}`}>
      {rowData.map((cell, cellIndex) =>
        columnVisibility[cellIndex] ? (
          <td
            key={`cell-${index}-${cellIndex}`}
            style={{
              width: columnWidths[cellIndex],
              border: "1px solid #ddd",
              padding: "8px",
              textAlign: columnAlignments[cellIndex],
              overflow: "hidden",
              whiteSpace: "nowrap",
              minWidth: columnWidths[cellIndex],
            }}
            className="dark:text-white/50"
          >
            <TruncatedCell
              text={cell?.toString()}
              width={columnWidths[cellIndex]}
            />
          </td>
        ) : null,
      )}
    </tr>
  );
};

// Column Picker Component (Dropdown using shadcn)
const ColumnPicker = ({
  columnVisibility,
  setColumnVisibility,
  headerTitles,
}) => {
  const handleToggle = (index) => {
    setColumnVisibility((prev) => {
      const newVisibility = [...prev];
      newVisibility[index] = !newVisibility[index];
      return newVisibility;
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 dark:bg-brand-darker border dark:border-brand-dark dark:text-white border-gray-300 rounded">
          Columns
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-32 bg-white dark:bg-brand-darker border dark:border-brand-dark rounded shadow-lg z-20">
        {headerTitles.map((header, index) => (
          <DropdownMenuCheckboxItem
            key={header}
            checked={columnVisibility[index] ?? true}
            onCheckedChange={() => handleToggle(index)}
            className="p-2 hover:bg-gray-100 w-fit dark:hover:bg-brand-dark space-x-6 dark:text-white text-brand-bright"
          >
            <span className="ml-5 dark:text-brand-bright">{header}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Main TableCrawl Component
const TableCrawl = ({ rows }) => {
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);
  const [columnAlignments, setColumnAlignments] = useState(
    initialColumnAlignments,
  );
  const [isResizing, setIsResizing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnVisibility, setColumnVisibility] = useState(
    headerTitles.map(() => true),
  );
  const startXRef = useRef(0);

  // Handle column resizing
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

  // Toggle column alignment
  const toggleColumnAlignment = (index) => {
    setColumnAlignments((prev) => {
      const newAlignments = [...prev];
      newAlignments[index] =
        newAlignments[index] === "center" ? "left" : "center";
      return newAlignments;
    });
  };

  // Add event listeners for resizing
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Calculate total table width
  const totalWidth = columnWidths.reduce((acc, width) => {
    const numWidth = width.includes("rem")
      ? parseFloat(width) * 16
      : parseFloat(width);
    return acc + numWidth;
  }, 0);

  // Normalize text by removing hyphens and converting to lowercase
  const normalizeText = (text) =>
    text?.toString().toLowerCase().replace(/-/g, "") ?? "";

  // Filter rows based on search term
  const filteredRows = rows.filter((row) => {
    return Object.values(row).some((value) =>
      normalizeText(value).includes(normalizeText(searchTerm)),
    );
  });

  return (
    <>
      {/* Global Search Filter and Column Picker */}
      <div className="text-xs dark:bg-brand-darker sticky top-0 flex gap-2">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-1 dark:bg-brand-darker border dark:border-brand-dark dark:text-white border-gray-300 rounded"
        />
        <ColumnPicker
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          headerTitles={headerTitles}
        />
      </div>
      <div className="w-full h-[calc(100%-28px)] overflow-auto relative">
        <div
          style={{ minWidth: `${totalWidth}px` }}
          className="domainCrawlParent"
        >
          <table className="w-full text-xs border-collapse domainCrawlParent ">
            <TableHeader
              headers={headerTitles}
              columnWidths={columnWidths}
              columnAlignments={columnAlignments}
              onResize={handleMouseDown}
              onAlignToggle={toggleColumnAlignment}
              columnVisibility={columnVisibility}
            />
            <tbody>
              {filteredRows?.map((row, index) => (
                <TableRow
                  key={`row-${index}`}
                  row={row}
                  index={index}
                  columnWidths={columnWidths}
                  columnAlignments={columnAlignments}
                  columnVisibility={columnVisibility}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TableCrawl;
