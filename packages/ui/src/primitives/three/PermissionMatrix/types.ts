/**
 * PermissionMatrix Types
 *
 * Type definitions for the 3D permission matrix visualization component.
 */

export type PermissionAction = "read" | "write" | "execute" | "delete" | "admin";

export interface Permission {
  id: string;
  /** Resource name */
  resource: string;
  /** Action type */
  action: PermissionAction;
  /** Is granted */
  granted: boolean;
  /** Is inherited from role */
  inherited?: boolean;
  /** Override reason if denied */
  reason?: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface PermissionMatrixProps {
  /** Groups of permissions to display */
  groups: PermissionGroup[];
  /** Currently selected permission */
  selected?: string;
  /** Position */
  position?: [number, number, number];
  /** Cell size */
  cellSize?: number;
  /** Spacing between cells */
  spacing?: number;
  /** Click handler */
  onPermissionClick?: (permission: Permission, group: PermissionGroup) => void;
  /** Show labels */
  showLabels?: boolean;
  /** Enable animations */
  animated?: boolean;
}

export const ACTION_COLORS: Record<PermissionAction, string> = {
  read: "#00aaff",
  write: "#00ff88",
  execute: "#ffaa00",
  delete: "#ff4444",
  admin: "#aa00ff",
};
