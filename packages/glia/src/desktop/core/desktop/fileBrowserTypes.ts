/**
 * @backbay/glia Desktop OS - FileBrowser Types
 *
 * Types for the file browser component and store.
 */

import type React from 'react';
import type { ContextMenuItem } from '../shell/types';

// ═══════════════════════════════════════════════════════════════════════════
// File Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Classification of file types for icon rendering.
 */
export type FileType =
  | 'file'
  | 'folder'
  | 'image'
  | 'document'
  | 'code'
  | 'archive'
  | 'audio'
  | 'video';

/**
 * A single file or folder item in the file browser.
 */
export interface FileItem {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** File type classification */
  type: FileType;
  /** Optional custom icon override */
  icon?: React.ReactNode;
  /** File size in bytes */
  size?: number;
  /** Last modified timestamp (ms since epoch) */
  modifiedAt?: number;
  /** Created timestamp (ms since epoch) */
  createdAt?: number;
  /** Parent folder ID, null for root items */
  parentId: string | null;
  /** MIME type string */
  mimeType?: string;
  /** Arbitrary metadata */
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// View & Sort
// ═══════════════════════════════════════════════════════════════════════════

/**
 * File browser view mode.
 */
export type FileBrowserViewMode = 'grid' | 'list';

/**
 * Sortable fields.
 */
export type FileBrowserSortField = 'name' | 'size' | 'modifiedAt' | 'type';

/**
 * Sort direction.
 */
export type FileBrowserSortOrder = 'asc' | 'desc';

/**
 * Sort configuration.
 */
export interface FileBrowserSort {
  field: FileBrowserSortField;
  order: FileBrowserSortOrder;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component Props
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Props for the FileBrowser component.
 */
export interface FileBrowserProps {
  /** All file items (flat list, tree built from parentId) */
  files: FileItem[];
  /** Initial folder path (folder ID to start in) */
  initialPath?: string;
  /** Called when a file is activated (double-click / Enter) */
  onFileActivate?: (file: FileItem) => void;
  /** Called when selection changes */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** Context menu item provider */
  getContextMenuItems?: (file: FileItem | null) => ContextMenuItem[];
  /** Default view mode */
  defaultViewMode?: FileBrowserViewMode;
  /** Default sort configuration */
  defaultSort?: FileBrowserSort;
  /** Show toolbar */
  showToolbar?: boolean;
  /** Show breadcrumb path */
  showBreadcrumb?: boolean;
  /** Show status bar */
  showStatusBar?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}
