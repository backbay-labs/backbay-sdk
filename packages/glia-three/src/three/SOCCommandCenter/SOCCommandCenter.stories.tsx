import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as React from "react";
import { SOCCommandCenter } from "./SOCCommandCenter";
import type { SOCCommandCenterProps } from "./types";

const networkData: SOCCommandCenterProps["networkData"] = {
  nodes: [
    {
      id: "fw-1",
      type: "firewall",
      hostname: "gateway-fw",
      ip: "10.0.0.1",
      status: "healthy",
      services: ["vpn", "dpi"],
    },
    {
      id: "router-1",
      type: "router",
      hostname: "core-router",
      ip: "10.0.0.254",
      status: "warning",
      services: ["bgp", "ospf"],
      vulnerabilities: 2,
    },
    {
      id: "srv-1",
      type: "server",
      hostname: "db-prod-01",
      ip: "10.0.2.10",
      status: "healthy",
      services: ["postgres"],
    },
    {
      id: "srv-2",
      type: "server",
      hostname: "api-prod-02",
      ip: "10.0.2.20",
      status: "compromised",
      services: ["api", "grpc"],
      vulnerabilities: 5,
    },
    {
      id: "ws-1",
      type: "workstation",
      hostname: "analyst-07",
      ip: "10.0.4.33",
      status: "healthy",
      services: ["edr"],
    },
  ],
  edges: [
    {
      id: "e1",
      source: "fw-1",
      target: "router-1",
      protocol: "tcp",
      encrypted: true,
      status: "active",
      bandwidth: 5800,
    },
    {
      id: "e2",
      source: "router-1",
      target: "srv-1",
      protocol: "https",
      encrypted: true,
      status: "active",
      bandwidth: 3200,
    },
    {
      id: "e3",
      source: "router-1",
      target: "srv-2",
      protocol: "ssh",
      encrypted: false,
      status: "suspicious",
      bandwidth: 1200,
    },
    {
      id: "e4",
      source: "router-1",
      target: "ws-1",
      protocol: "rdp",
      encrypted: true,
      status: "idle",
    },
  ],
  layout: "force",
  showTraffic: true,
  showLabels: false,
};

const threatData: SOCCommandCenterProps["threatData"] = {
  threats: [
    {
      id: "t-1",
      angle: Math.PI * 0.2,
      distance: 0.7,
      severity: 0.85,
      type: "malware",
      active: true,
      label: "Malware",
    },
    {
      id: "t-2",
      angle: Math.PI * 1.3,
      distance: 0.5,
      severity: 0.6,
      type: "intrusion",
      active: false,
      label: "Intrusion",
    },
    {
      id: "t-3",
      angle: Math.PI * 1.9,
      distance: 0.8,
      severity: 0.9,
      type: "ddos",
      active: true,
      label: "DDoS",
    },
  ],
  radius: 2.2,
  showLabels: false,
  showStats: true,
};

const threatDataHigh: SOCCommandCenterProps["threatData"] = {
  threats: [
    {
      id: "t-4",
      angle: Math.PI * 0.1,
      distance: 0.6,
      severity: 0.95,
      type: "malware",
      active: true,
      label: "Credential Theft",
    },
    {
      id: "t-5",
      angle: Math.PI * 0.55,
      distance: 0.4,
      severity: 0.82,
      type: "intrusion",
      active: true,
      label: "Lateral Move",
    },
    {
      id: "t-6",
      angle: Math.PI * 1.25,
      distance: 0.75,
      severity: 0.88,
      type: "ddos",
      active: true,
      label: "Volumetric",
    },
    {
      id: "t-7",
      angle: Math.PI * 1.7,
      distance: 0.65,
      severity: 0.7,
      type: "phishing",
      active: false,
      label: "Phishing",
    },
  ],
  radius: 2.4,
  showLabels: false,
  showStats: true,
};

const threatDataCalm: SOCCommandCenterProps["threatData"] = {
  threats: [
    {
      id: "t-8",
      angle: Math.PI * 0.4,
      distance: 0.5,
      severity: 0.2,
      type: "anomaly",
      active: false,
      label: "Anomaly",
    },
    {
      id: "t-9",
      angle: Math.PI * 1.4,
      distance: 0.7,
      severity: 0.3,
      type: "intrusion",
      active: false,
      label: "Recon",
    },
  ],
  radius: 2.1,
  showLabels: false,
  showStats: false,
};

