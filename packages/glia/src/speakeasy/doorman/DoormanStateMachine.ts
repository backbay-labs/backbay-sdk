/**
 * DoormanStateMachine - State machine for speakeasy doorman interaction
 *
 * States: IDLE → CHALLENGED → VERIFYING → ADMITTED → COOLDOWN/LOCKED
 *
 * Mirrors the HSM pattern from kernel/src/cyntra/core/topology/hsm_engine.py
 * but implemented as a Zustand store for React integration.
 */

import { create, createStore } from 'zustand';
import type { StoreApi } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  DEFAULT_DOORMAN_CONFIG,
  type DoormanState,
  type DoormanEvent,
  type DoormanConfig,
  type DoormanContext,
  type CapabilityToken,
} from '../types.js';

// ============================================================================
// Transition Definitions
// ============================================================================

interface Transition {
  from: DoormanState;
  to: DoormanState;
  event: DoormanEvent['type'];
  guard?: (context: DoormanContext, event: DoormanEvent) => boolean;
  action?: (context: DoormanContext, event: DoormanEvent) => Partial<DoormanContext>;
}

const createTransitions = (config: DoormanConfig): Transition[] => [
  // IDLE → CHALLENGED: Public knock detected
  {
    from: 'IDLE',
    to: 'CHALLENGED',
    event: 'KNOCK_DETECTED',
    action: (ctx, event) => {
      const timestamp = (event as { timestamp: number }).timestamp || Date.now();
      return {
        challenge: {
          nonce: generateNonce(),
          salt: generateSalt(),
          issuedAt: timestamp,
          expiresAt: timestamp + config.challengeWindowMs,
        },
      };
    },
  },

  // CHALLENGED → VERIFYING: Gesture complete
  {
    from: 'CHALLENGED',
    to: 'VERIFYING',
    event: 'GESTURE_COMPLETE',
    guard: (ctx) => {
      // Check challenge not expired
      if (!ctx.challenge) return false;
      return Date.now() < ctx.challenge.expiresAt;
    },
  },

  // CHALLENGED → IDLE: Challenge timeout
  {
    from: 'CHALLENGED',
    to: 'IDLE',
    event: 'CHALLENGE_TIMEOUT',
    action: () => ({ challenge: null }),
  },

  // CHALLENGED → IDLE: User cancels
  {
    from: 'CHALLENGED',
    to: 'IDLE',
    event: 'EXIT_REQUESTED',
    action: () => ({ challenge: null }),
  },

  // VERIFYING → IDLE: User cancels
  {
    from: 'VERIFYING',
    to: 'IDLE',
    event: 'EXIT_REQUESTED',
    action: () => ({ challenge: null }),
  },

  // VERIFYING → ADMITTED: Verification success
  {
    from: 'VERIFYING',
    to: 'ADMITTED',
    event: 'VERIFICATION_SUCCESS',
    action: (ctx, event) => {
      const e = event as { type: 'VERIFICATION_SUCCESS'; capability: CapabilityToken };
      return {
        capability: e.capability,
        challenge: null,
        consecutiveFailures: 0,
        admissionEndsAt: Date.now() + config.admissionTtlMs,
      };
    },
  },

  // VERIFYING → COOLDOWN: Verification failure (under threshold)
  {
    from: 'VERIFYING',
    to: 'COOLDOWN',
    event: 'VERIFICATION_FAILURE',
    guard: (ctx) => ctx.consecutiveFailures + 1 < config.maxConsecutiveFailures,
    action: (ctx) => {
      const failures = ctx.consecutiveFailures + 1;
      const cooldownMs = config.cooldownBaseMs * Math.pow(2, failures - 1);
      return {
        consecutiveFailures: failures,
        cooldownEndsAt: Date.now() + cooldownMs,
        challenge: null,
      };
    },
  },

  // VERIFYING → LOCKED: Verification failure (at threshold)
  {
    from: 'VERIFYING',
    to: 'LOCKED',
    event: 'VERIFICATION_FAILURE',
    guard: (ctx) => ctx.consecutiveFailures + 1 >= config.maxConsecutiveFailures,
    action: () => ({
      consecutiveFailures: config.maxConsecutiveFailures,
      lockEndsAt: Date.now() + config.lockDurationMs,
      challenge: null,
    }),
  },

  // COOLDOWN → IDLE: Cooldown elapsed
  {
    from: 'COOLDOWN',
    to: 'IDLE',
    event: 'COOLDOWN_ELAPSED',
    action: () => ({ cooldownEndsAt: null }),
  },

  // LOCKED → IDLE: Lock expired
  {
    from: 'LOCKED',
    to: 'IDLE',
    event: 'LOCK_EXPIRED',
    action: () => ({
      lockEndsAt: null,
      consecutiveFailures: 0,
    }),
  },

  // ADMITTED → IDLE: Exit requested
  {
    from: 'ADMITTED',
    to: 'IDLE',
    event: 'EXIT_REQUESTED',
    action: () => ({
      capability: null,
      admissionEndsAt: null,
    }),
  },

  // ADMITTED → IDLE: Admission timeout
  {
    from: 'ADMITTED',
    to: 'IDLE',
    event: 'ADMISSION_TIMEOUT',
    action: () => ({
      capability: null,
      admissionEndsAt: null,
    }),
  },

  // DECOY → IDLE: Exit requested
  {
    from: 'DECOY',
    to: 'IDLE',
    event: 'EXIT_REQUESTED',
    action: () => ({
      capability: null,
      admissionEndsAt: null,
    }),
  },

  // DECOY → IDLE: Timeout
  {
    from: 'DECOY',
    to: 'IDLE',
    event: 'ADMISSION_TIMEOUT',
    action: () => ({
      capability: null,
      admissionEndsAt: null,
    }),
  },

  // Panic gesture handling (if enabled)
  // Note: PANIC_GESTURE can be dispatched from both CHALLENGED and VERIFYING states
  ...(config.panicGestureEnabled
    ? ([
        // From CHALLENGED state
        {
          from: 'CHALLENGED' as DoormanState,
          to: 'DECOY' as DoormanState,
          event: 'PANIC_GESTURE' as const,
          guard: (_ctx, event) => {
            const e = event as { type: 'PANIC_GESTURE'; decoyMode: boolean };
            return e.decoyMode === true;
          },
          action: () => ({
            admissionEndsAt: Date.now() + config.decoyTtlMs,
            challenge: null,
            capability: null,
          }),
        },
        {
          from: 'CHALLENGED' as DoormanState,
          to: 'LOCKED' as DoormanState,
          event: 'PANIC_GESTURE' as const,
          guard: (_ctx, event) => {
            const e = event as { type: 'PANIC_GESTURE'; decoyMode: boolean };
            return e.decoyMode === false;
          },
          action: () => ({
            lockEndsAt: Date.now() + config.lockDurationMs * config.panicLockMultiplier,
            challenge: null,
            capability: null,
          }),
        },
        // From VERIFYING state (panic detected after claiming verification lock)
        {
          from: 'VERIFYING' as DoormanState,
          to: 'DECOY' as DoormanState,
          event: 'PANIC_GESTURE' as const,
          guard: (_ctx, event) => {
            const e = event as { type: 'PANIC_GESTURE'; decoyMode: boolean };
            return e.decoyMode === true;
          },
          action: () => ({
            admissionEndsAt: Date.now() + config.decoyTtlMs,
            challenge: null,
            capability: null,
          }),
        },
        {
          from: 'VERIFYING' as DoormanState,
          to: 'LOCKED' as DoormanState,
          event: 'PANIC_GESTURE' as const,
          guard: (_ctx, event) => {
            const e = event as { type: 'PANIC_GESTURE'; decoyMode: boolean };
            return e.decoyMode === false;
          },
          action: () => ({
            lockEndsAt: Date.now() + config.lockDurationMs * config.panicLockMultiplier,
            challenge: null,
            capability: null,
          }),
        },
      ] as Transition[])
    : []),
];

