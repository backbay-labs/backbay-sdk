import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as React from "react";
import { IntelFeed } from "./IntelFeed";
import type { IntelItem, IntelSource } from "./types";

const demoSources: IntelSource[] = [
  {
    id: "osint-1",
    name: "OpenCTI",
    type: "osint",
    reliability: 0.72,
  },
  {
    id: "isac-1",
    name: "Finance-ISAC",
    type: "isac",
    reliability: 0.86,
  },
  {
    id: "internal-1",
    name: "SOC Sensors",
    type: "internal",
    reliability: 0.9,
  },
];

const demoItems: IntelItem[] = [
  {
    id: "intel-1",
    source: "SOC Sensors",
    type: "ioc",
    severity: "high",
    title: "Suspicious Beaconing",
    summary: "HTTPS beacon to 104.21.33.7",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    relevance: 0.85,
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
    relevance: 0.6,
  },
  {
    id: "intel-3",
    source: "Finance-ISAC",
    type: "vulnerability",
    severity: "critical",
    title: "CVE-2026-1024",
    summary: "Remote code execution in VPN gateway",
    timestamp: new Date(Date.now() - 1000 * 60 * 55),
    relevance: 0.9,
    actionRequired: true,
  },
  {
    id: "intel-4",
    source: "OpenCTI",
    type: "campaign",
    severity: "medium",
    title: "Cloud Harvest",
    summary: "Credential theft targeting IAM",
    timestamp: new Date(Date.now() - 1000 * 60 * 85),
    relevance: 0.55,
  },
  {
    id: "intel-5",
    source: "SOC Sensors",
    type: "tool",
    severity: "high",
    title: "Cobalt Strike",
    summary: "Beacon signature observed on host",
    timestamp: new Date(Date.now() - 1000 * 60 * 95),
    relevance: 0.8,
  },
  {
    id: "intel-6",
    source: "Finance-ISAC",
    type: "report",
    severity: "low",
    title: "Monthly Threat Brief",
    summary: "Sector risk outlook",
    timestamp: new Date(Date.now() - 1000 * 60 * 115),
    relevance: 0.3,
  },
  {
    id: "intel-7",
    source: "OpenCTI",
    type: "ioc",
    severity: "info",
    title: "Domain Watch",
    summary: "New suspicious domains registered",
    timestamp: new Date(Date.now() - 1000 * 60 * 130),
    relevance: 0.2,
  },
  {
    id: "intel-8",
    source: "SOC Sensors",
    type: "ioc",
    severity: "high",
    title: "DNS Tunneling",
    summary: "Exfiltration pattern in DNS queries",
    timestamp: new Date(Date.now() - 1000 * 60 * 150),
    relevance: 0.88,
    actionRequired: true,
  },
];

const meta: Meta<typeof IntelFeed> = {
  title: "Primitives/3D/Security/IntelFeed",
  component: IntelFeed,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", background: "#050812" }}>
        <Canvas camera={{ position: [0, 2.5, 8], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={["#050812"]} />
          <fog attach="fog" args={["#050812", 7, 18]} />
          <Stars radius={60} depth={30} count={1200} factor={2} saturation={0} fade speed={0.4} />
          <ambientLight intensity={0.35} />
          <pointLight position={[5, 6, 5]} intensity={0.7} color="#38bdf8" />
          <pointLight position={[-5, 4, -5]} intensity={0.4} color="#f97316" />
          <OrbitControls enableDamping dampingFactor={0.08} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof IntelFeed>;

export const Waterfall: Story = {
  args: {
    items: demoItems,
    sources: demoSources,
    layout: "waterfall",
    autoScroll: true,
  },
};

export const Timeline: Story = {
  args: {
    items: demoItems,
    sources: demoSources,
    layout: "timeline",
    autoScroll: false,
  },
};

export const Grid: Story = {
  args: {
    items: demoItems,
    sources: demoSources,
    layout: "grid",
    autoScroll: false,
  },
};
