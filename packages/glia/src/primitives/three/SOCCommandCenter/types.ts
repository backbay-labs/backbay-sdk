import type { AuditTrailProps } from "../AuditTrail";
import type { IntelFeedProps } from "../IntelFeed";
import type { NetworkTopologyProps } from "../NetworkTopology";
import type { SecurityDashboardProps } from "../SecurityDashboard";
import type { ThreatRadarProps } from "../ThreatRadar";

export type SOCLayout = "standard" | "compact" | "expanded";

export type SOCPanelId = "network" | "threat" | "audit" | "alerts" | "intel";

export interface SOCPanelLayout {
  id: SOCPanelId;
  label: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number];
  scale?: number;
}

export interface SOCLayoutConfig {
  panels: Record<SOCPanelId, SOCPanelLayout>;
  statusPosition: [number, number, number];
}

export interface SOCCommandCenterProps {
  networkData: NetworkTopologyProps;
  threatData: ThreatRadarProps;
  auditData: AuditTrailProps;
  alertData: SecurityDashboardProps;
  intelData: IntelFeedProps;
  layout?: SOCLayout;
  selectedPanel?: SOCPanelId;
  onPanelSelect?: (panel: SOCPanelId) => void;
  showGlobalStatus?: boolean;
  enableVR?: boolean;
  theme?: "cyber" | "matrix" | "blueprint";
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const SOC_LAYOUTS: Record<SOCLayout, SOCLayoutConfig> = {
  standard: {
    panels: {
      network: {
        id: "network",
        label: "Network Topology",
        position: [-6.4, 2.1, 0],
        rotation: [0, 0, 0],
        size: [4.4, 2.6],
        scale: 0.72,
      },
      threat: {
        id: "threat",
        label: "Threat Radar",
        position: [0, 2.1, 0],
        rotation: [0, 0, 0],
        size: [5.6, 3.2],
        scale: 1,
      },
      audit: {
        id: "audit",
        label: "Audit Trail",
        position: [6.4, 2.1, 0],
        rotation: [0, 0, 0],
        size: [4.4, 2.6],
        scale: 0.72,
      },
      alerts: {
        id: "alerts",
        label: "Security Dashboard",
        position: [-3, -2.5, 0],
        rotation: [0, 0, 0],
        size: [4.6, 2.2],
        scale: 0.62,
      },
      intel: {
        id: "intel",
        label: "Intel Feed",
        position: [3, -2.5, 0],
        rotation: [0, 0, 0],
        size: [4.6, 2.2],
        scale: 0.62,
      },
    },
    statusPosition: [0, 5, 0],
  },
  compact: {
    panels: {
      network: {
        id: "network",
        label: "Network",
        position: [-5.4, 1.6, 0],
        rotation: [0, 0, 0],
        size: [3.8, 2.1],
        scale: 0.68,
      },
      threat: {
        id: "threat",
        label: "Threats",
        position: [0, 1.6, 0],
        rotation: [0, 0, 0],
        size: [4.8, 2.7],
        scale: 0.9,
      },
      audit: {
        id: "audit",
        label: "Audit",
        position: [5.4, 1.6, 0],
        rotation: [0, 0, 0],
        size: [3.8, 2.1],
        scale: 0.68,
      },
      alerts: {
        id: "alerts",
        label: "Alerts",
        position: [-2.7, -2.3, 0],
        rotation: [0, 0, 0],
        size: [3.8, 2],
        scale: 0.55,
      },
      intel: {
        id: "intel",
        label: "Intel",
        position: [2.7, -2.3, 0],
        rotation: [0, 0, 0],
        size: [3.8, 2],
        scale: 0.55,
      },
    },
    statusPosition: [0, 4.1, 0],
  },
  expanded: {
    panels: {
      network: {
        id: "network",
        label: "Network Topology",
        position: [-7.2, 2.6, 0],
        rotation: [0, 0, 0],
        size: [5, 3],
        scale: 0.88,
      },
      threat: {
        id: "threat",
        label: "Threat Radar",
        position: [0, 2.6, 0],
        rotation: [0, 0, 0],
        size: [6.4, 3.8],
        scale: 1,
      },
      audit: {
        id: "audit",
        label: "Audit Trail",
        position: [7.2, 2.6, 0],
        rotation: [0, 0, 0],
        size: [5, 3],
        scale: 0.88,
      },
      alerts: {
        id: "alerts",
        label: "Security Dashboard",
        position: [-3.6, -3, 0],
        rotation: [0, 0, 0],
        size: [5, 2.6],
        scale: 0.72,
      },
      intel: {
        id: "intel",
        label: "Intel Feed",
        position: [3.6, -3, 0],
        rotation: [0, 0, 0],
        size: [5, 2.6],
        scale: 0.72,
      },
    },
    statusPosition: [0, 6.4, 0],
  },
};

export const SOC_THEME_COLORS: Record<
  NonNullable<SOCCommandCenterProps["theme"]>,
  { frame: string; glow: string; accent: string; hud: string }
> = {
  cyber: {
    frame: "#0b1a2a",
    glow: "#22d3ee",
    accent: "#38bdf8",
    hud: "#00ffff",
  },
  matrix: {
    frame: "#0b1a12",
    glow: "#22ff88",
    accent: "#00ff66",
    hud: "#3cff95",
  },
  blueprint: {
    frame: "#0a1424",
    glow: "#4aa3ff",
    accent: "#60a5fa",
    hud: "#93c5fd",
  },
};
