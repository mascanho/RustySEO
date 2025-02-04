// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"; // Import shadcn components
import {
  initialColumnWidths,
  initialColumnAlignments,
  headerTitles,
} from "./tableLayout";

// Define TypeScript interfaces for props and state
interface TableCrawlProps {
  rows: Array<{
    url?: string;
    title?: Array<{ title?: string; title_len?: string }>;
    headings?: { h1?: string[]; h2?: string[] };
    status_code?: number;
    word_count?: number;
    mobile?: boolean;
  }>;
}

interface TruncatedCellProps {
  text: string;
  maxLength?: number;
  width?: string;
}

interface ResizableDividerProps {
  onMouseDown: (e: React.MouseEvent) => void;
}

interface TableHeaderProps {
  headers: string[];
  columnWidths: string[];
  columnAlignments: string[];
  onResize: (index: number, e: React.MouseEvent) => void;
  onAlignToggle: (index: number) => void;
  columnVisibility: boolean[];
}

interface TableRowProps {
  row: TableCrawlProps["rows"][number];
  index: number;
  columnWidths: string[];
  columnAlignments: string[];
  columnVisibility: boolean[];
}

interface ColumnPickerProps {
  columnVisibility: boolean[];
  setColumnVisibility: (visibility: boolean[]) => void;
  headerTitles: string[];
}

// Reusable TruncatedCell Component
const TruncatedCell = ({
  text,
  maxLength = 90,
  width = "auto",
}: TruncatedCellProps) => {
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
const ResizableDivider = ({ onMouseDown }: ResizableDividerProps) => {
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
}: TableHeaderProps) => {
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
}: TableRowProps) => {
  const rowData = [
    index + 1,
    row?.url || "",
    row?.title?.[0]?.title || "",
    row?.title?.[0]?.title_len || "",
    row?.headings?.h1 || "",
    row?.headings?.h1?.[0]?.length || "",
    row?.headings?.h2 || "",
    row?.headings?.h2?.[0]?.length || "",
    row?.status_code || "",
    row?.word_count || "",
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
}: ColumnPickerProps) => {
  const handleToggle = (index: number) => {
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
const TableCrawl = ({ rows }: TableCrawlProps) => {
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);
  const [columnAlignments, setColumnAlignments] = useState(
    initialColumnAlignments,
  );
  const [isResizing, setIsResizing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnVisibility, setColumnVisibility] = useState(
    headerTitles.map(() => true),
  );
  const startXRef = useRef(0);

  // Handle column resizing
  const handleMouseDown = (index: number, event: React.MouseEvent) => {
    setIsResizing(index);
    startXRef.current = event.clientX;
    event.preventDefault();
  };

  const handleMouseMove = (event: MouseEvent) => {
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
  const toggleColumnAlignment = (index: number) => {
    setColumnAlignments((prev) => {
      const newAlignments = [...prev];
      newAlignments[index] =
        newAlignments[index] === "center" ? "left" : "center";
      return newAlignments;
    });
  };

  // Add event listeners for resizing
  useEffect(() => {
    const handleMouseMoveWrapper = (e: MouseEvent) => handleMouseMove(e);
    const handleMouseUpWrapper = () => {
      handleMouseUp();
      setIsResizing(null); // Ensure resizing is reset
    };

    document.addEventListener("mousemove", handleMouseMoveWrapper);
    document.addEventListener("mouseup", handleMouseUpWrapper);

    return () => {
      document.removeEventListener("mousemove", handleMouseMoveWrapper);
      document.removeEventListener("mouseup", handleMouseUpWrapper);
    };
  }, [isResizing]);

  // Calculate total table width
  const totalWidth = columnWidths.reduce((acc, width) => {
    if (typeof width === "string") {
      if (width.endsWith("px")) {
        return acc + parseFloat(width);
      } else if (width.endsWith("rem")) {
        return acc + parseFloat(width) * 16;
      }
    }
    return acc + 100; // Fallback width
  }, 0);

  // Normalize text by removing hyphens and converting to lowercase
  const normalizeText = (text: string) =>
    text?.toString().toLowerCase().replace(/-/g, "") ?? "";

  // Filter rows based on search term
  const filteredRows = rows.filter((row) => {
    if (!row || typeof row !== "object") return false;
    return Object.values(row).some((value) =>
      normalizeText(value?.toString()).includes(normalizeText(searchTerm)),
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
          <table className="w-full text-xs border-collapse domainCrawlParent">
            <TableHeader
              headers={headerTitles}
              columnWidths={columnWidths}
              columnAlignments={columnAlignments}
              onResize={handleMouseDown}
              onAlignToggle={toggleColumnAlignment}
              columnVisibility={columnVisibility}
            />
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, index) => (
                  <TableRow
                    key={`row-${index}`}
                    row={row}
                    index={index}
                    columnWidths={columnWidths}
                    columnAlignments={columnAlignments}
                    columnVisibility={columnVisibility}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={headerTitles.length}
                    className="text-center py-4"
                  >
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TableCrawl;
