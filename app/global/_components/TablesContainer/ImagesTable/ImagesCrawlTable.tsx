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
import {
  initialColumnWidths,
  initialColumnAlignments,
  headerTitles,
} from "./tableLayout";
import { TbColumns3 } from "react-icons/tb";
import DownloadButton from "./DownloadButton";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";

interface TruncatedCellProps {
  text: string;
  maxLength?: number;
  width?: string;
}

interface ResizableDividerProps {
  onMouseDown: (event: React.MouseEvent) => void;
}

interface TableHeaderProps {
  headers: string[];
  columnWidths: string[];
  columnAlignments: string[];
  onResize: (index: number, event: React.MouseEvent) => void;
  onAlignToggle: (index: number) => void;
  columnVisibility: boolean[];
}

interface TableRowProps {
  row: any[];
  index: number;
  columnWidths: string[];
  columnAlignments: string[];
  columnVisibility: boolean[];
  clickedCell: { row: number | null; cell: number | null };
  handleCellClick: (
    rowIndex: number,
    cellIndex: number,
    cellContent: string,
  ) => void;
}

interface ColumnPickerProps {
  columnVisibility: boolean[];
  setColumnVisibility: (visibility: boolean[]) => void;
  headerTitles: string[];
}

interface TableCrawlProps {
  rows: any[];
  rowHeight?: number;
  overscan?: number;
  tabName: string;
}

