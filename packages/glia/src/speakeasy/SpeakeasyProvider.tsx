/**
 * SpeakeasyProvider
 *
 * React context that wires:
 * - doorman state machine (Zustand)
 * - auth verifier (gesture -> response)
 * - capability token issuance
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { startDoormanTimeouts, useDoormanStore } from './doorman/DoormanStateMachine.js';
import type {
  CapabilityToken,
  DoormanConfig,
  GestureSequence,
  SpeakeasyContextValue,
  SpeakeasyPrivateContextValue,
  SpeakeasyPublicContextValue,
} from './types.js';
import { DEFAULT_DOORMAN_CONFIG } from './types.js';
import { SpeakeasyAuth, type SpeakeasyAuthOptions } from './auth/SpeakeasyAuth.js';
import { createCapabilityToken } from './auth/CapabilityIssuer.js';
import type { SpeakeasyStorage } from './auth/storage.js';
import { isPanicGesture } from './doorman/panic.js';
import {
  createDefaultDeviceSecretProvider,
  type SpeakeasyDeviceSecretProvider,
} from './auth/deviceSecret.js';

// =============================================================================
// Errors
// =============================================================================

/**
 * Error thrown when an operation requires auth but device secret is not yet resolved.
 */
export class SpeakeasyNotReadyError extends Error {
  constructor(operation: string) {
    super(`[Speakeasy] ${operation}: device secret not yet resolved`);
    this.name = 'SpeakeasyNotReadyError';
  }
}

/**
 * Asserts that auth is ready, throwing SpeakeasyNotReadyError if not.
 * Use this for user-initiated operations that cannot silently fail.
 */
function assertAuthReady(auth: SpeakeasyAuth | null, operation: string): asserts auth is SpeakeasyAuth {
  if (!auth) {
    throw new SpeakeasyNotReadyError(operation);
  }
}

// =============================================================================
// Context
// =============================================================================

/** Public context - safe for all components */
const SpeakeasyPublicContext = createContext<SpeakeasyPublicContextValue | null>(null);

/** Private context - only for trusted components handling sensitive data */
const SpeakeasyPrivateContext = createContext<SpeakeasyPrivateContextValue | null>(null);

/** Legacy combined context (deprecated) */
const SpeakeasyContext = createContext<SpeakeasyContextValue | null>(null);

export interface SpeakeasyProviderProps {
  children: ReactNode;
  /** Override doorman timings and thresholds */
  doormanConfig?: Partial<DoormanConfig>;
  /** Inject a storage backend (keychain/enclave/etc.) */
  storage?: SpeakeasyStorage;
  /** Domain binding for anti-phishing */
  domain?: string;
  /** Optional device-bound secret (host-provided) */
  deviceSecret?: SpeakeasyAuthOptions['deviceSecret'];
  /** Device secret provider (keychain/enclave/etc.) */
  deviceSecretProvider?: SpeakeasyDeviceSecretProvider;
  /** Capability issuer identity string */
  issuer?: string;
  /** Capability scopes granted on admit */
  scopes?: string[];
  /** Called after successful admission */
  onAdmitted?: (capability: CapabilityToken) => void;
  /** Called on exit */
  onExit?: () => void;
}

