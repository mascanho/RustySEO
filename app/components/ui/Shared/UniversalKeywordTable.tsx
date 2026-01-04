// @ts-nocheck
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    ColumnDef,
    SortingState,
} from "@tanstack/react-table";
import { Search, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface UniversalKeywordTableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData>[];
    searchPlaceholder?: string;
    initialPageSize?: number;
    onRowClick?: (row: TData) => void;
    isLoading?: boolean;
    headerActions?: React.ReactNode;
}

export function UniversalKeywordTable<TData>({
    data,
    columns,
    searchPlaceholder = "Search...",
    initialPageSize = 50,
    onRowClick,
    isLoading = false,
    headerActions,
}: UniversalKeywordTableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: initialPageSize,
    });

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
            pagination,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-brand-darker rounded-md border dark:border-brand-dark overflow-hidden relative">
            {/* Search and Controls */}
            <div className="p-2 border-b dark:border-brand-dark flex items-center justify-between gap-4 bg-gray-50/50 dark:bg-brand-darker/50">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9 h-9 text-xs"
                    />
                    {globalFilter && (
                        <button
                            onClick={() => setGlobalFilter("")}
                            className="absolute right-2.5 top-2.5"
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {headerActions}

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Rows per page:</span>
                        <Select
                            value={pagination.pageSize.toString()}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger className="h-8 w-[70px] text-xs">
                                <SelectValue placeholder={pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50, 100, 500].map((size) => (
                                    <SelectItem key={size} value={size.toString()}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto side-scrollbar relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-brand-darker/80 z-20 backdrop-blur-[1px]">
                        <Loader2 className="h-10 w-10 animate-spin text-brand-bright" />
                        <p className="text-sm font-medium text-gray-400 mt-2 animate-pulse">Loading data...</p>
                    </div>
                ) : (
                    <table className="w-full text-xs border-collapse">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-brand-dark z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b dark:border-brand-dark">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider"
                                            style={{ width: header.getSize() }}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={`flex items-center gap-1 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""
                                                        }`}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {{
                                                        asc: <ChevronUp className="h-3 w-3" />,
                                                        desc: <ChevronDown className="h-3 w-3" />,
                                                    }[header.column.getIsSorted() as string] ?? null}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y dark:divide-brand-dark">
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => onRowClick?.(row.original)}
                                        className={`hover:bg-gray-50 dark:hover:bg-brand-dark/50 transition-colors ${onRowClick ? "cursor-pointer" : ""
                                            }`}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-2 whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No results found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Footer */}
            {!isLoading && (
                <div className="p-2 border-t dark:border-brand-dark flex items-center justify-between bg-gray-50/50 dark:bg-brand-darker/50">
                    <div className="text-xs text-muted-foreground">
                        Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                        {Math.min(
                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length
                        )}{" "}
                        of {table.getFilteredRowModel().rows.length} entries
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1 px-2">
                            <span className="text-xs font-medium">
                                {table.getState().pagination.pageIndex + 1}
                            </span>
                            <span className="text-xs text-muted-foreground">of</span>
                            <span className="text-xs font-medium">{table.getPageCount()}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
