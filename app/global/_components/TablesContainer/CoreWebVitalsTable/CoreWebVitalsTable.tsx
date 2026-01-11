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
import { exportPSIDataCSV } from "./exportPSIDataCsv";

interface TableCrawlProps {
  rows: Array<{
    url?: string;
    title?: Array<{ title?: string; title_len?: string }>;
    headings?: { h1?: string[]; h2?: string[] };
    status_code?: number;
    word_count?: number;
    mobile?: boolean;
    meta_robots?: { meta_robots: string[] };
    psi_results?: any;
  }>;
  tabName?: string;
  rowHeight?: number;
  overscan?: number;
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
  clickedCell: { row: number | null; cell: number | null };
  handleCellClick: (
    rowIndex: number,
    cellIndex: number,
    cellContent: string,
    row: any,
  ) => void;
}

interface ColumnPickerProps {
  columnVisibility: boolean[];
  setColumnVisibility: (visibility: boolean[]) => void;
  headerTitles: string[];
}

const TruncatedCell = ({
  text,
  maxLength = 90,
  width = "auto",
}: TruncatedCellProps) => {
  const truncatedText = useMemo(() => {
    if (!text) return "";
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }, [text, maxLength]);

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
                backgroundColor: "var(--background, white)",
                height: "32px",
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
      row?.url || "",
      row?.psi_results?.Ok?.[0]?.categories?.performance?.score ?? "n/a",
      row?.psi_results?.Ok?.[1]?.categories?.performance?.score ?? "n/a",
      row?.psi_results?.Ok?.[0]?.audits?.["speed-index"]?.score ?? "n/a",
      row?.psi_results?.Ok?.[1]?.audits?.["speed-index"]?.score ?? "n/a",
      row?.psi_results?.Ok?.[0]?.audits?.["largest-contentful-paint"]?.score ??
      "n/a",
      row?.psi_results?.Ok?.[1]?.audits?.["largest-contentful-paint"]?.score ??
      "n/a",
      row?.psi_results?.Ok?.[0]?.audits?.["cumulative-layout-shift"]?.score ??
      "n/a",
      row?.psi_results?.Ok?.[1]?.audits?.["cumulative-layout-shift"]?.score ??
      "n/a",
      row?.psi_results?.Ok?.[0]?.audits?.["first-contentful-paint"]?.score ??
      "n/a",
      row?.psi_results?.Ok?.[1]?.audits?.["first-contentful-paint"]?.score ??
      "n/a",

      row?.psi_results?.Ok?.[0]?.audits?.["interactive"]?.score ?? "n/a",
      row?.psi_results?.Ok?.[1]?.audits?.["interactive"]?.score ?? "n/a",

      row?.psi_results?.Ok?.[0]?.audits?.["redirects"]?.score ?? "n/a",

      row?.psi_results?.Ok?.[0]?.audits?.["server-response-time"]?.numericValue
        ? `${row?.psi_results?.Ok?.[0]?.audits?.["server-response-time"]?.numericValue} ms`
        : "n/a",

      row?.psi_results?.Ok?.[0]?.audits?.["total-blocking-time"]?.numericValue
        ? `${row?.psi_results?.Ok?.[0]?.audits?.["total-blocking-time"]?.numericValue.toFixed(0)} ms`
        : "n/a",

      (row?.psi_results?.Ok?.[0]?.audits?.["dom-size-insight"] ||
        row?.psi_results?.Ok?.[0]?.audits?.["dom-size"])?.numericValue ?? "n/a",
    ],
    [row, index],
  );

  const isOddRow = index % 2 === 1;
  const zebraBackground = isOddRow
    ? "var(--zebra-odd, #f8f9fa)"
    : "var(--zebra-even, transparent)";

  return (
    <tr style={{ height: "25px", backgroundColor: zebraBackground }}>
      {rowData.map((cell, cellIndex) =>
        columnVisibility[cellIndex] ? (
          <td
            key={`cell-${index}-${cellIndex}`}
            onClick={() =>
              handleCellClick(index, cellIndex, cell.toString(), row)
            }
            style={{
              width: columnWidths[cellIndex],
              border: "1px solid #ddd",
              padding: "6px 8px",
              textAlign: columnAlignments[cellIndex],
              overflow: "hidden",
              whiteSpace: "nowrap",
              minWidth: columnWidths[cellIndex],
              height: "25px",
              backgroundColor:
                clickedCell.row === index ? "#2B6CC4" : "inherit",
              color: clickedCell.row === index ? "white" : "inherit",
            }}
            className="dark:text-white/50 cursor-pointer"
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="border dark:border-white/20 w-8 flex justify-center items-center rounded h-6">
          <TbColumns3 className="w-5 h-5 dark:text-white/50 p-1" />
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
  );
};

const CoreWebVitalsTable = ({
  tabName,
  rows,
  rowHeight = 25,
  overscan = 18,
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
  const { isGeneratingExcel, setIsGeneratingExcel, setIssuesView } =
    useGlobalCrawlStore();

  const handleDownload = async () => {
    if (!rows.length) {
      toast.error("No data to download");
    }

    if (rows.length > 0) {
      toast.info("Getting your data ready...");
      await exportPSIDataCSV(rows);
    } else {
      setIsGeneratingExcel(true);
      try {
        const fileBuffer = await invoke("create_excel_main_table", {
          data: rows,
        });

        setIsGeneratingExcel(false);
        const filePath = await save({
          filters: [
            {
              name: "Excel File",
              extensions: ["xlsx"],
            },
          ],
          defaultPath: `RustySEO-${tabName}.xlsx`,
        });

        if (filePath) {
          await writeFile(filePath, new Uint8Array(fileBuffer));
          toast.success("Excel file saved successfully!");
        } else {
          console.log("User canceled the save dialog.");
        }
      } catch (error) {
        console.error("Error generating or saving Excel file:", error);
      }
    }
  };

  const [clickedCell, setClickedCell] = useState<{
    row: number | null;
    cell: number | null;
  }>({
    row: null,
    cell: null,
  });
  const { setSelectedTableURL } = useGlobalCrawlStore();

  const filterTableURL = (
    arr: { url: string }[],
    url: string,
    rowIndex: number,
  ) => {
    if (!arr || arr.length === 0) return [];
    return arr.filter((item) => item.url === url);
  };

  const handleCellClick = (
    rowIndex: number,
    cellIndex: number,
    cellContent: string,
    row: any,
  ) => {
    setClickedCell((prevClickedCell) => {
      if (
        prevClickedCell.row === rowIndex &&
        prevClickedCell.cell === cellIndex
      ) {
        return { row: null, cell: null };
      } else {
        return { row: rowIndex, cell: cellIndex };
      }
    });

    if (cellIndex === 1) {
      const urlData = filterTableURL(rows, cellContent, rowIndex);
      setSelectedTableURL(urlData);
    }
  };

  const startXRef = useRef(0);
  const parentRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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

  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 25, []), // Fixed 25px height
    overscan: 5, // Reduced overscan for better performance
    getItemKey: useCallback((index) => `row-${index}`, []),
  });

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    [],
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

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

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <>
      <style jsx>{`
        :root {
          --zebra-odd: #f8f9fa;
          --zebra-even: transparent;
        }

        .dark {
          --zebra-odd: rgba(55, 65, 81, 0.3);
          --zebra-even: transparent;
        }
      `}</style>
      <div className="text-xs dark:bg-brand-darker sticky top-0 flex gap-1">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => debouncedSearch(e.target.value)}
          className="w-full p-1 pl-2 h-6 bg-white dark:bg-brand-darker border dark:border-brand-dark dark:text-white  rounded-r"
        />
        <DownloadButton
          data={"data"}
          download={handleDownload}
          loading={isGeneratingExcel}
          setLoading={setIsGeneratingExcel}
        />
        <div className="mr-1.5">
          <ColumnPicker
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            headerTitles={headerTitles}
          />
        </div>
      </div>
      <div
        ref={parentRef}
        className="w-full h-[calc(100%-1.9rem)] overflow-scroll relative"
      >
        <div
          ref={tableContainerRef}
          style={{ minWidth: `${totalWidth}px` }}
          className="domainCrawlParent sticky top-0"
        >
          <table className="w-full text-xs border-collapse domainCrawlParent h-full">
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
                <>
                  {/* Top spacer */}
                  {virtualRows.length > 0 && virtualRows[0].start > 0 && (
                    <tr>
                      <td
                        colSpan={
                          headerTitles.filter(
                            (_, index) => columnVisibility[index],
                          ).length
                        }
                        style={{
                          height: `${virtualRows[0].start}px`,
                          padding: 0,
                          border: "none",
                        }}
                      />
                    </tr>
                  )}

                  {/* Render all virtual rows */}
                  {virtualRows.map((virtualRow) => (
                    <TableRow
                      key={virtualRow.key}
                      row={filteredRows[virtualRow.index]}
                      index={virtualRow.index}
                      columnWidths={columnWidths}
                      columnAlignments={columnAlignments}
                      columnVisibility={columnVisibility}
                      clickedCell={clickedCell}
                      handleCellClick={handleCellClick}
                    />
                  ))}

                  {/* Bottom spacer */}
                  {virtualRows.length > 0 && (
                    <tr>
                      <td
                        colSpan={
                          headerTitles.filter(
                            (_, index) => columnVisibility[index],
                          ).length
                        }
                        style={{
                          height: `${Math.max(0, rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end || 0))}px`,
                          padding: 0,
                          border: "none",
                        }}
                      />
                    </tr>
                  )}
                </>
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

export default CoreWebVitalsTable;