// ============================================================================
// Utility Functions
// ============================================================================

function randomHex(byteLength: number): string {
  if (
    typeof globalThis.crypto === 'undefined' ||
    typeof globalThis.crypto.getRandomValues !== 'function'
  ) {
    throw new Error('[Doorman] crypto.getRandomValues is required');
  }

  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateNonce(): string {
  return randomHex(32);
}

function generateSalt(): string {
  return randomHex(16);
}

// ============================================================================
// Store Definition
// ============================================================================

interface DoormanStore extends DoormanContext {
  config: DoormanConfig;
  transitions: Transition[];

  // Actions
  dispatch: (event: DoormanEvent) => void;
  reset: () => void;
  setConfig: (config: Partial<DoormanConfig>) => void;

  // Computed
  isAdmitted: () => boolean;
  timeRemaining: () => number | null;
}

const INITIAL_CONTEXT: DoormanContext = {
  state: 'IDLE',
  challenge: null,
  consecutiveFailures: 0,
  cooldownEndsAt: null,
  lockEndsAt: null,
  admissionEndsAt: null,
  capability: null,
};

function createDoormanStoreImpl(set: StoreApi<DoormanStore>["setState"], get: StoreApi<DoormanStore>["getState"]): DoormanStore {
  return {
    ...INITIAL_CONTEXT,
    config: DEFAULT_DOORMAN_CONFIG,
    transitions: createTransitions(DEFAULT_DOORMAN_CONFIG),

    dispatch: (event: DoormanEvent) => {
      const { state, transitions, ...context } = get();
      const currentContext: DoormanContext = { state, ...context };

      const transition = transitions.find((t: Transition) => {
        if (t.from !== state) return false;
        if (t.event !== event.type) return false;
        if (t.guard && !t.guard(currentContext, event)) return false;
        return true;
      });

      if (!transition) {
        console.warn(
          `[Doorman] No valid transition from ${state} on event ${event.type}`
        );
        return;
      }

      const updates = transition.action?.(currentContext, event) || {};
      set({
        state: transition.to,
        ...updates,
      });
    },

    reset: () => {
      set(INITIAL_CONTEXT);
    },

    setConfig: (partialConfig: Partial<DoormanConfig>) => {
      const newConfig = { ...get().config, ...partialConfig };
      set({
        config: newConfig,
        transitions: createTransitions(newConfig),
      });
    },

    isAdmitted: () => get().state === 'ADMITTED',

    timeRemaining: () => {
      const { state, challenge, cooldownEndsAt, lockEndsAt, admissionEndsAt } =
        get();
      const now = Date.now();

      switch (state) {
        case 'CHALLENGED':
          return challenge ? Math.max(0, challenge.expiresAt - now) : null;
        case 'COOLDOWN':
          return cooldownEndsAt ? Math.max(0, cooldownEndsAt - now) : null;
        case 'LOCKED':
          return lockEndsAt ? Math.max(0, lockEndsAt - now) : null;
        case 'ADMITTED':
        case 'DECOY':
          return admissionEndsAt ? Math.max(0, admissionEndsAt - now) : null;
        default:
          return null;
      }
    },
  };
}

/** Factory: creates an isolated Doorman store instance with subscribeWithSelector middleware. */
export function createDoormanStore() {
  return createStore<DoormanStore>()(
    subscribeWithSelector((set, get) => createDoormanStoreImpl(set, get))
  );
}

export type DoormanStoreApi = ReturnType<typeof createDoormanStore>;

// Legacy singleton
export const useDoormanStore = create<DoormanStore>()(
  subscribeWithSelector((set, get) => createDoormanStoreImpl(set, get))
);

// ============================================================================
// Timeout Management
// ============================================================================

/**
 * Start automatic timeout handling based on state changes.
 * Accepts an optional store instance; defaults to the legacy singleton.
 */
export function startDoormanTimeouts(storeApi?: DoormanStoreApi): () => void {
  const api = storeApi ?? useDoormanStore;

  let challengeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let cooldownTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lockTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let admissionTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const unsubscribe = api.subscribe(
    (state) => state.state,
    (doormanState, _prevState) => {
      const store = api.getState();

      // Clear all timeouts on state change
      if (challengeTimeoutId) clearTimeout(challengeTimeoutId);
      if (cooldownTimeoutId) clearTimeout(cooldownTimeoutId);
      if (lockTimeoutId) clearTimeout(lockTimeoutId);
      if (admissionTimeoutId) clearTimeout(admissionTimeoutId);

      // Set new timeout based on current state
      switch (doormanState) {
        case 'CHALLENGED':
          if (store.challenge) {
            const remaining = store.challenge.expiresAt - Date.now();
            if (remaining > 0) {
              challengeTimeoutId = setTimeout(() => {
                store.dispatch({ type: 'CHALLENGE_TIMEOUT' });
              }, remaining);
            }
          }
          break;

        case 'COOLDOWN':
          if (store.cooldownEndsAt) {
            const remaining = store.cooldownEndsAt - Date.now();
            if (remaining > 0) {
              cooldownTimeoutId = setTimeout(() => {
                store.dispatch({ type: 'COOLDOWN_ELAPSED' });
              }, remaining);
            }
          }
          break;

        case 'LOCKED':
          if (store.lockEndsAt) {
            const remaining = store.lockEndsAt - Date.now();
            if (remaining > 0) {
              lockTimeoutId = setTimeout(() => {
                store.dispatch({ type: 'LOCK_EXPIRED' });
              }, remaining);
            }
          }
          break;

        case 'ADMITTED':
        case 'DECOY':
          if (store.admissionEndsAt) {
            const remaining = store.admissionEndsAt - Date.now();
            if (remaining > 0) {
              admissionTimeoutId = setTimeout(() => {
                store.dispatch({ type: 'ADMISSION_TIMEOUT' });
              }, remaining);
            }
          }
          break;
      }
    }
  );

  return () => {
    unsubscribe();
    if (challengeTimeoutId) clearTimeout(challengeTimeoutId);
    if (cooldownTimeoutId) clearTimeout(cooldownTimeoutId);
    if (lockTimeoutId) clearTimeout(lockTimeoutId);
    if (admissionTimeoutId) clearTimeout(admissionTimeoutId);
  };
}

export default useDoormanStore;
