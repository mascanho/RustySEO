import React, { useState, useMemo, useCallback } from "react";
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  useBlockLayout,
  useResizeColumns,
} from "react-table";
import type { Column, ResizableColumnInstance } from "../types/table";
import SearchInput from "./SearchInput";
import ColumnSelector from "./ColumnSelector";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

interface TableProps {
  columns: Column[];
  onCellClick?: (rowIndex: number, columnId: string) => void;
  onCellRightClick?: (rowIndex: number, columnId: string) => void;
}

const Table: React.FC<TableProps> = ({
  columns,
  onCellClick,
  onCellRightClick,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.map((col) => col.accessor),
  );
  const { crawlData } = useGlobalCrawlStore();

  const data = useMemo(() => {
    return crawlData?.map((result, index) => ({
      id: index + 1,
      url: result?.url || "",
      pageTitle: result?.title?.[0]?.title || "",
      titleLength: result?.title?.[0]?.title_len || 0,
      metaDescription: result?.description || "",
      metaDescriptionLength: result?.description?.length || 0,
      h1: result?.headings?.h1?.[0] || "",
      h2Count: result?.headings?.h2?.length || 0,
      wordCount: result?.word_count || 0,
      statusCode: result?.status_code || 0,
      responseTime: result?.response_time || 0,
      canonicalUrl: result?.url || "",
      indexable: result?.indexability?.indexability > 0.5 || false,
      indexabilityReason: result?.indexability?.indexability_reason || "",
      internalLinks: Object.keys(result?.anchor_links?.internal || {}).length,
      externalLinks: Object.keys(result?.anchor_links?.external || {}).length,
      images: result?.images?.length || 0,
      altTagsMissing: result?.alt_tags?.without_alt_tags?.length || 0,
      loadTime: result?.response_time || 0,
      ssl: result?.url?.startsWith("https") || false,
      mobileFriendly: result?.mobile || false,
    }));
  }, [crawlData]);

  const defaultColumn = useMemo(
    () => ({
      minWidth: 80,
      width: 150,
      maxWidth: 400,
    }),
    [],
  );

  const filteredColumns = useMemo(
    () => columns.filter((column) => visibleColumns.includes(column.accessor)),
    [columns, visibleColumns],
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    setGlobalFilter,
  } = useTable(
    {
      columns: filteredColumns,
      data: data || [],
      defaultColumn,
    },
    useBlockLayout,
    useResizeColumns,
    useGlobalFilter,
    useSortBy,
  );

  const { globalFilter } = state;

  const handleCellClick = useCallback(
    (rowIndex: number, columnId: string) => {
      setSelectedCell({ rowIndex, columnId });
      if (onCellClick) {
        onCellClick(rowIndex, columnId);
      }
    },
    [onCellClick],
  );

  const handleCellRightClick = useCallback(
    (rowIndex: number, columnId: string) => {
      if (onCellRightClick) {
        onCellRightClick(rowIndex, columnId);
      }
    },
    [onCellRightClick],
  );

  const renderCell = useCallback(
    (cell: any, rowIndex: number) => {
      const { key, ...cellProps } = cell.getCellProps();
      const isSelected =
        selectedCell?.rowIndex === rowIndex &&
        selectedCell?.columnId === cell.column.id;
      const isIdColumn = cell.column.id === "id";
      const isBooleanColumn =
        cell.column.id === "ssl" ||
        cell.column.id === "mobileFriendly" ||
        cell.column.id === "indexable";

      return (
        <ContextMenu key={key}>
          <ContextMenuTrigger>
            <div
              {...cellProps}
              className={`flex items-center p-1 text-xs border-b border-r border-gray-200 truncate cursor-pointer hover:bg-gray-100 ${
                isSelected ? "bg-blue-200" : ""
              } ${isIdColumn ? "justify-center" : ""}`}
              style={{
                ...cellProps.style,
                width: cell.column.defaultWidth || cellProps.style.width,
              }}
              onClick={() => handleCellClick(rowIndex, cell.column.id)}
            >
              {isBooleanColumn ? (
                <span
                  className={`px-2 py-1 rounded ${
                    cell.value
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {cell.value ? "Yes" : "No"}
                </span>
              ) : (
                cell.render("Cell")
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onSelect={() => handleCellRightClick(rowIndex, cell.column.id)}
            >
              View Details
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    },
    [handleCellClick, handleCellRightClick, selectedCell],
  );

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="flex justify-between items-center">
        <SearchInput value={globalFilter || ""} onChange={setGlobalFilter} />
        <ColumnSelector
          columns={columns}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        />
      </div>
      <div className="flex-grow overflow-auto rounded-md">
        <div {...getTableProps()} className="inline-block min-w-full">
          <div className="sticky top-0 z-10 bg-gray-100">
            {headerGroups.map((headerGroup) => {
              const { key, ...headerGroupProps } =
                headerGroup.getHeaderGroupProps();
              return (
                <div key={key} {...headerGroupProps} className="flex">
                  {headerGroup.headers.map(
                    (column: ResizableColumnInstance) => {
                      const { key, ...columnProps } = column.getHeaderProps(
                        column.getSortByToggleProps(),
                      );
                      return (
                        <div
                          key={key}
                          {...columnProps}
                          className="font-semibold text-left p-1 text-xs border-b border-r border-gray-200 relative bg-gray-100"
                          style={{
                            ...columnProps.style,
                            width:
                              column.defaultWidth || columnProps.style?.width,
                          }}
                        >
                          <div
                            className={`flex items-center justify-between h-full ${column.id === "id" ? "justify-center" : ""}`}
                          >
                            {column.render("Header")}
                            <span className="ml-2">
                              {column.isSorted
                                ? column.isSortedDesc
                                  ? " 🔽"
                                  : " 🔼"
                                : ""}
                            </span>
                          </div>
                          {column.id !== "id" && (
                            <div
                              {...column.getResizerProps()}
                              className={`absolute right-0 top-0 h-full w-1 bg-gray-300 cursor-col-resize hover:bg-blue-500 transition-colors duration-200 ${
                                column.isResizing ? "bg-blue-500" : ""
                              }`}
                            />
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              );
            })}
          </div>
          <div {...getTableBodyProps()}>
            {rows.map((row, rowIndex) => {
              prepareRow(row);
              const { key, ...rowProps } = row.getRowProps();
              return (
                <div key={key} {...rowProps} className="flex w-full">
                  {row.cells.map((cell) => renderCell(cell, rowIndex))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Table;
