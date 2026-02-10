import type { Meta, StoryObj } from "@storybook/react";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { HeroScene } from "./HeroScene";

// =============================================================================
// Story Meta
// =============================================================================

const meta: Meta = {
  title: "Primitives/3D/Fields/HeroScenes/Cyber/Clawdstrike Reveal",
  parameters: { layout: "fullscreen" },
  tags: ["!test"],
};
export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Constants
// =============================================================================

type Phase = "scanning" | "detecting" | "revealing" | "settled";

type FlowState =
  | "cinematic"
  | "buttonSpawning"
  | "buttonReady"
  | "onboarding"
  | "complete"
  | "demo";

/** Milliseconds per scanner revolution */
const SCAN_DURATION = 3000;
/** Cumulative angle where field is fully revealed (end of sweep 1) */
const FIELD_REVEALED_ANGLE = 360;
/** Cumulative angle where detection triggers (sweep 3 at 180° = center crossing) */
const DETECT_ANGLE = 2.5 * 360; // 900°  → 7.5s
/** Cumulative angle where wiper reveal begins (sweep 4 start) */
const REVEAL_ANGLE = 3 * 360; // 1080° → 9s
/** Cumulative angle where scene settles (sweep 4 end) */
const SETTLE_ANGLE = 4 * 360; // 1440° → 12s

/** Index of the stylized "A" in "clawdstrike" */
const BRAND_A_INDEX = 2;

/** Delay after settled before button spawn begins */
const BUTTON_SPAWN_DELAY = 1500;
/** Delay from spawn start until DOM button appears (mid-animation) */
const RIPPLE_DURATION = 1500;
/** Total canvas animation duration (continues after button appears for release) */
const SPAWN_CANVAS_DURATION = 3000;

// =============================================================================
// Brand palette
// =============================================================================

const BRAND = {
  gold: "#c4a265",
  goldDim: "rgba(196,162,101,0.15)",
  goldBorder: "rgba(196,162,101,0.2)",
  goldGlow: "rgba(196,162,101,0.3)",
  crimson: "#8b1a1a",
  crimsonGlow: "rgba(139,26,26,0.3)",
  silver: "#d4d0c8",
  dark: "#0a0800",
  glassBg: "rgba(8,5,2,0.88)",
  glassBgLight: "rgba(12,10,6,0.75)",
  glassBorder: "rgba(196,162,101,0.12)",
  panelBg: "rgba(6,4,2,0.92)",
} as const;

// =============================================================================
// Font loading — Cormorant Garamond for the serif wordmark
// =============================================================================

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&display=swap');`;

// =============================================================================
// All @keyframes — consolidated into one <style> block
// =============================================================================

const globalKeyframes = `
${fontImport}

@keyframes clawdBloomPulse {
  0% { opacity: 0; transform: scale(0.3); }
  25% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 0.2; transform: scale(1.1); }
  75% { opacity: 0.5; transform: scale(1.3); }
  100% { opacity: 0; transform: scale(1.6); }
}
@keyframes clawdBreathe {
  0%, 100% { opacity: 1; text-shadow: 0 2px 8px rgba(0,0,0,0.6), 0 0 30px rgba(200,190,170,0.08); }
  50% { opacity: 0.92; text-shadow: 0 2px 8px rgba(0,0,0,0.6), 0 0 50px rgba(200,190,170,0.15); }
}
@keyframes clawdBloom {
  0% { opacity: 0; transform: scale(0.5); }
  30% { opacity: 0.6; }
  100% { opacity: 0; transform: scale(2.5); }
}
@keyframes clawdRipple {
  0% { transform: scale(0); opacity: 0.6; }
  70% { opacity: 0.3; }
  100% { transform: scale(1); opacity: 0; }
}
@keyframes clawdButtonIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes clawdSkipIn {
  from { opacity: 0; }
  to { opacity: 0.4; }
}
@keyframes clawdPanelIn {
  from { opacity: 0; transform: translateY(40px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes clawdHeroOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-30px); }
}
@keyframes clawdStepPulse {
  0%, 100% { box-shadow: 0 0 8px ${BRAND.goldDim}, inset 0 0 4px ${BRAND.goldDim}; }
  50% { box-shadow: 0 0 16px ${BRAND.goldGlow}, inset 0 0 8px ${BRAND.goldDim}; }
}
@keyframes clawdCheckIn {
  0% { transform: scale(0) rotate(-45deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(0deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes clawdStatusScan {
  0% { width: 0%; }
  100% { width: 100%; }
}
@keyframes clawdSpin {
  to { transform: rotate(360deg); }
}
@keyframes clawdGrainMove {
  0% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  20% { transform: translate(-15%, 5%); }
  30% { transform: translate(7%, -25%); }
  40% { transform: translate(-5%, 25%); }
  50% { transform: translate(-15%, 10%); }
  60% { transform: translate(15%, 0%); }
  70% { transform: translate(0%, 15%); }
  80% { transform: translate(3%, 35%); }
  90% { transform: translate(-10%, 10%); }
  100% { transform: translate(0, 0); }
}
@keyframes goldSteelShimmer {
  0%, 100% { background-position: 35% 35%; }
  50% { background-position: 65% 65%; }
}
`;

// =============================================================================
// useScannerEngine — rAF-driven scanner with angle-based phase triggers
// =============================================================================

interface ScannerState {
  /** Beam angle within current revolution (0–360) */
  angle: number;
  /** Cumulative rotation in degrees since start */
  totalAngle: number;
  /** Current animation phase */
  phase: Phase;
  /** Field wiper progress (0–1), sweep 1 reveals the quantum field */
  fieldRevealProgress: number;
  /** Logo wiper reveal progress (0–1), only > 0 during revealing/settled */
  revealProgress: number;
}

