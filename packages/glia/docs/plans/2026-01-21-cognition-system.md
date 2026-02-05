# Cognition System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the bb-ui cognition layer that models agent cognitive state (mode, attention, workload, persona stability) and drives emotion/audio outputs.

**Architecture:** Deterministic reducer-based state machine with pure functions. CognitionController manages state transitions via event dispatch. React hook (useCognition) bridges controller to UI with RAF-based ticking. Emotion driver maps cognitive state to AVO targets for the existing EmotionController.

**Tech Stack:** TypeScript, Zod (validation), React 18/19 (hooks), vitest (testing)

---

## Phase 1: Core Types + Controller

### Task 1: Create types.ts with CognitiveMode and CognitionState

**Files:**
- Create: `packages/bb-ui/src/cognition/types.ts`

**Step 1: Write the failing test**

Create `packages/bb-ui/src/cognition/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { CognitiveMode, CognitionState, CognitionEvent } from '../types.js';
import { createInitialCognitionState, clamp01 } from '../types.js';

describe('cognition/types', () => {
  it('createInitialCognitionState returns valid defaults', () => {
    const state = createInitialCognitionState();
    expect(state.mode).toBe('idle');
    expect(state.attention).toBeGreaterThanOrEqual(0);
    expect(state.attention).toBeLessThanOrEqual(1);
    expect(state.personaAnchor).toBe(1);
  });

  it('clamp01 clamps values to 0-1 range', () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1.5)).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/bb-ui && bun run test src/cognition/__tests__/types.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

Create `packages/bb-ui/src/cognition/types.ts`:

```typescript
import type { AVO } from '../emotion/types.js';

// =============================================================================
// Cognitive Mode
// =============================================================================

export type CognitiveMode =
  | 'idle'
  | 'listening'
  | 'deliberating'
  | 'acting'
  | 'explaining'
  | 'recovering'
  | 'blocked';

export type CognitiveSubmode =
  | 'reading'
  | 'searching'
  | 'verifying'
  | 'waiting'
  | 'writing'
  | 'tool_call';

// =============================================================================
// Continuous Signals (all normalized 0..1)
// =============================================================================

export interface CognitionSignals {
  attention: number;
  workload: number;
  timePressure: number;
  planDrift: number;
  costPressure: number;
  risk: number;
  uncertainty: number;
  confidence: number;
  errorStress: number;
}

// =============================================================================
// Persona Signals
// =============================================================================

export interface PersonaSignals {
  personaAnchor: number;
  personaDriftRisk: number;
  personaStyle?: string[];
}

// =============================================================================
// Dynamics (kernel integration)
// =============================================================================

export interface TrapWarning {
  stateId: string;
  reason: string;
  recommendation: string;
  severity?: 'info' | 'warning' | 'danger';
}

export interface DetailedBalance {
  chi2PerNdf: number;
  passed: boolean;
  threshold: number;
}

export interface DynamicsState {
  potentialV?: number;
  actionRate?: number;
  detailedBalance?: DetailedBalance;
  traps?: TrapWarning[];
}

// =============================================================================
// Personality + Policy (cockpit integration)
// =============================================================================

export interface PersonalityConfig {
  style: 'professional' | 'casual' | 'terse' | 'verbose';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  autonomy: 'low' | 'medium' | 'high' | 'full';
}

export interface PolicyConfig {
  safetyMode: boolean;
  trustTier?: string;
}

// =============================================================================
// Evidence (verification-first)
// =============================================================================

export type EvidenceRef =
  | { type: 'run'; runId: string }
  | { type: 'run_receipt'; receiptHash: string }
  | { type: 'artifact'; path: string; digest?: string }
  | { type: 'ui'; componentId: string; note?: string };

// =============================================================================
// Full Cognition State
// =============================================================================

export interface CognitionState extends CognitionSignals, PersonaSignals {
  mode: CognitiveMode;
  submode?: CognitiveSubmode;
  focusRunId?: string;

  dynamics?: DynamicsState;
  personality?: PersonalityConfig;
  policy?: PolicyConfig;

  moodAVO: AVO;
  emotionAVO: AVO;
}

// =============================================================================
// Cognition Events
// =============================================================================

export type CognitionEvent =
  | { type: 'ui.input_received'; intensity?: number }
  | { type: 'ui.user_idle' }
  | { type: 'ui.interrupt'; intensity?: number }
  | { type: 'run.event'; runId: string; status: string; progress?: number }
  | { type: 'run.started'; runId: string }
  | { type: 'run.completed'; runId: string; success: boolean }
  | { type: 'intensity.update'; values: Partial<CognitionSignals> }
  | { type: 'signals.update'; signals: Partial<CognitionSignals> }
  | { type: 'dynamics.update'; dynamics: DynamicsState }
  | { type: 'policy.update'; policy?: PolicyConfig; personality?: PersonalityConfig }
  | { type: 'text.user_message'; text: string; categories?: string[] }
  | { type: 'tick'; deltaMs: number };

// =============================================================================
// Cognition Snapshot (serialization)
// =============================================================================

export interface CognitionSnapshot {
  version: '1.0';
  timestamp: number;
  state: CognitionState;
  recentEvents?: Array<{ t: number; event: CognitionEvent }>;
}

// =============================================================================
// Helpers
// =============================================================================

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

const DEFAULT_AVO: AVO = { arousal: 0.25, valence: 0.6, openness: 0.35 };

