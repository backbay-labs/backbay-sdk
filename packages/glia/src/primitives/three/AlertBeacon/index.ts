/**
 * AlertBeacon - 3D alert severity orb with pulse and ripple effects
 *
 * @example
 * ```tsx
 * import { AlertBeacon } from "@backbay/glia/primitives/three/AlertBeacon";
 *
 * <AlertBeacon
 *   severity="critical"
 *   label="Service Down"
 *   message="API gateway unreachable"
 *   ripples
 * />
 * ```
 */

export { AlertBeacon } from "./AlertBeacon";
export type { AlertBeaconProps, AlertSeverity } from "./types";
