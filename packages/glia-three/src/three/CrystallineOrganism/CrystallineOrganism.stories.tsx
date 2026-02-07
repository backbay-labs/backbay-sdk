/**
 * CrystallineOrganism Stories
 *
 * Storybook stories demonstrating emotion-driven crystalline organisms.
 * Uses the same AVO emotion system as the Glyph.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useState, useEffect } from "react";

import { CrystallineOrganism } from "./CrystallineOrganism";
import { OrganismShell } from "./OrganismShell";
import { OrganismLattice } from "./OrganismLattice";
import { Breadcrumb } from "./Breadcrumb";
import { ORGANISM_BASE_SIZE } from "./constants";
import { ANCHOR_STATES, computeVisualState } from "@backbay/glia-agent/emotion";
import type {
  OrganismType,
  OrganismState,
  OrganismPower,
  CrystallineOrganismProps,
  LatticeEdge as LatticeEdgeType,
} from "./types";

// -----------------------------------------------------------------------------
// Story Setup
// -----------------------------------------------------------------------------

const CanvasWrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: "100%",
      height: "500px",
      background: "linear-gradient(to bottom, #050812, #0a0f1a)",
    }}
  >
    <Canvas camera={{ position: [0, 2, 5], fov: 50 }} dpr={[1, 2]}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} />
      <OrbitControls enablePan={false} />
      {children}
    </Canvas>
  </div>
);

// -----------------------------------------------------------------------------
// Shell Stories - Demonstrates geometry + emotion-driven visuals
// -----------------------------------------------------------------------------

const ShellMeta: Meta<typeof OrganismShell> = {
  title: "Primitives/3D/Fields/CrystallineOrganism/Shell",
  component: OrganismShell,
  decorators: [
    (Story) => (
      <CanvasWrapper>
        <Story />
      </CanvasWrapper>
    ),
  ],
};

export default ShellMeta;

type ShellStory = StoryObj<typeof OrganismShell>;

export const AllGeometries: ShellStory = {
  name: "Geometry Types",
  render: () => {
    const types: OrganismType[] = [
      "kernel",
      "agent",
      "workcell",
      "task",
      "storage",
      "relay",
    ];
    // All using idle state visual
    const idleVisual = computeVisualState(ANCHOR_STATES.idle);

    return (
      <>
        {types.map((type, i) => (
          <group key={type} position={[(i - 2.5) * 1.5, 0, 0]}>
            <OrganismShell
              type={type}
              visualState={idleVisual}
              size={ORGANISM_BASE_SIZE[type]}
            />
          </group>
        ))}
      </>
    );
  },
};

export const EmotionalStates: ShellStory = {
  name: "Emotional States",
  render: () => {
    const states: Array<{ name: string; avo: typeof ANCHOR_STATES.idle }> = [
      { name: "idle", avo: ANCHOR_STATES.idle },
      { name: "attentive", avo: ANCHOR_STATES.attentive },
      { name: "thinking", avo: ANCHOR_STATES.thinking },
      { name: "enthusiastic", avo: ANCHOR_STATES.enthusiastic },
      { name: "error", avo: ANCHOR_STATES.error },
    ];

    return (
      <>
        {states.map((state, i) => (
          <group key={state.name} position={[(i - 2) * 1.8, 0, 0]}>
            <OrganismShell
              type="kernel"
              visualState={computeVisualState(state.avo)}
              size={0.5}
            />
          </group>
        ))}
      </>
    );
  },
};

export const SelectionStates: ShellStory = {
  name: "Selection States",
  render: () => {
    const visualState = computeVisualState(ANCHOR_STATES.idle);
    return (
      <>
        <group position={[-2, 0, 0]}>
          <OrganismShell
            type="agent"
            visualState={visualState}
            size={0.45}
          />
        </group>
        <group position={[0, 0, 0]}>
          <OrganismShell
            type="agent"
            visualState={visualState}
            size={0.45}
            hovered
          />
        </group>
        <group position={[2, 0, 0]}>
          <OrganismShell
            type="agent"
            visualState={visualState}
            size={0.45}
            selected
          />
        </group>
      </>
    );
  },
};

// -----------------------------------------------------------------------------
// Full Organism Stories - Demonstrates the complete component with emotion
// -----------------------------------------------------------------------------

function SingleOrganismStory() {
  const [selected, setSelected] = useState<string | null>(null);
  const [state, setState] = useState<OrganismState>("idle");

  // Cycle through states for demo
  useEffect(() => {
    const states: OrganismState[] = ["idle", "listening", "thinking", "responding", "success"];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % states.length;
      setState(states[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <CrystallineOrganism
      id="kernel-01"
      type="kernel"
      label="Kernel-01"
      state={state}
      power="elevated"
      selected={selected === "kernel-01"}
      onSelect={setSelected}
    />
  );
}

export const SingleOrganism: StoryObj<typeof CrystallineOrganism> = {
  name: "Single Organism (Animated)",
  render: () => <SingleOrganismStory />,
};

function OrganismGridStory() {
  const [selected, setSelected] = useState<string | null>(null);

  const organisms: Array<{
    id: string;
    type: OrganismType;
    label: string;
    state: OrganismState;
    power: OrganismPower;
    position: [number, number, number];
  }> = [
    { id: "kernel", type: "kernel", label: "Kernel", state: "responding", power: "elevated", position: [-2, 0, -2] },
    { id: "wc-01", type: "workcell", label: "WC-01", state: "busy", power: "standard", position: [0, 0, -2] },
    { id: "wc-02", type: "workcell", label: "WC-02", state: "thinking", power: "standard", position: [2, 0, -2] },
    { id: "agent-01", type: "agent", label: "Agent-01", state: "idle", power: "standard", position: [-2, 0, 0] },
    { id: "agent-02", type: "agent", label: "Agent-02", state: "error", power: "standard", position: [0, 0, 0] },
    { id: "task-01", type: "task", label: "Task-01", state: "success", power: "minimal", position: [2, 0, 0] },
    { id: "storage", type: "storage", label: "Storage", state: "sleep", power: "standard", position: [-1, 0, 2] },
    { id: "relay", type: "relay", label: "Relay", state: "listening", power: "standard", position: [1, 0, 2] },
  ];

  return (
    <>
      {organisms.map((org) => (
        <CrystallineOrganism
          key={org.id}
          id={org.id}
          type={org.type}
          label={org.label}
          state={org.state}
          power={org.power}
          position={org.position}
          selected={selected === org.id}
          onSelect={setSelected}
        />
      ))}
    </>
  );
}

export const OrganismGrid: StoryObj<typeof CrystallineOrganism> = {
  name: "Organism Grid",
  render: () => <OrganismGridStory />,
};

function PowerLevelsStory() {
  const powers: OrganismPower[] = ["minimal", "standard", "elevated", "intense"];

  return (
    <>
      {powers.map((power, i) => (
        <CrystallineOrganism
          key={power}
          id={`kernel-${power}`}
          type="kernel"
          label={power}
          state="responding"
          power={power}
          position={[(i - 1.5) * 2, 0, 0]}
        />
      ))}
    </>
  );
}

export const PowerLevels: StoryObj<typeof CrystallineOrganism> = {
  name: "Power Levels",
  render: () => <PowerLevelsStory />,
};

function WithChildrenStory() {
  const childOrganisms: CrystallineOrganismProps[] = [
    { id: "task-1", type: "task", label: "Task-1", state: "idle" },
    { id: "task-2", type: "task", label: "Task-2", state: "thinking" },
    { id: "task-3", type: "task", label: "Task-3", state: "error" },
  ];

  return (
    <CrystallineOrganism
      id="workcell-01"
      type="workcell"
      label="Workcell-01"
      state="busy"
      power="elevated"
      children={childOrganisms}
      onSprawl={(id) => console.log("Sprawl:", id)}
    />
  );
}

export const WithChildren: StoryObj<typeof CrystallineOrganism> = {
  name: "With Children (Click to Sprawl)",
  render: () => <WithChildrenStory />,
};

// -----------------------------------------------------------------------------
// Direct AVO Control Story
// -----------------------------------------------------------------------------

function DirectAVOStory() {
  const [arousal, setArousal] = useState(0.5);
  const [valence, setValence] = useState(0.7);
  const [openness, setOpenness] = useState(0.5);

  return (
    <>
      <CrystallineOrganism
        id="direct-avo"
        type="kernel"
        label="Direct AVO Control"
        dimensions={{ arousal, valence, openness }}
        power="elevated"
      />

      {/* Controls overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          display: "flex",
          gap: "20px",
          background: "rgba(0,0,0,0.8)",
          padding: "15px",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "12px",
          color: "white",
        }}
      >
        <label style={{ flex: 1 }}>
          Arousal: {arousal.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={arousal}
            onChange={(e) => setArousal(parseFloat(e.target.value))}
            style={{ width: "100%", display: "block", marginTop: "5px" }}
          />
        </label>
        <label style={{ flex: 1 }}>
          Valence: {valence.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={valence}
            onChange={(e) => setValence(parseFloat(e.target.value))}
            style={{ width: "100%", display: "block", marginTop: "5px" }}
          />
        </label>
        <label style={{ flex: 1 }}>
          Openness: {openness.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={openness}
            onChange={(e) => setOpenness(parseFloat(e.target.value))}
            style={{ width: "100%", display: "block", marginTop: "5px" }}
          />
        </label>
      </div>
    </>
  );
}

export const DirectAVOControl: StoryObj<typeof CrystallineOrganism> = {
  name: "Direct AVO Control",
  render: () => (
    <div style={{ position: "relative" }}>
      <CanvasWrapper>
        <DirectAVOStory />
      </CanvasWrapper>
    </div>
  ),
};

// -----------------------------------------------------------------------------
// Integration Stories - Full Lattice with Sprawl Navigation
// -----------------------------------------------------------------------------

export const FullLattice: StoryObj<typeof OrganismLattice> = {
  name: "Full Lattice",
  render: () => {
    const [sprawlStack, setSprawlStack] = useState<string[]>([]);

    const organisms: CrystallineOrganismProps[] = [
      {
        id: "kernel-01",
        type: "kernel",
        label: "Kernel-01",
        state: "responding",
        power: "elevated",
        children: [
          { id: "wc-01", type: "workcell", label: "WC-01", state: "busy" },
          { id: "wc-02", type: "workcell", label: "WC-02", state: "thinking" },
          { id: "wc-03", type: "workcell", label: "WC-03", state: "idle" },
        ],
      },
      {
        id: "kernel-02",
        type: "kernel",
        label: "Kernel-02",
        state: "idle",
        children: [
          { id: "agent-01", type: "agent", label: "Agent-01", state: "listening" },
          { id: "agent-02", type: "agent", label: "Agent-02", state: "error" },
        ],
      },
      {
        id: "relay-01",
        type: "relay",
        label: "Relay-01",
        state: "listening",
      },
    ];

    const edges: LatticeEdgeType[] = [
      { id: "e1", source: "kernel-01", target: "kernel-02", type: "communication", strength: 0.8, bidirectional: true },
      { id: "e2", source: "kernel-01", target: "relay-01", type: "data-flow", strength: 0.6, bidirectional: false },
      { id: "e3", source: "kernel-02", target: "relay-01", type: "data-flow", strength: 0.6, bidirectional: false },
    ];

    const labels: Record<string, string> = {};
    const collectLabels = (orgs: CrystallineOrganismProps[]) => {
      orgs.forEach((o) => {
        if (o.label) labels[o.id] = o.label;
        if (o.children) collectLabels(o.children);
      });
    };
    collectLabels(organisms);

    const handleNavigate = (toIndex: number) => {
      if (toIndex < 0) {
        setSprawlStack([]);
      } else {
        setSprawlStack(sprawlStack.slice(0, toIndex + 1));
      }
    };

    return (
      <>
        <Breadcrumb
          stack={sprawlStack}
          labels={labels}
          onNavigate={handleNavigate}
        />
        <OrganismLattice
          organisms={organisms}
          edges={edges}
          layout="hex-grid"
          sprawlStack={sprawlStack}
          onSprawlChange={setSprawlStack}
        />
      </>
    );
  },
};

export const KernelWithWorkcells: StoryObj<typeof OrganismLattice> = {
  name: "Kernel With Workcells",
  render: () => {
    const [sprawlStack, setSprawlStack] = useState<string[]>(["kernel-01"]);

    const workcells: CrystallineOrganismProps[] = [
      { id: "wc-01", type: "workcell", label: "WC-01", state: "busy" },
      { id: "wc-02", type: "workcell", label: "WC-02", state: "thinking" },
      { id: "wc-03", type: "workcell", label: "WC-03", state: "idle" },
      { id: "wc-04", type: "workcell", label: "WC-04", state: "error" },
      { id: "wc-05", type: "workcell", label: "WC-05", state: "sleep" },
    ];

    const organisms: CrystallineOrganismProps[] = [
      {
        id: "kernel-01",
        type: "kernel",
        label: "Kernel-01",
        state: "responding",
        power: "elevated",
        children: workcells,
      },
    ];

    const edges: LatticeEdgeType[] = [
      { id: "e1", source: "wc-01", target: "wc-02", type: "dependency", strength: 0.5, bidirectional: false },
      { id: "e2", source: "wc-02", target: "wc-03", type: "dependency", strength: 0.5, bidirectional: false },
      { id: "e3", source: "wc-01", target: "wc-04", type: "data-flow", strength: 0.7, bidirectional: false },
    ];

    return (
      <>
        <Breadcrumb
          stack={sprawlStack}
          labels={{ "kernel-01": "Kernel-01" }}
          onNavigate={(i) => setSprawlStack(i < 0 ? [] : sprawlStack.slice(0, i + 1))}
        />
        <OrganismLattice
          organisms={organisms}
          edges={edges}
          layout="hex-grid"
          sprawlStack={sprawlStack}
          onSprawlChange={setSprawlStack}
        />
      </>
    );
  },
};
