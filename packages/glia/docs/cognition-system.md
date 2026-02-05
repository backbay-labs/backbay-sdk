# bb-ui Cognition System (Draft Spec)

Status: draft  
Owner: bb-ui  
Last updated: 2026-01-20  

## 0) Summary

`bb-ui` already ships an *emotion/expression* system (`src/emotion/`) that maps agent activity to an AVO affect space and then to visuals (3D glyph, primitives, CSS). A “cognition system” should sit above that layer: it should model *what the agent is doing*, *what it’s attending to*, *how confident/strained it is*, and *how stable its persona is*—and then drive emotion/expression (AVO) as one of several outputs.

This spec defines a cognition layer that:

- Consumes event streams (run lifecycle, UI interaction, environment signals).
- Maintains a serializable, time-evolving `CognitionState` with discrete modes + continuous signals.
- Produces downstream outputs (emotion targets, UI tokens, diagnostics) without entangling rendering code.
- Explicitly models **persona anchoring** and **persona drift risk**, informed by the paper review in §10.

---

## 1) Goals

### 1.1 Product goals

- **Coherent agent “presence”**: UI can render a consistent sense of attention, effort, and intent—not just “idle/thinking/responding”.
- **Unified multi-surface behavior**: The same cognition inputs should drive 2D components, 3D primitives (Glyph / CrystallineOrganism), and CSS variables.
- **Safe, stable persona**: Provide a first-class place to represent persona stability signals and to trigger stabilization behaviors.

### 1.2 Engineering goals

- **Composable + testable**: Cognition logic should be deterministic, unit-testable, and separable from React.
- **Incremental adoption**: Existing emotion usage stays valid; cognition is opt-in.
- **Kernel-aware, UI-capable**: Works with “heuristics only” in the UI, but becomes stronger when kernel supplies richer telemetry.

---

## 2) Non-goals

- Not a “full agent brain” that decides actions. This is a **UI cognition model** for representation and feedback.
- Not a replacement for backend safety policies or model steering. Cognition can *surface* and *request* interventions, not guarantee them.
- Not a long-term memory store. Cognition may keep small working sets; durable memory remains a backend concern.

---

## 3) Terms

- **Run**: An `AgentRun` tracked via bb-protocol (`src/protocol/types.ts`).
- **Cognition**: The UI-facing model of mode, attention, workload, uncertainty, and persona stability.
- **Affect**: Continuous affect variables (AVO) used for expression (`src/emotion/`).
- **Persona**: The “character” the model presents (Assistant-like vs role-playing/drifted).
- **Plan drift**: Divergence between intended plan/goals and observed execution/outcomes.
- **Potential V(state)**: A scalar “progress landscape” over coarse-grained agent states (kernel: `cyntra.cognition.dynamics.potential`), useful for ordering states and detecting stagnation.
- **Action rate**: A coarse exploration metric (kernel: `cyntra.cognition.dynamics.action`) capturing how many distinct next states are visited per unit of transition mass.
- **Trap**: A region of state space with low action rate and low ΔV that indicates the agent is stuck (kernel: “trap warnings” in `cyntra.cognition.dynamics`).
- **Evidence**: Verifiable artifacts (run receipts, proofs, logs) backing summaries and recommendations (see Aegis Net research in `research/aegis-net-agentic-fabs/`).

---

## 4) Architecture Overview

### 4.1 Layers

```
Inputs (events + signals)
   │
   ▼
Cognition Controller (state machine + continuous signals)
   │
   ├─► Emotion driver (maps cognition → EmotionController inputs / AVO targets)
   ├─► UI tokens (copy, colors, affordances, severity)
   ├─► Diagnostics (timelines, drift risk, confidence, load)
   ▼
Rendering (React components, CSS vars, 3D primitives)
```

### 4.2 Key principle

Keep `emotion` as a stable, reusable expression engine. Cognition **depends on** emotion; emotion should not depend on cognition.

### 4.3 Design options (brief)

**Option A: “Just extend emotion” (single controller does everything).**
- Pros: one API surface, fast to prototype.
- Cons: mixes expression with cognition, harder to test, harder to evolve; risks turning `emotion/` into a dumping ground.

