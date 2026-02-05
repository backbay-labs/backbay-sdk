/**
 * SecurityShield - 3D hexagonal force-field visualization
 *
 * @example
 * ```tsx
 * import { SecurityShield } from "@backbay/bb-ui/primitives/three/SecurityShield";
 *
 * <SecurityShield
 *   level={0.85}
 *   status="active"
 *   threatsBlocked={12}
 *   radius={2}
 *   showStats
 * />
 * ```
 */

export { SecurityShield } from "./SecurityShield";
export type {
  SecurityShieldProps,
  ShieldStatus,
  HexagonTileData,
  StatusColorConfig,
} from "./types";
export { STATUS_COLORS } from "./types";
