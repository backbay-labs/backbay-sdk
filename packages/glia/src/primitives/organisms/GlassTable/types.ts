import type React from "react";

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorFn?: (row: T) => React.ReactNode;
  accessorKey?: keyof T & string;
  sortable?: boolean;
  width?: string;
  cell?: (value: unknown, row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}
