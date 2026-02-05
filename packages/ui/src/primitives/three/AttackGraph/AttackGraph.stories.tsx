import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as React from "react";
import { AttackGraph } from "./AttackGraph";
import type { AttackChain } from "./types";

const demoChains: AttackChain[] = [
  {
    id: "chain-1",
    name: "Spearphish to C2",
    status: "active",
    actor: "APT-29",
    techniques: [
      {
        id: "T1566",
        name: "Phishing",
        tactic: "initial-access",
        detected: true,
        confidence: 0.9,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
      {
        id: "T1059",
        name: "Command Shell",
        tactic: "execution",
        detected: true,
        confidence: 0.78,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        id: "T1053",
        name: "Scheduled Task",
        tactic: "persistence",
        detected: false,
        confidence: 0.55,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: "T1071",
        name: "Web Protocols",
        tactic: "command-and-control",
        detected: true,
        confidence: 0.62,
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
      },
      {
        id: "T1041",
        name: "Exfiltration Over C2",
        tactic: "exfiltration",
        detected: false,
        confidence: 0.46,
      },
    ],
  },
  {
    id: "chain-2",
    name: "Credential Theft",
    status: "contained",
    techniques: [
      {
        id: "T1087",
        name: "Account Discovery",
        tactic: "discovery",
        detected: true,
        confidence: 0.74,
      },
      {
        id: "T1003",
        name: "OS Credential Dumping",
        tactic: "credential-access",
        detected: true,
        confidence: 0.88,
      },
      {
        id: "T1021",
        name: "Remote Services",
        tactic: "lateral-movement",
        detected: true,
        confidence: 0.68,
      },
      {
        id: "T1486",
        name: "Data Encrypted for Impact",
        tactic: "impact",
        detected: false,
        confidence: 0.42,
      },
    ],
  },
];

const meta: Meta<typeof AttackGraph> = {
  title: "Primitives/3D/Security/AttackGraph",
  component: AttackGraph,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", background: "#050812" }}>
        <Canvas camera={{ position: [0, 3.5, 9], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={["#050812"]} />
          <fog attach="fog" args={["#050812", 6, 20]} />
          <Stars radius={60} depth={30} count={1400} factor={2} saturation={0} fade speed={0.5} />
          <ambientLight intensity={0.3} />
          <pointLight position={[6, 6, 6]} intensity={0.7} color="#3b82f6" />
          <pointLight position={[-6, 2, -6]} intensity={0.4} color="#f97316" />
          <OrbitControls enableDamping dampingFactor={0.06} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AttackGraph>;

export const Killchain: Story = {
  args: {
    chains: demoChains,
    layout: "killchain",
    showMitreIds: true,
    highlightDetected: true,
  },
};

export const MatrixLayout: Story = {
  args: {
    chains: demoChains,
    layout: "matrix",
    showMitreIds: false,
  },
};

export const Timeline: Story = {
  args: {
    chains: demoChains,
    layout: "timeline",
    showMitreIds: true,
  },
};
