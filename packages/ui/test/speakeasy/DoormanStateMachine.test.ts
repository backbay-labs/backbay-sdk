import { describe, it, expect, beforeAll, beforeEach } from 'bun:test';
import { webcrypto } from 'node:crypto';

import { useDoormanStore } from '../../src/speakeasy/doorman/DoormanStateMachine.js';
import type { CapabilityToken, GestureSequence } from '../../src/speakeasy/types.js';

beforeAll(() => {
  const hasSubtle = typeof globalThis.crypto !== 'undefined' && !!globalThis.crypto.subtle;
  if (!hasSubtle) {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      configurable: true,
    });
  }
});

describe('DoormanStateMachine', () => {
  beforeEach(() => {
    useDoormanStore.getState().reset();
  });

  it('issues a challenge on knock', () => {
    const now = Date.now();
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: now });

    const state = useDoormanStore.getState();
    expect(state.state).toBe('CHALLENGED');
    expect(state.challenge).not.toBeNull();
    expect(state.challenge?.issuedAt).toBe(now);
    expect(state.challenge?.expiresAt).toBe(now + state.config.challengeWindowMs);
    expect(state.challenge?.nonce).toMatch(/^[0-9a-f]{64}$/);
    expect(state.challenge?.salt).toMatch(/^[0-9a-f]{32}$/);
  });

  it('moves to VERIFYING when gesture completes within window', () => {
    const now = Date.now();
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: now });

    const gesture: GestureSequence = {
      steps: [{ type: 'tap', count: 1, region: 'center' }],
      totalDurationMs: 120,
      rhythmHash: '00',
      timestamp: now,
    };

    useDoormanStore.getState().dispatch({ type: 'GESTURE_COMPLETE', gestureData: gesture });

    expect(useDoormanStore.getState().state).toBe('VERIFYING');
  });

  it('admits on VERIFICATION_SUCCESS and sets admission TTL', () => {
    const now = Date.now();
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: now });

    const gesture: GestureSequence = {
      steps: [{ type: 'tap', count: 1, region: 'center' }],
      totalDurationMs: 120,
      rhythmHash: '00',
      timestamp: now,
    };

    useDoormanStore.getState().dispatch({ type: 'GESTURE_COMPLETE', gestureData: gesture });

    const token: CapabilityToken = {
      tokenId: 'token-1',
      issuer: 'bb-ui:speakeasy',
      scopes: ['speakeasy.*'],
      notBefore: now,
      expiresAt: now + 60_000,
      signature: 'deadbeef',
    };

    useDoormanStore.getState().dispatch({ type: 'VERIFICATION_SUCCESS', capability: token });

    const state = useDoormanStore.getState();
    expect(state.state).toBe('ADMITTED');
    expect(state.capability?.tokenId).toBe('token-1');
    expect(state.admissionEndsAt).toBe(now + state.config.admissionTtlMs);
    expect(state.consecutiveFailures).toBe(0);
  });

  it('locks out after max consecutive failures', () => {
    const now = Date.now();

    const gesture: GestureSequence = {
      steps: [{ type: 'tap', count: 1, region: 'center' }],
      totalDurationMs: 120,
      rhythmHash: '00',
      timestamp: now,
    };

    // Fail 1
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: now });
    useDoormanStore.getState().dispatch({ type: 'GESTURE_COMPLETE', gestureData: gesture });
    useDoormanStore.getState().dispatch({ type: 'VERIFICATION_FAILURE', reason: 'invalid' });
    expect(useDoormanStore.getState().state).toBe('COOLDOWN');
    useDoormanStore.getState().dispatch({ type: 'COOLDOWN_ELAPSED' });
    expect(useDoormanStore.getState().state).toBe('IDLE');

    // Fail 2
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: now });
    useDoormanStore.getState().dispatch({ type: 'GESTURE_COMPLETE', gestureData: gesture });
    useDoormanStore.getState().dispatch({ type: 'VERIFICATION_FAILURE', reason: 'invalid' });
    expect(useDoormanStore.getState().state).toBe('COOLDOWN');
    useDoormanStore.getState().dispatch({ type: 'COOLDOWN_ELAPSED' });
    expect(useDoormanStore.getState().state).toBe('IDLE');

    // Fail 3 -> locked
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: now });
    useDoormanStore.getState().dispatch({ type: 'GESTURE_COMPLETE', gestureData: gesture });
    useDoormanStore.getState().dispatch({ type: 'VERIFICATION_FAILURE', reason: 'invalid' });
    expect(useDoormanStore.getState().state).toBe('LOCKED');
    expect(useDoormanStore.getState().lockEndsAt).not.toBeNull();
  });

  it('supports panic gesture lock vs decoy', () => {
    const now = Date.now();
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: now });

    useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: true });
    expect(useDoormanStore.getState().state).toBe('DECOY');

    useDoormanStore.getState().dispatch({ type: 'EXIT_REQUESTED' });
    expect(useDoormanStore.getState().state).toBe('IDLE');

    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: now });
    useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: false });
    expect(useDoormanStore.getState().state).toBe('LOCKED');
  });
});
