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
