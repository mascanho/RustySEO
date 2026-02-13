// @ts-nocheck
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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
import SelectFilter from "../components/SelectFilter";
import { TbColumns3 } from "react-icons/tb";
import DownloadButton from "./DownloadButton";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { exportJsDataCSV } from "./generateCSV";

interface TableCrawlJsProps {
  rows: Array<{
    url: string;
    index: number;
  }>;
  rowHeight?: number;
  overscan?: number;
  tabName?: string;
}

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
  row: {
    url: string;
    index: number;
  };
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
        gridTemplateColumns: visibleItems
          .map((item) => (item.originalIndex === 1 ? "1fr" : item.width))
          .join(" "),
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
          <ResizableDivider
            onMouseDown={(e) => onResize(item.originalIndex, e)}
          />
        </div>
      ))}
    </div>
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
  const rowData = useMemo(() => [index + 1, row?.url || ""], [row, index]);

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

  const isRowClicked = clickedCell.row === index;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: visibleItems
          .map((item) => (item.originalIndex === 1 ? "1fr" : item.width))
          .join(" "),
        height: "100%",
        alignItems: "center",
        color: isRowClicked ? "white" : "inherit",
        width: "100%",
      }}
      className="dark:text-white/50 cursor-pointer not-selectable"
    >
      {visibleItems.map((item) => (
        <div
          key={`cell-${index}-${item.originalIndex}`}
          onClick={() =>
            handleCellClick(index, item.originalIndex, item.cell.toString())
          }
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
          className={`dark:text-white text-xs dark:border dark:border-brand-dark border ${
            isRowClicked
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

const TableCrawlJs = ({
  rows,
  rowHeight = 25,
  overscan = 18,
  tabName,
}: TableCrawlJsProps) => {
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);
  const [columnAlignments, setColumnAlignments] = useState(
    initialColumnAlignments,
  );
  const [isResizing, setIsResizing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnVisibility, setColumnVisibility] = useState(
    headerTitles.map(() => true),
  );

  const [clickedCell, setClickedCell] = useState<{
    row: number | null;
    cell: number | null;
  }>({
    row: null,
    cell: null,
  });

  const { isGeneratingExcel, setIsGeneratingExcel } = useGlobalCrawlStore();

  // Dynamically adjust ID column width based on the number of rows
  useEffect(() => {
    if (rows && rows.length > 0) {
      const maxId = rows.length;
      // Calculate width: ~8px per digit + 20px padding
      const calculatedWidth = Math.max(40, maxId.toString().length * 8 + 20);
      setColumnWidths((prev) => {
        const newWidths = [...prev];
        if (newWidths[0] !== `${calculatedWidth}px`) {
          newWidths[0] = `${calculatedWidth}px`;
          return newWidths;
        }
        return prev;
      });
    }
  }, [rows.length]);

  const handleDownload = async () => {
    if (!rows.length) {
      toast.error("No data to download");
      return;
    }

    toast.info("Getting your data ready...");
    try {
      await exportJsDataCSV(rows);
    } catch (error) {
      console.error("Error during export:", error);
      toast.error("Failed to export data");
    }
  };

  const handleCellClick = (
    rowIndex: number,
    cellIndex: number,
    cellContent: string,
  ) => {
    setClickedCell((prev) => {
      if (prev.row === rowIndex && prev.cell === cellIndex) {
        return { row: null, cell: null };
      }
      return { row: rowIndex, cell: cellIndex };
    });
  };

  const startXRef = useRef(0);
  const parentRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const filteredRows = useMemo(() => {
    if (!rows || !Array.isArray(rows)) return [];
    if (!searchTerm) return rows;

    const searchTermNormalized = searchTerm.toLowerCase();
    return rows.filter((row) =>
      row.url.toLowerCase().includes(searchTermNormalized),
    );
  }, [rows, searchTerm]);

  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    initialRect: { width: 1000, height: rowHeight },
    overscan,
  });

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    [],
  );

  useEffect(() => {
    return () => debouncedSearch.cancel();
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
      setColumnWidths((prev) => {
        const next = [...prev];
        const currentWidth = parseInt(next[isResizing]);
        next[isResizing] = `${Math.max(50, currentWidth + delta)}px`;
        return next;
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
      const next = [...prev];
      next[index] = next[index] === "center" ? "left" : "center";
      return next;
    });
  }, []);

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
        className="w-full h-[calc(100%-1.4rem)] overflow-scroll relative"
      >
        <div
          ref={tableContainerRef}
          style={{
            width: "100%",
            height: `${rowVirtualizer.getTotalSize() + 30}px`,
            position: "relative",
          }}
          className="domainCrawlParent"
        >
          <div className="sticky top-0 z-10" style={{ width: "100%" }}>
            <TableHeader
              headers={headerTitles}
              columnWidths={columnWidths}
              columnAlignments={columnAlignments}
              onResize={handleMouseDown}
              onAlignToggle={toggleColumnAlignment}
              columnVisibility={columnVisibility}
            />
          </div>
          <div style={{ position: "relative" }}>
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
                    clickedCell={clickedCell}
                    handleCellClick={handleCellClick}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-brand-bright">
                No data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TableCrawlJs;