function useScannerEngine(): ScannerState {
  const [state, setState] = useState<ScannerState>({
    angle: 0,
    totalAngle: 0,
    phase: "scanning",
    fieldRevealProgress: 0,
    revealProgress: 0,
  });

  const rafRef = useRef(0);
  const settledRef = useRef(false);

  useEffect(() => {
    const start = performance.now();
    const degPerMs = 360 / SCAN_DURATION;

    const tick = (now: number) => {
      if (settledRef.current) return;

      const totalAngle = (now - start) * degPerMs;
      const angle = totalAngle % 360;

      const fieldRevealProgress = Math.min(totalAngle / FIELD_REVEALED_ANGLE, 1);

      let phase: Phase;
      let revealProgress = 0;

      if (totalAngle < DETECT_ANGLE) {
        phase = "scanning";
      } else if (totalAngle < REVEAL_ANGLE) {
        phase = "detecting";
      } else if (totalAngle < SETTLE_ANGLE) {
        phase = "revealing";
        revealProgress = (totalAngle - REVEAL_ANGLE) / 360;
      } else {
        phase = "settled";
        revealProgress = 1;
        settledRef.current = true;
      }

      setState({ angle, totalAngle, phase, fieldRevealProgress, revealProgress });

      if (!settledRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return state;
}

// =============================================================================
// useGlitchText — resolves random chars left-to-right
// =============================================================================

const GLITCH_CHARS_LOWER = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%&";
const GLITCH_CHARS_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&";

function useGlitchText(
  text: string,
  duration: number,
  active: boolean,
): string {
  const [display, setDisplay] = useState("");
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setDisplay("");
      return;
    }
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const resolved = Math.floor(progress * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " ") {
          out += " ";
        } else if (i < resolved) {
          out += text[i];
        } else {
          const isUpper =
            text[i] === text[i].toUpperCase() &&
            text[i] !== text[i].toLowerCase();
          const charset = isUpper ? GLITCH_CHARS_UPPER : GLITCH_CHARS_LOWER;
          out += charset[Math.floor(Math.random() * charset.length)];
        }
      }
      setDisplay(out);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, text, duration]);

  return active ? display || text.replace(/[^ ]/g, " ") : "";
}

// =============================================================================
// ScannerBeam — JS-driven rotation (no CSS keyframes)
// =============================================================================

function ScannerBeam({ angle, phase }: { angle: number; phase: Phase }) {
  const hidden = phase === "settled";

  const opacity = hidden
    ? 0
    : phase === "detecting"
      ? 0.9
      : phase === "revealing"
        ? 0.5
        : 0.7;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        opacity,
        transition: hidden ? "opacity 1.5s ease-out" : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: "200vmax",
          height: "200vmax",
          marginLeft: "-100vmax",
          marginTop: "-100vmax",
          background:
            "conic-gradient(from 0deg at 50% 50%, #8b1a1a99 0deg, #8b1a1a33 15deg, transparent 35deg, transparent 360deg)",
          transform: `rotate(${angle}deg)`,
          transformOrigin: "50% 50%",
          willChange: "transform",
        }}
      />
    </div>
  );
}

// =============================================================================
// FieldRevealMask — black overlay that the first scanner sweep wipes away
// =============================================================================

function FieldRevealMask({
  fieldRevealProgress,
}: {
  fieldRevealProgress: number;
}) {
  if (fieldRevealProgress >= 1) return null;

  const revealAngle = fieldRevealProgress * 360;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
        background: `conic-gradient(
          from 0deg at 50% 0%,
          transparent 0deg,
          transparent ${Math.max(0, revealAngle - 20)}deg,
          #000 ${Math.min(360, revealAngle + 20)}deg,
          #000 360deg
        )`,
      }}
    />
  );
}

// =============================================================================
// ResonanceBloom — golden radial bloom + rising ember particles on detection
// =============================================================================

const EMBER_COUNT = 7;

interface Ember {
  x: number;       // horizontal offset from center (px)
  delay: number;   // stagger (ms)
  drift: number;   // horizontal drift over lifetime (px)
  size: number;    // particle diameter (px)
  duration: number; // travel time (ms)
}

function makeEmbers(): Ember[] {
  const embers: Ember[] = [];
  for (let i = 0; i < EMBER_COUNT; i++) {
    embers.push({
      x: (Math.random() - 0.5) * 60,
      delay: Math.random() * 400,
      drift: (Math.random() - 0.5) * 40,
      size: 2 + Math.random() * 2.5,
      duration: 1200 + Math.random() * 800,
    });
  }
  return embers;
}

