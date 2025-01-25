// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  getPaginationRowModel,
} from "@tanstack/react-table";
import KeywordRow from "./KeywordRow";
import { Search, X } from "lucide-react";

interface GSCData {
  id: number;
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  url: string;
  position: number;
  date: string;
}

interface KeywordTableProps {
  gscData: GSCData[];
}

export default function GSCkeywordTable({ gscData }: KeywordTableProps) {
  const [keywordSearch, setKeywordSearch] = useState("");
  const [pageSize, setPageSize] = useState(100);
  const [pageIndex, setPageIndex] = useState(0);
  const [filteredData, setFilteredData] = useState<GSCData[]>([]);

  useEffect(() => {
    setFilteredData(
      gscData.filter(
        (item) =>
          item.query.toLowerCase().includes(keywordSearch.toLowerCase()) ||
          item.url.toLowerCase().includes(keywordSearch.toLowerCase()),
      ),
    );
  }, [gscData, keywordSearch]);

  const clearSearch = () => {
    setKeywordSearch("");
  };

  const columns: ColumnDef<GSCData>[] = [
    {
      accessorKey: "query",
      header: "Keyword",
      cell: ({ row }) => (
        <span className="text-blue-600 font-semibold  w-[100px] max-w-[150px] min-w-[200px] block">
          {row.original.query.toString().length > 45
            ? row.original.query.substring(0, 45) + "..."
            : row.original.query}
        </span>
      ),
    },
    {
      accessorKey: "impressions",
      header: "Impressions",
      cell: ({ row }) => {
        return <span>{row.original.impressions.toLocaleString()}</span>;
      },
    },
    {
      id: "ctr",
      header: "CTR",
      cell: ({ row }) => {
        return <span>{(row.original.ctr * 100).toFixed(2)}%</span>;
      },
    },
    {
      accessorKey: "clicks",
      header: "Clicks",
      cell: ({ row }) => {
        return <span>{row.original.clicks.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: "url",
      header: () => <div className="text-center">URL</div>,
      cell: ({ row }) => (
        <div className="w-[400px]  min-w-[400px] text-gray-500">
          {row.original.url.length > 80
            ? row.original.url.substring(0, 86) + "..."
            : row.original.url}
        </div>
      ),
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ row }) => {
        const position = Math.max(1, row.original.position);
        let colorClass = "";
        if (position <= 1.9) {
          colorClass = "text-green-500";
        } else if (position <= 10) {
          colorClass = "text-blue-500";
        } else if (position >= 10) {
          colorClass = "text-red-500";
        }
        return <span className={colorClass}>{position.toFixed(1)}</span>;
      },
    },
    // {
    //   accessorKey: "date",
    //   header: "Date Added",
    // },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageSize,
        pageIndex,
      },
    },
    manualPagination: false,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({ pageIndex, pageSize });
        setPageIndex(newState.pageIndex);
        setPageSize(newState.pageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
  });

  useEffect(() => {
    table.setPageIndex(pageIndex);
  }, [pageIndex, table]);

  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="overflow-x-auto flex-1 bg-white dark:bg-brand-darker rounded-md dark:border-brand-dark border overflow-y-scroll relative">
        <div className="sticky top-0 z-20 bg-white dark:bg-brand-darker p-2">
          <div className="flex items-center relative">
            <Search className="h-4 w-4 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search keywords or URL..."
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
              className="ml-2 w-96 px-2 py-1 border dark:border-brand-dark rounded dark:bg-brand-darker focus:outline-none focus:border-blue-500 text-xs"
            />
            {keywordSearch && (
              <X
                className="h-4 w-4 text-red-500 absolute left-96 cursor-pointer"
                onClick={clearSearch}
              />
            )}
          </div>
        </div>
        <table className="divide-y divide-gray-200 w-full">
          <thead className="bg-gray-50 sticky top-[40px] z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </div>
                  </th>
                ))}
                {/* <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  <RefreshCw
                    className="h-4 w-4 cursor-pointer"
                    onClick={refreshKeywords}
                  />
                </th> */}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white  divide-y divide-gray-200 dark:divide-y-red-500 dark:divide-y  overflow-hidden">
            {table.getRowModel().rows.map((row, index) => (
              <KeywordRow key={row.id} row={row} index={index} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between p-4  bg-white dark:bg-brand-darker">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 text-sm border rounded disabled:opacity-50 dark:border-brand-dark"
          >
            {"<<"}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 text-sm border rounded disabled:opacity-50 dark:border-brand-dark"
          >
            {"<"}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 text-sm border rounded disabled:opacity-50 dark:border-brand-dark"
          >
            {">"}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 text-sm border rounded disabled:opacity-50 dark:border-brand-dark"
          >
            {">>"}
          </button>
          <span className="flex items-center gap-1">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </strong>
          </span>
        </div>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            const newSize = Number(e.target.value);
            setPageSize(newSize);
            table.setPageSize(newSize);
          }}
          className="px-2 py-1 text-sm border rounded bg-gray-200 dark:bg-brand-darker dark:text-white/50"
        >
          {[10, 20, 30, 40, 50, 100, 500, 1000, 2000].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize === filteredData.length ? "All" : pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
