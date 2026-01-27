// @ts-nocheck
"use client";

import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
    memo,
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
    useIsGeneratingExcel,
} from "@/store/GlobalCrawlDataStore";
import { toast } from "sonner";
import { exportFilesDataCSV } from "./generateCSV";
import ContextTableMenu from "../components/ContextTableMenu";

interface FilesTableProps {
    rows: Array<{
        id: number;
        url: string;
        filetype: string;
        found_at: string;
    }>;
    rowHeight?: number;
    overscan?: number;
    tabName?: string;
}

const TruncatedCell = memo(({ text, maxLength = 120, width = "auto" }) => {
    const truncatedText = useMemo(() => {
        if (!text) return "";
        return text.toString().length > maxLength
            ? `${text.toString().slice(0, maxLength)}...`
            : text;
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

const ResizableDivider = memo(({ onMouseDown }) => (
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
));

const TableHeader = memo(
    ({
        headers,
        columnWidths,
        columnAlignments,
        onResize,
        onAlignToggle,
        columnVisibility,
    }) => {
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
                        className="dark:text-white/50 dark:bg-brand-darker text-black/50 dark:border-brand-dark bg-white shadow dark:border"
                    >
                        {item.header}
                        <ResizableDivider
                            onMouseDown={(e) => onResize(item.originalIndex, e)}
                        />
                    </div>
                ))}
            </div>
        );
    },
);

const TableRow = memo(
    ({
        row,
        index,
        columnWidths,
        columnAlignments,
        columnVisibility,
        clickedCell,
        handleCellClick,
    }) => {
        const rowData = useMemo(() => {
            return [row.id, row.url, row.filetype, row.found_at];
        }, [row]);

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
                        onClick={() =>
                            handleCellClick(
                                index,
                                item.originalIndex,
                                item.cell?.toString() || "",
                                row,
                            )
                        }
                        style={{
                            padding: "0px 8px",
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
    },
);

const ColumnPicker = memo(
    ({ columnVisibility, setColumnVisibility, headerTitles }) => {
        const handleToggle = useCallback(
            (index) => {
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
    },
);

const FilesTable = ({
    tabName,
    rows,
    rowHeight = 25,
    overscan = 10,
}: FilesTableProps) => {
    const [columnWidths, setColumnWidths] = useState(initialColumnWidths);
    const [columnAlignments, setColumnAlignments] = useState(
        initialColumnAlignments,
    );
    const [isResizing, setIsResizing] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [columnVisibility, setColumnVisibility] = useState(() =>
        headerTitles.map(() => true),
    );

    const isGeneratingExcel = useIsGeneratingExcel();
    const setIsGeneratingExcel = useGlobalCrawlStore(
        (s) => s.setIsGeneratingExcel,
    );

    const handleDownload = useCallback(async () => {
        await exportFilesDataCSV(rows);
    }, [rows]);

    const [clickedCell, setClickedCell] = useState<{
        row: number | null;
        cell: number | null;
    }>({
        row: null,
        cell: null,
    });

    const handleCellClick = useCallback((rowIndex, cellIndex, cellContent, row) => {
        setClickedCell((prev) => {
            if (prev.row === rowIndex && prev.cell === cellIndex) {
                return { row: null, cell: null };
            }
            return { row: rowIndex, cell: cellIndex };
        });
    }, []);

    const startXRef = useRef(0);
    const parentRef = useRef<HTMLDivElement>(null);

    const filteredRows = useMemo(() => {
        if (!rows || !Array.isArray(rows)) return [];
        if (!searchTerm) return rows;

        const searchTermNormalized = searchTerm.toLowerCase();

        return rows.filter((row) => {
            return (
                row.url.toLowerCase().includes(searchTermNormalized) ||
                row.filetype.toLowerCase().includes(searchTermNormalized) ||
                row.found_at.toLowerCase().includes(searchTermNormalized)
            );
        });
    }, [rows, searchTerm]);

    const rowVirtualizer = useVirtualizer({
        count: filteredRows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan,
        getItemKey: useCallback(
            (index) => filteredRows[index]?.url || index,
            [filteredRows],
        ),
    });

    const debouncedSearch = useMemo(
        () => debounce((value) => setSearchTerm(value), 300),
        [],
    );

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const handleMouseDown = useCallback((index, event) => {
        setIsResizing(index);
        startXRef.current = event.clientX;
        event.preventDefault();
    }, []);

    const handleMouseMove = useCallback(
        (event) => {
            if (isResizing === null) return;
            const delta = event.clientX - startXRef.current;
            setColumnWidths((prev) => {
                const next = [...prev];
                let currentWidth = 0;
                if (next[isResizing].endsWith("px")) {
                    currentWidth = parseInt(next[isResizing]);
                } else {
                    // Fallback if it's 1fr or other unit, though pixels are preferred after first resize
                    currentWidth = 200;
                }
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

    const toggleColumnAlignment = useCallback((index) => {
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
                <div className="h-[5px] border-b dark:border-b-brand-dark bg-white dark:bg-brand-darker w-full absolute -bottom-[0] -mb-1 z-50" />
            </div>

            <div
                ref={parentRef}
                className="w-full h-[calc(100%-2rem)] overflow-auto relative min-w-full"
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
                            No files discovered.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default memo(FilesTable);
