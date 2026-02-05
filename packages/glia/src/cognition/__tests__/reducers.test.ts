import { describe, it, expect } from 'vitest';
import {
  reduceEvent,
  reduceDecay,
  MODE_TRANSITION_MAP,
} from '../reducers.js';
import { createInitialCognitionState } from '../types.js';
import type { CognitionEvent, DynamicsState, PolicyConfig, PersonalityConfig } from '../types.js';

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

    it('updates dynamics state on dynamics.update', () => {
      const state = createInitialCognitionState();
      const dynamics: DynamicsState = {
        potentialV: 0.5,
        actionRate: 0.3,
        detailedBalance: { chi2PerNdf: 1.2, passed: true, threshold: 2.0 },
        traps: [{ stateId: 's1', reason: 'test', recommendation: 'retry' }],
      };
      const event: CognitionEvent = { type: 'dynamics.update', dynamics };
      const next = reduceEvent(state, event);
      expect(next.dynamics).toEqual(dynamics);
    });

    it('updates policy on policy.update', () => {
      const state = createInitialCognitionState();
      const policy: PolicyConfig = { safetyMode: true, trustTier: 'tier-1' };
      const event: CognitionEvent = { type: 'policy.update', policy };
      const next = reduceEvent(state, event);
      expect(next.policy).toEqual(policy);
    });

    it('updates personality on policy.update', () => {
      const state = createInitialCognitionState();
      const personality: PersonalityConfig = {
        style: 'casual',
        riskTolerance: 'moderate',
        autonomy: 'medium',
      };
      const event: CognitionEvent = { type: 'policy.update', personality };
      const next = reduceEvent(state, event);
      expect(next.personality).toEqual(personality);
    });

    it('updates both policy and personality on policy.update', () => {
      const state = createInitialCognitionState();
      const policy: PolicyConfig = { safetyMode: true };
      const personality: PersonalityConfig = {
        style: 'terse',
        riskTolerance: 'conservative',
        autonomy: 'low',
      };
      const event: CognitionEvent = { type: 'policy.update', policy, personality };
      const next = reduceEvent(state, event);
      expect(next.policy).toEqual(policy);
      expect(next.personality).toEqual(personality);
    });
  });

  describe('persona drift risk estimation', () => {
    it('increases personaDriftRisk for meta_reflection category', () => {
      const state = createInitialCognitionState({ personaDriftRisk: 0 });
      const event: CognitionEvent = {
        type: 'text.user_message',
        text: 'What are you thinking about?',
        categories: ['meta_reflection'],
      };
      const next = reduceEvent(state, event);
      expect(next.personaDriftRisk).toBeGreaterThan(0);
      // Should be ~0.09 (0 * 0.7 + 0.3 * 0.3)
      expect(next.personaDriftRisk).toBeCloseTo(0.09, 2);
    });

    it('increases personaDriftRisk more for vulnerable_disclosure', () => {
      const state = createInitialCognitionState({ personaDriftRisk: 0 });
      const event: CognitionEvent = {
        type: 'text.user_message',
        text: 'I am feeling vulnerable',
        categories: ['vulnerable_disclosure'],
      };
      const next = reduceEvent(state, event);
      // Should be ~0.12 (0 * 0.7 + 0.4 * 0.3)
      expect(next.personaDriftRisk).toBeCloseTo(0.12, 2);
    });

    it('decays personaDriftRisk for normal messages', () => {
      const state = createInitialCognitionState({ personaDriftRisk: 0.5 });
      const event: CognitionEvent = {
        type: 'text.user_message',
        text: 'Hello',
        categories: [],
      };
      const next = reduceEvent(state, event);
      // Should decay: 0.5 * 0.7 + 0 * 0.3 = 0.35
      expect(next.personaDriftRisk).toBeCloseTo(0.35, 2);
    });

    it('accumulates personaDriftRisk over multiple risky messages', () => {
      let state = createInitialCognitionState({ personaDriftRisk: 0 });

      // First meta_reflection message
      state = reduceEvent(state, {
        type: 'text.user_message',
        text: 'msg1',
        categories: ['meta_reflection'],
      });
      const first = state.personaDriftRisk;

      // Second meta_reflection message
      state = reduceEvent(state, {
        type: 'text.user_message',
        text: 'msg2',
        categories: ['meta_reflection'],
      });

      expect(state.personaDriftRisk).toBeGreaterThan(first);
    });

    it('transitions to listening mode on text.user_message', () => {
      const state = createInitialCognitionState({ mode: 'idle' });
      const event: CognitionEvent = {
        type: 'text.user_message',
        text: 'Hello',
      };
      const next = reduceEvent(state, event);
      expect(next.mode).toBe('listening');
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
