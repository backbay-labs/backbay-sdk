/**
 * @backbay/bb-ui Desktop OS - Shell Types
 *
 * Types for the shell layer (taskbar, start menu, context menu).
 */

import type { WindowId } from '../window/types';

/**
 * Taskbar button position for minimize/restore animations.
 */
export interface TaskbarButtonPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Taskbar item representing an app on the taskbar.
 */
export interface TaskbarItem {
  id: string;
  windowId?: WindowId;
  appId: string;
  title: string;
  icon?: string;
  isPinned: boolean;
  isActive: boolean;
}

/**
 * Preview state for taskbar hover.
 */
export interface TaskbarPreviewState {
  windowId: WindowId;
  anchorRect: TaskbarButtonPosition;
  icon?: string;
}

/**
 * Return type for the useTaskbar hook.
 */
export interface UseTaskbarReturn {
  /** All taskbar items (pinned + running) */
  items: TaskbarItem[];
  /** Currently active window ID */
  activeWindowId: WindowId | null;
  /** Preview hover state */
  previewState: TaskbarPreviewState | null;
  /** Button positions for animation targeting */
  buttonPositions: Map<string, TaskbarButtonPosition>;

  /** Register a taskbar button position */
  registerButtonPosition: (id: string, position: TaskbarButtonPosition) => void;
  /** Unregister a taskbar button position */
  unregisterButtonPosition: (id: string) => void;
  /** Get center of a button for animation */
  getButtonCenter: (id: string) => { x: number; y: number } | undefined;

  /** Pin an app to the taskbar */
  pin: (appId: string) => void;
  /** Unpin an app from the taskbar */
  unpin: (appId: string) => void;

  /** Start hover preview */
  startPreviewHover: (windowId: WindowId, icon?: string) => void;
  /** End hover preview */
  endPreviewHover: () => void;
  /** Cancel hide preview (when moving to preview) */
  cancelHidePreview: () => void;
  /** Immediately hide preview */
  hidePreview: () => void;
}

/**
 * Context menu target type.
 */
export type ContextMenuTargetType =
  | 'desktop'
  | 'window'
  | 'taskbar'
  | 'taskbar-button'
  | 'icon';

/**
 * Context menu target identifying what was right-clicked.
 */
export interface ContextMenuTarget {
  type: ContextMenuTargetType;
  id?: string;
  data?: Record<string, unknown>;
}

/**
 * Context menu item.
 */
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  children?: ContextMenuItem[];
  action?: () => void;
}

/**
 * Return type for the useContextMenu hook.
 */
export interface UseContextMenuReturn {
  /** Whether menu is open */
  isOpen: boolean;
  /** Menu position */
  position: { x: number; y: number };
  /** What was right-clicked */
  target: ContextMenuTarget | null;
  /** Menu items to display */
  items: ContextMenuItem[];

  /** Show the context menu */
  show: (
    e: React.MouseEvent,
    target: ContextMenuTarget,
    items: ContextMenuItem[]
  ) => void;
  /** Hide the context menu */
  hide: () => void;
}

/**
 * Start menu category.
 */
export interface StartMenuCategory {
  id: string;
  label: string;
  icon?: string;
}

/**
 * Start menu app item.
 */
export interface StartMenuApp {
  id: string;
  name: string;
  icon?: string;
  categoryId: string;
  description?: string;
  pinned?: boolean;
  recent?: boolean;
}

/**
 * Return type for the useStartMenu hook.
 */
export interface UseStartMenuReturn {
  /** Whether menu is open */
  isOpen: boolean;
  /** All app categories */
  categories: StartMenuCategory[];
  /** All apps */
  apps: StartMenuApp[];
  /** Pinned apps */
  pinnedApps: StartMenuApp[];
  /** Recent apps */
  recentApps: StartMenuApp[];
  /** Search query */
  searchQuery: string;
  /** Filtered apps based on search */
  filteredApps: StartMenuApp[];

  /** Open the start menu */
  open: () => void;
  /** Close the start menu */
  close: () => void;
  /** Toggle the start menu */
  toggle: () => void;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Launch an app */
  launchApp: (appId: string) => void;
  /** Pin an app */
  pinApp: (appId: string) => void;
  /** Unpin an app */
  unpinApp: (appId: string) => void;
}
