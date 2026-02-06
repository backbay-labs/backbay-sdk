'use client';

/**
 * @backbay/glia Desktop OS - FileBrowser Component
 *
 * A file browser with grid/list views, toolbar, breadcrumb navigation,
 * keyboard navigation, and context menu integration.
 *
 * Uses CSS variables for theming (--bb-color-*, --bb-font-*, etc.)
 */

import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useFileBrowser } from '../../core/desktop/useFileBrowser';
import type {
  FileItem,
  FileBrowserProps,
  FileBrowserSortField,
} from '../../core/desktop/fileBrowserTypes';
import type { ContextMenuItem } from '../../core/shell/types';

// ═══════════════════════════════════════════════════════════════════════════
// Default Icons
// ═══════════════════════════════════════════════════════════════════════════

const FILE_TYPE_ICONS: Record<string, string> = {
  folder: '\u{1F4C1}',
  file: '\u{1F4C4}',
  image: '\u{1F5BC}\uFE0F',
  document: '\u{1F4C3}',
  code: '\u{1F4BB}',
  archive: '\u{1F4E6}',
  audio: '\u{1F3B5}',
  video: '\u{1F3AC}',
};

function getFileIcon(file: FileItem): React.ReactNode {
  if (file.icon) return file.icon;
  return FILE_TYPE_ICONS[file.type] ?? FILE_TYPE_ICONS.file;
}

// ═══════════════════════════════════════════════════════════════════════════
// Format Helpers
// ═══════════════════════════════════════════════════════════════════════════

