// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import debounce from "lodash/debounce";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { initialColumnWidths, initialColumnAlignments, headerTitles } from "./tableLayout";
import { TbColumns3 } from "react-icons/tb";
import DownloadButton from "./DownloadButton";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { toast } from "sonner";
import { exportLinksCSV } from "./exportLinksCsv";
import {
  DropdownMenu as FilterDropdown,
  DropdownMenuContent as FilterContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger as FilterTrigger,
} from "@/components/ui/dropdown-menu";
import { FiFilter } from "react-icons/fi";

interface TableCrawlProps {
  rows: Array<any>;
  tabName: string;
  rowHeight?: number;
  overscan?: number;
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
  statusFilter: string;
  setStatusFilter: (val: string) => void;
}

interface TableRowProps {
  row: any;
  index: number;
  columnWidths: string[];
  columnAlignments: string[];
  columnVisibility: boolean[];
  clickedRow: number | null;
  handleRowClick: (rowIndex: number) => void;
}

interface ColumnPickerProps {
  columnVisibility: boolean[];
  setColumnVisibility: (visibility: any) => void;
  headerTitles: string[];
}

const TruncatedCell = memo(({ text, maxLength = 100, width = "100%" }: TruncatedCellProps) => {
  const truncatedText = useMemo(() => {
    if (!text) return "";
    if (typeof text !== "string") return text;
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }, [text, maxLength]);

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {truncatedText}
    </div>
  );
});

TruncatedCell.displayName = "TruncatedCell";

const ResizableDivider = memo(({ onMouseDown }: ResizableDividerProps) => {
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
});

ResizableDivider.displayName = "ResizableDivider";

