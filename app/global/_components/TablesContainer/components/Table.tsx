// @ts-nocheck
import React, { useState, useMemo, useCallback, useEffect } from "react";
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

interface TableProps {
  columns?: Column[]; // Make columns optional
  onCellClick?: (rowIndex: number, columnId: string) => void;
  onCellRightClick?: (rowIndex: number, columnId: string) => void;
  data?: any[]; // Make data optional
}

const Table: React.FC<TableProps> = ({
  columns = [], // Default to an empty array if no columns are provided
  onCellClick,
  onCellRightClick,
  data = [], // Default to an empty array if no data are provided
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns?.map((col) => col.accessor) || [], // Ensure visibleColumns is always an array
  );

  const defaultColumn = useMemo(
    () => ({
      minWidth: 40,
      width: 150,
      maxWidth: 400,
    }),
    [],
  );

  // Ensure data is always an array and filter out null/undefined rows
  const sanitizedData = useMemo(() => {
    if (!Array.isArray(data)) {
      console.error("Invalid data format. Expected an array. Received:", data);
      return [];
    }
    return data.filter((row) => row != null); // Filter out null/undefined rows
  }, [data]);

  // Filter columns based on visibleColumns
  const filteredColumns = useMemo(() => {
    if (!Array.isArray(columns)) {
      console.error(
        "Invalid columns format. Expected an array. Received:",
        columns,
      );
      return [];
    }
    return columns.filter((column) => visibleColumns.includes(column.accessor));
  }, [columns, visibleColumns]);

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
      data: sanitizedData,
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
      if (!cell || !cell.column) return null; // Safeguard against undefined cells or columns

      const { key, ...cellProps } = cell.getCellProps();
      const isSelected =
        selectedCell?.rowIndex === rowIndex &&
        selectedCell?.columnId === cell.column.id;
      const isIdColumn = cell.column.id === "id";
      const isBooleanColumn =
        cell.column.id === "mobileFriendly" || cell.column.id === "indexable";
      const cellValue = cell.value ?? "N/A"; // Default to "N/A" if value is undefined or null

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
                width: cell.column.width || cellProps.style.width,
              }}
              onClick={() => handleCellClick(rowIndex, cell.column.id)}
            >
              {isBooleanColumn ? (
                <span
                  className={`px-2 py-1 rounded ${
                    cellValue
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {cellValue ? "Yes" : "No"}
                </span>
              ) : (
                cell.render("Cell", { value: cellValue })
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
      <div className="flex-grow overflow-auto rounded-md dark:bg-brand-darker dark:text-white/50">
        <div {...getTableProps()} className="inline-block min-w-full">
          <div className="sticky top-0 z-10 bg-gray-100 dark:bg-brand-darker dark:text-white">
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
                          className="font-semibold dark:bg-brand-darker text-left p-1 text-xs border-b border-r border-gray-200 relative bg-gray-100"
                          style={{
                            ...columnProps.style,
                            width: column.width || columnProps.style?.width,
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
            {rows.length > 0 ? (
              rows.map((row, rowIndex) => {
                try {
                  prepareRow(row);
                  const { key, ...rowProps } = row.getRowProps();
                  return (
                    <div key={key} {...rowProps} className="flex w-full">
                      {row.cells.map((cell) => renderCell(cell, rowIndex))}
                    </div>
                  );
                } catch (error) {
                  console.error(
                    "Error preparing row:",
                    error,
                    "Row data:",
                    row,
                  );
                  return null; // Skip rendering this row
                }
              })
            ) : (
              <div className="flex justify-center items-center p-4">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Table;