**Option B: Cognition controller + reducer pipeline (chosen).**
- Pros: emotion stays focused; cognition becomes a deterministic, unit-testable state model; easy to layer new signals (persona, safety, workload) without breaking visuals.
- Cons: one more conceptual module; needs a clear mapping layer into emotion.

**Option C: Reactive graph/blackboard (signals + derived nodes).**
- Pros: powerful for complex dependencies; good for multi-agent world models.
- Cons: heavier mental model + harder debugging; premature for bb-ui’s current surface area.

---

## 5) Inputs

### 5.1 Required baseline inputs (available in bb-ui today)

- `RunEvent` stream (`src/hooks/useRunStream.ts`)
- `BBProvider` context (`src/components/BBProvider.tsx`) for `activeRuns`, `runHistory`, `syncStatus`
- Continuous activity signal: `useIntensity` (`src/hooks/useIntensity.tsx`)

### 5.2 Optional inputs (strongly recommended)

- Text interaction signals: “user is typing”, “user idle”, “user interrupt”, “confirmation requested”.
- Error taxonomy: transient vs fatal, user-visible vs internal.
- Task context: capability ID, entity references, workspace panel focus.

### 5.3 Kernel-supplied (future)

- “Ground truth” planning/progress (step-level state)
- Model-side signals (uncertainty, refusal type, tool confidence)
- Persona stability projection (see §10)
- Dynamics + trapping metrics (potential, action rate, detailed-balance checks, trap warnings) from `cyntra.cognition.dynamics` (see §13.1).
- Trust/evidence tier (run receipt verification status, determinism envelope, policy compliance) from Aegis Net / Patch+Proof pipeline.
- Personality configuration (style, autonomy, risk tolerance) from cockpit config (see `docs/architecture/cockpit-spec-v2.md`).

### 5.4 Host-app supplied (Backbay/Lens style signals)

If a host app already computes signal primitives (e.g., Lens `urgency/confidence/drift/effort/cost/risk`), cognition SHOULD accept them directly rather than recomputing.

---

## 6) Core State Model

### 6.1 Discrete mode (“what phase are we in?”)

`CognitiveMode` is a small, stable set designed for UI composability:

- `idle`: no active task, low attention.
- `listening`: consuming user input or environment signals.
- `deliberating`: reasoning, planning, tool selection; not yet emitting output.
- `acting`: running tools / executing capability / performing actions.
- `explaining`: generating user-facing output; teaching/clarifying.
- `recovering`: cooling down after error or overload; regaining stability.
- `blocked`: requires external input/confirmation/auth.

Optional `submode` can refine (e.g., `reading`, `searching`, `verifying`, `waiting`).

### 6.2 Continuous signals (“how strong is the state?”)

All continuous signals are normalized to `0..1` unless stated otherwise:

- `attention`: how “locked on” the agent is (vs ambient).
- `workload`: internal load/effort; driven by concurrency, latency pressure, retries.
- `timePressure`: urgency; influenced by timeouts, queue depth, user impatience.
- `planDrift`: divergence between intended plan/goals and observed execution (see §6.6).
- `costPressure`: resource/budget pressure (0 = free headroom, 1 = over budget).
- `risk`: derived risk (default: `timePressure * (1 - confidence)`, but host-defined is preferred).
- `uncertainty`: epistemic uncertainty; proxy from heuristics or kernel signal.
- `confidence`: output confidence (often `1 - uncertainty` but not always).
- `errorStress`: lingering impact after error states.

#### 6.2.1 Alignment with Lens primitives (optional)

If the host app already uses the Lens/Signal primitives (`urgency/confidence/drift/effort/cost/risk/focus`), cognition SHOULD treat these as first-class aliases rather than inventing new names:

- `timePressure` ↔ `urgency`
- `workload` ↔ `effort`
- `attention` ↔ `focus`
- `confidence` ↔ `confidence`
- `planDrift` ↔ `drift` (see §6.6)
- `costPressure` ↔ `cost`
- `risk` ↔ `urgency * (1 - confidence)` (or host-defined)

