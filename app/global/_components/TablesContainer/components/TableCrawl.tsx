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
  handleCellClick: (rowIndex: number, cellIndex: number) => void;
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
      row?.flesch?.Ok?.[0].toFixed(1) || "",
      row?.flesch?.Ok?.[1] || "",
      row?.mobile ? "Yes" : "No",
      row?.meta_robots?.meta_robots[0] || "",
      row?.content_type || "",
      row?.indexability?.indexability > 0.5
        ? "Indexable"
        : "Not Indexable" || "",
      row?.language || "",
      row?.schema ? "Yes" : "No",
    ],
    [row, index],
  );

  return (
    <>
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
              textAlign: columnAlignments[cellIndex],
              overflow: "hidden",
              whiteSpace: "nowrap",
              minWidth: columnWidths[cellIndex],
              height: "auto",
              backgroundColor:
                clickedCell.row === index ? "#2B6CC4" : "transparent",
              color: clickedCell.row === index ? "white" : "inherit",
            }}
            className="dark:text-white/50 cursor-pointer"
          >
            <ContextTableMenu data={cell}>
              <TruncatedCell
                text={cell?.toString()}
                width={columnWidths[cellIndex]}
              />
            </ContextTableMenu>
          </td>
        ) : null,
      )}
    </>
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

const TableCrawl = ({
  tabName,
  rows,
  rowHeight = 3,
  overscan = 20,
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

      // SET THE FILETERED DATA FOR THE SUBTABLES
      setSelectedTableURL(urlData);

      const findInLinkedObjects = (rows, selectedUrl, linkType) => {
        // Normalize URLs for consistent comparison
        const normalizeUrl = (url) => {
          if (!url) return "";

          if (!url.startsWith("http")) {
            url = "https://" + url;
          }

          // If URL does not start with "https://www.", add it
          if (!url.startsWith("https://www.")) {
            // Check if the URL starts with "https://" but not "https://www."
            if (url.startsWith("https://")) {
              // If it starts with "https://", replace it with "https://www."
              url = "https://www." + url.substring(8);
            } else {
              // Otherwise, prepend "https://www."
              url = "https://www." + url;
            }
          }

          return url
            .toString() // Ensure it's a string
            .trim() // Remove whitespace
            .toLowerCase(); // Case-insensitive
          // .replace(/(https?:\/)?(www\.)?/, ""); // Remove protocol & www
          // .replace(/\/+$/, ""); // Remove trailing slashes
        };

        const targetUrl = cellContent;

        return rows.filter((row) => {
          // Check if row has internal links (defensive check)
          const internalLinks = row?.inoutlinks_status_codes?.[linkType] || [];

          // Check each link for a match
          return internalLinks.some((link) => {
            const linkUrl = normalizeUrl(link?.url);

            return linkUrl === normalizeUrl(targetUrl);
          });
        });
      };

      // Match the selected URL with internal and external links
      const innerLinksMatched = findInLinkedObjects(
        rows,
        cellContent,
        "internal",
      );

      // SET THE SEPARATE STATE

      setInlinks([{ url: cellContent }, innerLinksMatched]);

      // FILTER FOR THE OULINKS ON PAGES THAT ARE CONTAINED INSIOE THE INNERLINKS OF OTHER PAGHES
      const findOutLinkedObjects = (rows, selectedUrl, linkType) => {
        // Normalize URLs for consistent comparison
        const normalizeUrl = (url) => {
          if (!url) return "";

          if (!url.startsWith("http")) {
            url = "https://" + url;
          }

          // If URL does not start with "https://www.", add it
          if (!url.startsWith("https://www.")) {
            // Check if the URL starts with "https://" but not "https://www."
            if (url.startsWith("https://")) {
              // If it starts with "https://", replace it with "https://www."
              url = "https://www." + url.substring(8);
            } else {
              // Otherwise, prepend "https://www."
              url = "https://www." + url;
            }
          }

          return url
            .toString() // Ensure it's a string
            .trim() // Remove whitespace
            .toLowerCase(); // Case-insensitive
          // .replace(/(https?:\/)?(www\.)?/, ""); // Remove protocol & www
          // .replace(/\/+$/, ""); // Remove trailing slashes
        };

        const targetUrl = cellContent;

        return rows.filter((row) => {
          // Check if row has internal links (defensive check)
          const internalLinks = row?.inoutlinks_status_codes?.internal || [];

          // Check each link for a match
          return internalLinks.some((link) => {
            const linkUrl = normalizeUrl(link?.url);

            return linkUrl === normalizeUrl(targetUrl);
          });
        });
      };

      // Match the selected URL with internal and external links
      const outLinksMatched = findOutLinkedObjects(
        rows,
        cellContent,
        "external",
      );

      // SET THE SEPARATE STATE
      setOutlinks([{ url: cellContent }, outLinksMatched]);
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

  // TODO: Fix THIs, it should be the ROWS?
  // const rowVirtualizer = useVirtualizer({
  //   count: filteredRows.length,
  //   getScrollElement: () => parentRef.current,
  //   estimateSize: useCallback(() => rowHeight, [rowHeight]),
  //   overscan,
  //   getItemKey: useCallback(
  //     (index) => filteredRows[index]?.url || index,
  //     [filteredRows],
  //   ),
  // });

  // TODO: NEW CONFIGS HERE - CHECK IF THE CONTAINER HEIGHT INFLUENCES OR NOT
  // Then in your virtualizer config:
  const rowVirtualizer = useVirtualizer({
    count: rows?.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
    getItemKey: (index) => rows[index]?.url || index,
    paddingStart: 0,
    paddingEnd: 0,
    scrollMargin: 0,
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
    () =>
      columnWidths.reduce((acc, width) => {
        if (typeof width === "string") {
          if (width.endsWith("px")) {
            return acc + parseFloat(width);
          } else if (width.endsWith("rem")) {
            return acc + parseFloat(width) * 16;
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

  useEffect(() => {
    console.log("Virtualizer debug:", {
      totalSize: rowVirtualizer.getTotalSize(),
      virtualItems: rowVirtualizer.getVirtualItems(),
      scrollElement: parentRef.current,
      measurements: rowVirtualizer.measurementsCache,
      filteredRowsCount: filteredRows?.length,
    });
  }, [rowVirtualizer, filteredRows]);

  return (
    <>
      <div className="text-xs dark:bg-brand-darker sticky top-0 flex gap-1 not-selectable">
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
        className="w-full h-[calc(100%-1.5rem)] overflow-auto relative"
      >
        <table className="w-full text-xs border-collapse domainCrawlParent h-10">
          <TableHeader
            headers={headerTitles}
            columnWidths={columnWidths}
            columnAlignments={columnAlignments}
            onResize={handleMouseDown}
            onAlignToggle={toggleColumnAlignment}
            columnVisibility={columnVisibility}
          />
          <tbody className="not-selectable">
            {rows.length > 0 ? (
              <>
                {virtualRows.map((virtualRow) => (
                  <tr key={virtualRow.key} style={{ height: "5px" }}>
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
                ))}
              </>
            ) : (
              <tr>
                <td colSpan={headerTitles.length} className="text-center py-4">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TableCrawl;