const auditEvents: SOCCommandCenterProps["auditData"]["events"] = [
  {
    id: "event-1",
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
    type: "login",
    severity: "info",
    actor: "svc-auth",
    resource: "auth-service",
    action: "login success",
    success: true,
  },
  {
    id: "event-2",
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    type: "access",
    severity: "warning",
    actor: "api-prod-02",
    resource: "customer-db",
    action: "unusual query volume",
    success: false,
  },
  {
    id: "event-3",
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    type: "alert",
    severity: "critical",
    actor: "edr-agent",
    resource: "workstation-07",
    action: "malicious process blocked",
    success: true,
  },
];

const auditData: SOCCommandCenterProps["auditData"] = {
  events: auditEvents,
  orientation: "vertical",
  showDetails: true,
  showSummary: false,
  enableParticles: true,
};

const auditEventsHigh: SOCCommandCenterProps["auditData"]["events"] = [
  ...auditEvents,
  {
    id: "event-4",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    type: "error",
    severity: "error",
    actor: "edr-agent",
    resource: "api-prod-02",
    action: "suspicious process spawned",
    success: false,
  },
  {
    id: "event-5",
    timestamp: new Date(Date.now() - 1000 * 60 * 1),
    type: "alert",
    severity: "critical",
    actor: "soc-sentinel",
    resource: "vpn-gateway",
    action: "brute force detected",
    success: false,
  },
];

const auditDataHigh: SOCCommandCenterProps["auditData"] = {
  events: auditEventsHigh,
  orientation: "vertical",
  showDetails: true,
  showSummary: false,
  enableParticles: true,
};

const auditEventsCalm: SOCCommandCenterProps["auditData"]["events"] = [
  {
    id: "event-6",
    timestamp: new Date(Date.now() - 1000 * 60 * 18),
    type: "login",
    severity: "info",
    actor: "svc-auth",
    resource: "auth-service",
    action: "login success",
    success: true,
  },
  {
    id: "event-7",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    type: "access",
    severity: "info",
    actor: "reporting-job",
    resource: "metrics-cluster",
    action: "scheduled export",
    success: true,
  },
];

const auditDataCalm: SOCCommandCenterProps["auditData"] = {
  events: auditEventsCalm,
  orientation: "vertical",
  showDetails: false,
  showSummary: false,
  enableParticles: false,
};

const alertData: SOCCommandCenterProps["alertData"] = {
  shield: {
    level: 0.7,
    status: "warning",
    threatsBlocked: 12,
  },
  threats: threatData.threats,
  auditEvents,
  layout: "compact",
  showConnections: false,
  showStatusHUD: false,
  animated: true,
  theme: "cyber",
};

const alertDataCritical: SOCCommandCenterProps["alertData"] = {
  shield: {
    level: 0.35,
    status: "breach",
    threatsBlocked: 4,
  },
  threats: threatDataHigh.threats,
  auditEvents: auditEventsHigh,
  layout: "compact",
  showConnections: false,
  showStatusHUD: false,
  animated: true,
  theme: "cyber",
};

const alertDataCalm: SOCCommandCenterProps["alertData"] = {
  shield: {
    level: 0.95,
    status: "active",
    threatsBlocked: 28,
  },
  threats: threatDataCalm.threats,
  auditEvents: auditEventsCalm,
  layout: "compact",
  showConnections: false,
  showStatusHUD: false,
  animated: true,
  theme: "blueprint",
};

const intelData: SOCCommandCenterProps["intelData"] = {
  sources: [
    { id: "s1", name: "OpenCTI", type: "osint", reliability: 0.72 },
    { id: "s2", name: "Finance-ISAC", type: "isac", reliability: 0.86 },
    { id: "s3", name: "SOC Sensors", type: "internal", reliability: 0.9 },
  ],
  items: [
    {
      id: "intel-1",
      source: "SOC Sensors",
      type: "ioc",
      severity: "high",
      title: "Suspicious Beacon",
      summary: "HTTPS beacon to 104.21.33.7",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      actionRequired: true,
    },
    {
      id: "intel-2",
      source: "OpenCTI",
      type: "actor",
      severity: "medium",
      title: "APT29 Activity",
      summary: "New infrastructure targeting SaaS",
      timestamp: new Date(Date.now() - 1000 * 60 * 35),
    },
    {
      id: "intel-3",
      source: "Finance-ISAC",
      type: "vulnerability",
      severity: "critical",
      title: "CVE-2026-1024",
      summary: "RCE in VPN gateway",
      timestamp: new Date(Date.now() - 1000 * 60 * 55),
      actionRequired: true,
    },
  ],
  layout: "waterfall",
  autoScroll: true,
};