function formatFileSize(bytes?: number): string {
  if (bytes == null) return '\u2014';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(timestamp?: number): string {
  if (timestamp == null) return '\u2014';
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--bb-color-window-bg, #0a0a0a)',
    color: 'var(--bb-color-text-secondary, #cccccc)',
    fontFamily: 'var(--bb-font-mono, "JetBrains Mono", monospace)',
    fontSize: '11px',
    overflow: 'hidden',
    outline: 'none',
  },

  // Toolbar
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    height: '36px',
    minHeight: '36px',
    padding: '0 8px',
    background: 'var(--bb-color-titlebar-bg, #111111)',
    borderBottom: '1px solid var(--bb-color-window-border, #333333)',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    border: 'none',
    borderRadius: 'var(--bb-radius-button, 3px)',
    background: 'transparent',
    color: 'var(--bb-color-text-secondary, #cccccc)',
    cursor: 'pointer',
    fontFamily: 'var(--bb-font-mono, monospace)',
    fontSize: '12px',
    transition: 'all 0.15s ease',
  },
  navButtonDisabled: {
    opacity: 0.3,
    cursor: 'default',
    pointerEvents: 'none' as const,
  },
  toolbarSeparator: {
    width: '1px',
    height: '16px',
    background: 'var(--bb-color-window-border, #333333)',
    margin: '0 2px',
  },
  viewToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    border: 'none',
    borderRadius: 'var(--bb-radius-button, 3px)',
    background: 'transparent',
    color: 'var(--bb-color-text-secondary, #cccccc)',
    cursor: 'pointer',
    fontFamily: 'var(--bb-font-mono, monospace)',
    fontSize: '11px',
    transition: 'all 0.15s ease',
  },
  viewToggleActive: {
    background: 'rgba(212, 168, 75, 0.12)',
    color: 'var(--bb-color-accent, #d4a84b)',
  },
  searchInput: {
    marginLeft: 'auto',
    height: '22px',
    width: '140px',
    padding: '0 6px',
    border: '1px solid var(--bb-color-window-border, #333333)',
    borderRadius: 'var(--bb-radius-input, 3px)',
    background: 'rgba(0, 0, 0, 0.3)',
    color: 'var(--bb-color-text-primary, #ffffff)',
    fontFamily: 'var(--bb-font-mono, monospace)',
    fontSize: '10px',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },

  // Breadcrumb
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '4px 8px',
    fontFamily: 'var(--bb-font-mono, "JetBrains Mono", monospace)',
    fontSize: '11px',
    borderBottom: '1px solid var(--bb-color-window-border, #222222)',
    overflow: 'hidden',
  },
  breadcrumbSegment: {
    border: 'none',
    background: 'transparent',
    color: 'var(--bb-color-text-muted, #888888)',
    fontFamily: 'var(--bb-font-mono, monospace)',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '2px',
    transition: 'color 0.15s ease',
    whiteSpace: 'nowrap' as const,
  },
  breadcrumbSegmentActive: {
    color: 'var(--bb-color-text-primary, #ffffff)',
    cursor: 'default',
  },
  breadcrumbSeparator: {
    color: 'var(--bb-color-text-muted, #555555)',
    fontSize: '9px',
    userSelect: 'none' as const,
  },

  // Grid View
  gridContainer: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 88px)',
    gap: '8px',
    alignContent: 'start',
  },
  gridItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 10px',
    minWidth: '88px',
    borderRadius: 'var(--bb-radius-button, 3px)',
    background: 'transparent',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 350ms ease-out',
    outline: 'none',
  },
  gridItemSelected: {
    background: 'var(--bb-color-icon-selected, rgba(212, 168, 75, 0.08))',
    boxShadow: '0 0 24px 8px rgba(212, 168, 75, 0.12), 0 0 48px 16px rgba(212, 168, 75, 0.06)',
  },
  gridItemIcon: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    transition: 'all 350ms ease-out',
  },
  gridItemLabel: {
    fontFamily: 'var(--bb-font-display, "Cinzel", serif)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.2,
    transition: 'color 350ms ease-out',
  },

  // List View
  listContainer: {
    flex: 1,
    overflow: 'auto',
  },
  listTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  listHeader: {
    position: 'sticky' as const,
    top: 0,
    background: 'var(--bb-color-titlebar-bg, #111111)',
    zIndex: 1,
  },
  listHeaderCell: {
    padding: '0 12px',
    height: '28px',
    fontFamily: 'var(--bb-font-mono, monospace)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--bb-color-text-muted, #888888)',
    textAlign: 'left' as const,
    borderBottom: '1px solid var(--bb-color-window-border, #333333)',
    cursor: 'pointer',
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
    transition: 'color 0.15s ease',
  },
  listHeaderCellActive: {
    color: 'var(--bb-color-accent, #d4a84b)',
  },
  listRow: {
    height: '28px',
    borderBottom: '1px solid var(--bb-color-window-border, #1a1a1a)',
    cursor: 'pointer',
    transition: 'background 0.1s ease',
  },
  listRowSelected: {
    background: 'var(--bb-color-icon-selected, rgba(212, 168, 75, 0.08))',
  },
  listCell: {
    padding: '0 12px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '300px',
  },
  listCellName: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  listCellIcon: {
    fontSize: '14px',
    width: '18px',
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  listCellSize: {
    textAlign: 'right' as const,
    color: 'var(--bb-color-text-muted, #888888)',
  },
  listCellDate: {
    color: 'var(--bb-color-text-muted, #888888)',
  },
  listCellType: {
    color: 'var(--bb-color-text-muted, #888888)',
    textTransform: 'uppercase' as const,
    fontSize: '10px',
    letterSpacing: '0.05em',
  },

  // Status Bar
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    height: '24px',
    minHeight: '24px',
    padding: '0 10px',
    borderTop: '1px solid var(--bb-color-window-border, #333333)',
    fontFamily: 'var(--bb-font-mono, monospace)',
    fontSize: '10px',
    color: 'var(--bb-color-text-muted, #888888)',
  },

  // Empty state
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--bb-color-text-muted, #555555)',
    fontFamily: 'var(--bb-font-mono, monospace)',
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },

  // Sort arrow
  sortArrow: {
    marginLeft: '4px',
    fontSize: '8px',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════

interface ToolbarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  canGoUp: boolean;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  onViewMode: (mode: 'grid' | 'list') => void;
  onSearchChange: (query: string) => void;
}

