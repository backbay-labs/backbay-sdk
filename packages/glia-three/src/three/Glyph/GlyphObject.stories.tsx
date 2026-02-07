import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import type { AnchorState, AVO } from "@backbay/glia-agent/emotion";
import { ANCHOR_STATES, computeVisualState, getAnimationWeights, useEmotion } from "@backbay/glia-agent/emotion";
import { GlyphObject } from "./GlyphObject";
import type { GlyphOneShot, GlyphState, GlyphVariant } from "./types";

const GLYPH_STATES: GlyphState[] = [
  "idle",
  "listening",
  "thinking",
  "responding",
  "success",
  "error",
  "sleep",
];

const ONE_SHOTS: GlyphOneShot[] = ["responding", "success", "error"];

function GlyphViewport({
  children,
  height = 520,
}: {
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height,
        background: "linear-gradient(to bottom, #050812, #0a0a0f)",
        border: "1px solid #1b2233",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.25} />
        <pointLight position={[5, 5, 5]} intensity={0.55} color="#ffd700" />
        <pointLight position={[-5, -5, -5]} intensity={0.45} color="#00f0ff" />
        {children}
        <OrbitControls enableDamping dampingFactor={0.05} minDistance={2} maxDistance={10} />
      </Canvas>
    </div>
  );
}

