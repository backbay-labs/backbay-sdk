/**
 * NetworkTopology Types
 *
 * Type definitions for the 3D network topology visualization component.
 */

export type NetworkNodeType =
  | "server"
  | "workstation"
  | "router"
  | "firewall"
  | "cloud"
  | "iot"
  | "mobile";

export type NetworkNodeStatus = "healthy" | "warning" | "compromised" | "offline";

export interface NetworkNode {
  id: string;
  type: NetworkNodeType;
  hostname: string;
  ip: string;
  status: NetworkNodeStatus;
  os?: string;
  services: string[];
  vulnerabilities?: number;
  position?: [number, number, number];
}

export type NetworkEdgeProtocol =
  | "tcp"
  | "udp"
  | "icmp"
  | "http"
  | "https"
  | "ssh"
  | "rdp"
  | "smb";

export type NetworkEdgeStatus = "active" | "idle" | "blocked" | "suspicious";

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  protocol: NetworkEdgeProtocol;
  port?: number;
  bandwidth?: number;
  encrypted: boolean;
  status: NetworkEdgeStatus;
}

export interface NetworkTopologyProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  layout?: "force" | "hierarchical" | "radial" | "geographic";
  highlightPath?: string[];
  selectedNode?: string;
  onNodeClick?: (node: NetworkNode) => void;
  onEdgeClick?: (edge: NetworkEdge) => void;
  showTraffic?: boolean;
  showLabels?: boolean;
  theme?: "cyber" | "matrix" | "blueprint";
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const NETWORK_NODE_STATUS_COLORS: Record<
  NetworkNodeStatus,
  { base: string; glow: string; text: string }
> = {
  healthy: { base: "#17f7a2", glow: "#33ffb2", text: "#aaf7d2" },
  warning: { base: "#ffb347", glow: "#ffd08a", text: "#ffe0b8" },
  compromised: { base: "#ff4455", glow: "#ff2233", text: "#ffd0d5" },
  offline: { base: "#4c5b6b", glow: "#2a3440", text: "#9aa7b5" },
};

export const NETWORK_EDGE_STATUS_COLORS: Record<NetworkEdgeStatus, string> = {
  active: "#22e7ff",
  idle: "#4c6b8a",
  blocked: "#ff3344",
  suspicious: "#ff8a2a",
};

export const NETWORK_PROTOCOL_COLORS: Record<NetworkEdgeProtocol, string> = {
  tcp: "#6ee7ff",
  udp: "#9dff6e",
  icmp: "#ffcc66",
  http: "#6aa2ff",
  https: "#3b82f6",
  ssh: "#ffb84d",
  rdp: "#ff6b6b",
  smb: "#c084fc",
};

export const NETWORK_THEME_COLORS: Record<
  NonNullable<NetworkTopologyProps["theme"]>,
  { grid: string; labels: string; ambient: string; glow: string }
> = {
  cyber: {
    grid: "#0b1b2e",
    labels: "#d4f2ff",
    ambient: "#0a0f1e",
    glow: "#21e6ff",
  },
  matrix: {
    grid: "#0a1a10",
    labels: "#c4ffd7",
    ambient: "#07130b",
    glow: "#2bff77",
  },
  blueprint: {
    grid: "#0a1220",
    labels: "#b9d4ff",
    ambient: "#08101d",
    glow: "#4aa3ff",
  },
};

export const NETWORK_NODE_LABELS: Record<NetworkNodeType, string> = {
  server: "Server",
  workstation: "Workstation",
  router: "Router",
  firewall: "Firewall",
  cloud: "Cloud",
  iot: "IoT",
  mobile: "Mobile",
};