function ResonanceBloom({ phase }: { phase: Phase }) {
  const visible = phase === "detecting" || phase === "revealing";
  const [embers] = useState(makeEmbers);
  const [tick, setTick] = useState(0);

  // Drive ember animation via rAF
  const startRef = useRef(0);
  useEffect(() => {
    if (!visible) return;
    startRef.current = performance.now();
    let raf: number;
    const loop = () => {
      setTick(performance.now() - startRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      {/* Radial bloom — double-beat pulse */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 300,
          height: 300,
          marginLeft: -150,
          marginTop: -150,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND.gold}33 0%, ${BRAND.gold}11 40%, transparent 70%)`,
          animation: "clawdBloomPulse 2s ease-in-out forwards",
        }}
      />

      {/* Rising embers */}
      {embers.map((ember, i) => {
        const elapsed = tick - ember.delay;
        if (elapsed < 0) return null;
        const progress = Math.min(1, elapsed / ember.duration);
        const y = progress * 120; // rise distance
        const x = ember.x + ember.drift * progress;
        const opacity = progress < 0.15
          ? progress / 0.15               // fade in
          : Math.max(0, 1 - (progress - 0.3) / 0.7); // fade out
        if (opacity <= 0) return null;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: ember.size,
              height: ember.size,
              borderRadius: "50%",
              background: BRAND.gold,
              boxShadow: `0 0 ${ember.size * 3}px ${BRAND.gold}88, 0 0 ${ember.size * 6}px ${BRAND.gold}33`,
              opacity,
              transform: `translate(${x - ember.size / 2}px, ${-y - ember.size / 2}px)`,
              willChange: "transform, opacity",
            }}
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// WiperEdgeGlow — gold glow line at the wiper reveal frontier
// =============================================================================

function WiperEdgeGlow({ revealProgress }: { revealProgress: number }) {
  if (revealProgress <= 0 || revealProgress >= 1) return null;

  const edgeAngle = revealProgress * 360;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 29,
        pointerEvents: "none",
        background: `conic-gradient(
          from 0deg at 50% 0%,
          transparent 0deg,
          transparent ${Math.max(0, edgeAngle - 25)}deg,
          ${BRAND.gold}33 ${Math.max(0, edgeAngle - 8)}deg,
          ${BRAND.gold}77 ${edgeAngle}deg,
          ${BRAND.gold}33 ${Math.min(360, edgeAngle + 8)}deg,
          transparent ${Math.min(360, edgeAngle + 25)}deg,
          transparent 360deg
        )`,
      }}
    />
  );
}

// =============================================================================
// BloomPulse — radial gold flash on reveal
// =============================================================================

function BloomPulse({ phase }: { phase: Phase }) {
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (phase === "revealing" && !fired) {
      setFired(true);
    }
  }, [phase, fired]);

  if (!fired) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 25,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "60vmin",
          height: "60vmin",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND.gold}66 0%, ${BRAND.gold}22 40%, transparent 70%)`,
          animation: "clawdBloom 1.5s ease-out forwards",
        }}
      />
    </div>
  );
}

// =============================================================================
// GlassGrain — SVG noise overlay for glass panels
// =============================================================================

function GlassGrain({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        pointerEvents: "none",
        animation: "clawdGrainMove 8s steps(10) infinite",
      }}
    >
      <filter id="clawdGrain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="300%" height="300%" filter="url(#clawdGrain)" />
    </svg>
  );
}

// =============================================================================
// QuantumFieldSpawn — Canvas-based grid warp + lattice assembly
//
// Phase 1 (0-40%):  WARP — gold grid overlay warps toward button rectangle,
//                   lines bend inward like a gravitational lens. Energy glow
//                   intensifies at the button center.
// Phase 2 (40-80%): ASSEMBLE — grid fades, 32 line fragments tear away from
//                   the lattice and fly to their positions on the button border.
// Phase 3 (80-100%): SOLIDIFY — assembled fragments form a glowing button
//                   outline that fades as the real DOM button takes over.
// =============================================================================

/** Button target dimensions (must match StartSwarmingButton) */
const SPAWN_BTN_W = 240;
const SPAWN_BTN_H = 48;
const SPAWN_BTN_R = 6;
const SPAWN_GRID = 60; // match PCB microGrid1
const SPAWN_FRAG_COUNT = 32;

interface SpawnFragment {
  sx: number; sy: number; // scattered start
  ex: number; ey: number; // target on button border
  len: number;            // fragment length px
  delay: number;          // 0-1 stagger
  edgeAngle: number;      // angle of target edge
}

function generateFragments(
  cx: number, cy: number, w: number, h: number, count: number,
): SpawnFragment[] {
  const frags: SpawnFragment[] = [];
  const perim = 2 * (w + h);
  const halfW = w / 2;
  const halfH = h / 2;

  for (let i = 0; i < count; i++) {
    const p = (i / count) * perim;
    let ex: number, ey: number, edgeAngle: number;

    if (p < w) {
      ex = cx - halfW + p; ey = cy - halfH; edgeAngle = 0;
    } else if (p < w + h) {
      ex = cx + halfW; ey = cy - halfH + (p - w); edgeAngle = Math.PI / 2;
    } else if (p < 2 * w + h) {
      ex = cx + halfW - (p - w - h); ey = cy + halfH; edgeAngle = Math.PI;
    } else {
      ex = cx - halfW; ey = cy + halfH - (p - 2 * w - h); edgeAngle = -Math.PI / 2;
    }

    const scatter = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 220;

    frags.push({
      sx: ex + Math.cos(scatter) * dist,
      sy: ey + Math.sin(scatter) * dist,
      ex, ey,
      len: 10 + Math.random() * 25,
      delay: (i / count) * 0.5 + Math.random() * 0.1,
      edgeAngle,
    });
  }
  return frags;
}

function easeOutCubic(t: number) { return 1 - (1 - t) ** 3; }
function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** Displace a grid vertex toward the button rectangle. */
function displaceVertex(
  x: number, y: number,
  cx: number, cy: number, halfW: number, halfH: number,
  strength: number,
): [number, number] {
  const nearX = Math.max(cx - halfW, Math.min(x, cx + halfW));
  const nearY = Math.max(cy - halfH, Math.min(y, cy + halfH));
  const dx = nearX - x;
  const dy = nearY - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return [x, y];

  const maxRange = 280;
  const falloff = Math.max(0, 1 - dist / maxRange);
  const pull = falloff * falloff * strength * 55;

  return [x + (dx / dist) * pull, y + (dy / dist) * pull];
}

