/**
 * SecurityShield Types
 *
 * Type definitions for the 3D security shield visualization component.
 */

export type ShieldStatus = "active" | "warning" | "breach" | "offline";

export interface SecurityShieldProps {
  /** Protection level 0-1 (0=breached, 1=fully protected) */
  level: number;
  /** Current status */
  status: ShieldStatus;
  /** Number of active threats being blocked */
  threatsBlocked?: number;
  /** Shield radius */
  radius?: number;
  /** Position in 3D space */
  position?: [number, number, number];
  /** Show stats overlay */
  showStats?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Animation speed multiplier */
  animationSpeed?: number;
  /** Enable honeycomb pattern overlay */
  showHoneycomb?: boolean;
}

export interface HexagonTileData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  index: number;
}

export interface StatusColorConfig {
  primary: string;
  glow: string;
  pulseSpeed: number;
}

export const STATUS_COLORS: Record<ShieldStatus, StatusColorConfig> = {
  active: {
    primary: "#00f0ff",
    glow: "#00ccdd",
    pulseSpeed: 1,
  },
  warning: {
    primary: "#ffaa00",
    glow: "#ff8800",
    pulseSpeed: 3,
  },
  breach: {
    primary: "#ff3333",
    glow: "#ff0000",
    pulseSpeed: 8,
  },
  offline: {
    primary: "#444444",
    glow: "#333333",
    pulseSpeed: 0,
  },
};
