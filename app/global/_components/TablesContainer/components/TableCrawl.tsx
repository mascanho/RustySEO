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
import {
  initialColumnWidths,
  initialColumnAlignments,
  headerTitles,
} from "./tableLayout";
import { TbColumns3 } from "react-icons/tb";
import DownloadButton from "./DownloadButton";
import useGlobalCrawlStore, {
  useDataActions,
  useIsGeneratingExcel,
} from "@/store/GlobalCrawlDataStore";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { exportSEODataCSV } from "./generateCSV";
import ContextTableMenu from "./ContextTableMenu";

interface TableCrawlProps {
  rows: Array<{
    url?: string;
    title?: Array<{ title?: string; title_len?: string }>;
    headings?: { h1?: string[]; h2?: string[] };
    status_code?: number;
    word_count?: number;
    mobile?: boolean;
    meta_robots?: { meta_robots: string[] };
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
  setColumnVisibility: (visibility: any) => void;
  headerTitles: string[];
}

const TruncatedCell = memo(({
  text,
  maxLength = 90,
  width = "auto",
}: TruncatedCellProps) => {
  const truncatedText = useMemo(() => {
    if (!text) return "";
    return text.toString().length > maxLength ? `${text.toString().slice(0, maxLength)}...` : text;
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
});

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

const TableHeader = memo(({
  headers,
  columnWidths,
  columnAlignments,
  onResize,
  onAlignToggle,
  columnVisibility,
}: TableHeaderProps) => {
  const visibleItems = useMemo(() => {
    return headers.map((header, index) => ({
      header,
      width: columnWidths[index],
      alignment: columnAlignments[index],
      visible: columnVisibility[index],
      originalIndex: index,
    })).filter(item => item.visible);
  }, [headers, columnWidths, columnAlignments, columnVisibility]);

  return (
    <div
      className="domainCrawl border-b bg-white dark:bg-brand-darker"
      style={{
        display: "grid",
        gridTemplateColumns: visibleItems.map(item => item.width).join(" "),
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
          <ResizableDivider onMouseDown={(e) => onResize(item.originalIndex, e)} />
        </div>
      ))}
    </div>
  );
});

const TableRow = memo(({
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
      row?.title?.[0]?.title || "",
      row?.title?.[0]?.title_len || "",
      row?.description || "",
      row?.description?.length || "",
      row?.headings?.h1?.[0] || "",
      row?.headings?.h1?.[0]?.length || "",
      row?.headings?.h2?.[0] || "",
      row?.headings?.h2?.[0]?.length || "",
      row?.status_code || "",
      row?.word_count || "",
      row?.text_ratio?.[0]?.text_ratio?.toFixed(1) || "",
      row?.flesch?.Ok?.[0]?.toFixed(1) || "",
      row?.flesch?.Ok?.[1] || "",
      row?.mobile ? "Yes" : "No",
      row?.meta_robots?.meta_robots?.[0] || "",
      row?.content_type || "",
      row?.indexability?.indexability > 0.5
        ? "Indexable"
        : "Not Indexable" || "",
      row?.language || "",
      row?.schema ? "Yes" : "No",
    ],
    [row, index],
  );

  const visibleItems = useMemo(() => {
    return rowData.map((cell, i) => ({
      cell,
      width: columnWidths[i],
      alignment: columnAlignments[i],
      visible: columnVisibility[i],
      originalIndex: i,
    })).filter(item => item.visible);
  }, [rowData, columnWidths, columnAlignments, columnVisibility]);

  const isRowClicked = clickedCell.row === index;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: visibleItems.map(item => item.width).join(" "),
        height: "100%",
        alignItems: "center",
        color: isRowClicked ? "white" : "inherit",
      }}
      className="dark:text-white/50 cursor-pointer not-selectable"
    >
      {visibleItems.map((item, visibleIdx) => (
        <div
          key={`cell-${index}-${item.originalIndex}`}
          onClick={() =>
            handleCellClick(index, item.originalIndex, item.cell.toString(), row)
          }
          style={{
            padding: "6px 8px",
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
          <ContextTableMenu data={item.cell}>
            <TruncatedCell text={item.cell?.toString()} width="100%" />
          </ContextTableMenu>
        </div>
      ))}
    </div>
  );
});

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