/** Draw a rounded-rect path (for button border). */
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Damped spring for the warp release — overshoots outward then settles.
 * Returns: 1 → 0 → -0.30 (outward push) → 0 (rest)
 */
function releaseSpring(t: number): number {
  return Math.exp(-3.5 * t) * Math.cos(t * Math.PI * 2.5);
}

function QuantumFieldSpawn({ active, targetRef }: {
  active: boolean;
  targetRef: React.RefObject<HTMLDivElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Button center — measured from the DOM target placeholder
    const btnCx = W / 2;
    let btnCy = H / 2 + 60; // fallback
    if (targetRef?.current) {
      const rect = targetRef.current.getBoundingClientRect();
      btnCy = rect.top + rect.height / 2;
    }
    const halfW = SPAWN_BTN_W / 2;
    const halfH = SPAWN_BTN_H / 2;

    const fragments = generateFragments(
      btnCx, btnCy, SPAWN_BTN_W, SPAWN_BTN_H, SPAWN_FRAG_COUNT,
    );

    // Grid dimensions
    const cols = Math.ceil(W / SPAWN_GRID) + 2;
    const rows = Math.ceil(H / SPAWN_GRID) + 2;
    const ox = ((W % SPAWN_GRID) / 2) - SPAWN_GRID;
    const oy = ((H % SPAWN_GRID) / 2) - SPAWN_GRID;

    const TOTAL_MS = SPAWN_CANVAS_DURATION;
    const t0 = performance.now();
    let raf: number;

    // Phase boundaries (normalized 0-1)
    const WARP_END = 0.17;       // 0-500ms: warp builds
    const ASSEMBLE_END = 0.50;   // 500-1500ms: warp held + fragments fly
    const RELEASE_START = 0.50;  // 1500ms: button appears, warp releases

    /** Draw the full warped grid at given strength and alpha. */
    function drawGrid(strength: number, alpha: number) {
      if (alpha < 0.003) return;
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = `rgba(196,162,101,${alpha.toFixed(3)})`;

      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const [x, y] = displaceVertex(
            ox + c * SPAWN_GRID, oy + r * SPAWN_GRID,
            btnCx, btnCy, halfW, halfH, strength,
          );
          if (c === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
        }
        ctx.stroke();
      }
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const [x, y] = displaceVertex(
            ox + c * SPAWN_GRID, oy + r * SPAWN_GRID,
            btnCx, btnCy, halfW, halfH, strength,
          );
          if (r === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
        }
        ctx.stroke();
      }
    }

    /** Draw brighter glow lines near the button. */
    function drawNearGlow(strength: number) {
      if (strength <= 0.01) return;
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(196,162,101,${(Math.abs(strength) * 0.25).toFixed(3)})`;
      ctx.shadowColor = "rgba(196,162,101,0.4)";
      ctx.shadowBlur = 10 * Math.abs(strength);

      const nearRange = 120;
      for (let r = 0; r < rows; r++) {
        const baseY = oy + r * SPAWN_GRID;
        if (Math.abs(baseY - btnCy) > nearRange + SPAWN_GRID) continue;
        ctx.beginPath();
        let started = false;
        for (let c = 0; c < cols; c++) {
          const baseX = ox + c * SPAWN_GRID;
          const nX = Math.max(btnCx - halfW, Math.min(baseX, btnCx + halfW));
          const nY = Math.max(btnCy - halfH, Math.min(baseY, btnCy + halfH));
          const distToBtn = Math.sqrt((nX - baseX) ** 2 + (nY - baseY) ** 2);
          if (distToBtn > nearRange) { started = false; continue; }
          const [x, y] = displaceVertex(
            baseX, baseY, btnCx, btnCy, halfW, halfH, strength,
          );
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    /** Draw energy glow at button center. */
    function drawEnergyGlow(intensity: number) {
      if (intensity < 0.005) return;
      const grad = ctx.createRadialGradient(btnCx, btnCy, 0, btnCx, btnCy, 200);
      grad.addColorStop(0, `rgba(196,162,101,${(intensity * 0.15).toFixed(3)})`);
      grad.addColorStop(1, "rgba(196,162,101,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(btnCx - 200, btnCy - 200, 400, 400);
    }

    /** Draw fragment lines at the given assembly progress (0-1). */
    function drawFrags(progress: number) {
      ctx.lineCap = "round";
      for (const frag of fragments) {
        const localT = Math.max(0, Math.min(1, (progress - frag.delay) / (1 - frag.delay)));
        if (localT <= 0) continue;
        const et = easeOutCubic(localT);

        const x = frag.sx + (frag.ex - frag.sx) * et;
        const y = frag.sy + (frag.ey - frag.sy) * et;

        const flightAngle = Math.atan2(frag.ey - frag.sy, frag.ex - frag.sx);
        const angle = flightAngle + (frag.edgeAngle - flightAngle) * et;

        const dx = Math.cos(angle) * frag.len / 2;
        const dy = Math.sin(angle) * frag.len / 2;

        const alpha = 0.2 + et * 0.6;
        ctx.lineWidth = 0.8 + et * 0.7;
        ctx.strokeStyle = `rgba(196,162,101,${alpha.toFixed(3)})`;
        ctx.shadowColor = `rgba(196,162,101,${(et * 0.5).toFixed(3)})`;
        ctx.shadowBlur = et * 14;

        ctx.beginPath();
        ctx.moveTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    function tick(now: number) {
      const t = Math.min((now - t0) / TOTAL_MS, 1);
      ctx.clearRect(0, 0, W, H);

      // Compute warp strength for every frame
      let warpStrength: number;
      let gridAlpha = 0.12;

      if (t < WARP_END) {
        // WARP BUILD: 0 → 1
        warpStrength = easeInOutQuad(t / WARP_END);
      } else if (t < RELEASE_START) {
        // WARP HELD: stay at 1 while fragments assemble
        warpStrength = 1;
      } else {
        // RELEASE: spring-back (1 → -0.3 → 0)
        const rt = (t - RELEASE_START) / (1 - RELEASE_START);
        warpStrength = releaseSpring(rt);
        // Fade grid out during release
        gridAlpha = 0.12 * Math.max(0, 1 - rt * 1.5);
      }

      // --- Always draw warped grid (unless alpha ~0) ---
      drawGrid(warpStrength, gridAlpha);

      // --- Energy glow (tracks warp strength) ---
      drawEnergyGlow(Math.abs(warpStrength));

      // --- Brighter glow lines near button (only during pull-in) ---
      if (warpStrength > 0.01) {
        drawNearGlow(warpStrength);
      }

      // --- Fragment assembly (starts at WARP_END, done by RELEASE_START) ---
      if (t >= WARP_END && t < RELEASE_START + 0.05) {
        const assembleP = Math.min(1, (t - WARP_END) / (ASSEMBLE_END - WARP_END));
        drawFrags(assembleP);
      }

      // --- Formed button border (from assembly end through release) ---
      if (t >= ASSEMBLE_END * 0.95) {
        const borderFade = t >= RELEASE_START
          ? Math.max(0, 1 - ((t - RELEASE_START) / (1 - RELEASE_START)) * 2)
          : 1;
        if (borderFade > 0.01) {
          ctx.save();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = `rgba(196,162,101,${(borderFade * 0.6).toFixed(3)})`;
          ctx.shadowColor = `rgba(196,162,101,${(borderFade * 0.4).toFixed(3)})`;
          ctx.shadowBlur = 16 * borderFade;
          roundedRectPath(ctx, btnCx - halfW, btnCy - halfH, SPAWN_BTN_W, SPAWN_BTN_H, SPAWN_BTN_R);
          ctx.stroke();
          ctx.restore();
        }
      }

      // --- Shockwave ring during release ---
      if (t >= RELEASE_START) {
        const rt = (t - RELEASE_START) / (1 - RELEASE_START);
        const ringRadius = 50 + rt * 350;
        const ringAlpha = Math.max(0, (1 - rt) * 0.35);
        if (ringAlpha > 0.005) {
          ctx.save();
          ctx.lineWidth = 1.5 * (1 - rt * 0.5);
          ctx.strokeStyle = `rgba(196,162,101,${ringAlpha.toFixed(3)})`;
          ctx.shadowColor = `rgba(196,162,101,${(ringAlpha * 0.8).toFixed(3)})`;
          ctx.shadowBlur = 12 * (1 - rt);
          ctx.beginPath();
          // Rounded-rect shaped ring that expands
          const rw = SPAWN_BTN_W + ringRadius * 2;
          const rh = SPAWN_BTN_H + ringRadius * 2;
          roundedRectPath(ctx, btnCx - rw / 2, btnCy - rh / 2, rw, rh, SPAWN_BTN_R + ringRadius * 0.3);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, targetRef]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 31,
        pointerEvents: "none",
      }}
    />
  );
}

// =============================================================================
// StartSwarmingButton — techno-gothic glass button
// =============================================================================

function StartSwarmingButton({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 48px",
        background: hovered ? BRAND.glassBgLight : BRAND.glassBg,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid ${hovered ? BRAND.gold + "44" : BRAND.glassBorder}`,
        borderRadius: 6,
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: hovered ? BRAND.gold : BRAND.silver,
        boxShadow: hovered
          ? `0 0 24px ${BRAND.goldDim}, 0 0 60px ${BRAND.crimsonGlow}, inset 0 1px 0 rgba(196,162,101,0.06)`
          : `inset 0 1px 0 rgba(196,162,101,0.04)`,
        transition: "all 0.25s ease",
        animation: "clawdButtonIn 0.25s ease-out forwards",
        overflow: "hidden",
      }}
    >
      <GlassGrain opacity={0.03} />
      <span style={{ position: "relative", zIndex: 1 }}>Start Swarming</span>
    </button>
  );
}