const TableHeader = memo(
  ({
    headers,
    columnWidths,
    columnAlignments,
    onResize,
    onAlignToggle,
    columnVisibility,
    statusFilter,
    setStatusFilter,
  }: TableHeaderProps) => {
    const visibleItems = useMemo(() => {
      return headers
        .map((header, index) => ({
          header,
          width: columnWidths[index],
          alignment: columnAlignments[index],
          visible: columnVisibility[index],
          originalIndex: index,
        }))
        .filter((item) => item.visible);
    }, [headers, columnWidths, columnAlignments, columnVisibility]);

    return (
      <div
        className="domainCrawl border-b bg-white dark:bg-brand-darker"
        style={{
          display: "grid",
          gridTemplateColumns: visibleItems.map((item) => item.width).join(" "),
          height: "30px",
          alignItems: "center",
          fontSize: "12px",
          width: "100%",
        }}
      >
        {visibleItems.map((item) => (
          <div
            key={item.header}
            style={{
              position: "relative",
              padding: "8px",
              userSelect: "none",
              justifyContent:
                item.alignment === "center"
                  ? "center"
                  : item.alignment === "right"
                    ? "flex-end"
                    : "flex-start",
              height: "30px",
              display: "flex",
              alignItems: "center",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={() => onAlignToggle(item.originalIndex)}
            className="dark:text-white/50 dark:bg-brand-darker text-black/50 dark:border-brand-dark  bg-white shadow dark:border"
          >
            {item.header}
            {item.header === "Status Code" && (
              <FilterDropdown>
                <FilterTrigger asChild>
                  <button
                    className={`ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${statusFilter !== "all" ? "text-blue-500" : ""
                      }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FiFilter size={10} />
                  </button>
                </FilterTrigger>
                <FilterContent className="bg-white dark:bg-brand-darker border dark:border-brand-dark">
                  <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                    <DropdownMenuRadioItem value="all" className="text-xs dark:text-white">All</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="200" className="text-xs dark:text-white">200 OK</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="300" className="text-xs dark:text-white">3xx Redirect</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="400" className="text-xs dark:text-white">4xx Error</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="500" className="text-xs dark:text-white">5xx Error</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </FilterContent>
              </FilterDropdown>
            )}
            <ResizableDivider
              onMouseDown={(e) => onResize(item.originalIndex, e)}
            />
          </div>
        ))}
      </div>
    );
  },
);

TableHeader.displayName = "TableHeader";

const TableRow = memo(
  ({
    row,
    index,
    columnWidths,
    columnAlignments,
    columnVisibility,
    clickedRow,
    handleRowClick,
  }: TableRowProps) => {
    const isRowClicked = clickedRow === index;

    const rowData = useMemo(() => [
      index + 1,
      row?.anchor || "",
      row?.rel || "",
      row?.link || "",
      row?.title || "",
      row?.target || "",
      row?.status || "",
      row?.page || "",
    ], [row, index]);

    const visibleItems = useMemo(() => {
      return rowData
        .map((cell, i) => ({
          cell,
          width: columnWidths[i],
          alignment: columnAlignments[i],
          visible: columnVisibility[i],
          originalIndex: i,
        }))
        .filter((item) => item.visible);
    }, [rowData, columnWidths, columnAlignments, columnVisibility]);

    return (
      <div
        onClick={() => handleRowClick(index)}
        style={{
          display: "grid",
          gridTemplateColumns: visibleItems.map((item) => item.width).join(" "),
          height: "100%",
          alignItems: "center",
          color: isRowClicked ? "white" : "inherit",
        }}
        className="dark:text-white/50 cursor-pointer not-selectable"
      >
        {visibleItems.map((item) => (
          <div
            key={`cell-${index}-${item.originalIndex}`}
            style={{
              padding: "8px",
              justifyContent:
                item.alignment === "center"
                  ? "center"
                  : item.alignment === "right"
                    ? "flex-end"
                    : "flex-start",
              overflow: "hidden",
              whiteSpace: "nowrap",
              height: "100%",
              display: "flex",
              alignItems: "center",
            }}
            className={`dark:text-white text-xs dark:border dark:border-brand-dark border ${isRowClicked
              ? "bg-blue-600"
              : index % 2 === 0
                ? "bg-white dark:bg-brand-darker"
                : "bg-gray-50 dark:bg-brand-dark/30"
              }`}
          >
            <TruncatedCell text={item.cell?.toString()} width="100%" />
          </div>
        ))}
      </div>
    );
  },
);

TableRow.displayName = "TableRow";

const ColumnPicker = memo(({
  columnVisibility,
  setColumnVisibility,
  headerTitles,
}: ColumnPickerProps) => {
  const handleToggle = useCallback(
    (index: number) => {
      setColumnVisibility((prev: boolean[]) => {
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
        <div className="border dark:border-white/20 w-8 flex justify-center items-center rounded h-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-brand-dark">
          <TbColumns3 className="w-5 h-5 dark:text-white/50 p-1" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-32 bg-white dark:bg-brand-darker border dark:border-brand-dark rounded shadow-lg z-20">
        {headerTitles.map((header, index) => (
          <DropdownMenuCheckboxItem
            key={header}
            checked={columnVisibility[index] ?? true}
            onCheckedChange={() => handleToggle(index)}
            className="p-2 hover:bg-gray-100 w-full dark:hover:bg-brand-dark space-x-6 dark:text-white text-brand-bright"
          >
            <span className="ml-5 dark:text-brand-bright">{header}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ColumnPicker.displayName = "ColumnPicker";

const LinksTable = ({
  rows,
  rowHeight = 25,
  overscan = 5,
  tabName,
}: TableCrawlProps) => {
  const [columnWidths, setColumnWidths] = useState<string[]>(initialColumnWidths);
  const [columnAlignments, setColumnAlignments] = useState<string[]>(initialColumnAlignments);
  const [isResizing, setIsResizing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<boolean[]>(headerTitles.map(() => true));
  const [statusFilter, setStatusFilter] = useState("all");
  const { isGeneratingExcel, setIsGeneratingExcel } = useGlobalCrawlStore();
  const startXRef = useRef(0);

  const handleMouseDown = useCallback((index: number, event: React.MouseEvent) => {
    setIsResizing(index);
    startXRef.current = event.clientX;
    event.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isResizing === null) return;
      const delta = event.clientX - startXRef.current;
      setColumnWidths((prevWidths) => {
        const newWidths = [...prevWidths];
        const currentWidth = parseInt(newWidths[isResizing]);
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
    () => columnWidths.reduce((acc, width) => acc + parseInt(width), 0),
    [columnWidths],
  );

  const toggleColumnAlignment = useCallback((index: number) => {
    setColumnAlignments((prev) => {
      const newAlignments = [...prev];
      newAlignments[index] = newAlignments[index] === "center" ? "left" : "center";
      return newAlignments;
    });
  }, []);

  const [clickedRow, setClickedRow] = useState<number | null>(null);

  const handleRowClick = useCallback((rowIndex: number) => {
    setClickedRow((prev) => (prev === rowIndex ? null : rowIndex));
  }, []);

  const filteredRows = useMemo(() => {
    if (!rows || !Array.isArray(rows)) return [];

    let result = rows;

    if (statusFilter !== "all") {
      result = result.filter(row => {
        const status = parseInt(row.status);
        if (statusFilter === "200") return status === 200;
        if (statusFilter === "300") return status >= 300 && status < 400;
        if (statusFilter === "400") return status >= 400 && status < 500;
        if (statusFilter === "500") return status >= 500;
        return true;
      });
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter((row) => {
        return Object.values(row).some((val) =>
          val?.toString().toLowerCase().includes(s)
        );
      });
    }

    return result;
  }, [rows, searchTerm, statusFilter]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    [],
  );

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const handleDownload = useCallback(async () => {
    if (!rows.length) {
      toast.error("No data to download");
      return;
    }
    await exportLinksCSV(rows);
  }, [rows]);

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <>
      <div className="text-xs dark:bg-brand-darker sticky top-0 flex gap-1 not-selectable z-20 pb-1 ">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => debouncedSearch(e.target.value)}
          className="w-full p-1 pl-2 h-6 bg-white dark:bg-brand-darker border dark:border-brand-dark dark:text-white rounded-r outline-none focus:border-blue-500"
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
            headerTitles={headerTitles}
          />
        </div>
        <div className="h-[5px] border-b dark:border-b-brand-dark  bg-white dark:bg-brand-darker w-full absolute -bottom-[0] -mb-1 z-50" />
      </div>
      <div
        ref={parentRef}
        className="w-full h-[calc(100%-1.9rem)] overflow-auto relative not-selectable"
      >
        <div
          style={{
            minWidth: `${totalWidth}px`,
            position: "relative",
          }}
        >
          <div
            className="sticky top-0 z-10"
            style={{ minWidth: `${totalWidth}px` }}
          >
            <TableHeader
              headers={headerTitles}
              columnWidths={columnWidths}
              columnAlignments={columnAlignments}
              onResize={handleMouseDown}
              onAlignToggle={toggleColumnAlignment}
              columnVisibility={columnVisibility}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>

          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
              minWidth: `${totalWidth}px`,
            }}
            className="domainCrawlParent"
          >
            {filteredRows.length > 0 ? (
              virtualRows.map((virtualRow) => (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: `${virtualRow.start}px`,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                  }}
                >
                  <TableRow
                    row={filteredRows[virtualRow.index]}
                    index={virtualRow.index}
                    columnWidths={columnWidths}
                    columnAlignments={columnAlignments}
                    columnVisibility={columnVisibility}
                    clickedRow={clickedRow}
                    handleRowClick={handleRowClick}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-gray-500">
                No data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(LinksTable);