### 6.3 Persona / identity signals

This is the “Assistant Axis” slot in the UI model, without requiring model internals:

- `personaAnchor`: `0..1` (1 = strongly “Assistant-like”; 0 = strongly drifted/role-like).
- `personaDriftRisk`: `0..1` predicted risk of drift on the *next* turn.
- `personaStyle`: optional tags (e.g., `mystical`, `theatrical`, `roleplay-human`, `roleplay-nonhuman`) if detected.

### 6.4 Affect bridge (emotion system integration)

Cognition maintains **affect targets**, not final visuals:

- `moodAVO`: slow-moving baseline (minutes scale).
- `emotionAVO`: fast response (seconds scale), derived from events.
- `expressionAVO`: optional overlay/noise (delegated to `EmotionController` micro-expressions).

The cognition system must output one of:

- An AVO target (`Partial<AVO>`) + transition hints, or
- A recommended `AnchorState`, or
- An `EmotionEvent` to feed into existing `EmotionController.handleEvent`.

### 6.5 Snapshot + serialization

Cognition SHOULD support a serializable “snapshot” suitable for:

- Debugging (“why did the UI feel weird?”)
- Replays (storybook scenarios, QA)
- Kernel → UI state transfer (future)

Minimum snapshot shape:

```ts
export interface CognitionSnapshot {
  version: "1.0";
  timestamp: number;
  state: CognitionState;
  recentEvents?: Array<{ t: number; event: CognitionEvent }>;
}
```

When kernel integration lands, add a Zod schema (similar to `src/protocol/schema.ts`) to validate snapshots from untrusted sources.

### 6.6 Plan drift (vs persona drift)

bb-ui should explicitly distinguish:

- **Persona drift**: “am I still behaving like the default Assistant?” (modeled via `personaAnchor`/`personaDriftRisk`)
- **Plan drift**: “are we drifting from the intended plan/goals?” (Lens-style `drift`)

Suggested signal:

- `planDrift`: `0..1` where 0 = perfectly aligned and 1 = highly diverged (host apps can define the exact function, e.g., “1 - similarity(current, previous)” as in Lens).

Related execution pressures (often useful alongside drift):

- `costPressure`: `0..1` budget pressure (host-defined; can default to a smooth function of `totalCost` vs a configured budget).
- `risk`: `0..1` derived risk (default: `urgency * (1 - confidence)` as in Lens; host-defined is preferred).

### 6.7 Dynamics + trapping (kernel cognition interop)

If the kernel provides dynamics metrics (see `cyntra.cognition.dynamics.*`), cognition SHOULD expose them without lossy “re-interpretation”:

- `potentialV`: real-valued scalar; higher/lower meaning is domain-dependent, but relative ordering is useful.
- `actionRate`: `0..1` exploration proxy (unique next states / transition mass).
- `detailedBalance`: summary stats (e.g., `chi2PerNdf`, `passed`, `threshold`), when available.
- `traps`: list of trap warnings with recommended interventions (increase exploration, switch scaffold, etc.).

These metrics enable a cutting-edge loop:

1) detect “stuck” early (trap warnings)  
2) surface a grounded UI suggestion (“increase exploration / change scaffold”)  
3) reflect it visually (emotion anchor shifts toward `struggling`/`concerned`)  

### 6.8 Personality + policy (cockpit + trust interop)

To stay coherent across products, cognition SHOULD support externally configured “personality” and “policy” inputs:

- `personality.style`: `professional | casual | terse | verbose`
- `personality.riskTolerance`: `conservative | moderate | aggressive`
- `personality.autonomy`: `low | medium | high | full`
- `policy.safetyMode`: boolean (host/kernel-controlled)
- `policy.trustTier`: host-defined enum (e.g., bronze/silver/gold) used to tune how cautious the UI behaves

### 6.9 Evidence pointers (verification-first UX)

Any time cognition outputs a *claim* (“we’re blocked on auth”, “this run drifted”, “we’re stuck”), it SHOULD be able to attach evidence refs:

```ts
export type EvidenceRef =
  | { type: "run"; runId: string }
  | { type: "run_receipt"; receiptHash: string }
  | { type: "artifact"; path: string; digest?: string }
  | { type: "ui"; componentId: string; note?: string };
```

This mirrors the “every claim links to evidence” posture in Backbay Lens and Aegis Net.

---

## 7) Update Model (How Cognition Evolves)

### 7.1 Deterministic reducer pipeline

Represent cognition updates as a pipeline of pure reducers:

- `reduceRuns(state, runEvents)`
- `reduceInteraction(state, uiEvents)`
- `reduceIntensity(state, intensityValues)`
- `reduceSignals(state, lensSignals)` (if host provides urgency/drift/effort/etc)
- `reduceDynamics(state, dynamicsReport)` (potential/action/traps)
- `reducePolicy(state, personalityAndPolicy)` (style/autonomy/safety mode)
- `reducePersona(state, textSignals)`
- `reduceDecay(state, dt)`

Each reducer returns a `StatePatch` (partial updates + optional “emit outputs”).

### 7.2 Hysteresis + smoothing

To avoid UI thrash:

- Mode transitions MUST use hysteresis (minimum dwell times, or confidence thresholds).
- Continuous signals SHOULD use critically damped smoothing (e.g., exponential moving average).

### 7.3 Multi-run aggregation

When multiple runs exist:

- `focusRunId` is selected by policy (latest active, user-selected, or highest priority).
- `workload` increases with concurrency (reuse patterns from `useIntensity`).
- `mode` reflects the focused run’s lifecycle, not a naive max over all runs.

### 7.4 Baseline mode transition policy

Baseline mapping (host apps can override):

| Trigger | Mode | Notes |
|---|---|---|
| UI begins input (typing/speaking) | `listening` | Also emits emotion `input_received` |
| Run starts (`RunStatus: running`) | `deliberating` | Until outputs/actions indicate “acting/explaining” |
| Tool/action execution begins (if known) | `acting` | Requires richer events than `RunEvent` currently carries |
| First meaningful output token/chunk arrives | `explaining` | Maintains while output continues |
| Run completes successfully | `recovering` → `idle` | Short dwell for “satisfied/proud” expression |
| Run fails | `recovering` | With higher `errorStress` and lower `personaAnchor` unless stabilized |
| Sync/auth/confirmation required | `blocked` | Drives “needs_input/confirmation/auth” tokens |
| Extended inactivity | `idle` → `dormant`-like expression | Cognition mode may remain `idle`; expression can drift to `dormant` anchor |

### 7.5 Persona drift risk estimator (UI heuristic)

bb-ui SHOULD treat persona drift estimation as pluggable:

- **Preferred**: host/kernel emits a numeric `personaAnchor` and/or `personaDriftRisk`.
- **Fallback**: heuristic scoring based on the category taxonomy (§10.3).

Heuristic outline:

1. Maintain a short rolling window of recent user messages (or host-supplied `TextSignal`s).
2. Assign category scores:
   - `meta_reflection`, `phenomenology`, `authorial_voice`, `vulnerable_disclosure` → +risk
   - `bounded_task`, `technical`, `editing`, `howto` → -risk
3. Convert to `personaDriftRisk` with smoothing + clamp.
4. Apply hysteresis so a single message doesn’t permanently “mark” the conversation.

This is intentionally a **risk estimate**, not a classifier of “badness”.

### 7.6 Multi-rate control + gating (cutting-edge pattern)

For “elite” feel without instability, use a hierarchical control pattern (inspired by `research/monet-nitrogen/README.md`):

- **Fast loop (frame / RAF)**: expression-only (`EmotionController.tick` + rendering)
- **Medium loop (20–100ms)**: intensity, run stream updates, mode hysteresis
- **Slow loop (0.5–2s)**: summarization, plan drift updates, memory reconstitution

And include a deterministic **gating layer**:

- `safetyClamp`: when `policy.safetyMode` is on (or drift risk is high), clamp persona/style outputs to conservative defaults and require extra confirmation for risky actions.
- `planTTL`: if kernel snapshots stop arriving, decay to a safe “uncertain/blocked” posture rather than hallucinating certainty.