export function createInitialCognitionState(
  overrides?: Partial<CognitionState>
): CognitionState {
  return {
    mode: 'idle',
    attention: 0.3,
    workload: 0,
    timePressure: 0,
    planDrift: 0,
    costPressure: 0,
    risk: 0,
    uncertainty: 0.2,
    confidence: 0.8,
    errorStress: 0,
    personaAnchor: 1,
    personaDriftRisk: 0,
    moodAVO: { ...DEFAULT_AVO },
    emotionAVO: { ...DEFAULT_AVO },
    ...overrides,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/bb-ui && bun run test src/cognition/__tests__/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/bb-ui/src/cognition/types.ts packages/bb-ui/src/cognition/__tests__/types.test.ts
git commit -m "feat(bb-ui): add cognition types and initial state factory

Implements CognitiveMode, CognitionState, CognitionEvent types
per cognition-system.md spec. Includes signals, persona, dynamics,
and evidence ref types.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Create Zod schema for CognitionSnapshot

**Files:**
- Create: `packages/bb-ui/src/cognition/schema.ts`
- Test: `packages/bb-ui/src/cognition/__tests__/schema.test.ts`

**Step 1: Write the failing test**

Create `packages/bb-ui/src/cognition/__tests__/schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { CognitionSnapshotSchema, validateCognitionSnapshot } from '../schema.js';
import { createInitialCognitionState } from '../types.js';

describe('cognition/schema', () => {
  it('validates a correct snapshot', () => {
    const snapshot = {
      version: '1.0' as const,
      timestamp: Date.now(),
      state: createInitialCognitionState(),
    };
    const result = validateCognitionSnapshot(snapshot);
    expect(result.success).toBe(true);
  });

  it('rejects invalid version', () => {
    const snapshot = {
      version: '2.0',
      timestamp: Date.now(),
      state: createInitialCognitionState(),
    };
    const result = validateCognitionSnapshot(snapshot);
    expect(result.success).toBe(false);
  });

  it('rejects out-of-range signals', () => {
    const state = createInitialCognitionState();
    state.attention = 5; // invalid
    const snapshot = {
      version: '1.0' as const,
      timestamp: Date.now(),
      state,
    };
    const result = validateCognitionSnapshot(snapshot);
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/bb-ui && bun run test src/cognition/__tests__/schema.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

Create `packages/bb-ui/src/cognition/schema.ts`:

```typescript
import { z } from 'zod';

// =============================================================================
// Primitives
// =============================================================================

const Signal01 = z.number().min(0).max(1);

const CognitiveModeSchema = z.enum([
  'idle',
  'listening',
  'deliberating',
  'acting',
  'explaining',
  'recovering',
  'blocked',
]);

const CognitiveSubmodeSchema = z.enum([
  'reading',
  'searching',
  'verifying',
  'waiting',
  'writing',
  'tool_call',
]);

const AVOSchema = z.object({
  arousal: Signal01,
  valence: Signal01,
  openness: Signal01,
});

// =============================================================================
// Sub-objects
// =============================================================================

const TrapWarningSchema = z.object({
  stateId: z.string(),
  reason: z.string(),
  recommendation: z.string(),
  severity: z.enum(['info', 'warning', 'danger']).optional(),
});

const DetailedBalanceSchema = z.object({
  chi2PerNdf: z.number(),
  passed: z.boolean(),
  threshold: z.number(),
});

const DynamicsStateSchema = z.object({
  potentialV: z.number().optional(),
  actionRate: Signal01.optional(),
  detailedBalance: DetailedBalanceSchema.optional(),
  traps: z.array(TrapWarningSchema).optional(),
});

const PersonalityConfigSchema = z.object({
  style: z.enum(['professional', 'casual', 'terse', 'verbose']),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  autonomy: z.enum(['low', 'medium', 'high', 'full']),
});

const PolicyConfigSchema = z.object({
  safetyMode: z.boolean(),
  trustTier: z.string().optional(),
});

// =============================================================================
// CognitionState
// =============================================================================

export const CognitionStateSchema = z.object({
  mode: CognitiveModeSchema,
  submode: CognitiveSubmodeSchema.optional(),
  focusRunId: z.string().optional(),

  attention: Signal01,
  workload: Signal01,
  timePressure: Signal01,
  planDrift: Signal01,
  costPressure: Signal01,
  risk: Signal01,
  uncertainty: Signal01,
  confidence: Signal01,
  errorStress: Signal01,

  personaAnchor: Signal01,
  personaDriftRisk: Signal01,
  personaStyle: z.array(z.string()).optional(),

  dynamics: DynamicsStateSchema.optional(),
  personality: PersonalityConfigSchema.optional(),
  policy: PolicyConfigSchema.optional(),

  moodAVO: AVOSchema,
  emotionAVO: AVOSchema,
});

// =============================================================================
// CognitionSnapshot
// =============================================================================

export const CognitionSnapshotSchema = z.object({
  version: z.literal('1.0'),
  timestamp: z.number(),
  state: CognitionStateSchema,
  recentEvents: z
    .array(
      z.object({
        t: z.number(),
        event: z.record(z.unknown()),
      })
    )
    .optional(),
});

// =============================================================================
// Validation helpers
// =============================================================================

export type CognitionSnapshotInput = z.input<typeof CognitionSnapshotSchema>;
export type CognitionSnapshotOutput = z.output<typeof CognitionSnapshotSchema>;

export interface CognitionSnapshotValidationResult {
  success: boolean;
  data?: CognitionSnapshotOutput;
  error?: z.ZodError;
}

export function validateCognitionSnapshot(
  input: unknown
): CognitionSnapshotValidationResult {
  const result = CognitionSnapshotSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/bb-ui && bun run test src/cognition/__tests__/schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/bb-ui/src/cognition/schema.ts packages/bb-ui/src/cognition/__tests__/schema.test.ts
git commit -m "feat(bb-ui): add Zod schema for CognitionSnapshot validation

Enables safe deserialization of cognition state from untrusted
sources (kernel, network). All signals validated to 0..1 range.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Create reducers for state updates

**Files:**
- Create: `packages/bb-ui/src/cognition/reducers.ts`
- Test: `packages/bb-ui/src/cognition/__tests__/reducers.test.ts`

**Step 1: Write the failing test**

Create `packages/bb-ui/src/cognition/__tests__/reducers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  reduceEvent,
  reduceDecay,
  MODE_TRANSITION_MAP,
} from '../reducers.js';
import { createInitialCognitionState } from '../types.js';
import type { CognitionEvent } from '../types.js';

describe('cognition/reducers', () => {
  describe('reduceEvent', () => {
    it('transitions to listening on ui.input_received', () => {
      const state = createInitialCognitionState({ mode: 'idle' });
      const event: CognitionEvent = { type: 'ui.input_received' };
      const next = reduceEvent(state, event);
      expect(next.mode).toBe('listening');
    });

    it('transitions to deliberating on run.started', () => {
      const state = createInitialCognitionState({ mode: 'idle' });
      const event: CognitionEvent = { type: 'run.started', runId: 'r1' };
      const next = reduceEvent(state, event);
      expect(next.mode).toBe('deliberating');
      expect(next.focusRunId).toBe('r1');
    });

    it('updates signals on signals.update', () => {
      const state = createInitialCognitionState();
      const event: CognitionEvent = {
        type: 'signals.update',
        signals: { workload: 0.8, risk: 0.5 },
      };
      const next = reduceEvent(state, event);
      expect(next.workload).toBe(0.8);
      expect(next.risk).toBe(0.5);
    });
  });

  describe('reduceDecay', () => {
    it('decays errorStress over time', () => {
      const state = createInitialCognitionState({ errorStress: 0.5 });
      const next = reduceDecay(state, 1000);
      expect(next.errorStress).toBeLessThan(0.5);
    });

    it('does not decay below zero', () => {
      const state = createInitialCognitionState({ errorStress: 0.01 });
      const next = reduceDecay(state, 10000);
      expect(next.errorStress).toBeGreaterThanOrEqual(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/bb-ui && bun run test src/cognition/__tests__/reducers.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

Create `packages/bb-ui/src/cognition/reducers.ts`:

```typescript
import type { AVO } from '../emotion/types.js';
import type {
  CognitionState,
  CognitionEvent,
  CognitiveMode,
  DynamicsState,
  PolicyConfig,
  PersonalityConfig,
  CognitionSignals,
} from './types.js';
import { clamp01 } from './types.js';

// =============================================================================
// Mode Transition Map
// =============================================================================

type ModeTransitionTrigger =
  | 'ui.input_received'
  | 'ui.user_idle'
  | 'ui.interrupt'
  | 'run.started'
  | 'run.completed_success'
  | 'run.completed_failure'
  | 'run.blocked';

export const MODE_TRANSITION_MAP: Record<
  ModeTransitionTrigger,
  CognitiveMode
> = {
  'ui.input_received': 'listening',
  'ui.user_idle': 'idle',
  'ui.interrupt': 'listening',
  'run.started': 'deliberating',
  'run.completed_success': 'recovering',
  'run.completed_failure': 'recovering',
  'run.blocked': 'blocked',
};

// =============================================================================
// Signal Reducers
// =============================================================================

function reduceSignals(
  state: CognitionState,
  signals: Partial<CognitionSignals>
): CognitionState {
  return {
    ...state,
    attention: clamp01(signals.attention ?? state.attention),
    workload: clamp01(signals.workload ?? state.workload),
    timePressure: clamp01(signals.timePressure ?? state.timePressure),
    planDrift: clamp01(signals.planDrift ?? state.planDrift),
    costPressure: clamp01(signals.costPressure ?? state.costPressure),
    risk: clamp01(signals.risk ?? state.risk),
    uncertainty: clamp01(signals.uncertainty ?? state.uncertainty),
    confidence: clamp01(signals.confidence ?? state.confidence),
    errorStress: clamp01(signals.errorStress ?? state.errorStress),
  };
}

function reduceDynamics(
  state: CognitionState,
  dynamics: DynamicsState
): CognitionState {
  return { ...state, dynamics };
}

function reducePolicy(
  state: CognitionState,
  policy?: PolicyConfig,
  personality?: PersonalityConfig
): CognitionState {
  return {
    ...state,
    policy: policy ?? state.policy,
    personality: personality ?? state.personality,
  };
}

// =============================================================================
// Decay Reducer (time-based signal decay)
// =============================================================================

const DECAY_RATES: Partial<Record<keyof CognitionSignals, number>> = {
  errorStress: 0.1, // 10% per second
  timePressure: 0.05,
};

export function reduceDecay(
  state: CognitionState,
  deltaMs: number
): CognitionState {
  const dt = deltaMs / 1000;
  let next = { ...state };

  for (const [key, rate] of Object.entries(DECAY_RATES)) {
    const k = key as keyof CognitionSignals;
    const current = state[k] as number;
    const decayed = current * Math.exp(-rate * dt);
    next = { ...next, [k]: clamp01(decayed) };
  }

  return next;
}

// =============================================================================
// Main Event Reducer
// =============================================================================

export function reduceEvent(
  state: CognitionState,
  event: CognitionEvent
): CognitionState {
  switch (event.type) {
    case 'ui.input_received': {
      const intensity = event.intensity ?? 0.5;
      return {
        ...state,
        mode: MODE_TRANSITION_MAP['ui.input_received'],
        attention: clamp01(state.attention + intensity * 0.3),
      };
    }

    case 'ui.user_idle': {
      return {
        ...state,
        mode: MODE_TRANSITION_MAP['ui.user_idle'],
        attention: clamp01(state.attention - 0.2),
      };
    }

    case 'ui.interrupt': {
      const intensity = event.intensity ?? 0.7;
      return {
        ...state,
        mode: MODE_TRANSITION_MAP['ui.interrupt'],
        attention: clamp01(state.attention + intensity * 0.4),
      };
    }

    case 'run.started': {
      return {
        ...state,
        mode: MODE_TRANSITION_MAP['run.started'],
        focusRunId: event.runId,
        workload: clamp01(state.workload + 0.2),
      };
    }

    case 'run.completed': {
      const trigger = event.success
        ? 'run.completed_success'
        : 'run.completed_failure';
      return {
        ...state,
        mode: MODE_TRANSITION_MAP[trigger],
        focusRunId: undefined,
        workload: clamp01(state.workload - 0.2),
        errorStress: event.success
          ? state.errorStress
          : clamp01(state.errorStress + 0.3),
      };
    }

    case 'run.event': {
      // Progress updates during a run
      if (event.progress !== undefined) {
        return {
          ...state,
          workload: clamp01(event.progress * 0.5 + state.workload * 0.5),
        };
      }
      return state;
    }

    case 'signals.update':
    case 'intensity.update': {
      const signals =
        event.type === 'signals.update' ? event.signals : event.values;
      return reduceSignals(state, signals);
    }

    case 'dynamics.update': {
      return reduceDynamics(state, event.dynamics);
    }

    case 'policy.update': {
      return reducePolicy(state, event.policy, event.personality);
    }

    case 'text.user_message': {
      // Persona drift risk estimation based on message categories
      // This is a placeholder for the full heuristic in Phase 2
      const categories = event.categories ?? [];
      const driftRisk = categories.includes('meta_reflection')
        ? 0.3
        : categories.includes('vulnerable_disclosure')
          ? 0.4
          : 0;

      return {
        ...state,
        personaDriftRisk: clamp01(
          state.personaDriftRisk * 0.7 + driftRisk * 0.3
        ),
      };
    }

    case 'tick': {
      return reduceDecay(state, event.deltaMs);
    }

    default:
      return state;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/bb-ui && bun run test src/cognition/__tests__/reducers.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/bb-ui/src/cognition/reducers.ts packages/bb-ui/src/cognition/__tests__/reducers.test.ts
git commit -m "feat(bb-ui): add cognition reducers for event-driven state updates

Implements reduceEvent for mode transitions and signal updates.
Includes time-based decay for errorStress and timePressure.
Mode transitions follow spec baseline policy.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Create CognitionController class

**Files:**
- Create: `packages/bb-ui/src/cognition/controller.ts`
- Test: `packages/bb-ui/src/cognition/__tests__/controller.test.ts`

**Step 1: Write the failing test**

Create `packages/bb-ui/src/cognition/__tests__/controller.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { CognitionController } from '../controller.js';

describe('CognitionController', () => {
  it('initializes with default state', () => {
    const controller = new CognitionController();
    const state = controller.getState();
    expect(state.mode).toBe('idle');
    expect(state.personaAnchor).toBe(1);
  });

  it('accepts initial state overrides', () => {
    const controller = new CognitionController({
      initial: { mode: 'listening', workload: 0.5 },
    });
    const state = controller.getState();
    expect(state.mode).toBe('listening');
    expect(state.workload).toBe(0.5);
  });

  it('handles events and updates state', () => {
    const controller = new CognitionController();
    controller.handleEvent({ type: 'run.started', runId: 'r1' });
    const state = controller.getState();
    expect(state.mode).toBe('deliberating');
    expect(state.focusRunId).toBe('r1');
  });

  it('tick advances decay', () => {
    const controller = new CognitionController({
      initial: { errorStress: 0.5 },
    });
    controller.tick(1000);
    const state = controller.getState();
    expect(state.errorStress).toBeLessThan(0.5);
  });

  it('emits change events', () => {
    const controller = new CognitionController();
    const handler = vi.fn();
    controller.on('change', handler);
    controller.handleEvent({ type: 'ui.input_received' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('getEmotionTarget returns anchor and AVO', () => {
    const controller = new CognitionController({
      initial: { mode: 'listening' },
    });
    const target = controller.getEmotionTarget();
    expect(target.anchor).toBe('listening');
    expect(target.avo).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/bb-ui && bun run test src/cognition/__tests__/controller.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

Create `packages/bb-ui/src/cognition/controller.ts`:

```typescript
import type { AVO, AnchorState } from '../emotion/types.js';
import type { CognitionState, CognitionEvent, CognitiveMode } from './types.js';
import { createInitialCognitionState } from './types.js';
import { reduceEvent } from './reducers.js';

// =============================================================================
// Emotion Bridge: Mode → Anchor mapping
// =============================================================================

const MODE_TO_ANCHOR: Record<CognitiveMode, AnchorState> = {
  idle: 'idle',
  listening: 'listening',
  deliberating: 'thinking',
  acting: 'focused',
  explaining: 'explaining',
  recovering: 'recovering',
  blocked: 'uncertain',
};

const MODE_TO_AVO: Record<CognitiveMode, AVO> = {
  idle: { arousal: 0.25, valence: 0.6, openness: 0.35 },
  listening: { arousal: 0.35, valence: 0.55, openness: 0.2 },
  deliberating: { arousal: 0.5, valence: 0.5, openness: 0.4 },
  acting: { arousal: 0.6, valence: 0.55, openness: 0.5 },
  explaining: { arousal: 0.45, valence: 0.65, openness: 0.7 },
  recovering: { arousal: 0.3, valence: 0.55, openness: 0.4 },
  blocked: { arousal: 0.35, valence: 0.4, openness: 0.3 },
};

// =============================================================================
// Controller Events
// =============================================================================

type EventHandler<T> = (data: T) => void;

interface CognitionControllerEvents {
  change: CognitionState;
  modeChange: { from: CognitiveMode; to: CognitiveMode };
}

// =============================================================================
// Controller Options
// =============================================================================

export interface CognitionControllerOptions {
  initial?: Partial<CognitionState>;
}

// =============================================================================
// CognitionController
// =============================================================================

export class CognitionController {
  private _state: CognitionState;
  private _listeners: Map<
    keyof CognitionControllerEvents,
    Set<EventHandler<unknown>>
  > = new Map();
  private _disposed: boolean = false;

  constructor(options: CognitionControllerOptions = {}) {
    this._state = createInitialCognitionState(options.initial);
  }

  /**
   * Get current cognition state
   */
  getState(): CognitionState {
    return { ...this._state };
  }

  /**
   * Handle a cognition event
   */
  handleEvent(event: CognitionEvent): void {
    if (this._disposed) return;

    const prevMode = this._state.mode;
    this._state = reduceEvent(this._state, event);
    this._emit('change', this._state);

    if (this._state.mode !== prevMode) {
      this._emit('modeChange', { from: prevMode, to: this._state.mode });
    }
  }

  /**
   * Tick - call each frame for time-based updates
   */
  tick(deltaMs: number): void {
    if (this._disposed) return;
    this.handleEvent({ type: 'tick', deltaMs });
  }

  /**
   * Get emotion target for driving EmotionController
   */
  getEmotionTarget(): { anchor?: AnchorState; avo?: AVO } {
    const { mode, personaDriftRisk, errorStress, confidence } = this._state;

    let anchor = MODE_TO_ANCHOR[mode];
    let avo = { ...MODE_TO_AVO[mode] };

    // Adjust for error stress
    if (errorStress > 0.3) {
      anchor = errorStress > 0.6 ? 'error' : 'concerned';
      avo.valence = Math.max(0, avo.valence - errorStress * 0.3);
    }

    // Adjust for low confidence
    if (confidence < 0.4) {
      anchor = 'uncertain';
      avo.arousal = Math.min(1, avo.arousal + 0.1);
    }

    // Persona drift risk: bias toward conservative anchors
    if (personaDriftRisk > 0.5) {
      // Keep anchor but reduce openness (stay grounded)
      avo.openness = Math.max(0, avo.openness - personaDriftRisk * 0.2);
    }

    return { anchor, avo };
  }

  /**
   * Subscribe to controller events
   */
  on<K extends keyof CognitionControllerEvents>(
    event: K,
    handler: EventHandler<CognitionControllerEvents[K]>
  ): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(handler as EventHandler<unknown>);

    return () => {
      this._listeners.get(event)?.delete(handler as EventHandler<unknown>);
    };
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this._disposed = true;
    this._listeners.clear();
  }

  private _emit<K extends keyof CognitionControllerEvents>(
    event: K,
    data: CognitionControllerEvents[K]
  ): void {
    this._listeners.get(event)?.forEach((handler) => handler(data));
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/bb-ui && bun run test src/cognition/__tests__/controller.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/bb-ui/src/cognition/controller.ts packages/bb-ui/src/cognition/__tests__/controller.test.ts
git commit -m "feat(bb-ui): add CognitionController with emotion bridge

Controller manages cognitive state via event dispatch.
getEmotionTarget() maps mode + signals to AnchorState and AVO
for driving EmotionController. Includes mode change events.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Create useCognition React hook

**Files:**
- Create: `packages/bb-ui/src/cognition/hooks/useCognition.ts`
- Create: `packages/bb-ui/src/cognition/hooks/index.ts`
- Test: `packages/bb-ui/src/cognition/__tests__/useCognition.test.ts`

**Step 1: Write the failing test**

Create `packages/bb-ui/src/cognition/__tests__/useCognition.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCognition } from '../hooks/useCognition.js';

describe('useCognition', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useCognition());
    expect(result.current.state.mode).toBe('idle');
  });

  it('accepts initial state overrides', () => {
    const { result } = renderHook(() =>
      useCognition({ initial: { mode: 'listening' } })
    );
    expect(result.current.state.mode).toBe('listening');
  });

  it('emit updates state', () => {
    const { result } = renderHook(() => useCognition({ autoTick: false }));

    act(() => {
      result.current.emit({ type: 'run.started', runId: 'r1' });
    });

    expect(result.current.state.mode).toBe('deliberating');
  });

  it('provides emotion bridge', () => {
    const { result } = renderHook(() => useCognition({ autoTick: false }));
    expect(result.current.emotion.anchor).toBeDefined();
    expect(result.current.emotion.avo).toBeDefined();
  });

  it('calls onChange callback', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCognition({ autoTick: false, onChange })
    );

    act(() => {
      result.current.emit({ type: 'ui.input_received' });
    });

    expect(onChange).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/bb-ui && bun run test src/cognition/__tests__/useCognition.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

Create `packages/bb-ui/src/cognition/hooks/useCognition.ts`:

```typescript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AVO, AnchorState } from '../../emotion/types.js';
import type { CognitionState, CognitionEvent } from '../types.js';
import { CognitionController, type CognitionControllerOptions } from '../controller.js';

export interface UseCognitionOptions extends CognitionControllerOptions {
  /** Callback on state change */
  onChange?: (state: CognitionState) => void;
  /** Auto-tick with requestAnimationFrame (default: true) */
  autoTick?: boolean;
}

export interface UseCognitionResult {
  /** Current cognition state */
  state: CognitionState;
  /** Emotion bridge outputs */
  emotion: {
    anchor?: AnchorState;
    avo?: AVO;
  };
  /** Emit a cognition event */
  emit: (event: CognitionEvent) => void;
  /** Manual tick (if autoTick disabled) */
  tick: (deltaMs: number) => void;
}

/**
 * React hook for managing cognitive state.
 *
 * Creates a CognitionController and provides reactive state updates.
 * Automatically handles RAF-based ticking when autoTick is true (default).
 *
 * @example
 * ```tsx
 * const { state, emotion, emit } = useCognition({
 *   onChange: (s) => console.log('Cognition changed:', s.mode),
 * });
 *
 * // Handle agent events
 * emit({ type: 'run.started', runId: 'r1' });
 *
 * // Use emotion bridge with EmotionController
 * emotionController.transitionToAnchor(emotion.anchor);
 * ```
 */
export function useCognition(options: UseCognitionOptions = {}): UseCognitionResult {
  const { initial, onChange, autoTick = true } = options;

  // Create controller ref (stable across renders)
  const controllerRef = useRef<CognitionController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new CognitionController({ initial });
  }

  const controller = controllerRef.current;

  // State for React reactivity
  const [state, setState] = useState<CognitionState>(controller.getState());
  const [emotion, setEmotion] = useState(controller.getEmotionTarget());

  // Store onChange in ref to avoid effect dependency changes
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Subscribe to controller events
  useEffect(() => {
    const unsub = controller.on('change', (newState) => {
      setState({ ...newState });
      setEmotion(controller.getEmotionTarget());
      onChangeRef.current?.(newState);
    });

    return () => {
      unsub();
    };
  }, [controller]);

  // Auto-tick with RAF
  useEffect(() => {
    if (!autoTick) return;

    let lastTime = performance.now();
    let rafId: number;

    const tick = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      controller.tick(delta);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [controller, autoTick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controller.dispose();
    };
  }, [controller]);

  // Stable callbacks
  const emit = useCallback(
    (event: CognitionEvent) => {
      controller.handleEvent(event);
    },
    [controller]
  );

  const tick = useCallback(
    (deltaMs: number) => {
      controller.tick(deltaMs);
    },
    [controller]
  );

  return {
    state,
    emotion,
    emit,
    tick,
  };
}
```

Create `packages/bb-ui/src/cognition/hooks/index.ts`:

```typescript
export { useCognition } from './useCognition.js';
export type { UseCognitionOptions, UseCognitionResult } from './useCognition.js';
```

**Step 4: Run test to verify it passes**

Run: `cd packages/bb-ui && bun run test src/cognition/__tests__/useCognition.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/bb-ui/src/cognition/hooks/
git add packages/bb-ui/src/cognition/__tests__/useCognition.test.ts
git commit -m "feat(bb-ui): add useCognition React hook

Bridges CognitionController to React with reactive state updates.
Provides emotion bridge (anchor + AVO) for driving visuals.
Supports autoTick for RAF-based decay/updates.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Create module index and add package export

**Files:**
- Create: `packages/bb-ui/src/cognition/index.ts`
- Modify: `packages/bb-ui/package.json` (add export)

**Step 1: Create module index**

Create `packages/bb-ui/src/cognition/index.ts`:

```typescript
// =============================================================================
// Types
// =============================================================================

export type {
  CognitiveMode,
  CognitiveSubmode,
  CognitionSignals,
  PersonaSignals,
  TrapWarning,
  DetailedBalance,
  DynamicsState,
  PersonalityConfig,
  PolicyConfig,
  EvidenceRef,
  CognitionState,
  CognitionEvent,
  CognitionSnapshot,
} from './types.js';

export { clamp01, createInitialCognitionState } from './types.js';

// =============================================================================
// Schema
// =============================================================================

export {
  CognitionStateSchema,
  CognitionSnapshotSchema,
  validateCognitionSnapshot,
} from './schema.js';

export type {
  CognitionSnapshotInput,
  CognitionSnapshotOutput,
  CognitionSnapshotValidationResult,
} from './schema.js';

// =============================================================================
// Reducers
// =============================================================================

export { reduceEvent, reduceDecay, MODE_TRANSITION_MAP } from './reducers.js';

// =============================================================================
// Controller
// =============================================================================

export { CognitionController } from './controller.js';
export type { CognitionControllerOptions } from './controller.js';

// =============================================================================
// Hooks
// =============================================================================

export { useCognition } from './hooks/index.js';
export type { UseCognitionOptions, UseCognitionResult } from './hooks/index.js';
```

**Step 2: Add package export**

Modify `packages/bb-ui/package.json` exports section to add:

```json
"./cognition": {
  "types": "./dist/cognition/index.d.ts",
  "import": "./dist/cognition/index.js"
}
```

**Step 3: Verify build**

Run: `cd packages/bb-ui && bun run build`
Expected: Build succeeds

**Step 4: Verify typecheck**

Run: `cd packages/bb-ui && bun run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add packages/bb-ui/src/cognition/index.ts packages/bb-ui/package.json
git commit -m "feat(bb-ui): export cognition module as @backbay/glia/cognition

Completes Phase 1: types, schema, reducers, controller, and hook
are now available as a tree-shakable module.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Audio-Cognition Integration

### Task 7: Expand AudioPlannerSignals to accept full CognitionState

**Files:**
- Modify: `packages/bb-ui/src/audio/planner.ts`
- Modify: `packages/bb-ui/src/audio/__tests__/planner.test.ts`

**Step 1: Write the failing test**

Add to `packages/bb-ui/src/audio/__tests__/planner.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { planSpeech, planSpeechFromCognition } from '../planner.js';
import type { CognitionState } from '../../cognition/types.js';
import { createInitialCognitionState } from '../../cognition/types.js';

describe('planSpeechFromCognition', () => {
  const mockVoices = {
    get: (id: string) =>
      id === 'v1'
        ? { voiceId: 'v1', licenseCategory: 'cc0' as const, tags: ['default', 'grounded'] }
        : null,
    list: () => [
      { voiceId: 'v1', licenseCategory: 'cc0' as const, tags: ['default', 'grounded'] },
    ],
  };

  const basePolicy = {
    safetyMode: false,
    voiceCloningAllowed: false,
  };

  it('extracts signals from CognitionState', () => {
    const cognition: CognitionState = createInitialCognitionState({
      mode: 'explaining',
      confidence: 0.9,
      risk: 0.1,
      personaDriftRisk: 0.1,
    });

    const request = planSpeechFromCognition({
      text: 'Hello world',
      cognition,
      policy: basePolicy,
      voices: mockVoices,
    });

    expect(request.voiceId).toBe('v1');
    expect(request.text).toBe('Hello world');
  });

  it('uses grounded voice when personaDriftRisk is high', () => {
    const cognition: CognitionState = createInitialCognitionState({
      mode: 'explaining',
      personaDriftRisk: 0.7,
    });

    const request = planSpeechFromCognition({
      text: 'Hello!!! World!!!',
      cognition,
      policy: basePolicy,
      voices: mockVoices,
    });

    // Exclamation marks should be clamped
    expect(request.text).not.toContain('!!!');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/bb-ui && bun run test src/audio/__tests__/planner.test.ts`
Expected: FAIL - planSpeechFromCognition not found

**Step 3: Write minimal implementation**

Add to `packages/bb-ui/src/audio/planner.ts`:

```typescript
import type { CognitionState } from '../cognition/types.js';

// ... existing code ...

export interface AudioPlannerCognitionInput {
  text: string;
  language?: string;
  runId?: string;
  targetAffect?: AVO;
  cognition: CognitionState;
  policy: AudioPolicy;
  voices: VoiceCatalog;
  defaults?: {
    voiceId?: string;
    groundedVoiceTag?: string;
    defaultVoiceTag?: string;
    temperature?: number;
  };
}

/**
 * Plan speech from full CognitionState.
 *
 * Extracts relevant signals and delegates to planSpeech.
 */
export function planSpeechFromCognition(
  input: AudioPlannerCognitionInput
): SpeechSynthesisRequest {
  const { cognition, ...rest } = input;

  const signals: AudioPlannerSignals = {
    mode: cognition.mode,
    personaDriftRisk: cognition.personaDriftRisk,
    confidence: cognition.confidence,
    risk: cognition.risk,
  };

  // Use cognition's emotionAVO as default targetAffect if not provided
  const targetAffect = rest.targetAffect ?? cognition.emotionAVO;

  return planSpeech({
    ...rest,
    targetAffect,
    signals,
  });
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/bb-ui && bun run test src/audio/__tests__/planner.test.ts`
Expected: PASS

**Step 5: Update audio index to export new function**

Add to `packages/bb-ui/src/audio/index.ts`:

```typescript
export { planSpeech, planSpeechFromCognition } from './planner.js';
export type { AudioPlannerInput, AudioPlannerSignals, AudioPlannerCognitionInput } from './planner.js';
```

**Step 6: Commit**

```bash
git add packages/bb-ui/src/audio/planner.ts packages/bb-ui/src/audio/index.ts packages/bb-ui/src/audio/__tests__/planner.test.ts
git commit -m "feat(bb-ui): add planSpeechFromCognition for full state integration

New function extracts signals from CognitionState and uses
emotionAVO as default targetAffect. Provides cleaner API for
cognition-aware audio planning.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Create useCognitionSpeech hook (combined cognition + speech)

**Files:**
- Create: `packages/bb-ui/src/audio/hooks/useCognitionSpeech.ts`
- Test: `packages/bb-ui/src/audio/__tests__/useCognitionSpeech.test.ts`

**Step 1: Write the failing test**

Create `packages/bb-ui/src/audio/__tests__/useCognitionSpeech.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCognitionSpeech } from '../hooks/useCognitionSpeech.js';

describe('useCognitionSpeech', () => {
  const mockProvider = {
    providerId: 'mock',
    synthesizeSpeech: vi.fn().mockResolvedValue({
      audio: new Blob(['test'], { type: 'audio/wav' }),
      artifact: {
        id: 'a1',
        format: 'wav',
        sha256: 'abc',
        durationMs: 1000,
      },
    }),
  };

  const mockVoices = {
    get: (id: string) =>
      id === 'v1'
        ? { voiceId: 'v1', licenseCategory: 'cc0' as const, tags: ['default'] }
        : null,
    list: () => [{ voiceId: 'v1', licenseCategory: 'cc0' as const, tags: ['default'] }],
  };

  const baseOptions = {
    provider: mockProvider,
    voices: mockVoices,
    policy: { safetyMode: false, voiceCloningAllowed: false },
  };

  it('provides cognition state and speak function', () => {
    const { result } = renderHook(() =>
      useCognitionSpeech({ ...baseOptions, autoTick: false })
    );

    expect(result.current.cognition.mode).toBe('idle');
    expect(typeof result.current.speak).toBe('function');
  });

  it('uses cognition state when speaking', async () => {
    const { result } = renderHook(() =>
      useCognitionSpeech({ ...baseOptions, autoTick: false })
    );

    // Change mode
    act(() => {
      result.current.emitCognition({ type: 'run.started', runId: 'r1' });
    });

    expect(result.current.cognition.mode).toBe('deliberating');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/bb-ui && bun run test src/audio/__tests__/useCognitionSpeech.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

Create `packages/bb-ui/src/audio/hooks/useCognitionSpeech.ts`:

```typescript
'use client';

import { useCallback } from 'react';
import type { AVO } from '../../emotion/types.js';
import type { CognitionState, CognitionEvent } from '../../cognition/types.js';
import { useCognition, type UseCognitionOptions } from '../../cognition/hooks/useCognition.js';
import { planSpeechFromCognition } from '../planner.js';
import type {
  AudioPolicy,
  AudioProof,
  AudioVerifier,
  SpeechSynthesisProvider,
  SpeechSynthesisRequest,
  SpeechSynthesisResult,
  VoiceCatalog,
} from '../types.js';
import { useSpeechSynthesis, type UseSpeechSynthesisOptions } from './useSpeechSynthesis.js';

// =============================================================================
// Types
// =============================================================================

export interface UseCognitionSpeechOptions {
  // Speech synthesis options
  provider: SpeechSynthesisProvider;
  verifier?: AudioVerifier;
  voices: VoiceCatalog;
  policy: AudioPolicy;
  volume?: number;
  verificationMode?: 'before_playback' | 'after_playback' | 'never';

  // Cognition options
  initialCognition?: Partial<CognitionState>;
  autoTick?: boolean;
  onCognitionChange?: (state: CognitionState) => void;

  // Barge-in
  bargeIn?: {
    stream: MediaStream | null;
    threshold?: number;
    hangoverMs?: number;
  };

  // Voice defaults
  defaults?: {
    voiceId?: string;
    groundedVoiceTag?: string;
    defaultVoiceTag?: string;
    temperature?: number;
  };

  // Callbacks
  onProof?: (proof: AudioProof) => void;
  onBargeIn?: () => void;
  onError?: (error: Error) => void;
}

export interface SpeakWithCognitionOptions {
  runId?: string;
  language?: string;
  targetAffect?: AVO;
}

export interface UseCognitionSpeechReturn {
  // Cognition
  cognition: CognitionState;
  emitCognition: (event: CognitionEvent) => void;
  tickCognition: (deltaMs: number) => void;

  // Speech
  isSynthesizing: boolean;
  isSpeaking: boolean;
  error: string | null;
  lastRequest: SpeechSynthesisRequest | null;
  lastResult: SpeechSynthesisResult | null;
  lastProof: AudioProof | null;

  speak: (text: string, options?: SpeakWithCognitionOptions) => Promise<void>;
  cancel: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useCognitionSpeech(
  options: UseCognitionSpeechOptions
): UseCognitionSpeechReturn {
  const {
    provider,
    verifier,
    voices,
    policy,
    volume,
    verificationMode,
    initialCognition,
    autoTick = true,
    onCognitionChange,
    bargeIn,
    defaults,
    onProof,
    onBargeIn,
    onError,
  } = options;

  // Cognition state
  const cognitionResult = useCognition({
    initial: initialCognition,
    autoTick,
    onChange: onCognitionChange,
  });

  // Speech synthesis - uses signals derived from cognition
  const speechResult = useSpeechSynthesis({
    provider,
    verifier,
    voices,
    policy,
    volume,
    verificationMode,
    signals: {
      mode: cognitionResult.state.mode,
      personaDriftRisk: cognitionResult.state.personaDriftRisk,
      confidence: cognitionResult.state.confidence,
      risk: cognitionResult.state.risk,
    },
    defaults,
    bargeIn,
    onProof,
    onBargeIn: () => {
      // On barge-in, emit interrupt to cognition
      cognitionResult.emit({ type: 'ui.interrupt' });
      onBargeIn?.();
    },
    onError,
  });

  // Speak using full cognition state
  const speak = useCallback(
    async (text: string, speakOptions?: SpeakWithCognitionOptions) => {
      // Plan using full cognition state
      const request = planSpeechFromCognition({
        text,
        language: speakOptions?.language,
        runId: speakOptions?.runId,
        targetAffect: speakOptions?.targetAffect,
        cognition: cognitionResult.state,
        policy,
        voices,
        defaults,
      });

      // Synthesize and play
      await speechResult.speak(text, {
        ...speakOptions,
        targetAffect: request.targetAffect,
      });
    },
    [cognitionResult.state, policy, voices, defaults, speechResult]
  );

  return {
    // Cognition
    cognition: cognitionResult.state,
    emitCognition: cognitionResult.emit,
    tickCognition: cognitionResult.tick,

    // Speech
    isSynthesizing: speechResult.isSynthesizing,
    isSpeaking: speechResult.isSpeaking,
    error: speechResult.error,
    lastRequest: speechResult.lastRequest,
    lastResult: speechResult.lastResult,
    lastProof: speechResult.lastProof,

    speak,
    cancel: speechResult.cancel,
  };
}
```

**Step 4: Update hooks index**

Add to `packages/bb-ui/src/audio/hooks/index.ts`:

```typescript
export { useCognitionSpeech } from './useCognitionSpeech.js';
export type {
  UseCognitionSpeechOptions,
  SpeakWithCognitionOptions,
  UseCognitionSpeechReturn,
} from './useCognitionSpeech.js';
```

**Step 5: Run test to verify it passes**

Run: `cd packages/bb-ui && bun run test src/audio/__tests__/useCognitionSpeech.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/bb-ui/src/audio/hooks/useCognitionSpeech.ts packages/bb-ui/src/audio/hooks/index.ts packages/bb-ui/src/audio/__tests__/useCognitionSpeech.test.ts
git commit -m "feat(bb-ui): add useCognitionSpeech combined hook

Integrates useCognition + useSpeechSynthesis for unified
cognition-aware speech. Barge-in automatically emits interrupt
to cognition. Uses planSpeechFromCognition for full state access.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Final Integration + Tests

### Task 9: Run full test suite and fix any issues

**Step 1: Run all cognition tests**

Run: `cd packages/bb-ui && bun run test src/cognition/`
Expected: All PASS

**Step 2: Run all audio tests**

Run: `cd packages/bb-ui && bun run test src/audio/`
Expected: All PASS

**Step 3: Run typecheck**

Run: `cd packages/bb-ui && bun run typecheck`
Expected: No errors

**Step 4: Run build**

Run: `cd packages/bb-ui && bun run build`
Expected: Build succeeds

**Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(bb-ui): address test/build issues in cognition module

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

**Phase 1 (Core):** Tasks 1-6
- Types, schema, reducers, controller, hook, module exports
- ~800 LOC implementation + ~300 LOC tests

**Phase 2 (Audio Integration):** Tasks 7-8
- planSpeechFromCognition, useCognitionSpeech
- ~200 LOC implementation + ~100 LOC tests

**Phase 3 (Verification):** Task 9
- Full test suite, typecheck, build verification

**Total estimated:** ~1,300 LOC implementation + ~400 LOC tests

---

Plan complete and saved to `docs/plans/2026-01-21-cognition-system.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
