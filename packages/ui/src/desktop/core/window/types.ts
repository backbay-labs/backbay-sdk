/**
 * @backbay/bb-ui Desktop OS - Window Types
 *
 * Core types for window management. These types are designed to be
 * framework-agnostic and work with both provider-managed and standalone modes.
 */

export type WindowId = string;

/**
 * Tile positions for snapping windows to screen edges/corners.
 * Based on Hyprland-style tiling behavior.
 */
export type TilePosition =
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Window state representing a single window instance.
 */
export interface WindowState {
  id: WindowId;
  title: string;
  icon?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  isFullscreen: boolean;
  isFocused: boolean;
  zIndex: number;
  /** Tile position if window is snapped to an edge */
  tilePosition?: TilePosition;
  /** Group ID if window is part of a tab group */
  groupId?: string;
  /** Whether this is the active tab in its group */
  isGroupActive?: boolean;
  /** Pre-maximize position for restore */
  preMaximize?: { x: number; y: number; width: number; height: number };
  /** Pre-fullscreen position for restore */
  preFullscreen?: { x: number; y: number; width: number; height: number };
  /** Pre-tile position for restore */
  preTile?: { x: number; y: number; width: number; height: number };
}

/**
 * Window group representing a tab group of windows.
 */
export interface WindowGroup {
  id: string;
  windowIds: WindowId[];
  activeWindowId: WindowId;
}

/**
 * Configuration for opening a new window.
 */
export interface WindowOpenConfig {
  title: string;
  icon?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  isMinimized?: boolean;
  isMaximized?: boolean;
}

/**
 * Return type for the useWindowManager hook.
 */
export interface UseWindowManagerReturn {
  /** All windows in the system */
  windows: WindowState[];
  /** Currently focused window ID */
  focusedId: WindowId | null;
  /** Window currently in fullscreen mode */
  fullscreenId: WindowId | null;
  /** All window groups */
  groups: WindowGroup[];

  // Window lifecycle
  /** Open a new window and return its ID */
  open: (config: WindowOpenConfig) => WindowId;
  /** Close a window by ID */
  close: (id: WindowId) => void;

  // Focus management
  /** Focus a window by ID */
  focus: (id: WindowId) => void;
  /** Cycle focus to the next window */
  cycleFocusNext: () => void;

  // Window state changes
  /** Minimize a window */
  minimize: (id: WindowId) => void;
  /** Maximize a window */
  maximize: (id: WindowId) => void;
  /** Restore a window from minimized/maximized state */
  restore: (id: WindowId) => void;
  /** Enter fullscreen mode */
  fullscreen: (id: WindowId) => void;
  /** Exit fullscreen mode */
  exitFullscreen: () => void;

  // Position and size
  /** Move a window to a new position */
  move: (id: WindowId, position: { x: number; y: number }) => void;
  /** Resize a window */
  resize: (id: WindowId, size: { width: number; height: number }) => void;

  // Tiling
  /** Tile a window to a screen position */
  tile: (id: WindowId, position: TilePosition) => void;
  /** Untile a window */
  untile: (id: WindowId) => void;

  // Window grouping
  /** Create a new group from two windows */
  createGroup: (windowId1: WindowId, windowId2: WindowId) => string | null;
  /** Add a window to an existing group */
  addToGroup: (groupId: string, windowId: WindowId) => void;
  /** Remove a window from its group */
  removeFromGroup: (windowId: WindowId) => void;
  /** Set the active tab in a group */
  setActiveTab: (groupId: string, windowId: WindowId) => void;

  // Bulk operations
  /** Minimize all windows */
  minimizeAll: () => void;
  /** Close all windows */
  closeAll: () => void;
  /** Cascade all windows */
  cascade: () => void;
  /** Tile all windows in a layout */
  tileAll: (layout: 'horizontal' | 'vertical' | 'grid') => void;

  // Queries
  /** Get a single window by ID */
  getWindow: (id: WindowId) => WindowState | undefined;
  /** Get the group a window belongs to */
  getWindowGroup: (windowId: WindowId) => WindowGroup | undefined;
}