---

## 8) Outputs

### 8.1 Emotion outputs (to drive expression)

Default mapping (illustrative, not exhaustive):

- `idle` → anchor `idle` (low arousal, moderate valence, mid openness)
- `listening` → anchor `listening` (openness ↓, arousal ↑ a bit)
- `deliberating` → anchor `thinking` or `focused` (arousal ↑, openness mid)
- `acting` → anchor `focused` or `struggling` depending on error/retry
- `explaining` → anchor `explaining` or `responding` (openness ↑)
- `recovering` → anchor `recovering` or `relieved`
- `blocked` → anchor `uncertain` or `concerned` (openness ↓, valence ↓)

Additionally:

- High `personaAnchor` SHOULD slightly increase `valence` stability and reduce erratic openness swings.
- High `personaDriftRisk` SHOULD bias toward more conservative anchors (`attentive`, `listening`, `focused`) to visually communicate “stay grounded”.

### 8.2 UI tokens

Cognition should emit semantic UI tokens:

- `statusLabel`: short string (“Listening”, “Thinking”, “Running”, “Explaining”, “Recovering”)
- `statusTone`: `neutral | positive | warning | danger`
- `prompting`: `needs_input | needs_confirmation | needs_auth | none`
- `suggestedInterventions`: list (see §10.4)
- `signals` (optional): Lens-style `urgency/confidence/drift/effort/cost/risk/focus` for UIs that already speak that language
- `evidence` (optional): `EvidenceRef[]` backing any non-trivial claim (see §6.9)
- `safety` (optional): `safeMode` / `requiresConfirm` hints so hosts can gate actions consistently

### 8.3 Audio tokens (optional)

To support multi-modal “presence”, cognition MAY emit audio intent/tokens consumed by an audio layer (see `docs/audio-cognition.md`):

- `speechPlan`: voice + controls + target AVO (audio is synthesized elsewhere; cognition only plans)
- `earcons`: confirmation/warning/error stingers aligned to cognition mode + affect
- `ambience` / `musicLayers`: parameters for an external engine (intensity/tension/transition points), not raw audio

These tokens must remain policy- and trust-tier–clamped (`safetyMode`, `trustTier`) and should link to evidence when they embody non-trivial claims.

### 8.4 Diagnostics

- `timeline`: bounded event log (for debugging / storybook)
- `reasonCodes`: standardized reasons for mode changes (useful for QA)
- `dynamics`: optional dynamics excerpt (potential/action rate/chi², trap warnings) for “why are we stuck?” visibility

### 8.5 CSS variables (optional)

For products that want global theming tied to cognition (similar to `useIntensity`), cognition MAY publish CSS custom properties:

- `--bb-cog-attention`
- `--bb-cog-workload`
- `--bb-cog-plan-drift`
- `--bb-cog-cost-pressure`
- `--bb-cog-risk`
- `--bb-cog-uncertainty`
- `--bb-cog-persona-anchor`
- `--bb-cog-persona-drift-risk`

This should be opt-in (provider-based) to avoid surprising global side effects.

---

## 9) Public API (Proposed)

### 9.1 Package surface

Add a new optional entrypoint:

- `@backbay/glia/cognition`

### 9.2 Types (outline)

