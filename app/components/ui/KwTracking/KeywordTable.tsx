import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import KeywordRow from "./KeywordRow";
import { ChevronUp, ChevronDown } from "lucide-react";

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
}

export default function KeywordTable({
  keywords,
  removeKeyword,
  requestSort,
  sortConfig,
}: KeywordTableProps) {
  const columns: ColumnDef<Keyword>[] = [
    {
      accessorKey: "keyword",
      header: "Keyword",
    },
    {
      accessorKey: "currentImpressions",
      header: "Impressions",
      cell: ({ row }) => {
        const change =
          row.original.currentImpressions - row.original.initialImpressions;
        const color =
          change > 0
            ? "text-green-600"
            : change < 0
              ? "text-red-600"
              : "text-gray-600";
        const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
        return (
          <span>
            {row.original.currentImpressions.toLocaleString()}{" "}
            <span className={`${color} ml-2`}>
              ({arrow} {Math.abs(change).toLocaleString()})
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
            ? "text-green-600"
            : change < 0
              ? "text-red-600"
              : "text-gray-600";
        const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
        return (
          <span>
            {row.original.currentClicks.toLocaleString()}{" "}
            <span className={`${color} ml-2`}>
              ({arrow} {Math.abs(change).toLocaleString()})
            </span>
          </span>
        );
      },
    },
    {
      accessorKey: "url",
      header: "URL",
    },
    {
      accessorKey: "currentPosition",
      header: "Position",
      cell: ({ row }) => {
        const change =
          row.original.initialPosition - row.original.currentPosition;
        const color =
          change > 0
            ? "text-green-600"
            : change < 0
              ? "text-red-600"
              : "text-gray-600";
        const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
        return (
          <span>
            {row.original.currentPosition}{" "}
            <span className={`${color} ml-2`}>
              ({arrow} {Math.abs(change)})
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
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                onClick={() => requestSort(header.column.id as keyof Keyword)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        ))}
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {table.getRowModel().rows.map((row, index) => (
          <KeywordRow
            key={row.id}
            row={row}
            index={index}
            removeKeyword={removeKeyword}
          />
        ))}
      </tbody>
    </table>
  );
}
