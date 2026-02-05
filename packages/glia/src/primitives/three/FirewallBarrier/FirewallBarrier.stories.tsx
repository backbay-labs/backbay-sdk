import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as React from "react";
import { FirewallBarrier } from "./FirewallBarrier";
import type { FirewallRule, FirewallTraffic } from "./types";

const demoRules: FirewallRule[] = [
  {
    id: "rule-1",
    name: "Allow HTTPS",
    action: "allow",
    source: "0.0.0.0/0",
    destination: "10.0.2.0/24",
    port: 443,
    protocol: "tcp",
    hits: 420,
  },
  {
    id: "rule-2",
    name: "Allow VPN",
    action: "allow",
    source: "0.0.0.0/0",
    destination: "10.0.1.5",
    port: 1194,
    protocol: "udp",
    hits: 210,
  },
  {
    id: "rule-3",
    name: "Deny SMB",
    action: "deny",
    source: "0.0.0.0/0",
    destination: "10.0.3.0/24",
    port: 445,
    protocol: "tcp",
    hits: 120,
  },
  {
    id: "rule-4",
    name: "Log ICMP",
    action: "log",
    source: "0.0.0.0/0",
    destination: "10.0.4.10",
    protocol: "icmp",
    hits: 60,
  },
  {
    id: "rule-5",
    name: "Deny RDP",
    action: "deny",
    source: "0.0.0.0/0",
    destination: "10.0.2.20",
    port: 3389,
    protocol: "tcp",
    hits: 280,
  },
  {
    id: "rule-6",
    name: "Allow DNS",
    action: "allow",
    source: "10.0.0.0/16",
    destination: "10.0.0.2",
    port: 53,
    protocol: "udp",
    hits: 150,
  },
];

const demoTraffic: FirewallTraffic[] = [
  {
    id: "t1",
    source: "203.0.113.12",
    destination: "10.0.2.10",
    port: 443,
    protocol: "tcp",
    action: "allowed",
    timestamp: new Date(),
    ruleId: "rule-1",
  },
  {
    id: "t2",
    source: "198.51.100.44",
    destination: "10.0.2.20",
    port: 3389,
    protocol: "tcp",
    action: "blocked",
    timestamp: new Date(),
    ruleId: "rule-5",
  },
  {
    id: "t3",
    source: "192.0.2.77",
    destination: "10.0.3.4",
    port: 445,
    protocol: "tcp",
    action: "blocked",
    timestamp: new Date(),
    ruleId: "rule-3",
  },
  {
    id: "t4",
    source: "10.0.10.12",
    destination: "10.0.0.2",
    port: 53,
    protocol: "udp",
    action: "allowed",
    timestamp: new Date(),
    ruleId: "rule-6",
  },
  {
    id: "t5",
    source: "198.51.100.99",
    destination: "10.0.1.5",
    port: 1194,
    protocol: "udp",
    action: "allowed",
    timestamp: new Date(),
    ruleId: "rule-2",
  },
];

const meta: Meta<typeof FirewallBarrier> = {
  title: "Primitives/3D/Security/FirewallBarrier",
  component: FirewallBarrier,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", background: "#050812" }}>
        <Canvas camera={{ position: [0, 2, 6], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={["#050812"]} />
          <fog attach="fog" args={["#050812", 6, 18]} />
          <Stars radius={60} depth={30} count={1000} factor={2} saturation={0} fade speed={0.4} />
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 6, 5]} intensity={0.7} color="#22d3ee" />
          <pointLight position={[-5, 4, -5]} intensity={0.4} color="#f97316" />
          <OrbitControls enableDamping dampingFactor={0.08} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FirewallBarrier>;

export const VerticalBarrier: Story = {
  args: {
    rules: demoRules,
    recentTraffic: demoTraffic,
    orientation: "vertical",
    showRuleLabels: true,
  },
};

export const HorizontalBarrier: Story = {
  args: {
    rules: demoRules,
    recentTraffic: demoTraffic,
    orientation: "horizontal",
    showRuleLabels: false,
  },
};