// =============================================================================
// SkipLink — faint skip option below the button
// =============================================================================

function SkipLink({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 11,
        letterSpacing: "0.12em",
        color: hovered ? "#888" : "#555",
        opacity: 0,
        animation: "clawdSkipIn 0.6s ease-out 0.4s forwards",
        transition: "color 0.2s ease",
        padding: "8px 16px",
        textDecoration: hovered ? "underline" : "none",
        textUnderlineOffset: 4,
      }}
    >
      skip
    </button>
  );
}

// =============================================================================
// HeroContent — "clAwdstrike" serif wordmark with wiper mask
// =============================================================================

const TITLE_TEXT = "clAwdstrike";

function HeroContent({
  phase,
  revealProgress,
  flowState,
  onStartSwarming,
  onSkip,
}: {
  phase: Phase;
  revealProgress: number;
  flowState: FlowState;
  onStartSwarming: () => void;
  onSkip: () => void;
}) {
  const revealing = phase === "revealing" || phase === "settled";
  const settled = phase === "settled";
  const wordmark = useGlitchText(TITLE_TEXT, SCAN_DURATION, revealing);
  const btnTargetRef = useRef<HTMLDivElement>(null);

  if (!revealing) return null;

  // Hide hero content when transitioning to onboarding
  const exiting = flowState === "onboarding" || flowState === "complete" || flowState === "demo";

  const revealAngle = revealProgress * 360;
  const maskImage = settled
    ? undefined
    : `conic-gradient(from 0deg at 50% 0%, rgba(0,0,0,1) 0deg, rgba(0,0,0,1) ${Math.max(0, revealAngle - 15)}deg, rgba(0,0,0,0) ${Math.min(360, revealAngle + 15)}deg, rgba(0,0,0,0) 360deg)`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        pointerEvents: exiting ? "none" : "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        maskImage,
        WebkitMaskImage: maskImage,
        animation: exiting
          ? "clawdHeroOut 0.6s ease-in forwards"
          : settled
            ? "clawdBreathe 4s ease-in-out infinite"
            : undefined,
      }}
    >
      {/* Wordmark: "clAwdstrike" — gold steel inscription */}
      <div
        style={{
          fontFamily:
            "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif",
          fontSize: 84,
          fontWeight: 600,
          letterSpacing: "0.06em",
          whiteSpace: "pre",
          lineHeight: 1,
          color: BRAND.gold,
          // Multi-band gold steel gradient — upper-right directional light
          background: `linear-gradient(
            135deg,
            #5a4425 0%, #8a6b35 12%, #c9a54e 22%, #d4b878 32%,
            #e8d8a0 40%, #cbb060 48%, #8a7040 55%, #c9a54e 62%,
            #e2cc8a 70%, #d4b878 78%, #9a7e4c 88%, #5a4425 100%
          )`,
          backgroundSize: "150% 150%",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          // Subtle drop shadow under letters
          textShadow: "0 2px 4px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.2)",
          // Slow shimmer — ambient light shift
          animation: "goldSteelShimmer 10s ease-in-out infinite",
        }}
      >
        {wordmark.split("").map((char, i) => {
          const isBrandA = i === BRAND_A_INDEX;
          const displayChar = isBrandA ? char.toUpperCase() : char;

          if (isBrandA) {
            return (
              <span
                key={i}
                style={{
                  WebkitTextFillColor: "#9b1b1b",
                  color: "#9b1b1b",
                  fontSize: "1.15em",
                  fontWeight: 700,
                  display: "inline",
                  position: "relative",
                  textShadow:
                    "0 0 20px rgba(139,26,26,0.4), 0 0 50px rgba(139,26,26,0.2), 0 2px 8px rgba(0,0,0,0.6)",
                }}
              >
                {displayChar}
              </span>
            );
          }

          return (
            <span key={i} style={{ display: "inline" }}>
              {displayChar}
            </span>
          );
        })}
      </div>

      {/* Button spawn area — always rendered to keep layout stable during glitch decode */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          marginTop: 16,
          position: "relative",
        }}
      >
        <QuantumFieldSpawn
          active={settled && (flowState === "buttonSpawning" || flowState === "buttonReady")}
          targetRef={btnTargetRef}
        />
        <div
          ref={btnTargetRef}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: SPAWN_BTN_H,
          }}
        >
          <StartSwarmingButton
            visible={flowState === "buttonReady"}
            onClick={onStartSwarming}
          />
        </div>
        <div style={{ minHeight: 30 }}>
          <SkipLink
            visible={flowState === "buttonReady"}
            onClick={onSkip}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Onboarding Step Definitions
