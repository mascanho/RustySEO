import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import KeywordRow from "./KeywordRow";
import { ChevronUp, ChevronDown, Settings } from "lucide-react";

interface Keyword {
  id: string;
  keyword: string;
  initialImpressions: number;
  currentImpressions: number;
  initialClicks: number;
  currentClicks: number;
  url: string;
  initialPosition: number;
  currentPosition: number;
  dateAdded: string;
}

type SortConfig = {
  key: keyof Keyword;
  direction: "asc" | "desc";
} | null;

interface KeywordTableProps {
  keywords: Keyword[];
  removeKeyword: (id: string) => void;
  requestSort: (key: keyof Keyword) => void;
  sortConfig: SortConfig;
  keywordIds: string[];
}

export default function KeywordTable({
  keywords,
  removeKeyword,
  requestSort,
  sortConfig,
  keywordIds,
}: KeywordTableProps) {
  const columns: ColumnDef<Keyword>[] = [
    {
      accessorKey: "keyword",
      header: "Keyword",
      cell: ({ row }) => (
        <span className="text-blue-600 font-semibold">
          {row.original.keyword}
        </span>
      ),
    },
    {
      accessorKey: "currentImpressions",
      header: "Impressions",
      cell: ({ row }) => {
        const change =
          row.original.currentImpressions - row.original.initialImpressions;
        const color =
          change > 0
            ? "text-green-500"
            : change < 0
              ? "text-red-600"
              : "text-gray-600";
        const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
        return (
          <span>
            {row.original.currentImpressions.toLocaleString()}{" "}
            <span
              className={`inline-flex items-center ml-2 py-0.5 text-xs font-medium ${color}`}
            >
              {arrow} {Math.abs(change).toLocaleString()}
            </span>
          </span>
        );
      },
    },
    {
      accessorKey: "currentClicks",
      header: "Clicks",
      cell: ({ row }) => {
        const change = row.original.currentClicks - row.original.initialClicks;
        const color =
          change > 0
            ? "text-green-500"
            : change < 0
              ? "text-red-800"
              : "text-gray-600";
        const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
        return (
          <span>
            {row.original.currentClicks.toLocaleString()}{" "}
            <span
              className={`inline-flex items-center py-0.5 text-xs pl-2 font-medium  ${color}`}
            >
              {arrow} {Math.abs(change).toLocaleString()}
            </span>
          </span>
        );
      },
    },
    {
      accessorKey: "url",
      header: () => <div className="text-center">URL</div>,
      cell: ({ row }) => (
        <div className="max-w-[400px] truncate text-gray-500">
          {row.original.url}
        </div>
      ),
    },
    {
      accessorKey: "currentPosition",
      header: "Position",
      cell: ({ row }) => {
        const position = Math.max(1, row.original.currentPosition);
        const initialPosition = Math.max(1, row.original.initialPosition);
        const change = initialPosition - position;
        const color =
          change > 0
            ? "text-green-600"
            : change < 0
              ? "text-red-600"
              : "text-gray-600";
        const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
        return (
          <span>
            {position.toFixed(1)}{" "}
            <span
              className={`inline-flex items-center py-0.5 text-xs font-medium ml-2 ${color}`}
            >
              {arrow} {Math.abs(change).toFixed(1)}
            </span>
          </span>
        );
      },
    },
    {
      accessorKey: "dateAdded",
      header: "Date Added",
    },
  ];

  const table = useReactTable({
    data: keywords,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto h-[calc(100vh-16rem)] pb-6 bg-white dark:bg-brand-darker rounded-md dark:border-brand-dark border overflow-y-scroll relative">
      <table className="divide-y divide-gray-200 w-full">
        <thead className="bg-gray-50 sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={() => requestSort(header.column.id as keyof Keyword)}
                  className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {sortConfig?.key === header.column.id &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </th>
              ))}
              <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <Settings className="h-4 w-4" />
              </th>
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 overflow-hidden">
          {table.getRowModel().rows.map((row, index) => (
            <KeywordRow
              key={row.id}
              row={row}
              index={index}
              removeKeyword={removeKeyword}
              keywordIds={keywordIds}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