export function SpeakeasyProvider({
  children,
  doormanConfig,
  storage,
  domain,
  deviceSecret,
  deviceSecretProvider,
  issuer = 'bb-ui:speakeasy',
  scopes = ['speakeasy.*'],
  onAdmitted,
  onExit,
}: SpeakeasyProviderProps) {
  const state = useDoormanStore((s) => s.state);
  const capability = useDoormanStore((s) => s.capability);

  const [resolvedDeviceSecret, setResolvedDeviceSecret] = useState<
    SpeakeasyAuthOptions['deviceSecret'] | undefined
  >(deviceSecret);

  useEffect(() => {
    let cancelled = false;
    if (deviceSecret !== undefined) {
      setResolvedDeviceSecret(deviceSecret);
      return;
    }

    const provider = deviceSecretProvider ?? createDefaultDeviceSecretProvider();
    provider.getOrCreateDeviceSecret().then((secret) => {
      if (!cancelled) setResolvedDeviceSecret(secret);
    });

    return () => {
      cancelled = true;
    };
  }, [deviceSecret, deviceSecretProvider]);

  // Auth is only created once deviceSecret is resolved (prevents race condition)
  const auth = useMemo(() => {
    if (resolvedDeviceSecret === undefined) {
      return null; // Not ready yet
    }
    return new SpeakeasyAuth({
      storage,
      domain,
      deviceSecret: resolvedDeviceSecret,
    });
  }, [storage, domain, resolvedDeviceSecret]);

  const [isRegistered, setIsRegistered] = useState(false);
  const [tick, setTick] = useState(0);

  // Apply config overrides
  useEffect(() => {
    if (!doormanConfig) return;
    useDoormanStore.getState().setConfig(doormanConfig);
  }, [doormanConfig]);

  // Start timeout management and reset state on unmount
  useEffect(() => {
    const cleanupTimeouts = startDoormanTimeouts();
    return () => {
      cleanupTimeouts();
      useDoormanStore.getState().reset();
    };
  }, []);

  // Load registration status (only when auth is ready)
  useEffect(() => {
    if (!auth) {
      setIsRegistered(false);
      return;
    }
    let cancelled = false;
    auth.isRegistered().then((registered) => {
      if (!cancelled) setIsRegistered(registered);
    });
    return () => {
      cancelled = true;
    };
  }, [auth]);

  // Basic tick to keep timeRemaining fresh for UI
  useEffect(() => {
    if (
      state !== 'CHALLENGED' &&
      state !== 'COOLDOWN' &&
      state !== 'LOCKED' &&
      state !== 'ADMITTED'
    ) {
      return;
    }
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [state]);

  const knock = useCallback(() => {
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
  }, []);

  const exit = useCallback(() => {
    useDoormanStore.getState().dispatch({ type: 'EXIT_REQUESTED' });
    onExit?.();
  }, [onExit]);

  const register = useCallback(
    async (gesture: GestureSequence) => {
      // User-initiated: throw if not ready
      assertAuthReady(auth, 'register');
      await auth.registerGesture(gesture);
      setIsRegistered(true);
    },
    [auth]
  );

  const clearRegistration = useCallback(async () => {
    // User-initiated: throw if not ready
    assertAuthReady(auth, 'clearRegistration');
    await auth.clear();
    setIsRegistered(false);
  }, [auth]);

  const submitGesture = useCallback(
    async (gesture: GestureSequence) => {
      // User-initiated: throw if not ready
      assertAuthReady(auth, 'submitGesture');

      const store = useDoormanStore.getState();
      const challenge = store.challenge;

      if (store.state !== 'CHALLENGED' || !challenge) return;

      // Atomically claim the VERIFYING state BEFORE any async work
      // This prevents race conditions where multiple submissions could proceed
      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: gesture });

      // Re-check state after dispatch - if not VERIFYING, another submission won the race
      if (useDoormanStore.getState().state !== 'VERIFYING') {
        // Either challenge expired or another submission won the race; bail out
        return;
      }

      // Now we have exclusive ownership of the VERIFYING state
      // Check for panic gesture (must happen after claiming state to prevent bypass)
      if (store.config.panicGestureEnabled && isPanicGesture(gesture)) {
        store.dispatch({
          type: 'PANIC_GESTURE',
          decoyMode: store.config.panicAction === 'decoy',
        });
        return;
      }

      if (!(await auth.isRegistered())) {
        // Not a failure attempt; just cancel the challenge.
        store.dispatch({ type: 'EXIT_REQUESTED' });
        return;
      }

      const result = await auth.verifyGesture(gesture, challenge);
      if (!result.ok) {
        store.dispatch({
          type: 'VERIFICATION_FAILURE',
          reason: result.reason ?? 'invalid',
        });
        return;
      }

      const verifier = await auth.getVerifier();
      if (!verifier) {
        store.dispatch({ type: 'VERIFICATION_FAILURE', reason: 'not_registered' });
        return;
      }

      const config = store.config ?? DEFAULT_DOORMAN_CONFIG;
      const token = await createCapabilityToken({
        verifierKeyHex: verifier.hash,
        issuer,
        scopes,
        ttlMs: config.admissionTtlMs,
      });

      store.dispatch({ type: 'VERIFICATION_SUCCESS', capability: token });
      onAdmitted?.(token);
    },
    [auth, issuer, scopes, onAdmitted]
  );

  const isReady = auth !== null;

  const publicContextValue = useMemo<SpeakeasyPublicContextValue>(() => {
    const store = useDoormanStore.getState();
    return {
      state,
      isReady,
      isAdmitted: state === 'ADMITTED',
      isDecoy: state === 'DECOY',
      knock,
      exit,
      timeRemaining: store.timeRemaining(),
    };
  }, [state, isReady, knock, exit, tick]);

  const privateContextValue = useMemo<SpeakeasyPrivateContextValue>(
    () => ({
      capability,
      isRegistered,
      register,
      clearRegistration,
      submitGesture,
    }),
    [capability, isRegistered, register, clearRegistration, submitGesture]
  );

  // Combined context for legacy support
  const contextValue = useMemo<SpeakeasyContextValue>(
    () => ({
      ...publicContextValue,
      ...privateContextValue,
    }),
    [publicContextValue, privateContextValue]
  );

  return (
    <SpeakeasyPublicContext.Provider value={publicContextValue}>
      <SpeakeasyPrivateContext.Provider value={privateContextValue}>
        <SpeakeasyContext.Provider value={contextValue}>
          {children}
        </SpeakeasyContext.Provider>
      </SpeakeasyPrivateContext.Provider>
    </SpeakeasyPublicContext.Provider>
  );
}

/**
 * Hook for public speakeasy state - safe for all components.
 * Use this when you only need to read state or trigger knock/exit.
 */
export function useSpeakeasyPublic(): SpeakeasyPublicContextValue {
  const ctx = useContext(SpeakeasyPublicContext);
  if (!ctx) {
    throw new Error('useSpeakeasyPublic must be used within a SpeakeasyProvider');
  }
  return ctx;
}

/**
 * Hook for private speakeasy state - only for trusted components.
 * Use this when you need access to capability tokens or registration.
 */
export function useSpeakeasyPrivate(): SpeakeasyPrivateContextValue {
  const ctx = useContext(SpeakeasyPrivateContext);
  if (!ctx) {
    throw new Error('useSpeakeasyPrivate must be used within a SpeakeasyProvider');
  }
  return ctx;
}

/**
 * Combined hook for full speakeasy context.
 * @deprecated Use useSpeakeasyPublic() or useSpeakeasyPrivate() for better security isolation.
 */
export function useSpeakeasy(): SpeakeasyContextValue {
  const ctx = useContext(SpeakeasyContext);
  if (!ctx) {
    throw new Error('useSpeakeasy must be used within a SpeakeasyProvider');
  }
  return ctx;
}