// =============================================================================

interface OnboardingStepDef {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: string;
  actionLabel: string;
  completedLabel: string;
}

const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    id: "connect-claw",
    label: "Connect",
    title: "Deploy Clawdstrike Agent",
    description:
      "Install the Claw agent on your endpoints to begin threat detection and autonomous response across your infrastructure.",
    icon: "⬡",
    actionLabel: "Deploy Agent",
    completedLabel: "Agent Deployed",
  },
  {
    id: "connect-siem",
    label: "Integrate",
    title: "Connect SIEM / SOAR",
    description:
      "Link your security information pipeline. Clawdstrike ingests from Splunk, Sentinel, Chronicle, and 40+ other sources.",
    icon: "⬢",
    actionLabel: "Connect Pipeline",
    completedLabel: "Pipeline Connected",
  },
  {
    id: "create-policy",
    label: "Policy",
    title: "Create First Policy",
    description:
      "Define an autonomous response policy. Set severity thresholds, response actions, and escalation rules for the swarm.",
    icon: "◈",
    actionLabel: "Create Policy",
    completedLabel: "Policy Active",
  },
  {
    id: "status-check",
    label: "Verify",
    title: "Swarm Status Check",
    description:
      "Final verification of your deployment. The swarm will run diagnostics across all connected systems.",
    icon: "◉",
    actionLabel: "Run Diagnostics",
    completedLabel: "All Systems Go",
  },
];

// =============================================================================
// OnboardingStepContent — glass card content for each step
// =============================================================================

