/**
 * AuditTrail - 3D audit event timeline visualization
 *
 * @example
 * ```tsx
 * import { AuditTrail } from "@backbay/glia/primitives/three/AuditTrail";
 *
 * <AuditTrail
 *   events={auditEvents}
 *   maxEvents={20}
 *   length={10}
 *   orientation="horizontal"
 *   theme="cyber"
 *   onEventClick={(event) => console.log('Clicked:', event)}
 * />
 * ```
 */

export { AuditTrail } from "./AuditTrail";
export type {
  AuditEvent,
  AuditEventType,
  AuditSeverity,
  AuditTrailProps,
  EventNodeProps,
  FlowParticlesProps,
} from "./types";
export {
  SEVERITY_COLORS,
  EVENT_GEOMETRIES,
  EVENT_TYPE_LABELS,
  THEME_COLORS,
} from "./types";
