/**
 * Integration tests for the full Speakeasy handshake lifecycle.
 *
 * Exercises: register gesture -> knock -> challenge -> verify -> capability -> admitted
 * and failure paths (wrong gesture, lockout, panic, timeout).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SpeakeasyAuth } from '../auth/SpeakeasyAuth.js';
import { createInMemorySpeakeasyStorage } from '../auth/storage.js';
import { createCapabilityToken, verifyCapabilityToken } from '../auth/CapabilityIssuer.js';
import { useDoormanStore } from '../doorman/DoormanStateMachine.js';
import type { GestureSequence } from '../types.js';

function createGesture(overrides?: Partial<GestureSequence>): GestureSequence {
  return {
    steps: [
      { type: 'tap', count: 3, region: 'center' },
      { type: 'hold', durationMs: 550, region: 'edge' },
    ],
    totalDurationMs: 900,
    rhythmHash: 'test-rhythm',
    timestamp: Date.now(),
    ...overrides,
  };
}

function createWrongGesture(): GestureSequence {
  return createGesture({
    steps: [
      { type: 'tap', count: 1, region: 'edge' },
    ],
  });
}

describe('Speakeasy handshake lifecycle', () => {
  let auth: SpeakeasyAuth;
  let storage: ReturnType<typeof createInMemorySpeakeasyStorage>;

  beforeEach(() => {
    useDoormanStore.getState().reset();
    storage = createInMemorySpeakeasyStorage();
    auth = new SpeakeasyAuth({
      storage,
      domain: 'https://test.local',
      deviceSecret: 'integration-test-secret',
    });
  });

  it('completes full register -> challenge -> verify -> capability -> admitted flow', async () => {
    const gesture = createGesture();

    // 1. Register gesture
    const verifier = await auth.registerGesture(gesture);
    expect(verifier.hash).toHaveLength(64);
    expect(await auth.isRegistered()).toBe(true);

    // 2. Knock -> CHALLENGED
    const now = Date.now();
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: now });
    expect(useDoormanStore.getState().state).toBe('CHALLENGED');

    const challenge = useDoormanStore.getState().challenge;
    expect(challenge).not.toBeNull();

    // 3. Gesture complete -> VERIFYING
    useDoormanStore.getState().dispatch({ type: 'GESTURE_COMPLETE', gestureData: gesture });
    expect(useDoormanStore.getState().state).toBe('VERIFYING');

    // 4. Verify gesture via SpeakeasyAuth
    const result = await auth.verifyGesture(gesture, challenge!);
    expect(result.ok).toBe(true);
    expect(result.response).toHaveLength(64);

    // 5. Issue capability token
    const token = await createCapabilityToken({
      verifierKeyHex: verifier.hash,
      issuer: 'test-issuer',
      scopes: ['speakeasy:enter'],
      ttlMs: 60_000,
    });
    expect(token.tokenId).toBeDefined();
    expect(token.signature).toHaveLength(64);

    // 6. Dispatch success -> ADMITTED
    useDoormanStore.getState().dispatch({ type: 'VERIFICATION_SUCCESS', capability: token });
    expect(useDoormanStore.getState().state).toBe('ADMITTED');
    expect(useDoormanStore.getState().capability?.tokenId).toBe(token.tokenId);
    expect(useDoormanStore.getState().consecutiveFailures).toBe(0);

    // 7. Verify capability token is valid
    const valid = await verifyCapabilityToken({
      token,
      verifierKeyHex: verifier.hash,
    });
    expect(valid).toBe(true);
  });

  it('handles wrong gesture -> cooldown -> retry with correct gesture', async () => {
    const correctGesture = createGesture();
    const wrongGesture = createWrongGesture();

    await auth.registerGesture(correctGesture);

    // First attempt: wrong gesture
    const now = Date.now();
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: now });
    const challenge1 = useDoormanStore.getState().challenge!;

    useDoormanStore.getState().dispatch({ type: 'GESTURE_COMPLETE', gestureData: wrongGesture });
    expect(useDoormanStore.getState().state).toBe('VERIFYING');

    // Verify fails
    const badResult = await auth.verifyGesture(wrongGesture, challenge1);
    expect(badResult.ok).toBe(false);
    expect(badResult.reason).toBe('invalid_gesture');

    // Dispatch failure -> COOLDOWN
    useDoormanStore.getState().dispatch({ type: 'VERIFICATION_FAILURE', reason: 'invalid' });
    expect(useDoormanStore.getState().state).toBe('COOLDOWN');
    expect(useDoormanStore.getState().consecutiveFailures).toBe(1);

    // Wait for cooldown to elapse
    useDoormanStore.getState().dispatch({ type: 'COOLDOWN_ELAPSED' });
    expect(useDoormanStore.getState().state).toBe('IDLE');

    // Second attempt: correct gesture
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
    const challenge2 = useDoormanStore.getState().challenge!;
    useDoormanStore.getState().dispatch({ type: 'GESTURE_COMPLETE', gestureData: correctGesture });

    const goodResult = await auth.verifyGesture(correctGesture, challenge2);
    expect(goodResult.ok).toBe(true);

    const token = await createCapabilityToken({
      verifierKeyHex: (await auth.getVerifier())!.hash,
      issuer: 'test',
      scopes: ['speakeasy:enter'],
      ttlMs: 60_000,
    });

    useDoormanStore.getState().dispatch({ type: 'VERIFICATION_SUCCESS', capability: token });
    expect(useDoormanStore.getState().state).toBe('ADMITTED');
    expect(useDoormanStore.getState().consecutiveFailures).toBe(0);
  });

  it('handles max failures -> locked', async () => {
    const correctGesture = createGesture();
    const wrongGesture = createWrongGesture();

    await auth.registerGesture(correctGesture);

    // Fail 3 times (maxConsecutiveFailures default = 3)
    for (let i = 0; i < 3; i++) {
      useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
      useDoormanStore.getState().dispatch({ type: 'GESTURE_COMPLETE', gestureData: wrongGesture });

      const challenge = useDoormanStore.getState().challenge!;
      const result = await auth.verifyGesture(wrongGesture, challenge);
      expect(result.ok).toBe(false);

      useDoormanStore.getState().dispatch({ type: 'VERIFICATION_FAILURE', reason: 'invalid' });

      if (i < 2) {
        expect(useDoormanStore.getState().state).toBe('COOLDOWN');
        useDoormanStore.getState().dispatch({ type: 'COOLDOWN_ELAPSED' });
        expect(useDoormanStore.getState().state).toBe('IDLE');
      }
    }

    // Third failure should lock
    expect(useDoormanStore.getState().state).toBe('LOCKED');
    expect(useDoormanStore.getState().consecutiveFailures).toBe(3);
    expect(useDoormanStore.getState().lockEndsAt).not.toBeNull();

    // Cannot knock while locked
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
    expect(useDoormanStore.getState().state).toBe('LOCKED');

    // After lock expires, can try again
    useDoormanStore.getState().dispatch({ type: 'LOCK_EXPIRED' });
    expect(useDoormanStore.getState().state).toBe('IDLE');
    expect(useDoormanStore.getState().consecutiveFailures).toBe(0);
  });

  it('handles panic gesture -> decoy mode', async () => {
    const gesture = createGesture();
    await auth.registerGesture(gesture);

    useDoormanStore.getState().setConfig({ panicGestureEnabled: true, panicAction: 'decoy' });
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
    expect(useDoormanStore.getState().state).toBe('CHALLENGED');

    // Panic gesture detected
    useDoormanStore.getState().dispatch({ type: 'PANIC_GESTURE', decoyMode: true });

    const state = useDoormanStore.getState();
    expect(state.state).toBe('DECOY');
    expect(state.admissionEndsAt).not.toBeNull();
    // Decoy should NOT have a real capability
    expect(state.capability).toBeNull();

    // Decoy expires back to IDLE
    useDoormanStore.getState().dispatch({ type: 'ADMISSION_TIMEOUT' });
    expect(useDoormanStore.getState().state).toBe('IDLE');
  });

  it('handles challenge timeout', async () => {
    const gesture = createGesture();
    await auth.registerGesture(gesture);

    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
    expect(useDoormanStore.getState().state).toBe('CHALLENGED');

    // Challenge times out before gesture completion
    useDoormanStore.getState().dispatch({ type: 'CHALLENGE_TIMEOUT' });
    const state = useDoormanStore.getState();
    expect(state.state).toBe('IDLE');
    expect(state.challenge).toBeNull();
    // No failure increment on timeout (user just didn't act)
    expect(state.consecutiveFailures).toBe(0);
  });

  it('rejects expired challenge guard', async () => {
    const gesture = createGesture();
    await auth.registerGesture(gesture);

    // Create a challenge that's already expired
    const pastTime = Date.now() - 60_000;
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: pastTime });
    expect(useDoormanStore.getState().state).toBe('CHALLENGED');

    // Gesture complete should NOT transition because challenge expired
    useDoormanStore.getState().dispatch({ type: 'GESTURE_COMPLETE', gestureData: gesture });
    expect(useDoormanStore.getState().state).toBe('CHALLENGED');
  });

  it('capability token rejected after expiry', async () => {
    const gesture = createGesture();
    const verifier = await auth.registerGesture(gesture);

    // Create a token that already expired
    const token = await createCapabilityToken({
      verifierKeyHex: verifier.hash,
      issuer: 'test',
      scopes: ['speakeasy:enter'],
      ttlMs: 1, // 1ms TTL
    });

    // Verify immediately should work
    const validNow = await verifyCapabilityToken({
      token,
      verifierKeyHex: verifier.hash,
      now: token.notBefore,
    });
    expect(validNow).toBe(true);

    // Verify after expiry should fail
    const validLater = await verifyCapabilityToken({
      token,
      verifierKeyHex: verifier.hash,
      now: token.expiresAt + 1,
    });
    expect(validLater).toBe(false);
  });

  it('capability token rejected with wrong verifier key', async () => {
    const gesture = createGesture();
    const verifier = await auth.registerGesture(gesture);

    const token = await createCapabilityToken({
      verifierKeyHex: verifier.hash,
      issuer: 'test',
      scopes: ['speakeasy:enter'],
      ttlMs: 60_000,
    });

    const valid = await verifyCapabilityToken({
      token,
      verifierKeyHex: 'ff'.repeat(32), // Wrong key
    });
    expect(valid).toBe(false);
  });
});