function OnboardingStepContent({
  step,
  status,
  onAction,
}: {
  step: OnboardingStepDef;
  status: "pending" | "active" | "completed";
  onAction: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const isCompleted = status === "completed";
  const isActive = status === "active";

  const handleAction = () => {
    if (loading || isCompleted) return;
    setLoading(true);
    // Simulate async operation
    setTimeout(() => {
      setLoading(false);
      onAction();
    }, 1800);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        padding: "32px 24px",
        textAlign: "center",
        opacity: isActive || isCompleted ? 1 : 0.3,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Step icon */}
      <div
        style={{
          fontSize: 36,
          lineHeight: 1,
          color: isCompleted ? "#4ade80" : BRAND.gold,
          textShadow: isCompleted
            ? "0 0 20px rgba(74,222,128,0.4)"
            : `0 0 20px ${BRAND.goldDim}`,
          transition: "all 0.5s ease",
        }}
      >
        {isCompleted ? "✓" : step.icon}
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily:
            "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
          fontSize: 24,
          fontWeight: 600,
          color: BRAND.silver,
          letterSpacing: "0.02em",
        }}
      >
        {step.title}
      </div>

      {/* Description */}
      <div
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 13,
          lineHeight: 1.7,
          color: "#888880",
          maxWidth: 380,
        }}
      >
        {step.description}
      </div>

      {/* Action button */}
      {isActive && (
        <button
          type="button"
          onClick={handleAction}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 36px",
            background: loading ? "rgba(196,162,101,0.08)" : BRAND.glassBg,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: `1px solid ${loading ? BRAND.gold + "33" : BRAND.glassBorder}`,
            borderRadius: 6,
            cursor: loading ? "wait" : "pointer",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: loading ? BRAND.gold + "88" : BRAND.gold,
            boxShadow: `inset 0 1px 0 rgba(196,162,101,0.04)`,
            transition: "all 0.25s ease",
            minWidth: 200,
          }}
        >
          {loading ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  border: `2px solid ${BRAND.gold}33`,
                  borderTopColor: BRAND.gold,
                  borderRadius: "50%",
                  animation: "clawdSpin 0.8s linear infinite",
                }}
              />
              Connecting...
            </>
          ) : (
            step.actionLabel
          )}
        </button>
      )}

      {/* Completed badge */}
      {isCompleted && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 24px",
            background: "rgba(74,222,128,0.06)",
            border: "1px solid rgba(74,222,128,0.15)",
            borderRadius: 6,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#4ade80",
            animation: "clawdCheckIn 0.5s ease-out forwards",
          }}
        >
          ✓ {step.completedLabel}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// OnboardingStepsIndicator — horizontal step progress (custom, not GlassSteps)
// =============================================================================

function OnboardingStepsIndicator({
  activeStep,
}: {
  activeStep: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "24px 32px 0",
      }}
    >
      {ONBOARDING_STEPS.map((step, i) => {
        const isCompleted = i < activeStep;
        const isActive = i === activeStep;
        const isLast = i === ONBOARDING_STEPS.length - 1;

        return (
          <React.Fragment key={step.id}>
            {/* Step circle + label */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                minWidth: 64,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                  background: isCompleted
                    ? "rgba(74,222,128,0.12)"
                    : isActive
                      ? `rgba(196,162,101,0.08)`
                      : "transparent",
                  border: isCompleted
                    ? "2px solid rgba(74,222,128,0.5)"
                    : isActive
                      ? `2px solid ${BRAND.gold}`
                      : "2px solid rgba(255,255,255,0.08)",
                  color: isCompleted
                    ? "#4ade80"
                    : isActive
                      ? BRAND.gold
                      : "#555",
                  boxShadow: isCompleted
                    ? "0 0 12px rgba(74,222,128,0.2)"
                    : isActive
                      ? `0 0 12px ${BRAND.goldDim}`
                      : "none",
                  animation: isActive
                    ? "clawdStepPulse 2.5s ease-in-out infinite"
                    : undefined,
                  transition: "all 0.4s ease",
                }}
              >
                {isCompleted ? "✓" : i + 1}
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  fontWeight: isActive ? 700 : 400,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: isCompleted
                    ? "rgba(74,222,128,0.7)"
                    : isActive
                      ? BRAND.silver
                      : "#555",
                  transition: "color 0.3s ease",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  marginBottom: 26,
                  marginLeft: 4,
                  marginRight: 4,
                  borderRadius: 1,
                  background: isCompleted
                    ? "linear-gradient(to right, rgba(74,222,128,0.4), rgba(74,222,128,0.2))"
                    : "rgba(255,255,255,0.05)",
                  transition: "background 0.5s ease",
                  minWidth: 40,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// =============================================================================
// OnboardingPanel — glass panel overlay with the setup flow
// =============================================================================

function OnboardingPanel({
  visible,
  onComplete,
}: {
  visible: boolean;
  onComplete: () => void;
}) {
  const [activeStep, setActiveStep] = useState(0);

  const handleStepAction = useCallback(() => {
    if (activeStep < ONBOARDING_STEPS.length - 1) {
      setActiveStep((s) => s + 1);
    } else {
      onComplete();
    }
  }, [activeStep, onComplete]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
    >
      {/* Glass panel */}
      <div
        style={{
          position: "relative",
          width: 520,
          maxWidth: "90vw",
          minHeight: 440,
          background: BRAND.panelBg,
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: `1px solid ${BRAND.glassBorder}`,
          borderRadius: 12,
          boxShadow: `
            0 0 40px rgba(0,0,0,0.6),
            0 0 80px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(196,162,101,0.04)
          `,
          animation: "clawdPanelIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <GlassGrain opacity={0.035} />

        {/* Steps indicator */}
        <OnboardingStepsIndicator activeStep={activeStep} />

        {/* Separator */}
        <div
          style={{
            height: 1,
            margin: "16px 32px 0",
            background: `linear-gradient(to right, transparent, ${BRAND.glassBorder}, transparent)`,
          }}
        />

        {/* Step content */}
        <div style={{ flex: 1, position: "relative" }}>
          <OnboardingStepContent
            step={ONBOARDING_STEPS[activeStep]}
            status="active"
            onAction={handleStepAction}
          />
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 32px 20px",
            borderTop: `1px solid ${BRAND.glassBorder}`,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
            disabled={activeStep === 0}
            style={{
              background: "none",
              border: "none",
              cursor: activeStep === 0 ? "default" : "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: activeStep === 0 ? "#333" : "#666",
              padding: "6px 12px",
              transition: "color 0.2s ease",
            }}
          >
            ← Back
          </button>

          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              color: "#444",
            }}
          >
            {activeStep + 1} / {ONBOARDING_STEPS.length}
          </span>

          <button
            type="button"
            onClick={handleStepAction}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: BRAND.gold,
              padding: "6px 12px",
              transition: "color 0.2s ease",
            }}
          >
            {activeStep === ONBOARDING_STEPS.length - 1 ? "Finish →" : "Skip Step →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CompletionOverlay — shown after onboarding or skip
// =============================================================================

function CompletionOverlay({
  flowState,
}: {
  flowState: FlowState;
}) {
  if (flowState !== "complete" && flowState !== "demo") return null;

  const isDemo = flowState === "demo";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        pointerEvents: "none",
        animation: "clawdPanelIn 0.6s ease-out forwards",
      }}
    >
      <div
        style={{
          fontSize: 48,
          animation: "clawdCheckIn 0.6s ease-out forwards",
          color: isDemo ? BRAND.gold : "#4ade80",
          textShadow: isDemo
            ? `0 0 30px ${BRAND.goldDim}`
            : "0 0 30px rgba(74,222,128,0.3)",
        }}
      >
        {isDemo ? "⬡" : "✓"}
      </div>
      <div
        style={{
          fontFamily:
            "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
          fontSize: 28,
          fontWeight: 600,
          color: BRAND.silver,
          letterSpacing: "0.02em",
        }}
      >
        {isDemo ? "Demo Mode Active" : "Swarm Deployed"}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#666",
          marginTop: 4,
        }}
      >
        {isDemo
          ? "Explore the platform with simulated data"
          : "All systems operational — autonomous protection enabled"}
      </div>
    </div>
  );
}

