/**
 * @backbay/bb-ui Desktop OS - Desktop Types
 *
 * Types for desktop and process management.
 */

import type React from 'react';
import type { WindowId, WindowState } from '../window/types';

/**
 * Process definition for registering an app.
 */
export interface ProcessDefinition {
  /** Unique process identifier */
  id: string;
  /** Display name */
  name: string;
  /** Icon identifier or React node */
  icon: React.ReactNode | string;
  /** The component to render in the window */
  component: React.ComponentType<{ windowId: WindowId }>;
  /** Default window size */
  defaultSize?: { width: number; height: number };
  /** Minimum window size */
  minSize?: { width: number; height: number };
  /** Maximum window size */
  maxSize?: { width: number; height: number };
  /** Whether only one instance can be open at a time */
  singleton?: boolean;
  /** Whether app is pinned to taskbar by default */
  pinned?: boolean;
  /** Whether to hide the default window titlebar (app provides its own) */
  hideWindowTitlebar?: boolean;
  /** Category for start menu organization */
  category?: string;
  /** Description for start menu */
  description?: string;
}

/**
 * Running process instance.
 */
export interface ProcessInstance {
  /** Unique instance ID */
  id: string;
  /** Process definition ID */
  processId: string;
  /** Associated window ID */
  windowId: WindowId;
  /** Launch arguments */
  args?: Record<string, unknown>;
  /** When the process was started */
  startedAt: number;
}

/**
 * Desktop icon item.
 */
export interface DesktopIcon {
  id: string;
  label: string;
  icon: React.ReactNode | string;
  /** Grid position (column, row) */
  position: { col: number; row: number };
  /** Action when double-clicked */
  onActivate?: () => void;
  /** Associated process ID to launch */
  processId?: string;
  /** Whether this is a system icon (cannot be deleted) */
  isSystem?: boolean;
}

/**
 * Return type for the useDesktop hook.
 */
export interface UseDesktopReturn {
  /** Desktop icons */
  icons: DesktopIcon[];
  /** Selected icon IDs */
  selectedIconIds: string[];
  /** Grid size for icon layout */
  gridSize: { cols: number; rows: number };

  /** Add an icon */
  addIcon: (icon: DesktopIcon) => void;
  /** Remove an icon */
  removeIcon: (id: string) => void;
  /** Move an icon to a new position */
  moveIcon: (id: string, position: { col: number; row: number }) => void;
  /** Select icons */
  selectIcons: (ids: string[]) => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Activate an icon (double-click) */
  activateIcon: (id: string) => void;
}

/**
 * Return type for the useProcessRegistry hook.
 */
export interface UseProcessRegistryReturn {
  /** All registered process definitions */
  definitions: ProcessDefinition[];
  /** All running process instances */
  instances: ProcessInstance[];

  /** Register a process definition */
  register: (definition: ProcessDefinition) => void;
  /** Unregister a process definition */
  unregister: (id: string) => void;

  /** Launch a process and return the instance ID */
  launch: (processId: string, args?: Record<string, unknown>) => string | null;
  /** Terminate a process instance */
  terminate: (instanceId: string) => void;
  /** Terminate all instances of a process */
  terminateAll: (processId: string) => void;

  /** Get process definition by ID */
  getDefinition: (id: string) => ProcessDefinition | undefined;
  /** Get process instance by ID */
  getInstance: (id: string) => ProcessInstance | undefined;
  /** Get instances of a process */
  getInstancesByProcess: (processId: string) => ProcessInstance[];
  /** Get instance by window ID */
  getInstanceByWindow: (windowId: WindowId) => ProcessInstance | undefined;
}

/**
 * Snap zone type for window snapping.
 */
export type SnapZone =
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'maximize';

/**
 * Return type for the useSnapZones hook.
 */
export interface UseSnapZonesReturn {
  /** Currently active snap zone preview */
  activeZone: SnapZone | null;
  /** Window ID being dragged */
  draggingWindowId: WindowId | null;

  /** Set the active snap zone */
  setActiveZone: (zone: SnapZone | null) => void;
  /** Set which window is being dragged */
  setDraggingWindow: (id: WindowId | null) => void;
  /** Detect snap zone from cursor position */
  detectSnapZone: (cursorX: number, cursorY: number) => SnapZone | null;
  /** Get snap zone dimensions for preview rendering */
  getSnapZoneDimensions: (zone: SnapZone) => {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Desktop OS Provider configuration.
 */
export interface DesktopOSConfig {
  /** Process definitions */
  processes: ProcessDefinition[];
  /** Initial windows to open */
  initialWindows?: Partial<WindowState>[];
  /** Initially pinned apps */
  initialPinnedApps?: string[];
  /** Enable snap zones for window tiling */
  enableSnapZones?: boolean;
  /** Enable window grouping (tab groups) */
  enableWindowGroups?: boolean;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Callback when windows change */
  onWindowsChange?: (windows: WindowState[]) => void;
  /** Callback when pinned apps change */
  onPinnedAppsChange?: (appIds: string[]) => void;
}
