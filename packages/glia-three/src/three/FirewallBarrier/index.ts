/**
 * FirewallBarrier - 3D firewall rule visualization
 *
 * @example
 * ```tsx
 * import { FirewallBarrier } from "@backbay/glia/primitives/three/FirewallBarrier";
 *
 * <FirewallBarrier rules={rules} recentTraffic={traffic} />
 * ```
 */

export { FirewallBarrier } from "./FirewallBarrier";
export type { FirewallBarrierProps, FirewallRule, FirewallTraffic } from "./types";
export { FIREWALL_ACTION_COLORS, FIREWALL_TRAFFIC_COLORS } from "./types";