// =============================================================================
// ClawdstrikeRevealScene — orchestrator
//
// Scanner phases: scanning → detecting → revealing → settled
// UI flow (after settled): buttonSpawning → buttonReady → onboarding → complete
//                                                       → demo (skip)
// =============================================================================

function ClawdstrikeRevealScene() {
  const { angle, phase, fieldRevealProgress, revealProgress } =
    useScannerEngine();

  const [flowState, setFlowState] = useState<FlowState>("cinematic");

  // After settled → spawn button with delay
  useEffect(() => {
    if (phase !== "settled") return;
    if (flowState !== "cinematic") return;

    const spawnTimer = setTimeout(() => {
      setFlowState("buttonSpawning");
    }, BUTTON_SPAWN_DELAY);

    return () => clearTimeout(spawnTimer);
  }, [phase, flowState]);

  // After spawning ripples → make button visible
  useEffect(() => {
    if (flowState !== "buttonSpawning") return;

    const readyTimer = setTimeout(() => {
      setFlowState("buttonReady");
    }, RIPPLE_DURATION);

    return () => clearTimeout(readyTimer);
  }, [flowState]);

  const handleStartSwarming = useCallback(() => {
    setFlowState("onboarding");
  }, []);

  const handleSkip = useCallback(() => {
    setFlowState("demo");
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setFlowState("complete");
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Global keyframes */}
      <style>{globalKeyframes}</style>

      {/* Base layer: amber PCB field + gold rain + gold gradient sky */}
      <HeroScene
        fieldConfig={{
          paletteMode: "amber",
          latticeMode: "rect",
          baseVisibility: 0.2,
          microGrid1: 60,
          microGrid2: 200,
          microGridStrength: 0.82,
          microWarp: 0.008,
          iridescenceStrength: 0,
          iridescenceScale: 1,
          exposure: 0.78,
          filmic: 0.92,
          grainStrength: 0.05,
          crtStrength: 0.55,
          copperStrength: 0.08,
        }}
        environment={{ preset: "matrix", intensity: 1 }}
        customEnvironment={{
          weather: { type: "rain", intensity: 0.9, color: BRAND.gold },
          light: { intensity: 0 },
          sky: {
            type: "gradient",
            intensity: 0.8,
            colors: ["#0a0800", "#1a1000", "#000800"],
          },
        }}
        environmentIntensity={0.88}
        background="#000"
      />

      {/* Black mask wiped away by sweep 1 — reveals the field */}
      <FieldRevealMask fieldRevealProgress={fieldRevealProgress} />

      {/* Custom scanner beam — JS-driven rotation */}
      <ScannerBeam angle={angle} phase={phase} />

      {/* Detection bloom + embers */}
      <ResonanceBloom phase={phase} />

      {/* Gold bloom pulse on reveal */}
      <BloomPulse phase={phase} />

      {/* Gold glow line at wiper frontier */}
      <WiperEdgeGlow revealProgress={revealProgress} />

      {/* Hero wordmark + button spawn area — masked by conic wiper during reveal */}
      <HeroContent
        phase={phase}
        revealProgress={revealProgress}
        flowState={flowState}
        onStartSwarming={handleStartSwarming}
        onSkip={handleSkip}
      />

      {/* Onboarding flow — glass panel with steps */}
      <OnboardingPanel
        visible={flowState === "onboarding"}
        onComplete={handleOnboardingComplete}
      />

      {/* Completion overlay */}
      <CompletionOverlay flowState={flowState} />
    </div>
  );
}

// =============================================================================
// Story
// =============================================================================

export const ClawdstrikeReveal: Story = {
  render: () => <ClawdstrikeRevealScene />,
};
