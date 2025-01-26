// @ts-nocheck
import type React from "react";
import { useState, useMemo, useCallback } from "react";
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  useBlockLayout,
  useResizeColumns,
} from "react-table";
import type { Column, Data, ResizableColumnInstance } from "../types/table";
import SearchInput from "./SearchInput";
import ColumnSelector from "./ColumnSelector";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TableProps {
  columns: Column[];
  data: Data[];
  onCellClick?: (rowIndex: number, columnId: string) => void;
  onCellRightClick?: (rowIndex: number, columnId: string) => void;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
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

  const defaultColumn = useMemo(
    () => ({
      minWidth: 100,
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
      data,
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

      return (
        <ContextMenu key={key}>
          <ContextMenuTrigger>
            <div
              {...cellProps}
              className={`flex items-center p-2 border-b border-r border-gray-200 truncate cursor-pointer hover:bg-gray-100 ${
                isSelected ? "bg-blue-200" : ""
              }`}
              style={{
                width: cell.column.width,
                borderRight: "1px solid #e5e7eb",
              }}
              onClick={() => handleCellClick(rowIndex, cell.column.id)}
            >
              {cell.render("Cell")}
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
    <div className="overflow-x-auto flex-1">
      <div className="mb-4 flex justify-between items-center">
        <SearchInput value={globalFilter || ""} onChange={setGlobalFilter} />
        <ColumnSelector
          columns={columns}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        />
      </div>
      <div className="overflow-x-auto overflow-y-auto  border border-gray-300 rounded-md h-full min-h[800px]">
        <div {...getTableProps()} className="inline-block min-w-2">
          <div className="sticky top-0 bg-gray-100">
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
                          className="font-semibold text-left p-2 border-b border-gray-200 relative bg-gray-100"
                          style={{ width: column.width }}
                        >
                          <div className="flex items-center justify-between h-full">
                            {column.render("Header")}
                            <span className="ml-2">
                              {column.isSorted
                                ? column.isSortedDesc
                                  ? " 🔽"
                                  : " 🔼"
                                : ""}
                            </span>
                          </div>
                          <div
                            {...column.getResizerProps()}
                            className={`absolute right-0 top-0 h-full w-px bg-gray-300 cursor-col-resize hover:bg-blue-500 transition-colors duration-200 ${
                              column.isResizing ? "bg-blue-500" : ""
                            }`}
                          />
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
