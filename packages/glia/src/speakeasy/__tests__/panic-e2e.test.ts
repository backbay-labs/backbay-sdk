/**
 * End-to-end tests for panic gesture flow through DoormanStateMachine.
 *
 * Tests the full panic flow: gesture detection -> state machine transition -> decoy/lock.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { isPanicGesture, DEFAULT_PANIC_GESTURE_PATTERN } from '../doorman/panic.js';
import { useDoormanStore } from '../doorman/DoormanStateMachine.js';
import { DEFAULT_DOORMAN_CONFIG } from '../types.js';
import type { GestureSequence } from '../types.js';

function createPanicGesture(): GestureSequence {
  return {
    steps: [
      { type: 'tap', count: 5, region: 'center' },
      { type: 'hold', durationMs: 3000, region: 'edge' },
    ],
    totalDurationMs: 4000,
    rhythmHash: 'panic-rhythm',
    timestamp: Date.now(),
  };
}

function createNormalGesture(): GestureSequence {
  return {
    steps: [
      { type: 'tap', count: 3, region: 'center' },
    ],
    totalDurationMs: 500,
    rhythmHash: 'normal-rhythm',
    timestamp: Date.now(),
  };
}

describe('panic gesture e2e', () => {
  beforeEach(() => {
    useDoormanStore.getState().reset();
    useDoormanStore.getState().setConfig({
      panicGestureEnabled: true,
      panicAction: 'decoy',
      panicLockMultiplier: 2,
    });
  });

  describe('panic detection -> state machine', () => {
    it('detects panic gesture and transitions CHALLENGED -> DECOY when decoyMode=true', () => {
      const panicGesture = createPanicGesture();

      // Verify it IS a panic gesture
      expect(isPanicGesture(panicGesture)).toBe(true);

      // Knock -> CHALLENGED
      useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      expect(useDoormanStore.getState().state).toBe('CHALLENGED');

      // Dispatch panic with decoy mode
      useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: true });

      const state = useDoormanStore.getState();
      expect(state.state).toBe('DECOY');
      expect(state.admissionEndsAt).not.toBeNull();
      expect(state.challenge).toBeNull();
      expect(state.capability).toBeNull();
    });

    it('detects panic gesture and transitions CHALLENGED -> LOCKED when decoyMode=false', () => {
      const panicGesture = createPanicGesture();
      expect(isPanicGesture(panicGesture)).toBe(true);

      useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });

      useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: false });

      const state = useDoormanStore.getState();
      expect(state.state).toBe('LOCKED');
      expect(state.lockEndsAt).not.toBeNull();
      expect(state.challenge).toBeNull();
      // Lock duration should be multiplied by panicLockMultiplier
      const expectedLockEnd = Date.now() + DEFAULT_DOORMAN_CONFIG.lockDurationMs * 2;
      expect(state.lockEndsAt!).toBeGreaterThanOrEqual(expectedLockEnd - 100);
      expect(state.lockEndsAt!).toBeLessThanOrEqual(expectedLockEnd + 100);
    });

    it('normal gesture is NOT detected as panic', () => {
      const normalGesture = createNormalGesture();
      expect(isPanicGesture(normalGesture)).toBe(false);
    });
  });

  describe('panic from VERIFYING state', () => {
    it('transitions VERIFYING -> DECOY when decoyMode=true', () => {
      const gesture = createNormalGesture();

      useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      useDoormanStore.getState().dispatch({ type: 'GESTURE_COMPLETE', gestureData: gesture });
      expect(useDoormanStore.getState().state).toBe('VERIFYING');

      useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: true });

      const state = useDoormanStore.getState();
      expect(state.state).toBe('DECOY');
      expect(state.admissionEndsAt).not.toBeNull();
      // Decoy TTL should match config
      const expectedEnd = Date.now() + DEFAULT_DOORMAN_CONFIG.decoyTtlMs;
      expect(state.admissionEndsAt!).toBeGreaterThanOrEqual(expectedEnd - 100);
      expect(state.admissionEndsAt!).toBeLessThanOrEqual(expectedEnd + 100);
    });

    it('transitions VERIFYING -> LOCKED when decoyMode=false', () => {
      const gesture = createNormalGesture();

      useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      useDoormanStore.getState().dispatch({ type: 'GESTURE_COMPLETE', gestureData: gesture });
      expect(useDoormanStore.getState().state).toBe('VERIFYING');

      useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: false });

      const state = useDoormanStore.getState();
      expect(state.state).toBe('LOCKED');
      expect(state.lockEndsAt).not.toBeNull();
    });
  });

  describe('DECOY state behavior', () => {
    it('DECOY has no real capability token', () => {
      useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: true });

      const state = useDoormanStore.getState();
      expect(state.state).toBe('DECOY');
      expect(state.capability).toBeNull();
    });

    it('DECOY auto-expires via ADMISSION_TIMEOUT', () => {
      useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: true });
      expect(useDoormanStore.getState().state).toBe('DECOY');

      // Simulate timeout
      useDoormanStore.getState().dispatch({ type: 'ADMISSION_TIMEOUT' });
      const state = useDoormanStore.getState();
      expect(state.state).toBe('IDLE');
      expect(state.admissionEndsAt).toBeNull();
      expect(state.capability).toBeNull();
    });

    it('DECOY can be exited manually', () => {
      useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: true });
      expect(useDoormanStore.getState().state).toBe('DECOY');

      useDoormanStore.getState().dispatch({ type: 'EXIT_REQUESTED' });
      expect(useDoormanStore.getState().state).toBe('IDLE');
    });
  });

  describe('panic LOCKED state behavior', () => {
    it('LOCKED from panic uses multiplied duration', () => {
      useDoormanStore.getState().setConfig({
        panicGestureEnabled: true,
        panicLockMultiplier: 3,
        lockDurationMs: 100_000,
      });

      useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: false });

      const state = useDoormanStore.getState();
      expect(state.state).toBe('LOCKED');
      // 100_000ms * 3 = 300_000ms
      const expectedEnd = Date.now() + 300_000;
      expect(state.lockEndsAt!).toBeGreaterThanOrEqual(expectedEnd - 100);
      expect(state.lockEndsAt!).toBeLessThanOrEqual(expectedEnd + 100);
    });

    it('LOCKED from panic recovers via LOCK_EXPIRED', () => {
      useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: false });
      expect(useDoormanStore.getState().state).toBe('LOCKED');

      useDoormanStore.getState().dispatch({ type: 'LOCK_EXPIRED' });
      const state = useDoormanStore.getState();
      expect(state.state).toBe('IDLE');
      expect(state.lockEndsAt).toBeNull();
      expect(state.consecutiveFailures).toBe(0);
    });
  });

  describe('panic disabled', () => {
    it('PANIC_GESTURE does nothing when panicGestureEnabled=false', () => {
      useDoormanStore.getState().setConfig({ panicGestureEnabled: false });

      useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      expect(useDoormanStore.getState().state).toBe('CHALLENGED');

      useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: true });
      // Should stay in CHALLENGED
      expect(useDoormanStore.getState().state).toBe('CHALLENGED');

      useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: false });
      // Still CHALLENGED
      expect(useDoormanStore.getState().state).toBe('CHALLENGED');
    });
  });
});