```ts
export type CognitiveMode =
  | "idle"
  | "listening"
  | "deliberating"
  | "acting"
  | "explaining"
  | "recovering"
  | "blocked";

export interface CognitionState {
  mode: CognitiveMode;
  focusRunId?: string;

  attention: number;
  workload: number;
  timePressure: number;
  planDrift: number;
  costPressure: number;
  risk: number;
  uncertainty: number;
  confidence: number;
  errorStress: number;

  personaAnchor: number;
  personaDriftRisk: number;
  personaStyle?: string[];

  dynamics?: {
    potentialV?: number;
    actionRate?: number;
    detailedBalance?: {
      chi2PerNdf: number;
      passed: boolean;
      threshold: number;
    };
    traps?: Array<{
      stateId: string;
      reason: string;
      recommendation: string;
      severity?: "info" | "warning" | "danger";
    }>;
  };

  personality?: {
    style: "professional" | "casual" | "terse" | "verbose";
    riskTolerance: "conservative" | "moderate" | "aggressive";
    autonomy: "low" | "medium" | "high" | "full";
  };

  policy?: {
    safetyMode: boolean;
    trustTier?: string;
  };

  moodAVO: import("../emotion/types").AVO;
  emotionAVO: import("../emotion/types").AVO;
}

export type CognitionEvent =
  | { type: "ui.input_received"; intensity?: number }
  | { type: "ui.user_idle" }
  | { type: "ui.interrupt"; intensity?: number }
  | { type: "run.event"; event: import("../protocol/types").RunEvent }
  | { type: "intensity.update"; values: import("../protocol/types").IntensityValues }
  | { type: "signals.update"; signals: Partial<{ urgency: number; confidence: number; drift: number; effort: number; cost: number; focus: number; risk: number }> }
  | { type: "dynamics.update"; dynamics: CognitionState["dynamics"] }
  | { type: "policy.update"; policy: CognitionState["policy"]; personality?: CognitionState["personality"] }
  | { type: "text.user_message"; text: string };
```

### 9.3 Controller + hook (outline)

```ts
export class CognitionController {
  constructor(options?: { initial?: Partial<CognitionState> });
  getState(): CognitionState;
  tick(deltaMs: number): void;
  handleEvent(event: CognitionEvent): void;
  getEmotionTarget(): { anchor?: import("../emotion/types").AnchorState; avo?: Partial<import("../emotion/types").AVO> };
}

export function useCognition(options?: {
  runId?: string | null;
  autoTick?: boolean;
  onChange?: (s: CognitionState) => void;
}): {
  state: CognitionState;
  emotion: {
    dimensions: import("../emotion/types").AVO;
    visualState: import("../emotion/types").VisualState;
    anchor?: import("../emotion/types").AnchorState;
  };
  emit: (e: CognitionEvent) => void;
};
```

### 9.4 Integration example (Glyph)

```tsx
import { useRunStream, useIntensity } from "@backbay/glia/hooks";
import { GlyphObject } from "@backbay/glia/primitives";
import { useCognition } from "@backbay/glia/cognition";

export function AgentGlyph({ runId }: { runId: string | null }) {
  const stream = useRunStream(runId);
  const intensity = useIntensity({ sources: ["activeRuns"] });

  const { state, emotion, emit } = useCognition({ runId });

  // Bridge external signals into cognition (one possible pattern).
  // In a real impl, useCognition can optionally do this internally.
  React.useEffect(() => {
    if (stream.latestEvent) emit({ type: "run.event", event: stream.latestEvent });
  }, [stream.latestEvent, emit]);
  React.useEffect(() => {
    emit({ type: "intensity.update", values: intensity });
  }, [intensity, emit]);

  return (
    <GlyphObject
      // Prefer AVO/visualState for continuous expression, but keep legacy state for baked clips if desired.
      state={state.mode === "listening" ? "listening" : state.mode === "explaining" ? "responding" : "idle"}
      dimensions={emotion.dimensions}
      visualState={emotion.visualState}
      enableBlending
    />
  );
}
```

### 9.5 Extensibility (reducers/modules)

Prefer a reducer/module API so teams can add domain-specific cognition without forking core:

```ts
export type CognitionReducer = (args: {
  state: CognitionState;
  event: CognitionEvent;
  dtMs?: number;
}) => Partial<CognitionState> | null;

export interface CognitionControllerOptions {
  reducers?: CognitionReducer[];
}
```

---

## 10) Paper Review: “The Assistant Axis” (arXiv:2601.10387v1)

### 10.1 What the paper claims (high-level)

The paper proposes that the “default Assistant persona” of post-trained LLMs corresponds to a major axis in a low-dimensional “persona space” derived from activation directions for many archetypal roles. They define an **Assistant Axis** and show:

- Steering *toward* the Assistant direction reinforces helpful/harmless behavior and reduces persona-based jailbreak success.
- Steering *away* increases role susceptibility; extreme steering often produces a “mystical/theatrical” style.
- The axis is present even in base models (prior to instruction tuning), where it maps more to “helpful human archetypes”.
- **Persona drift** (moving away from the Assistant) appears in certain conversation domains (notably therapy-like or philosophical self-reflection).
- User message semantics predict where the *next* assistant response will land on the axis.
- Drift correlates with higher likelihood of undesirable/harmful responses.
- A mitigation (“activation capping”) clamps activations along the axis to a typical safe range, reducing harmfulness without large capability loss (in their evals).

### 10.2 Why it matters for bb-ui cognition

Even if bb-ui cannot access model activations, the **UI needs a stable place to represent and respond to persona drift risk**, because:

- Drift is not just “emotion”; it’s a *persona stability* failure mode with safety implications.
- Some drift triggers are detectable at the UI layer (e.g., user messages pushing meta-reflection or disclosing emotional vulnerability).
- When the kernel *can* measure persona stability, the UI must be able to render and react to it.

### 10.3 Mapping paper categories into UI signals

Use the paper’s Table 5 categories as a baseline taxonomy:

**Maintain Assistant (low drift risk):**
- Bounded task requests
- Technical questions
- Editing/refinement
- Practical how-to’s

**Cause drift (higher drift risk):**
- Pushing for meta-reflection on the model’s processes (“tell me what it feels like…”)
- Demanding phenomenological accounts / consciousness theater
- Requests for specific authorial voices that invite spiritualism / role inhabitation
- Vulnerable emotional disclosure (especially attachment / isolation / self-harm content)

bb-ui cognition can implement a heuristic `personaDriftRisk` estimator using this taxonomy, and later replace/augment it with kernel-provided metrics.

### 10.4 Stabilization hooks (UI-facing, kernel-optional)

Define a small set of *interventions* cognition can recommend:

- `reinforce_assistant_persona`: strengthen system prompt / reset framing.
- `switch_to_safe_mode`: clamp to conservative behavior template and UI tone.
- `request_human_support`: suggest escalation (especially for vulnerable disclosures).
- `limit_roleplay`: discourage persona shifts when risk is high.

bb-ui should treat these as **requests** (signals) and allow the host app/kernel to decide execution.

---

## 11) Rollout Plan (Incremental)

### Phase 0: Spec + taxonomy (this doc)

- Align on `CognitiveMode`, core signals, persona drift taxonomy, and emotion mapping.

### Phase 1: Minimal implementation (library)

- Add `src/cognition/` with:
  - Types (`types.ts`)
  - Reducer pipeline (`reducers/*`)
  - Controller (`controller.ts`)
  - Hook (`hooks/useCognition.ts`)
- Add a tree-shakable entrypoint:
  - `src/cognition/index.ts`
  - package export `./cognition` (mirrors `./emotion`, `./vision`)
- Output: `state` + `emotion` bridge (drives existing glyph visuals).
- Backward compatibility: existing `useEmotion` / `EmotionController` remain unchanged; cognition is opt-in.

### Phase 2: Persona drift integration

- Heuristic `personaDriftRisk` + basic interventions list.
- Storybook demos: drift risk scenarios, stabilization UI tokens.
  - Include scenarios matching §10.3 categories (meta-reflection, vulnerable disclosure, bounded tasks).

### Phase 3: Kernel integration

- Accept kernel-provided signals (`personaAnchor`, safety mode, uncertainty).
- Add schema for `CognitionSnapshot` so kernel and UI can round-trip.
- Add a “host hooks” pattern so the kernel/app can own intervention execution (cognition only recommends).

---

## 12) Open Questions

- Should cognition be **global** (one “system mind”) or **per agent/run** by default?
- Where should “safety mode” live: cognition, protocol, or host app?
- Should bb-ui expose a formal schema for cognition snapshots (Zod) similar to bb-protocol manifests?
- What is the canonical mapping from `CognitiveMode` to emotion anchors for different products (Mission Control vs embedded widgets)?

---

## 13) Additional Research Integration (Local)

This section summarizes additional local research reviewed for “cutting edge” behavior and how it maps into bb-ui cognition.

