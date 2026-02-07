/**
 * SecurityDashboard Types
 *
 * Type definitions for the composite 3D security dashboard component
 * that integrates SecurityShield, ThreatRadar, and AuditTrail.
 */

import type { ShieldStatus } from "../SecurityShield";
import type { Threat, ThreatType } from "../ThreatRadar";
import type { AuditEvent } from "../AuditTrail";

/**
 * Shield configuration for the dashboard
 */
export interface ShieldConfig {
  /** Protection level 0-1 */
  level: number;
  /** Current shield status */
  status: ShieldStatus;
  /** Number of threats blocked */
  threatsBlocked: number;
}

/**
 * Dashboard threat (extends base Threat type for dashboard context)
 */
export interface DashboardThreat {
  /** Unique identifier */
  id: string;
  /** Angle in radians (0-2pi) */
  angle: number;
  /** Distance from center (0-1) */
  distance: number;
  /** Severity level (0-1) */
  severity: number;
  /** Threat classification */
  type: ThreatType;
  /** Whether threat is actively attacking */
  active: boolean;
  /** Optional label */
  label?: string;
}

/**
 * Dashboard audit event
 */
export type DashboardAuditEvent = AuditEvent;

/**
 * Layout preset names
 */
export type DashboardLayout = "command" | "monitoring" | "compact";

/**
 * Props for the SecurityDashboard component
 */
export interface SecurityDashboardProps {
  /** Shield configuration */
  shield: ShieldConfig;
  /** Threats for the radar display */
  threats: DashboardThreat[];
  /** Audit events for the trail */
  auditEvents: DashboardAuditEvent[];
  /** Layout preset (default: 'command') */
  layout?: DashboardLayout;
  /** Overall position in 3D space */
  position?: [number, number, number];
  /** Enable animations (default: true) */
  animated?: boolean;
  /** Click handler for the shield */
  onShieldClick?: () => void;
  /** Click handler for threats */
  onThreatClick?: (threat: DashboardThreat) => void;
  /** Click handler for audit events */
  onEventClick?: (event: DashboardAuditEvent) => void;
  /** Show connecting lines between components (default: true in command layout) */
  showConnections?: boolean;
  /** Show central status HUD (default: true) */
  showStatusHUD?: boolean;
  /** Color theme */
  theme?: "cyber" | "matrix" | "terminal" | "neon" | "blueprint";
}

/**
 * Internal layout configuration for component positioning
 */
export interface LayoutConfig {
  shield: {
    position: [number, number, number];
    radius: number;
  };
  radar: {
    position: [number, number, number];
    radius: number;
  };
  audit: {
    position: [number, number, number];
    length: number;
    orientation: "horizontal" | "vertical";
  };
  statusHUD: {
    position: [number, number, number];
  };
}

/**
 * Layout presets for different dashboard configurations
 */
export const LAYOUT_PRESETS: Record<DashboardLayout, LayoutConfig> = {
  command: {
    shield: { position: [0, 1.5, -3], radius: 2 },
    radar: { position: [-4.5, 0, 0], radius: 2.5 },
    audit: { position: [4.5, 0, 0], length: 6, orientation: "vertical" },
    statusHUD: { position: [0, 4.5, -2] },
  },
  monitoring: {
    shield: { position: [-6, 0, 0], radius: 1.5 },
    radar: { position: [0, 0, 0], radius: 3 },
    audit: { position: [6, 0, 0], length: 5, orientation: "vertical" },
    statusHUD: { position: [0, 3.5, 0] },
  },
  compact: {
    shield: { position: [0, 3.5, 0], radius: 1.2 },
    radar: { position: [0, 0, 0], radius: 1.8 },
    audit: { position: [0, -3, 0], length: 5, orientation: "horizontal" },
    statusHUD: { position: [0, 5.5, 0] },
  },
};

/**
 * Security status levels
 */
export type SecurityStatus = "SECURE" | "WARNING" | "CRITICAL" | "OFFLINE";

/**
 * Theme color configuration
 */
export const STATUS_THEME_COLORS: Record<SecurityStatus, string> = {
  SECURE: "#00ff88",
  WARNING: "#ffaa00",
  CRITICAL: "#ff4444",
  OFFLINE: "#666666",
};