const intelDataDense: SOCCommandCenterProps["intelData"] = {
  ...intelData,
  items: [
    ...intelData.items,
    {
      id: "intel-4",
      source: "SOC Sensors",
      type: "ioc",
      severity: "high",
      title: "DNS Tunneling",
      summary: "Anomalous NXDOMAIN burst",
      timestamp: new Date(Date.now() - 1000 * 60 * 70),
    },
    {
      id: "intel-5",
      source: "OpenCTI",
      type: "tool",
      severity: "medium",
      title: "Cobalt Strike",
      summary: "Beacon signatures observed",
      timestamp: new Date(Date.now() - 1000 * 60 * 90),
    },
    {
      id: "intel-6",
      source: "Finance-ISAC",
      type: "report",
      severity: "low",
      title: "Weekly Threat Brief",
      summary: "Sector update",
      timestamp: new Date(Date.now() - 1000 * 60 * 110),
    },
  ],
  layout: "waterfall",
  autoScroll: true,
};

const intelDataGrid: SOCCommandCenterProps["intelData"] = {
  ...intelDataDense,
  layout: "grid",
  autoScroll: false,
};

const intelDataTimeline: SOCCommandCenterProps["intelData"] = {
  ...intelDataDense,
  layout: "timeline",
  autoScroll: false,
};

const meta: Meta<typeof SOCCommandCenter> = {
  title: "Primitives/3D/Security/SOCCommandCenter",
  component: SOCCommandCenter,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", background: "#050812" }}>
        <Canvas camera={{ position: [0, 4.5, 14], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={["#050812"]} />
          <fog attach="fog" args={["#050812", 10, 30]} />
          <Stars radius={90} depth={40} count={1600} factor={2} saturation={0} fade speed={0.3} />
          <ambientLight intensity={0.3} />
          <pointLight position={[8, 10, 8]} intensity={0.8} color="#38bdf8" />
          <pointLight position={[-8, 6, -8]} intensity={0.4} color="#22d3ee" />
          <OrbitControls enableDamping dampingFactor={0.08} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SOCCommandCenter>;

export const Standard: Story = {
  args: {
    networkData,
    threatData,
    auditData,
    alertData,
    intelData,
    layout: "standard",
    showGlobalStatus: true,
  },
};

export const Expanded: Story = {
  args: {
    networkData,
    threatData,
    auditData,
    alertData,
    intelData,
    layout: "expanded",
    showGlobalStatus: true,
    theme: "blueprint",
  },
};

export const Compact: Story = {
  args: {
    networkData,
    threatData,
    auditData,
    alertData,
    intelData,
    layout: "compact",
    showGlobalStatus: false,
    theme: "matrix",
  },
};

export const HighAlertHero: Story = {
  args: {
    networkData,
    threatData: threatDataHigh,
    auditData: auditDataHigh,
    alertData: alertDataCritical,
    intelData: intelDataDense,
    layout: "standard",
    selectedPanel: "threat",
    showGlobalStatus: true,
    theme: "cyber",
  },
};

export const QuietShift: Story = {
  args: {
    networkData: {
      ...networkData,
      nodes: networkData.nodes.map((node) => ({
        ...node,
        status: node.id === "srv-2" ? "warning" : "healthy",
        vulnerabilities: node.id === "srv-2" ? 1 : node.vulnerabilities,
      })),
    },
    threatData: threatDataCalm,
    auditData: auditDataCalm,
    alertData: alertDataCalm,
    intelData: { ...intelData, layout: "timeline", autoScroll: false },
    layout: "standard",
    showGlobalStatus: true,
    theme: "blueprint",
  },
};

export const IntelGridFocus: Story = {
  args: {
    networkData,
    threatData,
    auditData,
    alertData,
    intelData: intelDataGrid,
    layout: "expanded",
    selectedPanel: "intel",
    showGlobalStatus: true,
    theme: "blueprint",
  },
};

export const CompactSelected: Story = {
  args: {
    networkData,
    threatData: threatDataHigh,
    auditData: auditDataHigh,
    alertData: alertDataCritical,
    intelData: intelDataDense,
    layout: "compact",
    selectedPanel: "alerts",
    showGlobalStatus: false,
    theme: "matrix",
  },
};

export const TypographyClean: Story = {
  args: {
    networkData,
    threatData: { ...threatDataCalm, showStats: false },
    auditData: auditDataCalm,
    alertData: alertDataCalm,
    intelData: { ...intelDataGrid, maxItems: 6 },
    layout: "standard",
    showGlobalStatus: true,
    theme: "blueprint",
  },
};

export const TimelineIntel: Story = {
  args: {
    networkData,
    threatData,
    auditData,
    alertData,
    intelData: intelDataTimeline,
    layout: "expanded",
    selectedPanel: "intel",
    showGlobalStatus: true,
    theme: "cyber",
  },
};
