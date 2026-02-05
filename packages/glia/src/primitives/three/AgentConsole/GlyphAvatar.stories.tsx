import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { GlyphAvatar } from "./GlyphAvatar";
import type { AgentMode, AgentState } from "./types";

const meta: Meta<typeof GlyphAvatar> = {
  title: "Primitives/3D/Agent/GlyphAvatar",
  component: GlyphAvatar,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  argTypes: {
    state: {
      control: "select",
      options: ["idle", "listening", "thinking", "responding", "error"],
    },
    mode: {
      control: "select",
      options: ["conversational", "monitoring", "focused", "commanding"],
    },
    scale: {
      control: { type: "range", min: 0.5, max: 1.75, step: 0.05 },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "100%",
          height: "100vh",
          background: "linear-gradient(to bottom, #050812, #0a0a0f)",
        }}
      >
        <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.25} />
          <pointLight position={[5, 5, 5]} intensity={0.55} color="#ffd700" />
          <pointLight position={[-5, -5, -5]} intensity={0.45} color="#00f0ff" />
          <Story />
          <OrbitControls enableDamping dampingFactor={0.05} minDistance={2} maxDistance={10} />
        </Canvas>
      </div>
    ),
  ],
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof GlyphAvatar>;

export const Interactive: Story = {
  args: {
    state: "idle",
    mode: "conversational",
    scale: 1,
  },
};

function ScriptedSequenceInner({ mode }: { mode: AgentMode }) {
  const sequence = useMemo(
    () =>
      [
        { state: "listening" as const, ms: 900 },
        { state: "thinking" as const, ms: 1100 },
        { state: "responding" as const, ms: 1200 },
        // Returning to idle triggers a success flourish inside GlyphAvatar.
        { state: "idle" as const, ms: 1800 },
        { state: "error" as const, ms: 1100 },
        { state: "idle" as const, ms: 1400 },
      ] satisfies Array<{ state: AgentState; ms: number }>,
    []
  );

  const [state, setState] = useState<AgentState>("idle");

  useEffect(() => {
    let cancelled = false;
    let idx = 0;
    let timeoutId: number | null = null;

    const step = () => {
      if (cancelled) return;
      const next = sequence[idx % sequence.length];
      setState(next.state);
      idx += 1;
      timeoutId = window.setTimeout(step, next.ms);
    };

    step();

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [sequence]);

  return <GlyphAvatar state={state} mode={mode} scale={1} />;
}

export const ScriptedSequence: Story = {
  name: "Scripted Sequence (Events + One‑Shots)",
  render: (args) => <ScriptedSequenceInner mode={(args.mode ?? "conversational") as AgentMode} />,
  args: {
    mode: "conversational",
  },
};

