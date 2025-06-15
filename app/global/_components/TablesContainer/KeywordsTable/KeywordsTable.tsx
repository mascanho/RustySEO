// @ts-nocheck
"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import debounce from "lodash/debounce";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { TbColumns3 } from "react-icons/tb";
import DownloadButton from "./DownloadButton";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { toast } from "sonner";
import { writeFile } from "@tauri-apps/plugin-fs";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

interface TableCrawlProps {
  rows: Array<{
    url?: string;
    keywords?: Array<[string, number]>; // Array of [keyword, count]
  }>;
  rowHeight?: number;
  overscan?: number;
  tabName: string;
}

interface TruncatedCellProps {
  text: string | React.ReactNode;
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
  clickedRow: number | null;
  handleRowClick: (rowIndex: number) => void;
  keywordColumns: string[]; // List of keyword columns
  isZebraRow: boolean; // For zebra striping
}

interface ColumnPickerProps {
  columnVisibility: boolean[];
  setColumnVisibility: (visibility: boolean[]) => void;
  headerTitles: string[];
}

const TruncatedCell = ({
  text,
  maxLength = 100,
  width = "100%",
}: TruncatedCellProps) => {
  const truncatedText = useMemo(() => {
    if (!text) return "";
    if (typeof text !== "string") return text;
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }, [text, maxLength]);

  return useMemo(
    () => (
      <div
        style={{
          width: "100%", // Use 100% to fill the available space
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {truncatedText}
      </div>
    ),
    [truncatedText],
  );
};

const ResizableDivider = ({ onMouseDown }: ResizableDividerProps) => {
  return useMemo(
    () => (
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
    ),
    [onMouseDown],
  );
};

const TableHeader = ({
  headers,
  columnWidths,
  columnAlignments,
  onResize,
  onAlignToggle,
  columnVisibility,
}: TableHeaderProps) => {
  return useMemo(
    () => (
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
                  padding: "8px 8px 2px 8px",
                  userSelect: "none",
                  minWidth: columnWidths[index],
                  maxWidth: columnWidths[index],
                  textAlign: columnAlignments[index] as any,
                  backgroundColor: "var(--background, white)",
                  height: "10px",
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
    ),
    [
      headers,
      columnWidths,
      columnAlignments,
      onResize,
      onAlignToggle,
      columnVisibility,
    ],
  );
};

const TableRow = ({
  row,
  index,
  columnWidths,
  columnAlignments,
  columnVisibility,
  clickedRow,
  handleRowClick,
  keywordColumns,
  isZebraRow,
}: TableRowProps) => {
  const isRowClicked = clickedRow === index;

  // Determine row background based on zebra striping and click state
  const getRowClassName = () => {
    if (isRowClicked) {
      return "bg-brand-bright text-white text-black dark:text-white"; // Blue background for clicked row
    }
    if (isZebraRow) {
      return "bg-gray-50 dark:bg-gray-800/50 dark:text-white"; // Zebra striping for odd rows
    }
    return "bg-white dark:bg-transparent dark:text-white"; // Default background
  };

  return useMemo(
    () => (
      <tr
        onClick={() => handleRowClick(index)}
        className={getRowClassName()}
        style={{ height: `25px` }} // Fixed row height
      >
        {/* ID Column */}
        {columnVisibility[0] && (
          <td
            key={`cell-${index}-id`}
            style={{
              width: columnWidths[0],
              minWidth: columnWidths[0],
              maxWidth: columnWidths[0],
            }}
            className={`not-selectable p-1 pl-3 border border-gray-300 dark:border-gray-700 ${
              columnAlignments[0] === "center" ? "text-center" : "text-left"
            }`}
          >
            <TruncatedCell
              text={(index + 1).toString()}
              width={columnWidths[0]}
            />
          </td>
        )}

        {/* URL Column */}
        {columnVisibility[1] && (
          <td
            key={`cell-${index}-url`}
            style={{
              width: columnWidths[1],
              minWidth: columnWidths[1],
              maxWidth: columnWidths[1],
            }}
            className={`p-1 pl-3 border border-gray-300 dark:border-gray-700 ${
              columnAlignments[1] === "center" ? "text-center" : "text-left"
            }`}
          >
            <TruncatedCell text={row.url || ""} width={columnWidths[1]} />
          </td>
        )}

        {/* Keyword Columns */}
        {keywordColumns.map((_, cellIndex) => {
          const keywordData = row.keywords?.[cellIndex];
          const keyword = keywordData?.[0] || "";
          const count = keywordData?.[1] || 0;

          return columnVisibility[cellIndex + 2] ? (
            <td
              key={`cell-${index}-${cellIndex}`}
              style={{
                width: columnWidths[cellIndex + 2],
                minWidth: columnWidths[cellIndex + 2],
                maxWidth: columnWidths[cellIndex + 2],
              }}
              className={`p-1 border border-gray-300 dark:border-gray-700 ${
                columnAlignments[cellIndex + 2] === "center"
                  ? "text-center"
                  : "text-left"
              }`}
            >
              <TruncatedCell
                text={
                  <>
                    {keyword}{" "}
                    <span
                      className={
                        isRowClicked
                          ? "text-brand-bright" // Gold color for clicked row
                          : "text-brand-bright" // Orange color for non-clicked row
                      }
                    >
                      <span className="text-blue-900">({count})</span>
                    </span>
                  </>
                }
                width={columnWidths[cellIndex + 2]}
              />
            </td>
          ) : null;
        })}
      </tr>
    ),
    [
      row,
      index,
      columnWidths,
      columnAlignments,
      columnVisibility,
      clickedRow,
      handleRowClick,
      keywordColumns,
      isRowClicked,
      isZebraRow,
    ],
  );
};

const ColumnPicker = ({
  columnVisibility,
  setColumnVisibility,
  headerTitles,
}: ColumnPickerProps) => {
  const handleToggle = useCallback(
    (index: number) => {
      setColumnVisibility((prev) => {
        const newVisibility = [...prev];
        newVisibility[index] = !newVisibility[index];
        return newVisibility;
      });
    },
    [setColumnVisibility],
  );

  return useMemo(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="border dark:border-white/20  w-8  flex justify-center items-center rounded h-6">
            <TbColumns3 className="w-5 h-5 dark:text-white/50 p-1 " />
          </div>
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
    ),
    [columnVisibility, handleToggle, headerTitles],
  );
};

const KeywordsTable = ({
  rows,
  rowHeight = 25,
  overscan = 5, // Reduced overscan for better performance
  tabName,
}: TableCrawlProps) => {
  const [columnWidths, setColumnWidths] = useState<string[]>([]);
  const [columnAlignments, setColumnAlignments] = useState<string[]>([]);
  const [isResizing, setIsResizing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<boolean[]>([]);
  const { isGeneratingExcel, setIsGeneratingExcel } = useGlobalCrawlStore();
  const startXRef = useRef(0);

  // Determine the maximum number of keywords across all URLs
  const maxKeywords = useMemo(() => {
    return Math.max(...rows.map((row) => row.keywords?.length || 0));
  }, [rows]);

  // Generate column headers ("Top 1", "Top 2", etc.)
  const keywordColumns = useMemo(() => {
    return Array.from({ length: maxKeywords }, (_, i) => `Top ${i + 1}`);
  }, [maxKeywords]);

  // Initialize column widths and alignments
  useEffect(() => {
    const initialWidths = [
      "60px",
      "300px",
      ...keywordColumns.map(() => "150px"),
    ];
    const initialAlignments = [
      "center",
      "left",
      ...keywordColumns.map(() => "center"),
    ];
    const initialVisibility = [true, true, ...keywordColumns.map(() => true)];

    setColumnWidths(initialWidths);
    setColumnAlignments(initialAlignments);
    setColumnVisibility(initialVisibility);
  }, [keywordColumns]);

  // Handle column resizing
  const handleMouseDown = useCallback(
    (index: number, event: React.MouseEvent) => {
      setIsResizing(index);
      startXRef.current = event.clientX;
      event.preventDefault();
    },
    [],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isResizing === null) return;

      const delta = event.clientX - startXRef.current;
      setColumnWidths((prevWidths) => {
        const newWidths = [...prevWidths];
        const currentWidth = Number.parseInt(newWidths[isResizing]);
        newWidths[isResizing] = `${Math.max(50, currentWidth + delta)}px`;
        return newWidths;
      });
      startXRef.current = event.clientX;
    },
    [isResizing],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  // Event listeners for resizing
  useEffect(() => {
    if (isResizing !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Calculate total table width
  const totalWidth = useMemo(
    () =>
      columnWidths.reduce((acc, width) => {
        if (typeof width === "string") {
          if (width.endsWith("px")) {
            return acc + Number.parseFloat(width);
          } else if (width.endsWith("rem")) {
            return acc + Number.parseFloat(width) * 16;
          }
        }
        return acc + 100;
      }, 0),
    [columnWidths],
  );

  const toggleColumnAlignment = useCallback((index: number) => {
    setColumnAlignments((prev) => {
      const newAlignments = [...prev];
      newAlignments[index] =
        newAlignments[index] === "center" ? "left" : "center";
      return newAlignments;
    });
  }, []);

  // State to track the clicked row
  const [clickedRow, setClickedRow] = useState<number | null>(null);

  // Handle row click
  const handleRowClick = (rowIndex: number) => {
    setClickedRow((prevClickedRow) => {
      if (prevClickedRow === rowIndex) {
        // If the clicked row is already highlighted, unhighlight it
        return null;
      } else {
        // Otherwise, highlight the clicked row
        return rowIndex;
      }
    });
  };

  // Memoize filtered rows
  const filteredRows = useMemo(() => {
    if (!rows || !Array.isArray(rows)) return [];

    const normalizeText = (text: string) =>
      text?.toString().toLowerCase().replace(/-/g, "") ?? "";

    const searchTermNormalized = normalizeText(searchTerm);

    return searchTerm
      ? rows.filter((row) => {
          if (!row || typeof row !== "object") return false;
          return Object.values(row).some((value) =>
            normalizeText(value?.toString()).includes(searchTermNormalized),
          );
        })
      : rows;
  }, [rows, searchTerm]);

  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize virtualizer with proper configuration
  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    [],
  );

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Define the handleDownload function
  const handleDownload = async () => {
    if (!rows.length) {
      toast.error("No data to download");
      return;
    }

    // Set the loader state to true
    setIsGeneratingExcel(true);
    try {
      // Call the backend command to generate the Excel file
      const fileBuffer = await invoke("create_keywords_excel_command", {
        data: rows,
      });

      setIsGeneratingExcel(false);

      // Prompt the user to choose a file path to save the Excel file
      const filePath = await save({
        filters: [
          {
            name: "Excel File",
            extensions: ["xlsx"],
          },
        ],
        defaultPath: `RustySEO-${tabName}.xlsx`, // Default file name
      });

      if (filePath) {
        // Convert the Uint8Array to a binary file and save it
        await writeFile(filePath, new Uint8Array(fileBuffer));
        toast.success("Excel file saved successfully!");
      } else {
        console.log("User canceled the save dialog.");
      }
    } catch (error) {
      console.error("Error generating or saving Excel file:", error);
      toast.error("Failed to generate or save Excel file.");
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  return (
    <>
      <div className="text-xs dark:bg-brand-darker sticky top-0 flex gap-1 z-20 not-selectable">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => debouncedSearch(e.target.value)}
          className="w-full p-1 pl-2 h-6 dark:bg-brand-darker border dark:border-brand-dark dark:text-white border-gray-300 rounded"
        />
        <DownloadButton
          download={handleDownload}
          loading={isGeneratingExcel}
          setLoading={setIsGeneratingExcel}
        />
        <div className="mr-1.5">
          <ColumnPicker
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            headerTitles={["ID", "URL", ...keywordColumns]}
          />
        </div>
      </div>
      <div
        ref={parentRef}
        className="w-full h-[calc(100%-1.9rem)] overflow-auto relative not-selectable"
      >
        <div
          style={{
            minWidth: `${totalWidth}px`,
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {/* Fixed Header */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              minWidth: `${totalWidth}px`,
            }}
          >
            <table
              className="w-full text-xs border-collapse"
              style={{ minWidth: `${totalWidth}px`, tableLayout: "fixed" }}
            >
              <TableHeader
                headers={["ID", "URL", ...keywordColumns]}
                columnWidths={columnWidths}
                columnAlignments={columnAlignments}
                onResize={handleMouseDown}
                onAlignToggle={toggleColumnAlignment}
                columnVisibility={columnVisibility}
              />
            </table>
          </div>

          {/* Virtual Rows Container */}
          <div
            style={{
              position: "relative",
              minWidth: `${totalWidth}px`,
            }}
          >
            {filteredRows.length > 0 ? (
              virtualRows.map((virtualRow) => {
                const isZebraRow = virtualRow.index % 2 === 1; // Odd rows get zebra styling

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <table
                      className="w-full text-xs border-collapse"
                      style={{
                        minWidth: `${totalWidth}px`,
                        tableLayout: "fixed",
                      }}
                    >
                      <tbody>
                        <TableRow
                          row={filteredRows[virtualRow.index]}
                          index={virtualRow.index}
                          columnWidths={columnWidths}
                          columnAlignments={columnAlignments}
                          columnVisibility={columnVisibility}
                          clickedRow={clickedRow}
                          handleRowClick={handleRowClick}
                          keywordColumns={keywordColumns}
                          isZebraRow={isZebraRow}
                        />
                      </tbody>
                    </table>
                  </div>
                );
              })
            ) : (
              <div
                className="text-center py-4"
                style={{ minWidth: `${totalWidth}px` }}
              >
                <table
                  className="w-full text-xs border-collapse"
                  style={{ minWidth: `${totalWidth}px`, tableLayout: "fixed" }}
                >
                  <tbody>
                    <tr>
                      <td
                        colSpan={keywordColumns.length + 2}
                        className="text-center py-4"
                      >
                        No data available.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default KeywordsTable;
