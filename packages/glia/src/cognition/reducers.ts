// packages/bb-ui/src/cognition/reducers.ts

/**
 * Cognition State Reducers
 *
 * Pure functions for updating cognition state based on events and time decay.
 */

import type {
  CognitionState,
  CognitionEvent,
  CognitiveMode,
  CognitionSignals,
  DynamicsState,
  PolicyConfig,
  PersonalityConfig,
} from './types.js';
import { clamp01 } from './types.js';

/**
 * Trigger types that cause mode transitions
 */
export type CognitionTrigger =
  | 'ui.input_received'
  | 'ui.user_idle'
  | 'ui.interrupt'
  | 'run.started'
  | 'run.completed'
  | 'run.event';

/**
 * Maps trigger events to resulting cognitive modes
 */
export const MODE_TRANSITION_MAP: Record<CognitionTrigger, CognitiveMode> = {
  'ui.input_received': 'listening',
  'ui.user_idle': 'idle',
  'ui.interrupt': 'listening',
  'run.started': 'deliberating',
  'run.completed': 'idle',
  'run.event': 'deliberating',
};

/**
 * Decay rates per second for various signals
 */
export const DECAY_RATES: Record<'errorStress' | 'timePressure' | 'planDrift', number> = {
  errorStress: 0.1,    // Decays 10% per second
  timePressure: 0.05,  // Decays 5% per second
  planDrift: 0.08,     // Decays 8% per second
};

/**
 * Reduce signals from a signals.update event
 */
function reduceSignals(
  state: CognitionState,
  signals: Partial<CognitionSignals>
): CognitionState {
  return {
    ...state,
    attention: signals.attention !== undefined ? clamp01(signals.attention) : state.attention,
    workload: signals.workload !== undefined ? clamp01(signals.workload) : state.workload,
    risk: signals.risk !== undefined ? clamp01(signals.risk) : state.risk,
    timePressure: signals.timePressure !== undefined ? clamp01(signals.timePressure) : state.timePressure,
    errorStress: signals.errorStress !== undefined ? clamp01(signals.errorStress) : state.errorStress,
    planDrift: signals.planDrift !== undefined ? clamp01(signals.planDrift) : state.planDrift,
    costPressure: signals.costPressure !== undefined ? clamp01(signals.costPressure) : state.costPressure,
    uncertainty: signals.uncertainty !== undefined ? clamp01(signals.uncertainty) : state.uncertainty,
    confidence: signals.confidence !== undefined ? clamp01(signals.confidence) : state.confidence,
  };
}

/**
 * Reduce dynamics state update
 */
function reduceDynamicsUpdate(
  state: CognitionState,
  dynamics: DynamicsState
): CognitionState {
  return {
    ...state,
    dynamics,
  };
}

/**
 * Reduce policy/personality update
 */
function reducePolicyUpdate(
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

/**
 * Reduce mode transitions based on events
 */
function reduceModeTransition(
  state: CognitionState,
  event: CognitionEvent
): CognitionState {
  const trigger = event.type as CognitionTrigger;
  const newMode = MODE_TRANSITION_MAP[trigger];

  if (!newMode) {
    return state;
  }

  let focusRunId = state.focusRunId;
  let errorStress = state.errorStress;
  let mode = newMode;

  // Handle run-related events
  if (event.type === 'run.started') {
    focusRunId = event.runId;
  } else if (event.type === 'run.completed') {
    focusRunId = undefined;
    if (!event.success) {
      errorStress = clamp01(state.errorStress + 0.2);
      mode = 'recovering';
    }
  } else if (event.type === 'run.event') {
    focusRunId = event.runId;
  }

  return {
    ...state,
    mode,
    focusRunId,
    errorStress,
  };
}

/**
 * Apply exponential decay to time-based signals
 */
export function reduceDecay(
  state: CognitionState,
  deltaMs: number
): CognitionState {
  const deltaSec = deltaMs / 1000;

  // Exponential decay: value * e^(-rate * time)
  const errorStress = clamp01(
    state.errorStress * Math.exp(-DECAY_RATES.errorStress * deltaSec)
  );
  const timePressure = clamp01(
    state.timePressure * Math.exp(-DECAY_RATES.timePressure * deltaSec)
  );
  const planDrift = clamp01(
    state.planDrift * Math.exp(-DECAY_RATES.planDrift * deltaSec)
  );

  return {
    ...state,
    errorStress,
    timePressure,
    planDrift,
  };
}

/**
 * Main event reducer - handles all cognition events
 */
export function reduceEvent(
  state: CognitionState,
  event: CognitionEvent
): CognitionState {
  switch (event.type) {
    case 'signals.update':
      return reduceSignals(state, event.signals);

    case 'intensity.update':
      return reduceSignals(state, event.values);

    case 'dynamics.update':
      return reduceDynamicsUpdate(state, event.dynamics);

    case 'policy.update':
      return reducePolicyUpdate(state, event.policy, event.personality);

    case 'tick':
      return reduceDecay(state, event.deltaMs);

    case 'ui.input_received':
    case 'ui.user_idle':
    case 'ui.interrupt':
    case 'run.started':
    case 'run.completed':
    case 'run.event':
      return reduceModeTransition(state, event);

    case 'text.user_message': {
      // Text messages transition to listening mode and update persona drift risk
      // based on message categories per spec section 7.5
      const categories = event.categories ?? [];
      const driftRisk = categories.includes('meta_reflection')
        ? 0.3
        : categories.includes('vulnerable_disclosure')
          ? 0.4
          : 0;

      // Exponential smoothing: 70% previous, 30% new
      const newPersonaDriftRisk = clamp01(
        state.personaDriftRisk * 0.7 + driftRisk * 0.3
      );

      return {
        ...state,
        mode: 'listening',
        personaDriftRisk: newPersonaDriftRisk,
      };
    }

    default: {
      // Exhaustive check - TypeScript will error if we miss a case
      const _exhaustive: never = event;
      return state;
    }
  }
}