function Toolbar({
  canGoBack,
  canGoForward,
  canGoUp,
  viewMode,
  searchQuery,
  onBack,
  onForward,
  onUp,
  onViewMode,
  onSearchChange,
}: ToolbarProps) {
  return (
    <div style={styles.toolbar} data-bb-filebrowser-toolbar>
      <button
        type="button"
        style={{ ...styles.navButton, ...(!canGoBack ? styles.navButtonDisabled : {}) }}
        onClick={onBack}
        disabled={!canGoBack}
        title="Back"
        aria-label="Navigate back"
      >
        &#x2190;
      </button>
      <button
        type="button"
        style={{ ...styles.navButton, ...(!canGoForward ? styles.navButtonDisabled : {}) }}
        onClick={onForward}
        disabled={!canGoForward}
        title="Forward"
        aria-label="Navigate forward"
      >
        &#x2192;
      </button>
      <button
        type="button"
        style={{ ...styles.navButton, ...(!canGoUp ? styles.navButtonDisabled : {}) }}
        onClick={onUp}
        disabled={!canGoUp}
        title="Up"
        aria-label="Navigate up"
      >
        &#x2191;
      </button>

      <div style={styles.toolbarSeparator} />

      <button
        type="button"
        style={{ ...styles.viewToggle, ...(viewMode === 'grid' ? styles.viewToggleActive : {}) }}
        onClick={() => onViewMode('grid')}
        title="Grid view"
        aria-label="Grid view"
      >
        &#x2593;
      </button>
      <button
        type="button"
        style={{ ...styles.viewToggle, ...(viewMode === 'list' ? styles.viewToggleActive : {}) }}
        onClick={() => onViewMode('list')}
        title="List view"
        aria-label="List view"
      >
        &#x2261;
      </button>

      <input
        type="text"
        style={styles.searchInput}
        placeholder="SEARCH..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        data-bb-filebrowser-search
      />
    </div>
  );
}

interface BreadcrumbProps {
  breadcrumb: (FileItem | null)[];
  onNavigate: (folderId: string | null) => void;
}

