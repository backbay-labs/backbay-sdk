/**
 * NetworkTopology - 3D network infrastructure visualization
 *
 * @example
 * ```tsx
 * import { NetworkTopology } from "@backbay/bb-ui/primitives/three/NetworkTopology";
 *
 * <NetworkTopology
 *   nodes={nodes}
 *   edges={edges}
 *   layout="force"
 *   showTraffic
 *   showLabels
 * />
 * ```
 */

export { NetworkTopology } from "./NetworkTopology";
export type {
  NetworkTopologyProps,
  NetworkNode,
  NetworkNodeType,
  NetworkNodeStatus,
  NetworkEdge,
  NetworkEdgeProtocol,
  NetworkEdgeStatus,
} from "./types";
export {
  NETWORK_NODE_STATUS_COLORS,
  NETWORK_EDGE_STATUS_COLORS,
  NETWORK_PROTOCOL_COLORS,
  NETWORK_THEME_COLORS,
  NETWORK_NODE_LABELS,
} from "./types";