const TruncatedCell = ({
  text,
  maxLength = 140,
  width = "auto",
}: TruncatedCellProps) => {
  const truncatedText = useMemo(() => {
    if (!text) return "";
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }, [text, maxLength]);

  return useMemo(
    () => (
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
    ),
    [width, truncatedText],
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
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <table
          className="w-full text-xs border-collapse"
          style={{ tableLayout: "fixed" }}
        >
          <thead>
            <tr>
              {headers.map((header, index) =>
                columnVisibility[index] ? (
                  <th
                    key={header}
                    style={{
                      width: columnWidths[index],
                      position: "relative",
                      border: "1px solid #ddd",
                      // padding: "20px 0 10px 40px",
                      userSelect: "none",
                      minWidth: columnWidths[index],
                      textAlign: columnAlignments[index],
                      backgroundColor: "var(--background, white)",
                      height: "30px",
                    }}
                    className="dark:border-gray-600 dark:bg-gray-800 bg-gray-50 font-medium text-gray-900 dark:text-gray-100"
                    onClick={() => onAlignToggle(index)}
                  >
                    {header}
                    <ResizableDivider onMouseDown={(e) => onResize(index, e)} />
                  </th>
                ) : null,
              )}
            </tr>
          </thead>
        </table>
      </div>
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
  clickedCell,
  handleCellClick,
}: TableRowProps) => {
  const rowData = useMemo(
    () => [
      index + 1,
      row[1] || "",
      row[0] || "",
      row[2] + " KB" || "",
      row[3] || "",
      row[4] || "",
    ],
    [row, index],
  );

  const isOdd = index % 2 === 1;

  return useMemo(
    () => (
      <>
        {rowData.map((cell, cellIndex) =>
          columnVisibility[cellIndex] ? (
            <td
              key={`cell-${index}-${cellIndex}`}
              onClick={() => handleCellClick(index, cellIndex, cell.toString())}
              style={{
                width: columnWidths[cellIndex],
                border: "1px solid #ddd",
                padding: "8px",
                textAlign: columnAlignments[cellIndex],
                overflow: "hidden",
                whiteSpace: "nowrap",
                minWidth: columnWidths[cellIndex],
                height: "25px",
              }}
              className={`
                select-none
                border-gray-200 dark:border-gray-700
                transition-colors
                ${
                  clickedCell.row === index && clickedCell.cell === cellIndex
                    ? "bg-blue-600 dark:bg-blue-700 text-white hover:bg-brand-bright" // Selected cell
                    : isOdd
                      ? "bg-gray-100 dark:bg-brand-dark/20" // Odd row (darker)
                      : "bg-white dark:bg-brand-darker" // Even row (lighter)
                }
                hover:bg-blue-50 dark:hover:bg-blue-900/30
              `}
            >
              <TruncatedCell
                text={cell?.toString()}
                width={columnWidths[cellIndex]}
              />
            </td>
          ) : null,
        )}
      </>
    ),
    [
      rowData,
      columnWidths,
      columnAlignments,
      columnVisibility,
      index,
      clickedCell,
      handleCellClick,
      isOdd,
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
          <div className="border dark:border-white/20   w-8  flex  dark:hover:border-brand-bright dark:hover:border   justify-center items-center rounded h-6 hover:border-brand-bright cursor-pointer active:bg-brand-bright active:text-white">
            <TbColumns3 className="w-5 h-5 dark:text-white/50 p-1 " />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-32 bg-white text-black active:text-white dark:bg-brand-darker border dark:border-brand-dark rounded shadow-lg z-20">
          {headerTitles.map((header, index) => (
            <DropdownMenuCheckboxItem
              key={header}
              checked={columnVisibility[index] ?? true}
              onCheckedChange={() => handleToggle(index)}
              className="p-2 hover:bg-gray-100  dark:hover:bg-brand-dark space-x-6 dark:text-white text-black active:text-white hover:text-white w-full "
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

const ImagesCrawlTable = ({
  rows,
  rowHeight = 25,
  overscan = 18,
  tabName,
}: TableCrawlProps) => {
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);
  const [columnAlignments, setColumnAlignments] = useState(
    initialColumnAlignments,
  );
  const [isResizing, setIsResizing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnVisibility, setColumnVisibility] = useState(
    headerTitles.map(() => true),
  );

  const handleDownload = async () => {
    try {
      // Call the backend command to generate the Excel file

      if (!rows.length) {
        toast.error("No data to download, crawl something first");
        return;
      }

      const fileBuffer = await invoke("create_excel", { data: rows });

      // Prompt the user to choose a file path to save the Excel file
      const filePath = await save({
        filters: [
          {
            name: "Excel File",
            extensions: ["xlsx"],
          },
        ],
        defaultPath: `RustySEO-${tabName}`, // Default file name
      });

      if (filePath) {
        // Convert the Uint8Array to a binary file and save it
        await writeFile(filePath, new Uint8Array(fileBuffer));
      } else {
        console.log("User canceled the save dialog.");
      }
    } catch (error) {
      console.error("Error generating or saving Excel file:", error);
    }
  };

  // State to track the clicked cell (rowIndex, cellIndex)
  const [clickedCell, setClickedCell] = useState<{
    row: number | null;
    cell: number | null;
  }>({
    row: null,
    cell: null,
  });
  const { setSelectedTableURL } = useGlobalCrawlStore();

  const filterTableURL = (arr: { url: string }[], url: string) => {
    if (!arr || arr.length === 0) return [];
    return arr.filter((item) => item.url === url);
  };

  // Handle cell click
  const handleCellClick = (
    rowIndex: number,
    cellIndex: number,
    cellContent: string,
  ) => {
    setClickedCell((prevClickedCell) => {
      if (
        prevClickedCell.row === rowIndex &&
        prevClickedCell.cell === cellIndex
      ) {
        // If the clicked cell is already highlighted, unhighlight it
        return { row: null, cell: null };
      } else {
        // Otherwise, highlight the clicked cell
        return { row: rowIndex, cell: cellIndex };
      }
    });

    if (cellIndex === 1) {
      // const urlData = filterTableURL(rows, cellContent);
      // setSelectedTableURL(urlData);
      // console.log(urlData);
    }

    // console.log(cellContent, rowIndex, cellIndex);
  };

  const startXRef = useRef(0);
  const parentRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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

  // Initialize virtualizer with proper sizing
  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
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

  // Column resizing handlers
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
      columnWidths.reduce((acc, width, index) => {
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

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <>
      <div className="text-xs dark:bg-brand-darker relative top-0 flex gap-1 pb-1">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => debouncedSearch(e.target.value)}
          className="w-full p-1 pl-3 h-6 dark:bg-brand-darker border dark:border-brand-dark dark:text-white  rounded-r relative"
        />
        <DownloadButton download={handleDownload} />
        <div className="mr-1.5">
          <ColumnPicker
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            headerTitles={headerTitles}
          />
        </div>
        <div className="h-[5px] border-b dark:border-b-brand-dark  bg-white dark:bg-brand-darker w-full -bottom-1 z-[60]  absolute" />
      </div>

      <div
        ref={parentRef}
        className="w-full h-[calc(100%-1.9rem)] overflow-auto relative bg-white dark:bg-brand-darker"
        style={{ contain: "strict" }}
      >
        <div
          ref={tableContainerRef}
          style={{
            minWidth: `${totalWidth}px`,
            height: `${rowVirtualizer.getTotalSize() + 41}px`, // Add header height
            position: "relative",
          }}
          className="domainCrawlParent"
        >
          {/* Sticky Header */}
          <TableHeader
            headers={headerTitles}
            columnWidths={columnWidths}
            columnAlignments={columnAlignments}
            onResize={handleMouseDown}
            onAlignToggle={toggleColumnAlignment}
            columnVisibility={columnVisibility}
          />

          {/* Virtual rows container */}
          <div style={{ position: "relative", paddingTop: "0px" }}>
            {filteredRows.length > 0 ? (
              virtualRows.map((virtualRow) => {
                const isOdd = virtualRow.index % 2 === 1;
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: `${virtualRow.start}px`,
                      left: 0,
                      height: `${virtualRow.size}px`,
                      width: "100%",
                    }}
                    className={`${isOdd ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}`}
                  >
                    <table
                      className="w-full text-xs border-collapse"
                      style={{
                        width: "100%",
                        tableLayout: "fixed",
                        height: "100%",
                      }}
                    >
                      <tbody>
                        <tr style={{ height: `${rowHeight}px` }}>
                          <TableRow
                            row={filteredRows[virtualRow.index]}
                            index={virtualRow.index}
                            columnWidths={columnWidths}
                            columnAlignments={columnAlignments}
                            columnVisibility={columnVisibility}
                            clickedCell={clickedCell}
                            handleCellClick={handleCellClick}
                          />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })
            ) : (
              <div className="absolute top-4 left-0 w-full h-full flex items-center justify-center bg-white">
                <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                  No data available.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ImagesCrawlTable;