function Breadcrumb({ breadcrumb, onNavigate }: BreadcrumbProps) {
  return (
    <div style={styles.breadcrumb} data-bb-filebrowser-breadcrumb>
      {breadcrumb.map((item, i) => {
        const isLast = i === breadcrumb.length - 1;
        const label = item === null ? 'ROOT' : item.name;
        const id = item === null ? null : item.id;

        return (
          <React.Fragment key={id ?? 'root'}>
            {i > 0 && <span style={styles.breadcrumbSeparator}>&gt;</span>}
            <button
              type="button"
              style={{
                ...styles.breadcrumbSegment,
                ...(isLast ? styles.breadcrumbSegmentActive : {}),
              }}
              onClick={() => { if (!isLast) onNavigate(id); }}
              disabled={isLast}
            >
              {label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface GridViewProps {
  files: FileItem[];
  selectedIds: Set<string>;
  focusedIndex: number;
  onSelect: (id: string, additive: boolean) => void;
  onActivate: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem | null) => void;
}

function GridView({ files, selectedIds, focusedIndex, onSelect, onActivate, onContextMenu }: GridViewProps) {
  if (files.length === 0) {
    return <div style={styles.empty}>NO ITEMS</div>;
  }

  return (
    <div style={styles.gridContainer} onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, null); }}>
      <div style={styles.grid} data-bb-filebrowser-grid>
        {files.map((file, i) => {
          const isSelected = selectedIds.has(file.id);
          const isFocused = i === focusedIndex;

          return (
            <button
              key={file.id}
              type="button"
              style={{
                ...styles.gridItem,
                ...(isSelected ? styles.gridItemSelected : {}),
                ...(isFocused && !isSelected ? { outline: '1px solid var(--bb-color-accent, #d4a84b)', outlineOffset: '-1px' } : {}),
              }}
              onClick={(e) => onSelect(file.id, e.metaKey || e.ctrlKey)}
              onDoubleClick={() => onActivate(file)}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(file.id, false); onContextMenu(e, file); }}
              data-bb-filebrowser-item
              data-id={file.id}
              data-selected={isSelected || undefined}
            >
              <div
                style={{
                  ...styles.gridItemIcon,
                  color: isSelected ? 'var(--bb-color-accent, #d4a84b)' : 'var(--bb-color-icon-text, #cccccc)',
                  textShadow: isSelected
                    ? '0 0 16px rgba(212, 168, 75, 0.35), 0 0 32px rgba(212, 168, 75, 0.2)'
                    : 'none',
                }}
              >
                {getFileIcon(file)}
              </div>
              <span
                style={{
                  ...styles.gridItemLabel,
                  color: isSelected ? 'var(--bb-color-accent, #d4a84b)' : 'var(--bb-color-icon-text, #cccccc)',
                }}
              >
                {file.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ListViewProps {
  files: FileItem[];
  selectedIds: Set<string>;
  focusedIndex: number;
  sort: { field: FileBrowserSortField; order: 'asc' | 'desc' };
  onSelect: (id: string, additive: boolean) => void;
  onActivate: (file: FileItem) => void;
  onToggleSort: (field: FileBrowserSortField) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem | null) => void;
}

function ListView({ files, selectedIds, focusedIndex, sort, onSelect, onActivate, onToggleSort, onContextMenu }: ListViewProps) {
  const renderSortArrow = (field: FileBrowserSortField) => {
    if (sort.field !== field) return null;
    return <span style={styles.sortArrow}>{sort.order === 'asc' ? '\u25B2' : '\u25BC'}</span>;
  };

  if (files.length === 0) {
    return <div style={styles.empty}>NO ITEMS</div>;
  }

  return (
    <div style={styles.listContainer} onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, null); }}>
      <table style={styles.listTable} data-bb-filebrowser-list>
        <thead style={styles.listHeader}>
          <tr>
            <th
              style={{ ...styles.listHeaderCell, ...(sort.field === 'name' ? styles.listHeaderCellActive : {}), minWidth: '200px' }}
              onClick={() => onToggleSort('name')}
            >
              NAME{renderSortArrow('name')}
            </th>
            <th
              style={{ ...styles.listHeaderCell, ...(sort.field === 'size' ? styles.listHeaderCellActive : {}), width: '80px', textAlign: 'right' }}
              onClick={() => onToggleSort('size')}
            >
              SIZE{renderSortArrow('size')}
            </th>
            <th
              style={{ ...styles.listHeaderCell, ...(sort.field === 'modifiedAt' ? styles.listHeaderCellActive : {}), width: '120px' }}
              onClick={() => onToggleSort('modifiedAt')}
            >
              MODIFIED{renderSortArrow('modifiedAt')}
            </th>
            <th
              style={{ ...styles.listHeaderCell, ...(sort.field === 'type' ? styles.listHeaderCellActive : {}), width: '80px' }}
              onClick={() => onToggleSort('type')}
            >
              TYPE{renderSortArrow('type')}
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file, i) => {
            const isSelected = selectedIds.has(file.id);
            const isFocused = i === focusedIndex;

            return (
              <tr
                key={file.id}
                style={{
                  ...styles.listRow,
                  ...(isSelected ? styles.listRowSelected : {}),
                  ...(isFocused && !isSelected ? { outline: '1px solid var(--bb-color-accent, #d4a84b)', outlineOffset: '-1px' } : {}),
                }}
                onClick={(e) => onSelect(file.id, e.metaKey || e.ctrlKey)}
                onDoubleClick={() => onActivate(file)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(file.id, false); onContextMenu(e, file); }}
                data-bb-filebrowser-item
                data-id={file.id}
                data-selected={isSelected || undefined}
              >
                <td style={{ ...styles.listCell, ...styles.listCellName }}>
                  <span style={styles.listCellIcon}>{getFileIcon(file)}</span>
                  <span>{file.name}</span>
                </td>
                <td style={{ ...styles.listCell, ...styles.listCellSize }}>
                  {file.type === 'folder' ? '\u2014' : formatFileSize(file.size)}
                </td>
                <td style={{ ...styles.listCell, ...styles.listCellDate }}>
                  {formatDate(file.modifiedAt)}
                </td>
                <td style={{ ...styles.listCell, ...styles.listCellType }}>
                  {file.type}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface StatusBarProps {
  totalItems: number;
  selectedCount: number;
}

function StatusBar({ totalItems, selectedCount }: StatusBarProps) {
  return (
    <div style={styles.statusBar} data-bb-filebrowser-statusbar>
      <span>{totalItems} ITEM{totalItems !== 1 ? 'S' : ''}</span>
      {selectedCount > 0 && (
        <span>{selectedCount} SELECTED</span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * File browser component with grid/list views, toolbar, and keyboard navigation.
 *
 * @example
 * ```tsx
 * <FileBrowser
 *   files={myFiles}
 *   onFileActivate={(file) => console.log('Activated:', file.name)}
 *   defaultViewMode="grid"
 * />
 * ```
 */
export function FileBrowser({
  files,
  initialPath,
  onFileActivate,
  onSelectionChange,
  getContextMenuItems,
  defaultViewMode = 'grid',
  defaultSort,
  showToolbar = true,
  showBreadcrumb = true,
  showStatusBar = true,
  className,
  style,
}: FileBrowserProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Context menu state (local, not using global ContextMenu)
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    items: ContextMenuItem[];
  }>({ isOpen: false, position: { x: 0, y: 0 }, items: [] });

  const browser = useFileBrowser(files, initialPath ?? null);

  // Initialize defaults
  useEffect(() => {
    if (defaultViewMode) browser.setViewMode(defaultViewMode);
    if (defaultSort) browser.setSort(defaultSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize starting path
  useEffect(() => {
    if (initialPath) browser.navigateTo(initialPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify selection changes
  useEffect(() => {
    onSelectionChange?.(Array.from(browser.selectedIds));
  }, [browser.selectedIds, onSelectionChange]);

  // Reset focused index when folder changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [browser.currentFolderId]);

  // Handle file activation
  const handleActivate = useCallback(
    (file: FileItem) => {
      if (file.type === 'folder') {
        browser.navigateTo(file.id);
      } else {
        onFileActivate?.(file);
      }
    },
    [browser.navigateTo, onFileActivate]
  );

  // Handle context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, file: FileItem | null) => {
      if (!getContextMenuItems) return;
      const items = getContextMenuItems(file);
      if (items.length === 0) return;
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        items,
      });
    },
    [getContextMenuItems]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Compute grid columns for 2D arrow-key navigation
  const gridColumns = useMemo(() => {
    if (browser.viewMode !== 'grid') return 1;
    const containerWidth = containerRef.current?.clientWidth ?? 800;
    const itemWidth = 88 + 8; // grid item width + gap
    return Math.max(1, Math.floor((containerWidth - 24) / itemWidth));
  }, [browser.viewMode, browser.visibleFiles.length]);

  // Keyboard navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const fileCount = browser.visibleFiles.length;
      if (fileCount === 0) return;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const step = browser.viewMode === 'grid' ? gridColumns : 1;
          setFocusedIndex((prev) => Math.min(prev + step, fileCount - 1));
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const step = browser.viewMode === 'grid' ? gridColumns : 1;
          setFocusedIndex((prev) => Math.max(prev - step, 0));
          break;
        }
        case 'ArrowRight': {
          if (browser.viewMode === 'grid') {
            e.preventDefault();
            setFocusedIndex((prev) => Math.min(prev + 1, fileCount - 1));
          }
          break;
        }
        case 'ArrowLeft': {
          if (browser.viewMode === 'grid') {
            e.preventDefault();
            setFocusedIndex((prev) => Math.max(prev - 1, 0));
          }
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < fileCount) {
            const file = browser.visibleFiles[focusedIndex];
            browser.select(file.id, false);
            handleActivate(file);
          }
          break;
        }
        case 'Backspace': {
          e.preventDefault();
          browser.navigateUp();
          break;
        }
        case 'Escape': {
          e.preventDefault();
          browser.clearSelection();
          setFocusedIndex(-1);
          if (contextMenu.isOpen) closeContextMenu();
          break;
        }
        case 'a':
        case 'A': {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            browser.selectAll();
          }
          break;
        }
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [browser, focusedIndex, gridColumns, handleActivate, contextMenu.isOpen, closeContextMenu]);

  // Auto-select on focus change via keyboard
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < browser.visibleFiles.length) {
      const file = browser.visibleFiles[focusedIndex];
      browser.select(file.id, false);
    }
  }, [focusedIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...styles.container, ...style }}
      tabIndex={0}
      data-bb-filebrowser
    >
      {showToolbar && (
        <Toolbar
          canGoBack={browser.canGoBack}
          canGoForward={browser.canGoForward}
          canGoUp={browser.canGoUp}
          viewMode={browser.viewMode}
          searchQuery={browser.searchQuery}
          onBack={browser.navigateBack}
          onForward={browser.navigateForward}
          onUp={browser.navigateUp}
          onViewMode={browser.setViewMode}
          onSearchChange={browser.setSearchQuery}
        />
      )}

      {showBreadcrumb && (
        <Breadcrumb
          breadcrumb={browser.breadcrumb}
          onNavigate={browser.navigateTo}
        />
      )}

      {browser.viewMode === 'grid' ? (
        <GridView
          files={browser.visibleFiles}
          selectedIds={browser.selectedIds}
          focusedIndex={focusedIndex}
          onSelect={browser.select}
          onActivate={handleActivate}
          onContextMenu={handleContextMenu}
        />
      ) : (
        <ListView
          files={browser.visibleFiles}
          selectedIds={browser.selectedIds}
          focusedIndex={focusedIndex}
          sort={browser.sort}
          onSelect={browser.select}
          onActivate={handleActivate}
          onToggleSort={browser.toggleSortField}
          onContextMenu={handleContextMenu}
        />
      )}

      {showStatusBar && (
        <StatusBar
          totalItems={browser.totalItems}
          selectedCount={browser.selectedCount}
        />
      )}

      {/* Inline context menu */}
      {contextMenu.isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999998 }}
            onClick={closeContextMenu}
            onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}
          />
          <div
            style={{
              position: 'fixed',
              left: contextMenu.position.x,
              top: contextMenu.position.y,
              minWidth: '180px',
              background: 'var(--bb-color-context-menu-bg, #111111)',
              border: '1px solid var(--bb-color-window-border, #333333)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(212, 168, 75, 0.15)',
              padding: '6px',
              zIndex: 999999,
              borderRadius: 'var(--bb-radius-menu, 3px)',
            }}
          >
            {contextMenu.items.map((item, idx) => {
              if (item.separator) {
                return (
                  <div
                    key={item.id || `sep-${idx}`}
                    style={{
                      height: '1px',
                      margin: '5px 8px',
                      background: 'var(--bb-color-window-border, #333333)',
                    }}
                  />
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 0,
                    fontFamily: 'var(--bb-font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'default',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: item.danger
                      ? 'var(--bb-color-destructive, #c44444)'
                      : 'var(--bb-color-text-secondary, #cccccc)',
                    opacity: item.disabled ? 0.4 : 1,
                    pointerEvents: item.disabled ? 'none' : 'auto',
                  }}
                  disabled={item.disabled}
                  onClick={() => {
                    item.action?.();
                    closeContextMenu();
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = item.danger
                      ? 'rgba(196, 92, 92, 0.12)'
                      : 'var(--bb-color-context-menu-hover, rgba(212, 168, 75, 0.10))';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  {item.icon && <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{item.icon}</span>}
                  {item.label}
                  {item.shortcut && (
                    <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.6 }}>{item.shortcut}</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
