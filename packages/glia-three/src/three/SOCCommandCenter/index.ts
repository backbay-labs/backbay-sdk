/**
 * SOCCommandCenter - Composite SOC monitoring scene
 *
 * @example
 * ```tsx
 * import { SOCCommandCenter } from "@backbay/glia/primitives/three/SOCCommandCenter";
 *
 * <SOCCommandCenter
 *   networkData={networkProps}
 *   threatData={threatProps}
 *   auditData={auditProps}
 *   alertData={dashboardProps}
 *   intelData={intelProps}
 * />
 * ```
 */

export { SOCCommandCenter } from "./SOCCommandCenter";
export type {
  SOCCommandCenterProps,
  SOCLayout,
  SOCPanelId,
  SOCPanelLayout,
  SOCLayoutConfig,
} from "./types";
export { SOC_LAYOUTS, SOC_THEME_COLORS } from "./types";
