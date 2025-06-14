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
import useGlobalCrawlStore, {
  useDataActions,
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
  const visibleHeaders = headers.filter((_, index) => columnVisibility[index]);
  const visibleWidths = columnWidths.filter(
    (_, index) => columnVisibility[index],
  );
  const visibleAlignments = columnAlignments.filter(
    (_, index) => columnVisibility[index],
  );

  return (
    <div
      className="domainCrawl border-b bg-white dark:bg-brand-darker"
      style={{
        display: "grid",
        gridTemplateColumns: visibleWidths.join(" "),
        height: "30px",
        alignItems: "center",
        fontSize: "12px",
        width: "100%",
      }}
    >
      {visibleHeaders.map((header, visibleIndex) => {
        const originalIndex = headers.findIndex(
          (h, i) =>
            columnVisibility[i] &&
            headers.slice(0, i + 1).filter((_, j) => columnVisibility[j])
              .length ===
              visibleIndex + 1,
        );
        return (
          <div
            key={header}
            style={{
              position: "relative",
              // border: "1px solid #ddd",
              padding: "8px",
              userSelect: "none",
              textAlign: visibleAlignments[visibleIndex] as any,
              height: "30px",
              display: "flex",
              alignItems: "center",
              fontWeight: "bold",
            }}
            onClick={() => onAlignToggle(originalIndex)}
            className="dark:text-white dark:bg-brand-darker dark:border-brand-dark dark:border bg-white shadow"
          >
            {header}
            <ResizableDivider onMouseDown={(e) => onResize(originalIndex, e)} />
          </div>
        );
      })}
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

  const visibleData = rowData.filter(
    (_, cellIndex) => columnVisibility[cellIndex],
  );
  const visibleWidths = columnWidths.filter(
    (_, cellIndex) => columnVisibility[cellIndex],
  );
  const visibleAlignments = columnAlignments.filter(
    (_, cellIndex) => columnVisibility[cellIndex],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: visibleWidths.join(" "),
        height: "100%",
        alignItems: "center",
        color: clickedCell.row === index ? "white" : "inherit",
      }}
      className="dark:text-white/50 cursor-pointer not-selectable"
    >
      {visibleData.map((cell, visibleIndex) => {
        const originalIndex = rowData.findIndex(
          (c, i) =>
            columnVisibility[i] &&
            rowData.slice(0, i + 1).filter((_, j) => columnVisibility[j])
              .length ===
              visibleIndex + 1,
        );
        return (
          <div
            key={`cell-${index}-${visibleIndex}`}
            onClick={() =>
              handleCellClick(index, originalIndex, cell.toString(), row)
            }
            style={{
              // border: "1px solid #ddd",
              padding: "6px 8px",
              textAlign: visibleAlignments[visibleIndex] as any,
              overflow: "hidden",
              whiteSpace: "nowrap",
              height: "100%",
              display: "flex",
              alignItems: "center",
            }}
            className={`dark:text-white text-xs dark:border dark:border-brand-dark border ${
              clickedCell.row === index
                ? "bg-blue-600"
                : index % 2 === 0
                  ? "bg-white dark:bg-brand-darker"
                  : "bg-gray-50 dark:bg-brand-dark/30"
            }`}
          >
            <ContextTableMenu data={cell}>
              <TruncatedCell text={cell?.toString()} width="100%" />
            </ContextTableMenu>
          </div>
        );
      })}
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
  const [columnVisibility, setColumnVisibility] = useState(
    headerTitles.map(() => true),
  );
  const { isGeneratingExcel, setIsGeneratingExcel, setIssuesView } =
    useGlobalCrawlStore();

  const { setInlinks, setOutlinks } = useDataActions();

  const handleDownload = async () => {
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

      const findInLinkedObjects = (
        rows: any[],
        selectedUrl: string,
        linkType: string,
      ) => {
        const normalizeUrl = (url: string) => {
          if (!url) return "";

          if (!url.startsWith("http")) {
            url = "https://" + url;
          }

          if (!url.startsWith("https://www.")) {
            if (url.startsWith("https://")) {
              url = "https://www." + url.substring(8);
            } else {
              url = "https://www." + url;
            }
          }

          return url.toString().trim().toLowerCase();
        };

        const targetUrl = cellContent;

        return rows.filter((row) => {
          const internalLinks = row?.inoutlinks_status_codes?.[linkType] || [];
          return internalLinks.some((link: any) => {
            const linkUrl = normalizeUrl(link?.url);
            return linkUrl === normalizeUrl(targetUrl);
          });
        });
      };

      const innerLinksMatched = findInLinkedObjects(
        rows,
        cellContent,
        "internal",
      );

      setInlinks([{ url: cellContent }, innerLinksMatched]);

      const findOutLinkedObjects = (
        rows: any[],
        selectedUrl: string,
        linkType: string,
      ) => {
        const normalizeUrl = (url: string) => {
          if (!url) return "";

          if (!url.startsWith("http")) {
            url = "https://" + url;
          }

          if (!url.startsWith("https://www.")) {
            if (url.startsWith("https://")) {
              url = "https://www." + url.substring(8);
            } else {
              url = "https://www." + url;
            }
          }

          return url.toString().trim().toLowerCase();
        };

        const targetUrl = cellContent;

        return rows.filter((row) => {
          const internalLinks = row?.inoutlinks_status_codes?.internal || [];
          return internalLinks.some((link: any) => {
            const linkUrl = normalizeUrl(link?.url);
            return linkUrl === normalizeUrl(targetUrl);
          });
        });
      };

      const outLinksMatched = findOutLinkedObjects(
        rows,
        cellContent,
        "external",
      );

      setOutlinks([{ url: cellContent }, outLinksMatched]);
    }
  };

  const startXRef = useRef(0);
  const parentRef = useRef<HTMLDivElement>(null);

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

  // Fixed virtualizer configuration
  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
    getItemKey: (index) => filteredRows[index]?.url || index,
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
      <div className="text-xs dark:bg-brand-darker sticky top-0 flex gap-1 not-selectable z-20">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => debouncedSearch(e.target.value)}
          className="w-full p-1 pl-2 h-6 bg-white dark:bg-brand-darker border dark:border-brand-dark dark:text-white border-gray-300 rounded"
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
        className="w-full h-[calc(100%-1.7rem)] overflow-auto relative"
      >
        {/* Fixed Header */}
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

        {/* Virtualized Body */}
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
                className=""
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
            <div className="text-center py-4 text-gray-500">
              No data available.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TableCrawl;
