/**
 * SecurityDashboard - Composite 3D security monitoring dashboard
 *
 * Integrates SecurityShield, ThreatRadar, and AuditTrail into a unified
 * security monitoring view with multiple layout presets.
 *
 * @example
 * ```tsx
 * import { SecurityDashboard } from "@backbay/bb-ui/primitives/three/SecurityDashboard";
 *
 * <SecurityDashboard
 *   shield={{ level: 0.85, status: 'active', threatsBlocked: 5 }}
 *   threats={[
 *     { id: '1', angle: 0.5, distance: 0.6, severity: 0.8, type: 'malware', active: true }
 *   ]}
 *   auditEvents={[
 *     { id: '1', timestamp: new Date(), type: 'login', severity: 'info', ... }
 *   ]}
 *   layout="command"
 *   onShieldClick={() => console.log('Shield clicked')}
 *   onThreatClick={(threat) => console.log('Threat:', threat)}
 *   onEventClick={(event) => console.log('Event:', event)}
 * />
 * ```
 */

export { SecurityDashboard } from "./SecurityDashboard";
export type {
  SecurityDashboardProps,
  ShieldConfig,
  DashboardThreat,
  DashboardAuditEvent,
  DashboardLayout,
  LayoutConfig,
  SecurityStatus,
} from "./types";
export { LAYOUT_PRESETS, STATUS_THEME_COLORS } from "./types";
