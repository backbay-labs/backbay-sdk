/**
 * AuditTrail Types
 *
 * Type definitions for the 3D audit trail timeline visualization component.
 */

/**
 * Types of audit events that can be tracked
 */
export type AuditEventType =
  | "login"
  | "logout"
  | "access"
  | "modify"
  | "delete"
  | "error"
  | "alert";

/**
 * Severity levels for audit events
 */
export type AuditSeverity = "info" | "warning" | "error" | "critical";

/**
 * Represents a single audit event in the timeline
 */
export interface AuditEvent {
  /** Unique identifier for the event */
  id: string;
  /** When the event occurred */
  timestamp: Date;
  /** Type of event */
  type: AuditEventType;
  /** Severity level */
  severity: AuditSeverity;
  /** User or system that triggered the event */
  actor: string;
  /** Resource that was affected */
  resource: string;
  /** Description of the action taken */
  action: string;
  /** Whether the action was successful */
  success: boolean;
  /** Optional additional details */
  details?: string;
  /** Optional parent event ID for creating connections */
  parentId?: string;
}

/**
 * Props for the AuditTrail component
 */
export interface AuditTrailProps {
  /** List of audit events to display */
  events: AuditEvent[];
  /** Maximum number of events to display (default: 20) */
  maxEvents?: number;
  /** Timeline length in 3D units (default: 10) */
  length?: number;
  /** Position of the component in 3D space */
  position?: [number, number, number];
  /** Layout orientation (default: 'horizontal') */
  orientation?: "horizontal" | "vertical";
  /** Show event details on hover (default: false) */
  showDetails?: boolean;
  /** Callback when an event is clicked */
  onEventClick?: (event: AuditEvent) => void;
  /** Callback when an event is hovered */
  onEventHover?: (event: AuditEvent | null) => void;
  /** Auto-scroll to show latest events (default: true) */
  autoScroll?: boolean;
  /** Color theme for the timeline */
  theme?: "cyber" | "matrix" | "terminal" | "neon" | "blueprint";
  /** Show timeline summary HUD (default: true) */
  showSummary?: boolean;
  /** Enable particle flow animation (default: true) */
  enableParticles?: boolean;
  /** Rotation of the entire component */
  rotation?: [number, number, number];
}

/**
 * Internal props for the EventNode sub-component
 */
export interface EventNodeProps {
  event: AuditEvent;
  position: [number, number, number];
  onEventClick?: (event: AuditEvent) => void;
  onEventHover?: (event: AuditEvent | null) => void;
  showDetails: boolean;
  theme: AuditTrailProps["theme"];
}

/**
 * Internal props for the FlowParticles sub-component
 */
export interface FlowParticlesProps {
  length: number;
  orientation: "horizontal" | "vertical";
  particleCount?: number;
  speed?: number;
  color?: string;
}

/**
 * Color mapping for different severity levels
 */
export const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  info: "#00ff88",
  warning: "#ffaa00",
  error: "#ff4444",
  critical: "#ff00ff",
};

/**
 * Geometry type mapping for different event types
 */
export const EVENT_GEOMETRIES: Record<
  AuditEventType,
  "torus" | "sphere" | "box" | "octahedron" | "icosahedron" | "cone"
> = {
  login: "torus",
  logout: "torus",
  access: "sphere",
  modify: "box",
  delete: "octahedron",
  error: "icosahedron",
  alert: "cone",
};

/**
 * Labels for event types
 */
export const EVENT_TYPE_LABELS: Record<AuditEventType, string> = {
  login: "LOGIN",
  logout: "LOGOUT",
  access: "ACCESS",
  modify: "MODIFY",
  delete: "DELETE",
  error: "ERROR",
  alert: "ALERT",
};

/**
 * Theme color schemes
 */
export const THEME_COLORS: Record<
  NonNullable<AuditTrailProps["theme"]>,
  {
    primary: string;
    secondary: string;
    spine: string;
    particle: string;
    glow: string;
  }
> = {
  cyber: {
    primary: "#00ffff",
    secondary: "#0088ff",
    spine: "#334455",
    particle: "#00ccff",
    glow: "#00ffff40",
  },
  matrix: {
    primary: "#00ff66",
    secondary: "#00cc44",
    spine: "#1a3a1a",
    particle: "#00ff44",
    glow: "#00ff6640",
  },
  terminal: {
    primary: "#ffaa00",
    secondary: "#ff8800",
    spine: "#3a3a1a",
    particle: "#ffcc00",
    glow: "#ffaa0040",
  },
  neon: {
    primary: "#ff00ff",
    secondary: "#ff0088",
    spine: "#3a1a3a",
    particle: "#ff44ff",
    glow: "#ff00ff40",
  },
  blueprint: {
    primary: "#4aa3ff",
    secondary: "#60a5fa",
    spine: "#1b2a44",
    particle: "#93c5fd",
    glow: "#4aa3ff40",
  },
};
