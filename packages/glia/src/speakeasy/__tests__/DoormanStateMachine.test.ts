/**
 * Tests for DoormanStateMachine state transitions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  useDoormanStore,
} from '../doorman/DoormanStateMachine.js';
import type { CapabilityToken, GestureSequence } from '../types.js';

function createMockCapability(): CapabilityToken {
  return {
    tokenId: 'test-token',
    issuer: 'test-issuer',
    scopes: ['speakeasy.*'],
    notBefore: Date.now(),
    expiresAt: Date.now() + 300_000,
    signature: 'mock-signature',
  };
}

function createMockGesture(): GestureSequence {
  return {
    steps: [{ type: 'tap', count: 3, region: 'center' }],
    totalDurationMs: 1000,
    rhythmHash: 'abc123',
    timestamp: Date.now(),
  };
}

describe('DoormanStateMachine', () => {
  beforeEach(() => {
    useDoormanStore.getState().reset();
  });

  describe('initial state', () => {
    it('starts in IDLE state', () => {
      const state = useDoormanStore.getState();
      expect(state.state).toBe('IDLE');
      expect(state.challenge).toBeNull();
      expect(state.capability).toBeNull();
      expect(state.consecutiveFailures).toBe(0);
    });
  });

  describe('IDLE → CHALLENGED', () => {
    it('transitions on KNOCK_DETECTED', () => {
      const store = useDoormanStore.getState();
      const now = Date.now();

      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: now });

      const state = useDoormanStore.getState();
      expect(state.state).toBe('CHALLENGED');
      expect(state.challenge).not.toBeNull();
      expect(state.challenge?.nonce).toHaveLength(64); // 32 bytes hex
      expect(state.challenge?.salt).toHaveLength(32); // 16 bytes hex
      expect(state.challenge?.issuedAt).toBe(now);
      expect(state.challenge?.expiresAt).toBe(now + 30_000); // Default 30s window
    });
  });

  describe('CHALLENGED → VERIFYING', () => {
    it('transitions on GESTURE_COMPLETE within window', () => {
      const store = useDoormanStore.getState();
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      expect(useDoormanStore.getState().state).toBe('CHALLENGED');

      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
      expect(useDoormanStore.getState().state).toBe('VERIFYING');
    });

    it('does not transition when challenge expired', () => {
      const store = useDoormanStore.getState();
      // Create a challenge that's already expired
      const pastTime = Date.now() - 60_000; // 1 minute ago
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: pastTime });

      // The challenge window has passed
      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
      // Should not transition due to guard (challenge expired)
      expect(useDoormanStore.getState().state).toBe('CHALLENGED');
    });
  });

  describe('CHALLENGED → IDLE (timeout)', () => {
    it('transitions on CHALLENGE_TIMEOUT', () => {
      const store = useDoormanStore.getState();
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      expect(useDoormanStore.getState().state).toBe('CHALLENGED');

      store.dispatch({ type: 'CHALLENGE_TIMEOUT' });
      const state = useDoormanStore.getState();
      expect(state.state).toBe('IDLE');
      expect(state.challenge).toBeNull();
    });
  });

  describe('CHALLENGED → IDLE (user exit)', () => {
    it('transitions on EXIT_REQUESTED', () => {
      const store = useDoormanStore.getState();
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });

      store.dispatch({ type: 'EXIT_REQUESTED' });
      expect(useDoormanStore.getState().state).toBe('IDLE');
    });
  });

  describe('VERIFYING → ADMITTED', () => {
    it('transitions on VERIFICATION_SUCCESS', () => {
      const store = useDoormanStore.getState();
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
      expect(useDoormanStore.getState().state).toBe('VERIFYING');

      const capability = createMockCapability();
      store.dispatch({ type: 'VERIFICATION_SUCCESS', capability });

      const state = useDoormanStore.getState();
      expect(state.state).toBe('ADMITTED');
      expect(state.capability).toBe(capability);
      expect(state.challenge).toBeNull();
      expect(state.consecutiveFailures).toBe(0);
      expect(state.admissionEndsAt).toBeGreaterThan(Date.now());
    });
  });

  describe('VERIFYING → COOLDOWN (under threshold)', () => {
    it('transitions on VERIFICATION_FAILURE with exponential backoff', () => {
      const store = useDoormanStore.getState();

      // First failure
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
      store.dispatch({ type: 'VERIFICATION_FAILURE', reason: 'invalid' });

      const state = useDoormanStore.getState();
      expect(state.state).toBe('COOLDOWN');
      expect(state.consecutiveFailures).toBe(1);
      expect(state.cooldownEndsAt).not.toBeNull();

      // Cooldown should be 1s for first failure
      const firstCooldown = state.cooldownEndsAt! - Date.now();
      expect(firstCooldown).toBeGreaterThan(900);
      expect(firstCooldown).toBeLessThanOrEqual(1100);
    });
  });

  describe('VERIFYING → LOCKED (at threshold)', () => {
    it('transitions on third failure', () => {
      const store = useDoormanStore.getState();

      // Simulate 2 failures + cooldowns
      for (let i = 0; i < 2; i++) {
        store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
        store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
        store.dispatch({ type: 'VERIFICATION_FAILURE', reason: 'invalid' });
        store.dispatch({ type: 'COOLDOWN_ELAPSED' });
      }

      // Third failure should trigger lock
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
      store.dispatch({ type: 'VERIFICATION_FAILURE', reason: 'invalid' });

      const state = useDoormanStore.getState();
      expect(state.state).toBe('LOCKED');
      expect(state.consecutiveFailures).toBe(3);
      expect(state.lockEndsAt).not.toBeNull();
    });
  });

  describe('COOLDOWN → IDLE', () => {
    it('transitions on COOLDOWN_ELAPSED', () => {
      const store = useDoormanStore.getState();
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
      store.dispatch({ type: 'VERIFICATION_FAILURE', reason: 'invalid' });
      expect(useDoormanStore.getState().state).toBe('COOLDOWN');

      store.dispatch({ type: 'COOLDOWN_ELAPSED' });
      const state = useDoormanStore.getState();
      expect(state.state).toBe('IDLE');
      expect(state.cooldownEndsAt).toBeNull();
      // Failure count should persist
      expect(state.consecutiveFailures).toBe(1);
    });
  });

  describe('LOCKED → IDLE', () => {
    it('transitions on LOCK_EXPIRED and resets failures', () => {
      const store = useDoormanStore.getState();

      // Force into LOCKED state
      for (let i = 0; i < 3; i++) {
        store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
        store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
        store.dispatch({ type: 'VERIFICATION_FAILURE', reason: 'invalid' });
        if (i < 2) store.dispatch({ type: 'COOLDOWN_ELAPSED' });
      }
      expect(useDoormanStore.getState().state).toBe('LOCKED');

      store.dispatch({ type: 'LOCK_EXPIRED' });
      const state = useDoormanStore.getState();
      expect(state.state).toBe('IDLE');
      expect(state.lockEndsAt).toBeNull();
      expect(state.consecutiveFailures).toBe(0); // Reset on lock expire
    });
  });

  describe('ADMITTED → IDLE', () => {
    it('transitions on EXIT_REQUESTED', () => {
      const store = useDoormanStore.getState();
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
      store.dispatch({ type: 'VERIFICATION_SUCCESS', capability: createMockCapability() });
      expect(useDoormanStore.getState().state).toBe('ADMITTED');

      store.dispatch({ type: 'EXIT_REQUESTED' });
      const state = useDoormanStore.getState();
      expect(state.state).toBe('IDLE');
      expect(state.capability).toBeNull();
      expect(state.admissionEndsAt).toBeNull();
    });

    it('transitions on ADMISSION_TIMEOUT', () => {
      const store = useDoormanStore.getState();
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
      store.dispatch({ type: 'VERIFICATION_SUCCESS', capability: createMockCapability() });

      store.dispatch({ type: 'ADMISSION_TIMEOUT' });
      expect(useDoormanStore.getState().state).toBe('IDLE');
    });
  });

  describe('PANIC_GESTURE handling', () => {
    it('transitions CHALLENGED → DECOY when decoyMode=true', () => {
      const store = useDoormanStore.getState();
      store.setConfig({ panicGestureEnabled: true, panicAction: 'decoy' });
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });

      store.dispatch({ type: 'PANIC_GESTURE', decoyMode: true });
      const state = useDoormanStore.getState();
      expect(state.state).toBe('DECOY');
      expect(state.admissionEndsAt).not.toBeNull();
    });

    it('transitions CHALLENGED → LOCKED when decoyMode=false', () => {
      const store = useDoormanStore.getState();
      store.setConfig({ panicGestureEnabled: true, panicAction: 'lock' });
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });

      store.dispatch({ type: 'PANIC_GESTURE', decoyMode: false });
      expect(useDoormanStore.getState().state).toBe('LOCKED');
    });

    it('transitions VERIFYING → DECOY when decoyMode=true', () => {
      const store = useDoormanStore.getState();
      store.setConfig({ panicGestureEnabled: true, panicAction: 'decoy' });
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
      expect(useDoormanStore.getState().state).toBe('VERIFYING');

      store.dispatch({ type: 'PANIC_GESTURE', decoyMode: true });
      const state = useDoormanStore.getState();
      expect(state.state).toBe('DECOY');
      expect(state.admissionEndsAt).not.toBeNull();
    });

    it('transitions VERIFYING → LOCKED when decoyMode=false', () => {
      const store = useDoormanStore.getState();
      store.setConfig({ panicGestureEnabled: true, panicAction: 'lock' });
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
      expect(useDoormanStore.getState().state).toBe('VERIFYING');

      store.dispatch({ type: 'PANIC_GESTURE', decoyMode: false });
      expect(useDoormanStore.getState().state).toBe('LOCKED');
    });

    it('does nothing when panicGestureEnabled=false', () => {
      const store = useDoormanStore.getState();
      store.setConfig({ panicGestureEnabled: false });
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });

      store.dispatch({ type: 'PANIC_GESTURE', decoyMode: true });
      // Should stay in CHALLENGED since panic is disabled
      expect(useDoormanStore.getState().state).toBe('CHALLENGED');
    });
  });

  describe('DECOY state', () => {
    it('transitions to IDLE on EXIT_REQUESTED', () => {
      const store = useDoormanStore.getState();
      store.setConfig({ panicGestureEnabled: true });
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      store.dispatch({ type: 'PANIC_GESTURE', decoyMode: true });
      expect(useDoormanStore.getState().state).toBe('DECOY');

      store.dispatch({ type: 'EXIT_REQUESTED' });
      expect(useDoormanStore.getState().state).toBe('IDLE');
    });

    it('transitions to IDLE on ADMISSION_TIMEOUT', () => {
      const store = useDoormanStore.getState();
      store.setConfig({ panicGestureEnabled: true });
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      store.dispatch({ type: 'PANIC_GESTURE', decoyMode: true });

      store.dispatch({ type: 'ADMISSION_TIMEOUT' });
      expect(useDoormanStore.getState().state).toBe('IDLE');
    });
  });

  describe('computed values', () => {
    it('isAdmitted() returns true only in ADMITTED state', () => {
      const store = useDoormanStore.getState();
      expect(store.isAdmitted()).toBe(false);

      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      expect(useDoormanStore.getState().isAdmitted()).toBe(false);

      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
      store.dispatch({ type: 'VERIFICATION_SUCCESS', capability: createMockCapability() });
      expect(useDoormanStore.getState().isAdmitted()).toBe(true);
    });

    it('timeRemaining() returns correct values for each state', () => {
      const store = useDoormanStore.getState();

      // IDLE - null
      expect(store.timeRemaining()).toBeNull();

      // CHALLENGED - challenge window remaining
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      const challengeRemaining = useDoormanStore.getState().timeRemaining();
      expect(challengeRemaining).toBeGreaterThan(29_000);
      expect(challengeRemaining).toBeLessThanOrEqual(30_000);
    });
  });

  describe('reset()', () => {
    it('restores initial state', () => {
      const store = useDoormanStore.getState();
      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      store.dispatch({ type: 'GESTURE_COMPLETE', gestureData: createMockGesture() });
      store.dispatch({ type: 'VERIFICATION_FAILURE', reason: 'invalid' });

      store.reset();

      const state = useDoormanStore.getState();
      expect(state.state).toBe('IDLE');
      expect(state.challenge).toBeNull();
      expect(state.consecutiveFailures).toBe(0);
    });
  });

  describe('setConfig()', () => {
    it('updates config and recreates transitions', () => {
      const store = useDoormanStore.getState();
      store.setConfig({ challengeWindowMs: 60_000 });

      store.dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      const challenge = useDoormanStore.getState().challenge;
      expect(challenge?.expiresAt! - challenge?.issuedAt!).toBe(60_000);
    });
  });
});
