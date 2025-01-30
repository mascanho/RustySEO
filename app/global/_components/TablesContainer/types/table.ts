import type { ColumnInstance } from "react-table";

export interface Column {
  Header: string;
  accessor: string;
}

export interface Data {
  [key: string]: string | number;
}

export interface ResizableColumnInstance extends ColumnInstance {
  getResizerProps: () => any;
  isResizing: boolean;
}

export interface CellData {
  id: number;
  details: string;
  history: string[];
  related: { id: number; name: string }[];
}

export interface TabData {
  columns: Column[];
  data: Data[];
}