function Pill({
  active,
  label,
  onClick,
  tone = "violet",
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  tone?: "violet" | "emerald" | "amber" | "red";
}) {
  const colors = {
    violet: { fg: "#a78bfa", border: "#a78bfa" },
    emerald: { fg: "#34d399", border: "#34d399" },
    amber: { fg: "#fbbf24", border: "#fbbf24" },
    red: { fg: "#fb7185", border: "#fb7185" },
  } as const;

  const c = colors[tone];

  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${active ? c.border : "#2a3347"}`,
        background: active ? "#141a2a" : "#0e1220",
        color: active ? c.fg : "#94a3b8",
        fontSize: 11,
        cursor: "pointer",
        fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
    >
      {label}
    </button>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#0b1020",
        border: "1px solid #1b2233",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 12,
          color: "#e2e8f0",
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function LegacyClipReview() {
  const [state, setState] = useState<GlyphState>("idle");
  const [variant, setVariant] = useState<GlyphVariant>("sentinel");
  const [particles, setParticles] = useState(false);

  const playState = (next: GlyphState) => {
    if (!ONE_SHOTS.includes(next as GlyphOneShot)) {
      setState(next);
      return;
    }

    setState((prev) => {
      if (prev !== next) return next;
      // Force a replay by bouncing through an idle frame.
      setTimeout(() => setState(next), 0);
      return "idle";
    });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 20,
        padding: 24,
        height: "100vh",
        background: "#050812",
        color: "#e2e8f0",
      }}
    >
      <GlyphViewport>
        <GlyphObject
          state={state}
          enableBlending={false}
          variant={variant}
          enableParticles={particles}
        />
      </GlyphViewport>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel title="Baked Clips (Legacy Mode)">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {GLYPH_STATES.map((s) => (
              <Pill
                key={s}
                active={s === state}
                label={s}
                onClick={() => playState(s)}
                tone={s === "error" ? "red" : ONE_SHOTS.includes(s as GlyphOneShot) ? "emerald" : "violet"}
              />
            ))}
          </div>

          <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
            One-shots (responding/success/error) play once. Click the active pill again to replay.
          </div>
        </Panel>

        <Panel title="View">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 11, color: "#94a3b8" }}>
              Variant
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value as GlyphVariant)}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 6,
                  padding: "8px 10px",
                  background: "#0e1220",
                  border: "1px solid #2a3347",
                  borderRadius: 10,
                  color: "#e2e8f0",
                }}
              >
                <option value="sentinel">sentinel</option>
                <option value="console">console</option>
                <option value="graph">graph</option>
                <option value="minimal">minimal</option>
              </select>
            </label>

            <label style={{ fontSize: 11, color: "#94a3b8" }}>
              Particles
              <button
                onClick={() => setParticles((v) => !v)}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 6,
                  padding: "8px 10px",
                  background: particles ? "#0f2a20" : "#0e1220",
                  border: `1px solid ${particles ? "#34d399" : "#2a3347"}`,
                  borderRadius: 10,
                  color: particles ? "#34d399" : "#94a3b8",
                  cursor: "pointer",
                }}
              >
                {particles ? "enabled" : "disabled"}
              </button>
            </label>
          </div>
        </Panel>

        <Panel title="Motion Cues">
          <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
            <div>
              <span style={{ color: "#a78bfa" }}>Listening</span>: calmer ring orbit, subtle inhale, slight lean.
            </div>
            <div>
              <span style={{ color: "#a78bfa" }}>Thinking</span>: stronger core pulses, ring wobble, tighter intent.
            </div>
            <div>
              <span style={{ color: "#34d399" }}>Responding / Success</span>: outward projection (rings expand + core push).
            </div>
            <div>
              <span style={{ color: "#fb7185" }}>Error</span>: sharper alarm (root shake + brow snap).
            </div>
            <div>
              <span style={{ color: "#a78bfa" }}>Sleep</span>: minimal motion, contracted rings, eyes closed.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function OneShotRepeater({
  clip,
  base,
  intervalMs = 2400,
}: {
  clip: GlyphOneShot;
  base: AVO;
  intervalMs?: number;
}) {
  const [nonce, setNonce] = useState(0);
  const visual = useMemo(() => computeVisualState(base), [base]);

  useEffect(() => {
    const id = window.setInterval(() => setNonce((n) => n + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return (
    <GlyphObject
      state="idle"
      enableBlending={true}
      dimensions={base}
      visualState={visual}
      oneShot={clip}
      oneShotNonce={nonce}
      variant="sentinel"
      enableParticles={false}
    />
  );
}

function EmotionBlendStudio() {
  const [variant, setVariant] = useState<GlyphVariant>("sentinel");
  const [particles, setParticles] = useState(true);
  const [oneShot, setOneShot] = useState<GlyphOneShot | undefined>(undefined);
  const [oneShotNonce, setOneShotNonce] = useState(0);
  const [selectedAnchor, setSelectedAnchor] = useState<AnchorState>("idle");
  const [mode, setMode] = useState<"anchors" | "manual">("anchors");

  const { dimensions, baseDimensions, visualState, goTo, set, isTransitioning } = useEmotion({
    initialAnchor: "idle",
    microExpressions: true,
  });

  const trigger = (clip: GlyphOneShot) => {
    setOneShot(clip);
    setOneShotNonce((n) => n + 1);
  };

  const setManual = (key: keyof AVO, value: number) => {
    set({ [key]: value });
  };

  const weights = useMemo(() => getAnimationWeights(baseDimensions), [baseDimensions]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 420px",
        gap: 20,
        padding: 24,
        height: "100vh",
        background: "#050812",
        color: "#e2e8f0",
      }}
    >
      <GlyphViewport>
        <GlyphObject
          state="idle"
          enableBlending={true}
          variant={variant}
          enableParticles={particles}
          dimensions={dimensions}
          visualState={visualState}
          oneShot={oneShot}
          oneShotNonce={oneShotNonce}
        />
      </GlyphViewport>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel title="Emotion + Blending">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill
              active={mode === "anchors"}
              label="anchors"
              onClick={() => {
                setMode("anchors");
                goTo(selectedAnchor);
              }}
              tone="violet"
            />
            <Pill active={mode === "manual"} label="manual AVO" onClick={() => setMode("manual")} tone="amber" />
          </div>

          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(["idle", "listening", "thinking", "dormant"] as const).map((a) => (
              <Pill
                key={a}
                active={selectedAnchor === a}
                label={a}
                onClick={() => {
                  setSelectedAnchor(a);
                  setMode("anchors");
                  goTo(a);
                }}
                tone="emerald"
              />
            ))}
            {(["satisfied", "responding", "error"] as const).map((a) => (
              <Pill
                key={a}
                active={selectedAnchor === a}
                label={a}
                onClick={() => {
                  setSelectedAnchor(a);
                  setMode("anchors");
                  goTo(a);
                }}
                tone={a === "error" ? "red" : "emerald"}
              />
            ))}
          </div>

          <div style={{ marginTop: 12, fontSize: 11, color: isTransitioning ? "#fbbf24" : "#94a3b8" }}>
            {isTransitioning ? "● transitioning…" : "○ stable"}
          </div>

          {mode === "manual" && (
            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              {(["arousal", "valence", "openness"] as const).map((k) => (
                <label key={k} style={{ fontSize: 11, color: "#94a3b8" }}>
                  {k} <span style={{ color: "#e2e8f0" }}>{baseDimensions[k].toFixed(2)}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={baseDimensions[k]}
                    onChange={(e) => setManual(k, Number.parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </label>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="One‑Shots (Overlay)">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Pill active={false} label="responding" onClick={() => trigger("responding")} tone="emerald" />
            <Pill active={false} label="success" onClick={() => trigger("success")} tone="emerald" />
            <Pill active={false} label="error" onClick={() => trigger("error")} tone="red" />
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
            These are baked one-shots layered on top of blended loop clips, while the procedural AVO layer still updates materials + micro-expressions.
          </div>
        </Panel>

        <Panel title="Loop Weights (Derived)">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 10,
              fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 11,
              color: "#94a3b8",
            }}
          >
            {(["idle", "listening", "thinking", "sleep"] as const).map((k) => (
              <div key={k} style={{ padding: 10, background: "#0e1220", borderRadius: 10, border: "1px solid #2a3347" }}>
                <div style={{ color: "#e2e8f0" }}>{k}</div>
                <div style={{ marginTop: 6 }}>{(weights[k] * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="View">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 11, color: "#94a3b8" }}>
              Variant
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value as GlyphVariant)}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 6,
                  padding: "8px 10px",
                  background: "#0e1220",
                  border: "1px solid #2a3347",
                  borderRadius: 10,
                  color: "#e2e8f0",
                }}
              >
                <option value="sentinel">sentinel</option>
                <option value="console">console</option>
                <option value="graph">graph</option>
                <option value="minimal">minimal</option>
              </select>
            </label>

            <label style={{ fontSize: 11, color: "#94a3b8" }}>
              Particles
              <button
                onClick={() => setParticles((v) => !v)}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 6,
                  padding: "8px 10px",
                  background: particles ? "#0f2a20" : "#0e1220",
                  border: `1px solid ${particles ? "#34d399" : "#2a3347"}`,
                  borderRadius: 10,
                  color: particles ? "#34d399" : "#94a3b8",
                  cursor: "pointer",
                }}
              >
                {particles ? "enabled" : "disabled"}
              </button>
            </label>
          </div>
        </Panel>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Primitives/3D/Agent/Glyph",
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
};

export default meta;

type Story = StoryObj;

export const LegacyClips: Story = {
  render: () => <LegacyClipReview />,
};

export const EmotionStudio: Story = {
  render: () => <EmotionBlendStudio />,
};

export const IdleLoop: Story = {
  name: "Clip / Idle (Loop)",
  render: () => (
    <div style={{ padding: 24, background: "#050812", minHeight: "100vh" }}>
      <GlyphViewport>
        <GlyphObject state="idle" enableBlending={false} variant="sentinel" enableParticles={false} />
      </GlyphViewport>
    </div>
  ),
};

export const ListeningLoop: Story = {
  name: "Clip / Listening (Loop)",
  render: () => (
    <div style={{ padding: 24, background: "#050812", minHeight: "100vh" }}>
      <GlyphViewport>
        <GlyphObject state="listening" enableBlending={false} variant="sentinel" enableParticles={false} />
      </GlyphViewport>
    </div>
  ),
};

export const ThinkingLoop: Story = {
  name: "Clip / Thinking (Loop)",
  render: () => (
    <div style={{ padding: 24, background: "#050812", minHeight: "100vh" }}>
      <GlyphViewport>
        <GlyphObject state="thinking" enableBlending={false} variant="sentinel" enableParticles={false} />
      </GlyphViewport>
    </div>
  ),
};

export const SleepLoop: Story = {
  name: "Clip / Sleep (Loop)",
  render: () => (
    <div style={{ padding: 24, background: "#050812", minHeight: "100vh" }}>
      <GlyphViewport>
        <GlyphObject state="sleep" enableBlending={false} variant="sentinel" enableParticles={false} />
      </GlyphViewport>
    </div>
  ),
};

export const RespondingOneShot: Story = {
  name: "Clip / Responding (One‑Shot)",
  render: () => (
    <div style={{ padding: 24, background: "#050812", minHeight: "100vh" }}>
      <GlyphViewport>
        <OneShotRepeater clip="responding" base={ANCHOR_STATES.responding} />
      </GlyphViewport>
    </div>
  ),
};

export const SuccessOneShot: Story = {
  name: "Clip / Success (One‑Shot)",
  render: () => (
    <div style={{ padding: 24, background: "#050812", minHeight: "100vh" }}>
      <GlyphViewport>
        <OneShotRepeater clip="success" base={ANCHOR_STATES.satisfied} />
      </GlyphViewport>
    </div>
  ),
};

export const ErrorOneShot: Story = {
  name: "Clip / Error (One‑Shot)",
  render: () => (
    <div style={{ padding: 24, background: "#050812", minHeight: "100vh" }}>
      <GlyphViewport>
        <OneShotRepeater clip="error" base={ANCHOR_STATES.error} intervalMs={2200} />
      </GlyphViewport>
    </div>
  ),
};

