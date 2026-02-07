import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as React from "react";
import { NetworkTopology } from "./NetworkTopology";
import type { NetworkEdge, NetworkNode } from "./types";

const demoNodes: NetworkNode[] = [
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
    services: ["bgp", "ospf", "mpls"],
    vulnerabilities: 2,
  },
  {
    id: "srv-1",
    type: "server",
    hostname: "db-prod-01",
    ip: "10.0.2.10",
    status: "healthy",
    services: ["postgres", "redis"],
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
  {
    id: "iot-1",
    type: "iot",
    hostname: "badge-reader",
    ip: "10.0.6.15",
    status: "warning",
    services: ["ble"],
  },
  {
    id: "cloud-1",
    type: "cloud",
    hostname: "aws-edge",
    ip: "172.20.0.1",
    status: "healthy",
    services: ["cdn", "waf"],
  },
];

const demoEdges: NetworkEdge[] = [
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
  {
    id: "e5",
    source: "srv-2",
    target: "iot-1",
    protocol: "udp",
    encrypted: false,
    status: "blocked",
  },
  {
    id: "e6",
    source: "fw-1",
    target: "cloud-1",
    protocol: "https",
    encrypted: true,
    status: "active",
    bandwidth: 6100,
  },
];

const meta: Meta<typeof NetworkTopology> = {
  title: "Primitives/3D/Security/NetworkTopology",
  component: NetworkTopology,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", background: "#050812" }}>
        <Canvas camera={{ position: [0, 4, 8], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={["#050812"]} />
          <fog attach="fog" args={["#050812", 8, 20]} />
          <Stars radius={60} depth={30} count={1200} factor={2} saturation={0} fade speed={0.4} />
          <ambientLight intensity={0.3} />
          <pointLight position={[6, 8, 6]} intensity={0.7} color="#3b82f6" />
          <pointLight position={[-6, 4, -6]} intensity={0.4} color="#22d3ee" />
          <OrbitControls enableDamping dampingFactor={0.06} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NetworkTopology>;

export const ForceLayout: Story = {
  args: {
    nodes: demoNodes,
    edges: demoEdges,
    layout: "force",
    showTraffic: true,
    showLabels: true,
    highlightPath: ["fw-1", "router-1", "srv-2"],
  },
};

export const Hierarchical: Story = {
  args: {
    nodes: demoNodes,
    edges: demoEdges,
    layout: "hierarchical",
    showTraffic: true,
    showLabels: true,
    highlightPath: ["fw-1", "router-1", "srv-1"],
    theme: "blueprint",
  },
};

export const Radial: Story = {
  args: {
    nodes: demoNodes,
    edges: demoEdges,
    layout: "radial",
    showTraffic: false,
    showLabels: true,
    theme: "matrix",
  },
};