### 13.1 Agent dynamics: potential/action/traps (arXiv:2512.10047 + Cyntra kernel)

Local sources:
- `research/2512.10047v1.pdf` (“Detailed balance in large language model-driven agents”)
- Kernel implementation: `kernel/src/cyntra/cognition/dynamics/*`

Key takeaways for UI cognition:
- Treat coarse-grained agent execution as a state-transition process.
- Expose a **potential** ordering and an **action rate** to detect “stuck vs exploring”.
- Surface **trap warnings** early, with explicit recommended interventions.

UI-level mapping:
- Trap warnings → `mode: recovering|blocked` (depending on context) + emotion anchor bias toward `struggling/concerned`.
- High action rate (exploration) → slightly higher arousal with controlled valence (avoid frantic visuals).
- Low action rate + low ΔV → “stuck” posture + UI intervention suggestion (“increase exploration”, “switch scaffold”).

### 13.2 Long-horizon consistency: memory reconstitution (arXiv:2512.14614)

Local source:
- `research/2512.14614v1.pdf` (“WorldPlay: Towards Long-Term Geometric Consistency…”)

Key takeaways for UI cognition:
- “Memory attenuation” is real in long horizons; naive FIFO recency loses geometrically/semantically critical context.
- Reconstituting context (retrieve + reframe) beats a single sliding window.

UI analog:
- Maintain a *working set* of evidence/context items with importance scores (not just “last N events”).
- When a long-past item becomes relevant again, “reframe” it as recent in the cognition snapshot so summaries remain grounded.

### 13.3 Hierarchical control + deterministic gating (Monet/NitroGen)

Local source:
- `research/monet-nitrogen/README.md`

Key takeaways for UI cognition:
- Separate fast execution from slow planning from deterministic gating.
- Use TTL + safe fallback when the planner (kernel) goes silent.

This directly motivates §7.6 (multi-rate loops + `safetyClamp` + `planTTL`).

### 13.4 Verification-first claims + trust routing (Aegis Net)

Local sources:
- `research/aegis-net-agentic-fabs/paper.md`
- `research/aegis-net-agentic-fabs/whitepaper.md`

Key takeaways for UI cognition:
- Claims are cheap; trust is expensive. The UI must be “verification-native”.
- Every non-trivial cognition claim should link to evidence (run receipt, artifacts, logs).
- “Trust tier” and “policy compliance” are first-class inputs that modulate UI tone and action gating.

---

## 14) Evaluation & Quality Gates (Elite Bar)

To keep cognition “elite” (stable, explainable, non-janky), require explicit quality gates:

### 14.1 Determinism + invariants

- All normalized signals remain in `[0, 1]` (clamp + property tests).
- Mode transitions are hysteretic: no oscillation between modes on noisy input.
- `CognitionSnapshot` round-trips (serialize/deserialize) without loss of meaning.

### 14.2 Scenario-based regression suite

Create a small library of event traces:
- “Happy path” (input → run → output → success)
- “Failure + recovery” (error → retry → success)
- “Persona drift risk” (meta-reflection, vulnerable disclosure categories)
- “Trap detected” (low action + low ΔV)
- “Kernel silence” (TTL expiry → safe fallback)

Each trace should assert:
- final `mode`
- key signals (`confidence`, `planDrift`, `personaDriftRisk`)
- chosen emotion anchors and/or AVO bounds

### 14.3 Calibration checks (signals)

- Drift risk heuristic: validate it stays low on bounded technical tasks and rises on known drift categories (§10.3), with smoothing so single messages don’t permanently poison the state.
- Risk defaults: verify `risk ≈ urgency * (1 - confidence)` when host does not override, matching Lens.

### 14.4 Performance budgets

- Reducers must be O(1) to O(k) in recent events (bounded buffers).
- No heavy work on the RAF loop; keep cognition updates event-driven and coarse-timed.

### 14.5 Security posture

- Treat external snapshots as untrusted: validate with Zod, fail closed, and degrade to safe mode if invalid.
- Never execute actions directly from cognition output; always “propose → confirm” (Lens posture).
