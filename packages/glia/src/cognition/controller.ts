// packages/bb-ui/src/cognition/controller.ts

/**
 * CognitionController manages the cognitive state lifecycle for the Glyph character.
 *
 * It handles:
 * - Cognitive mode transitions (idle, listening, deliberating, acting, etc.)
 * - Continuous signal processing (attention, workload, risk, etc.)
 * - Event-driven state changes from UI and kernel events
 * - Emotion bridge (mood and emotion AVO dimensions)
 * - Time-based decay of stress signals
 */

import type { AVO, AnchorState } from '../emotion/types.js';
import type {
  CognitionState,
  CognitionEvent,
  CognitiveMode,
} from './types.js';
import { createInitialCognitionState } from './types.js';
import { reduceEvent, reduceDecay } from './reducers.js';

// =============================================================================
// Mode Mappings
// =============================================================================

/**
 * Maps cognitive modes to emotion anchor states for visual representation
 */
export const MODE_TO_ANCHOR: Record<CognitiveMode, AnchorState> = {
  idle: 'idle',
  listening: 'listening',
  deliberating: 'thinking',
  acting: 'focused',
  explaining: 'explaining',
  recovering: 'recovering',
  blocked: 'concerned',
};

/**
 * Default AVO values for each cognitive mode
 * These are the target emotional states for each mode
 */
export const MODE_TO_AVO: Record<CognitiveMode, AVO> = {
  idle: { arousal: 0.25, valence: 0.60, openness: 0.35 },
  listening: { arousal: 0.45, valence: 0.70, openness: 0.05 },
  deliberating: { arousal: 0.60, valence: 0.60, openness: 0.40 },
  acting: { arousal: 0.70, valence: 0.70, openness: 0.50 },
  explaining: { arousal: 0.55, valence: 0.80, openness: 0.85 },
  recovering: { arousal: 0.40, valence: 0.45, openness: 0.40 },
  blocked: { arousal: 0.55, valence: 0.30, openness: 0.30 },
};

// =============================================================================
// Types
// =============================================================================

type EventHandler<T> = (data: T) => void;

export interface CognitionControllerEvents {
  /** Emitted when any state change occurs */
  change: CognitionState;
  /** Emitted when mode changes */
  modeChange: { from: CognitiveMode; to: CognitiveMode };
}

export interface CognitionControllerOptions {
  /** Initial state overrides */
  initial?: Partial<CognitionState>;
}

export interface EmotionTarget {
  /** The anchor state name for the current mode */
  anchor: AnchorState;
  /** The target AVO values adjusted by signals */
  avo: AVO;
}

/**
 * CognitionController manages the cognitive state lifecycle for the Glyph character.
 */
export class CognitionController {
  private _state: CognitionState;
  private _listeners: Map<keyof CognitionControllerEvents, Set<EventHandler<unknown>>> = new Map();
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
   * Get the emotion target for the current cognitive state
   * Returns anchor state and AVO values adjusted by signals
   */
  getEmotionTarget(): EmotionTarget {
    const anchor = MODE_TO_ANCHOR[this._state.mode];
    const baseAVO = MODE_TO_AVO[this._state.mode];

    // Adjust AVO based on signals
    const avo = this._adjustAVOBySignals(baseAVO);

    return { anchor, avo };
  }

  /**
   * Get emotion bridge - derives anchor and AVO from cognitive state
   * @deprecated Use getEmotionTarget() instead
   */
  getEmotionBridge(): { anchor?: AnchorState; avo?: AVO } {
    const target = this.getEmotionTarget();
    return { anchor: target.anchor, avo: target.avo };
  }

  /**
   * Handle a cognition event and update state
   */
  handleEvent(event: CognitionEvent): void {
    if (this._disposed) return;

    const prevMode = this._state.mode;
    this._state = reduceEvent(this._state, event);

    if (this._state.mode !== prevMode) {
      this._emitEvent('modeChange', { from: prevMode, to: this._state.mode });
    }

    this._emitEvent('change', this._state);
  }

  /**
   * Process an event and update state
   * @deprecated Use handleEvent() instead
   */
  emit(event: CognitionEvent): void {
    this.handleEvent(event);
  }

  /**
   * Update tick - call each frame with delta time in milliseconds
   * Applies time-based decay to stress signals
   */
  tick(deltaMs: number): void {
    if (this._disposed) return;

    const prevState = this._state;
    this._state = reduceDecay(this._state, deltaMs);

    // Only emit change if state actually changed
    if (
      prevState.errorStress !== this._state.errorStress ||
      prevState.timePressure !== this._state.timePressure ||
      prevState.planDrift !== this._state.planDrift
    ) {
      this._emitEvent('change', this._state);
    }
  }

  /**
   * Subscribe to controller events
   * Returns unsubscribe function
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
   * Dispose controller and clean up resources
   */
  dispose(): void {
    this._disposed = true;
    this._listeners.clear();
  }

  /**
   * Adjust AVO values based on current signal levels
   */
  private _adjustAVOBySignals(baseAVO: AVO): AVO {
    const { errorStress, workload, timePressure, uncertainty, confidence, personaDriftRisk } = this._state;

    // Arousal increases with workload, time pressure, and error stress
    const arousalBoost = (workload * 0.2) + (timePressure * 0.15) + (errorStress * 0.1);

    // Valence decreases with error stress and uncertainty
    const valenceDrops = (errorStress * 0.3) + (uncertainty * 0.15);
    const valenceBoost = (confidence - 0.5) * 0.2; // Confidence above 0.5 boosts valence

    // Openness decreases with persona drift risk (more grounded when drift risk is high)
    // Per spec section 7.6: high drift risk should reduce openness to signal groundedness
    const opennessDrop = personaDriftRisk * 0.3;

    return {
      arousal: Math.max(0, Math.min(1, baseAVO.arousal + arousalBoost)),
      valence: Math.max(0, Math.min(1, baseAVO.valence - valenceDrops + valenceBoost)),
      openness: Math.max(0, Math.min(1, baseAVO.openness - opennessDrop)),
    };
  }

  private _emitEvent<K extends keyof CognitionControllerEvents>(
    event: K,
    data: CognitionControllerEvents[K]
  ): void {
    this._listeners.get(event)?.forEach((handler) => handler(data));
  }
}
