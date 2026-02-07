"use client";

import { cn, prefersReducedMotion } from "../../../lib/utils";
import { cva } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import * as React from "react";
import {
  useGlassTokens,
  useColorTokens,
  useMotionTokens,
} from "../../../theme";
import { GlassPanel } from "../Glass/GlassPanel";
import { GlowButton } from "../../atoms/GlowButton/GlowButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import type { ColumnDef, SortState, PaginationState } from "./types";

// ============================================================================
// DENSITY VARIANTS
// ============================================================================

const cellVariants = cva("", {
  variants: {
    variant: {
      compact: "px-2 py-1 text-xs",
      default: "px-3 py-2 text-sm",
      comfortable: "px-4 py-3 text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const headerCellVariants = cva("font-medium", {
  variants: {
    variant: {
      compact: "px-2 py-1.5 text-[10px] uppercase tracking-wider",
      default: "px-3 py-2.5 text-xs uppercase tracking-wider",
      comfortable: "px-4 py-3.5 text-xs uppercase tracking-wider",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// ============================================================================
// TYPES
// ============================================================================

export interface GlassTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  getRowId?: (row: T, index: number) => string;

  // Sorting
  sortState?: SortState;
  onSortChange?: (sort: SortState) => void;

  // Pagination
  pagination?: boolean;
  paginationState?: PaginationState;
  onPaginationChange?: (state: PaginationState) => void;
  pageSizeOptions?: number[];

  // Filtering
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;

  // Selection
  selectable?: boolean;
  selectedRowIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;

  // Appearance
  variant?: "default" | "compact" | "comfortable";
  hoverable?: boolean;
  striped?: boolean;
  loading?: boolean;
  emptyState?: React.ReactNode;
  disableAnimations?: boolean;
  className?: string;
  style?: React.CSSProperties;

  // Row interaction
  onRowClick?: (row: T) => void;
}

// ============================================================================
// SKELETON ROW
// ============================================================================

function SkeletonRow({
  colCount,
  variant,
  glassTokens,
}: {
  colCount: number;
  variant: "compact" | "default" | "comfortable";
  glassTokens: ReturnType<typeof useGlassTokens>;
}) {
  return (
    <tr>
      {Array.from({ length: colCount }, (_, i) => (
        <td key={i} className={cellVariants({ variant })}>
          <div
            className="rounded animate-pulse"
            style={{
              background: glassTokens.hoverBg,
              height: variant === "compact" ? 12 : 16,
              width: `${50 + Math.random() * 40}%`,
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ============================================================================
// SORT ICON
// ============================================================================

function SortIcon({
  direction,
  accentColor,
}: {
  direction: "asc" | "desc" | null;
  accentColor: string;
}) {
  if (direction === "asc") {
    return <ArrowUp className="h-3.5 w-3.5" style={{ color: accentColor }} />;
  }
  if (direction === "desc") {
    return (
      <ArrowDown className="h-3.5 w-3.5" style={{ color: accentColor }} />
    );
  }
  return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
}

// ============================================================================
// GLASS TABLE
// ============================================================================

function GlassTableInner<T>(
  props: GlassTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    columns,
    data,
    getRowId,
    sortState,
    onSortChange,
    pagination = false,
    paginationState,
    onPaginationChange,
    pageSizeOptions = [10, 20, 50],
    globalFilter,
    onGlobalFilterChange,
    selectable = false,
    selectedRowIds,
    onSelectionChange,
    variant = "default",
    hoverable = true,
    striped = false,
    loading = false,
    emptyState,
    disableAnimations = false,
    className,
    style,
    onRowClick,
  } = props;

  const glassTokens = useGlassTokens();
  const colorTokens = useColorTokens();
  const motionTokens = useMotionTokens();
  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  // ---- Row ID helper ----
  const getRowIdFn = React.useCallback(
    (row: T, index: number): string => {
      if (getRowId) return getRowId(row, index);
      if (typeof row === "object" && row !== null && "id" in row) {
        return String((row as Record<string, unknown>).id);
      }
      return String(index);
    },
    [getRowId]
  );

  // ---- Cell value helper ----
  const getCellValue = React.useCallback(
    (row: T, col: ColumnDef<T>): unknown => {
      if (col.accessorFn) return col.accessorFn(row);
      if (col.accessorKey)
        return (row as Record<string, unknown>)[col.accessorKey];
      return undefined;
    },
    []
  );

  // ---- Filtering ----
  const filteredData = React.useMemo(() => {
    if (!globalFilter || globalFilter.trim() === "") return data;
    const search = globalFilter.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = getCellValue(row, col);
        if (val == null) return false;
        return String(val).toLowerCase().includes(search);
      })
    );
  }, [data, globalFilter, columns, getCellValue]);

  // ---- Sorting ----
  const sortedData = React.useMemo(() => {
    if (!sortState || !sortState.direction) return filteredData;
    const col = columns.find((c) => c.id === sortState.columnId);
    if (!col) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = getCellValue(a, col);
      const bVal = getCellValue(b, col);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return aVal - bVal;
      }
      return String(aVal).localeCompare(String(bVal));
    });
    if (sortState.direction === "desc") sorted.reverse();
    return sorted;
  }, [filteredData, sortState, columns, getCellValue]);

  // ---- Pagination ----
  const pageIndex = paginationState?.pageIndex ?? 0;
  const pageSize = paginationState?.pageSize ?? 10;
  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  const paginatedData = React.useMemo(() => {
    if (!pagination) return sortedData;
    const start = pageIndex * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, pageIndex, pageSize]);

  // ---- Selection helpers ----
  const allRowIds = React.useMemo(
    () => new Set(paginatedData.map((row, i) => getRowIdFn(row, i))),
    [paginatedData, getRowIdFn]
  );

  const allSelected =
    selectable &&
    allRowIds.size > 0 &&
    selectedRowIds != null &&
    [...allRowIds].every((id) => selectedRowIds.has(id));

  const someSelected =
    selectable &&
    !allSelected &&
    selectedRowIds != null &&
    [...allRowIds].some((id) => selectedRowIds.has(id));

  const handleSelectAll = React.useCallback(() => {
    if (!onSelectionChange || !selectedRowIds) return;
    if (allSelected) {
      const next = new Set(selectedRowIds);
      allRowIds.forEach((id) => next.delete(id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedRowIds);
      allRowIds.forEach((id) => next.add(id));
      onSelectionChange(next);
    }
  }, [allSelected, allRowIds, selectedRowIds, onSelectionChange]);

  const handleSelectRow = React.useCallback(
    (rowId: string) => {
      if (!onSelectionChange || !selectedRowIds) return;
      const next = new Set(selectedRowIds);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      onSelectionChange(next);
    },
    [selectedRowIds, onSelectionChange]
  );

  // ---- Sort handler ----
  const handleSort = React.useCallback(
    (columnId: string) => {
      if (!onSortChange) return;
      if (sortState?.columnId === columnId) {
        const nextDirection =
          sortState.direction === "asc"
            ? "desc"
            : sortState.direction === "desc"
              ? null
              : "asc";
        onSortChange({ columnId, direction: nextDirection });
      } else {
        onSortChange({ columnId, direction: "asc" });
      }
    },
    [sortState, onSortChange]
  );

  // ---- Page helpers ----
  const setPage = React.useCallback(
    (page: number) => {
      onPaginationChange?.({ pageIndex: page, pageSize });
    },
    [onPaginationChange, pageSize]
  );

  const setPageSize = React.useCallback(
    (size: number) => {
      onPaginationChange?.({ pageIndex: 0, pageSize: size });
    },
    [onPaginationChange]
  );

  // ---- Visible page buttons ----
  const pageButtons = React.useMemo(() => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(0, pageIndex - half);
    const end = Math.min(totalPages, start + maxVisible);
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }
    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [totalPages, pageIndex]);

  // ---- Alignment helper ----
  const alignClass = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  // ---- Checkbox styles ----
  const checkboxStyle: React.CSSProperties = {
    appearance: "none",
    width: 16,
    height: 16,
    borderRadius: 3,
    border: `1.5px solid ${glassTokens.cardBorder}`,
    background: glassTokens.cardBg,
    cursor: "pointer",
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  const checkboxCheckedStyle: React.CSSProperties = {
    ...checkboxStyle,
    background: colorTokens.accent.primary,
    borderColor: colorTokens.accent.primary,
  };

  const showFilter = globalFilter !== undefined;
  const isEmpty = !loading && paginatedData.length === 0;

  return (
    <GlassPanel
      ref={ref}
      elevation="hud"
      className={cn("flex flex-col", className)}
      style={style}
      disableAnimations={disableAnimations}
    >
      {/* ---- Filter toolbar ---- */}
      {showFilter && (
        <div
          className="flex items-center gap-2 px-3 py-2 border-b"
          style={{ borderColor: glassTokens.cardBorder }}
        >
          <Search
            className="h-4 w-4 shrink-0"
            style={{ color: colorTokens.text.soft }}
          />
          <input
            type="text"
            role="searchbox"
            aria-label="Filter table"
            placeholder="Filter..."
            value={globalFilter ?? ""}
            onChange={(e) => onGlobalFilterChange?.(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-50"
            style={{ color: colorTokens.text.primary }}
          />
        </div>
      )}

      {/* ---- Table container ---- */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr
              style={{
                background: glassTokens.headerGradient,
                borderBottom: `1px solid ${glassTokens.cardBorder}`,
              }}
            >
              {/* Selection header */}
              {selectable && (
                <th
                  scope="col"
                  className={cn(
                    headerCellVariants({ variant }),
                    "w-[40px] text-center"
                  )}
                >
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    style={allSelected ? checkboxCheckedStyle : checkboxStyle}
                  />
                </th>
              )}

              {/* Column headers */}
              {columns.map((col) => {
                const isSortable = col.sortable && onSortChange;
                const currentDirection =
                  sortState?.columnId === col.id
                    ? sortState.direction
                    : null;
                const ariaSortValue = isSortable
                  ? currentDirection === "asc"
                    ? ("ascending" as const)
                    : currentDirection === "desc"
                      ? ("descending" as const)
                      : ("none" as const)
                  : undefined;

                return (
                  <th
                    key={col.id}
                    scope="col"
                    aria-sort={ariaSortValue}
                    className={cn(
                      headerCellVariants({ variant }),
                      alignClass(col.align)
                    )}
                    style={{
                      width: col.width,
                      color: colorTokens.text.soft,
                    }}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                        aria-label={`Sort by ${col.header}`}
                        onClick={() => handleSort(col.id)}
                      >
                        <span>{col.header}</span>
                        <SortIcon
                          direction={currentDirection}
                          accentColor={colorTokens.accent.primary}
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* Loading state */}
            {loading &&
              Array.from({ length: pageSize }, (_, i) => (
                <SkeletonRow
                  key={`skeleton-${i}`}
                  colCount={columns.length + (selectable ? 1 : 0)}
                  variant={variant}
                  glassTokens={glassTokens}
                />
              ))}

            {/* Empty state */}
            {isEmpty && (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="text-center py-12"
                >
                  {emptyState ?? (
                    <div style={{ color: colorTokens.text.soft }}>
                      <p className="text-sm">No data to display</p>
                    </div>
                  )}
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading && (
              <AnimatePresence mode="popLayout">
                {paginatedData.map((row, rowIndex) => {
                  const rowId = getRowIdFn(row, rowIndex);
                  const isSelected = selectedRowIds?.has(rowId) ?? false;
                  const isClickable = !!onRowClick;

                  return (
                    <motion.tr
                      key={rowId}
                      initial={shouldAnimate ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      exit={shouldAnimate ? { opacity: 0 } : undefined}
                      transition={{ duration: motionTokens.fast.duration }}
                      className={cn(
                        "border-b transition-colors",
                        isClickable && "cursor-pointer"
                      )}
                      style={{
                        borderColor: glassTokens.cardBorder,
                        background: isSelected
                          ? `${colorTokens.accent.primary}15`
                          : striped && rowIndex % 2 === 1
                            ? `${glassTokens.hoverBg}40`
                            : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (hoverable) {
                          (
                            e.currentTarget as HTMLElement
                          ).style.background = isSelected
                            ? `${colorTokens.accent.primary}25`
                            : glassTokens.hoverBg;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (hoverable) {
                          (
                            e.currentTarget as HTMLElement
                          ).style.background = isSelected
                            ? `${colorTokens.accent.primary}15`
                            : striped && rowIndex % 2 === 1
                              ? `${glassTokens.hoverBg}40`
                              : "";
                        }
                      }}
                      onClick={() => onRowClick?.(row)}
                    >
                      {/* Selection cell */}
                      {selectable && (
                        <td
                          className={cn(
                            cellVariants({ variant }),
                            "text-center"
                          )}
                        >
                          <input
                            type="checkbox"
                            aria-label={`Select row ${rowId}`}
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectRow(rowId);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={
                              isSelected
                                ? checkboxCheckedStyle
                                : checkboxStyle
                            }
                          />
                        </td>
                      )}

                      {/* Data cells */}
                      {columns.map((col) => {
                        const rawValue = getCellValue(row, col);
                        const rendered = col.cell
                          ? col.cell(rawValue, row)
                          : rawValue != null
                            ? String(rawValue)
                            : "";

                        return (
                          <td
                            key={col.id}
                            className={cn(
                              cellVariants({ variant }),
                              alignClass(col.align)
                            )}
                            style={{
                              color: colorTokens.text.primary,
                              width: col.width,
                            }}
                          >
                            {rendered}
                          </td>
                        );
                      })}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* ---- Pagination footer ---- */}
      {pagination && (
        <div
          className="flex items-center justify-between gap-4 px-3 py-2 border-t"
          style={{ borderColor: glassTokens.cardBorder }}
        >
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs whitespace-nowrap"
              style={{ color: colorTokens.text.soft }}
            >
              Rows per page
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger size="sm" className="w-[70px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page info */}
          <span
            className="text-xs whitespace-nowrap"
            style={{ color: colorTokens.text.soft }}
          >
            {totalRows === 0
              ? "0 results"
              : `${pageIndex * pageSize + 1}-${Math.min((pageIndex + 1) * pageSize, totalRows)} of ${totalRows}`}
          </span>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <GlowButton
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={pageIndex === 0}
              aria-label="Go to first page"
              onClick={() => setPage(0)}
              disableAnimations={disableAnimations}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </GlowButton>
            <GlowButton
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={pageIndex === 0}
              aria-label="Go to previous page"
              onClick={() => setPage(pageIndex - 1)}
              disableAnimations={disableAnimations}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </GlowButton>

            {pageButtons.map((p) => (
              <GlowButton
                key={p}
                variant={p === pageIndex ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                aria-label={`Go to page ${p + 1}`}
                aria-current={p === pageIndex ? "page" : undefined}
                onClick={() => setPage(p)}
                disableAnimations={disableAnimations}
              >
                {p + 1}
              </GlowButton>
            ))}

            <GlowButton
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={pageIndex >= totalPages - 1}
              aria-label="Go to next page"
              onClick={() => setPage(pageIndex + 1)}
              disableAnimations={disableAnimations}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </GlowButton>
            <GlowButton
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={pageIndex >= totalPages - 1}
              aria-label="Go to last page"
              onClick={() => setPage(totalPages - 1)}
              disableAnimations={disableAnimations}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </GlowButton>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}

export const GlassTable = React.forwardRef(GlassTableInner) as <T>(
  props: GlassTableProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement;