const TableCrawl = ({
  tabName,
  rows,
  rowHeight = 25,
  overscan = 10,
}: TableCrawlProps) => {
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);
  const [columnAlignments, setColumnAlignments] = useState(
    initialColumnAlignments,
  );
  const [isResizing, setIsResizing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnVisibility, setColumnVisibility] = useState(() =>
    headerTitles.map(() => true),
  );

  // Use granular selectors to avoid unnecessary re-renders
  const isGeneratingExcel = useIsGeneratingExcel();
  const setIsGeneratingExcel = useGlobalCrawlStore(s => s.setIsGeneratingExcel);
  const { setInlinks, setOutlinks, setSelectedTableURL } = useDataActions();

  const handleDownload = useCallback(async () => {
    if (!rows.length) {
      toast.error("No data to download");
      return;
    }

    if (rows.length > 3000) {
      toast.info("Getting your data ready...");
      await exportSEODataCSV(rows);
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
          await writeFile(filePath, new Uint8Array(fileBuffer as any));
          toast.success("Excel file saved successfully!");
        }
      } catch (error) {
        console.error("Error generating or saving Excel file:", error);
        setIsGeneratingExcel(false);
      }
    }
  }, [rows, tabName, setIsGeneratingExcel]);

  const [clickedCell, setClickedCell] = useState<{
    row: number | null;
    cell: number | null;
  }>({
    row: null,
    cell: null,
  });

  const handleCellClick = useCallback((
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
      const urlData = rows.filter((item) => item.url === cellContent);
      setSelectedTableURL(urlData);

      const normalizeUrl = (url: string) => {
        if (!url) return "";
        if (!url.startsWith("http")) url = "https://" + url;
        if (!url.startsWith("https://www.")) {
          if (url.startsWith("https://")) {
            url = "https://www." + url.substring(8);
          } else {
            url = "https://www." + url;
          }
        }
        return url.toString().trim().toLowerCase();
      };

      const targetUrlNormalized = normalizeUrl(cellContent);

      const innerLinksMatched = rows.filter((r) => {
        const internalLinks = r?.inoutlinks_status_codes?.internal || [];
        return internalLinks.some((link: any) => normalizeUrl(link?.url) === targetUrlNormalized);
      });

      setInlinks([{ url: cellContent }, innerLinksMatched]);

      const outLinksMatched = rows.filter((r) => {
        const externalLinks = r?.inoutlinks_status_codes?.external || [];
        return externalLinks.some((link: any) => normalizeUrl(link?.url) === targetUrlNormalized);
      });

      setOutlinks([{ url: cellContent }, outLinksMatched]);
    }
  }, [rows, setInlinks, setOutlinks, setSelectedTableURL]);

  const startXRef = useRef(0);
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredRows = useMemo(() => {
    if (!rows || !Array.isArray(rows)) return [];
    if (!searchTerm) return rows;

    const normalizeText = (text: string) =>
      text?.toString().toLowerCase().replace(/-/g, "") ?? "";

    const searchTermNormalized = normalizeText(searchTerm);

    return rows.filter((row) => {
      if (!row || typeof row !== "object") return false;
      return Object.values(row).some((value) =>
        normalizeText(value?.toString()).includes(searchTermNormalized),
      );
    });
  }, [rows, searchTerm]);

  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
    getItemKey: useCallback((index: number) => filteredRows[index]?.url || index, [filteredRows]),
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
      <div className="text-xs dark:bg-brand-darker sticky top-0 flex gap-1 not-selectable z-20 pb-1 ">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => debouncedSearch(e.target.value)}
          className="w-full p-1 pl-2 h-6 bg-white dark:bg-brand-darker border dark:border-brand-dark dark:text-white rounded-r outline-none focus:border-blue-500"
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
        <div className="h-[5px] border-b dark:border-b-brand-dark  bg-white dark:bg-brand-darker w-full absolute -bottom-[0] -mb-1 z-50" />
      </div>

      <div
        ref={parentRef}
        className="w-full h-[calc(100%-2rem)] overflow-auto relative"
      >
        <div className="sticky top-0 z-10">
          <TableHeader
            headers={headerTitles}
            columnWidths={columnWidths}
            columnAlignments={columnAlignments}
            onResize={handleMouseDown}
            onAlignToggle={toggleColumnAlignment}
            columnVisibility={columnVisibility}
          />
        </div>

        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
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
                  clickedCell={clickedCell}
                  handleCellClick={handleCellClick}
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
    </>
  );
};

export default memo(TableCrawl);
