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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  initialColumnWidths,
  initialColumnAlignments,
  headerTitles,
} from "./tableLayout";
import SelectFilter from "../components/SelectFilter";
import { TbColumns3 } from "react-icons/tb";
import DownloadButton from "./DownloadButton";
import useFilterTableURL from "@/app/Hooks/useFilterTableUrl";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { toast } from "sonner";
import { writeFile } from "@tauri-apps/plugin-fs";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { exportLinksCSV } from "./exportLinksCsv";

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
  ) => void;
  rowHeight: number;
  onRowResize: (index: number, e: React.MouseEvent) => void;
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
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }, [text, maxLength]);

  return useMemo(
    () => (
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

const RowResizableDivider = ({ onMouseDown }: ResizableDividerProps) => {
  return useMemo(
    () => (
      <div
        onMouseDown={onMouseDown}
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          right: 0,
          height: "5px",
          cursor: "row-resize",
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
                  padding: "8px",
                  userSelect: "none",
                  minWidth: columnWidths[index],
                  textAlign: columnAlignments[index],
                  backgroundColor: "var(--background, white)",
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
  clickedCell,
  handleCellClick,
  rowHeight,
  onRowResize,
}: TableRowProps) => {
  const rowData = useMemo(
    () => [
      index + 1,
      row?.anchor,
      row?.rel || "",
      row?.link || "",
      row?.title || "",
      row?.target || "",
      row?.status || "",
      row?.page || "",
    ],
    [row, index],
  );

  return useMemo(
    () => (
      <tr style={{ height: `30px`, position: "relative" }}>
        {rowData.map((cell, cellIndex) =>
          columnVisibility[cellIndex] ? (
            <td
              key={`cell-${index}-${cellIndex}`}
              onClick={() => handleCellClick(index, cellIndex, cell.toString())}
              style={{
                width: columnWidths[cellIndex],
                border: "1px solid #ddd",
                padding: "0px 10px",
                paddingLeft: cellIndex === 0 ? "20px" : "0px",
                height: "100%",
                textAlign: columnAlignments[cellIndex],
                overflow: "hidden",
                whiteSpace: "nowrap",
                minWidth: columnWidths[cellIndex],
                backgroundColor:
                  clickedCell.row === index && clickedCell.cell === cellIndex
                    ? "#2B6CC4"
                    : "transparent",
                color:
                  clickedCell.row === index && clickedCell.cell === cellIndex
                    ? "white"
                    : "inherit",
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
        <RowResizableDivider onMouseDown={(e) => onRowResize(index, e)} />
      </tr>
    ),
    [
      rowData,
      columnWidths,
      columnAlignments,
      columnVisibility,
      index,
      clickedCell,
      handleCellClick,
      rowHeight,
      onRowResize,
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
    ),
    [columnVisibility, handleToggle, headerTitles],
  );
};

const LinksTable = ({
  rows,
  rowHeight = 3,
  overscan = 20,
  tabName,
}: TableCrawlProps) => {
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);
  const [columnAlignments, setColumnAlignments] = useState(
    initialColumnAlignments,
  );
  const [isResizingColumn, setIsResizingColumn] = useState<number | null>(null);
  const [isResizingRow, setIsResizingRow] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnVisibility, setColumnVisibility] = useState(
    headerTitles.map(() => true),
  );
  const [rowHeights, setRowHeights] = useState<number[]>(
    new Array(rows.length).fill(rowHeight),
  );
  const { isGeneratingExcel, setIsGeneratingExcel, setIssuesView } =
    useGlobalCrawlStore();
  const [statusFilter, setStatusFilter] = useState<number[]>([]);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);

  // Get status code badge color
  const getStatusCodeColor = (code: number) => {
    if (code >= 200 && code < 300)
      return "bg-green-100 border-green-200 text-green-800 dark:bg-green-700 hover:bg-green-500 dark:text-white";
    if (code >= 300 && code < 400)
      return "bg-blue-400 dark:bg-blue-700 dark:text-white";
    if (code >= 400 && code < 500)
      return "bg-red-400 dark:bg-red-600 dark:text-white text-white";
    if (code >= 500) return "bg-red-400 text-white";
    return "bg-gray-500";
  };

  // Define the handleDownload function
  const handleDownload = async () => {
    if (!rows.length) {
      toast.error("No data to download");
      return;
    }

    if (rows.length > 1000) {
      toast.info("Getting your data ready for download");
      await exportLinksCSV(rows);
    } else {
      setIsGeneratingExcel(true);
      try {
        const fileBuffer = await invoke("generate_links_table_xlsx_command", {
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
        toast.error("Failed to generate or save Excel file.");
      } finally {
        setIsGeneratingExcel(false);
      }
    }
  };

  // Handle column resizing
  const handleColumnMouseDown = useCallback(
    (index: number, event: React.MouseEvent) => {
      if (index === 1) return;
      setIsResizingColumn(index);
      startXRef.current = event.clientX;
      event.preventDefault();
    },
    [],
  );

  const handleColumnMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isResizingColumn === null) return;

      const delta = event.clientX - startXRef.current;
      setColumnWidths((prevWidths) => {
        const newWidths = [...prevWidths];
        const currentWidth = parseInt(newWidths[isResizingColumn]);
        newWidths[isResizingColumn] = `${Math.max(
          isResizingColumn === 0 ? 40 : 50,
          currentWidth + delta,
        )}px`;
        return newWidths;
      });
      startXRef.current = event.clientX;
    },
    [isResizingColumn],
  );

  const handleColumnMouseUp = useCallback(() => {
    setIsResizingColumn(null);
  }, []);

  // Handle row resizing
  const handleRowMouseDown = useCallback(
    (index: number, event: React.MouseEvent) => {
      setIsResizingRow(index);
      startYRef.current = event.clientY;
      event.preventDefault();
    },
    [],
  );

  const handleRowMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isResizingRow === null) return;

      const delta = event.clientY - startYRef.current;
      setRowHeights((prevHeights) => {
        const newHeights = [...prevHeights];
        const currentHeight = newHeights[isResizingRow];
        newHeights[isResizingRow] = Math.max(20, currentHeight + delta);
        return newHeights;
      });
      startYRef.current = event.clientY;
    },
    [isResizingRow],
  );

  const handleRowMouseUp = useCallback(() => {
    setIsResizingRow(null);
  }, []);

  // Event listeners for resizing
  useEffect(() => {
    if (isResizingColumn !== null) {
      window.addEventListener("mousemove", handleColumnMouseMove);
      window.addEventListener("mouseup", handleColumnMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleColumnMouseMove);
        window.removeEventListener("mouseup", handleColumnMouseUp);
      };
    }
    if (isResizingRow !== null) {
      window.addEventListener("mousemove", handleRowMouseMove);
      window.addEventListener("mouseup", handleRowMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleRowMouseMove);
        window.removeEventListener("mouseup", handleRowMouseUp);
      };
    }
  }, [
    isResizingColumn,
    handleColumnMouseMove,
    handleColumnMouseUp,
    isResizingRow,
    handleRowMouseMove,
    handleRowMouseUp,
  ]);

  // Calculate total table width
  const totalWidth = useMemo(
    () =>
      columnWidths.reduce((acc, width, index) => {
        if (typeof width === "string") {
          if (width.endsWith("px")) {
            return acc + parseFloat(width);
          } else if (width.endsWith("rem")) {
            return acc + parseFloat(width) * 16;
          }
        }
        return acc + (index === 0 ? 40 : 100);
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

  // State to track the clicked cell
  const [clickedCell, setClickedCell] = useState<{
    row: number | null;
    cell: number | null;
  }>({
    row: null,
    cell: null,
  });

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
        return { row: null, cell: null };
      } else {
        return { row: rowIndex, cell: cellIndex };
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

  // Initialize virtualizer
  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(
      (index: number) => rowHeights[index] || rowHeight,
      [rowHeights, rowHeight],
    ),
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

  // Filter table based on status code
  const filteredTable = useMemo(() => {
    if (!rows || !Array.isArray(filteredRows)) return [];

    return filteredRows.filter((row) => {
      if (!row || typeof row !== "object") return false;
      return statusFilter.length === 0 || statusFilter.includes(row.status);
    });
  }, [filteredRows, statusFilter]);

  const virtualRows = rowVirtualizer.getVirtualItems();
  const parentRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="text-xs dark:bg-brand-darker sticky top-0 flex gap-1">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => debouncedSearch(e.target.value)}
          className="w-full p-1 pl-2 h-6 dark:bg-brand-darker border dark:border-brand-dark dark:text-white border-gray-300 rounded"
        />

        {/* Status Code Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex gap-2 bg-transparent font-normal dark:bg-brand-darker dark:text-white dark:border-brand-dark h-6 w-40"
            >
              <Filter size={2} className="h-3 w-3 text-xs p-[2px]" />
              Status
              {statusFilter?.length > 0 && (
                <Badge variant="secondary" className="ml-0">
                  {statusFilter?.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="left"
            className="w-44 ml-0 text-center m-0 bg-white dark:bg-brand-darker dark:text-white dark:border-brand-dark"
          >
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[200, 201, 204, 400, 401, 403, 404, 500].map((code) => (
              <DropdownMenuCheckboxItem
                className="hover:bg-brand-blue text-left active:text-black hover:text-white dark:text-white"
                key={code}
                checked={statusFilter?.includes(code)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatusFilter([...statusFilter, code]);
                  } else {
                    setStatusFilter(statusFilter?.filter((c) => c !== code));
                  }
                }}
              >
                <Badge
                  variant="outline"
                  className={`mr-2 ${getStatusCodeColor(code)}`}
                >
                  {code}
                </Badge>
                {code >= 200 && code < 300
                  ? "Success"
                  : code >= 300 && code < 400
                    ? "Redirection"
                    : code >= 400 && code < 500
                      ? "Client Error"
                      : "Server Error"}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
          <table
            style={{ tableLayout: "fixed" }}
            className="w-full text-xs border-collapse domainCrawlParent h-full"
          >
            <TableHeader
              headers={headerTitles}
              columnWidths={columnWidths}
              columnAlignments={columnAlignments}
              onResize={handleColumnMouseDown}
              onAlignToggle={toggleColumnAlignment}
              columnVisibility={columnVisibility}
            />
            <tbody>
              {filteredTable.length > 0 ? (
                <>
                  <tr
                    style={{
                      height: `${rowVirtualizer.getVirtualItems()[0]?.start || 0}px`,
                    }}
                  />
                  {virtualRows.map((virtualRow) => (
                    <TableRow
                      key={virtualRow.key}
                      row={filteredTable[virtualRow.index]}
                      index={virtualRow.index}
                      columnWidths={columnWidths}
                      columnAlignments={columnAlignments}
                      columnVisibility={columnVisibility}
                      clickedCell={clickedCell}
                      handleCellClick={handleCellClick}
                      rowHeight={rowHeights[virtualRow.index] || rowHeight}
                      onRowResize={handleRowMouseDown}
                    />
                  ))}
                  <tr
                    style={{
                      height: `${Math.max(0, rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end || 0))}px`,
                    }}
                  />
                </>
              ) : (
                <tr>
                  <td
                    colSpan={headerTitles.length}
                    className="text-center py-2"
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

export default LinksTable;
