import { describe, it, expect, vi } from 'vitest';
import { CognitionController } from '../controller.js';

describe('CognitionController', () => {
  it('initializes with default state', () => {
    const controller = new CognitionController();
    const state = controller.getState();
    expect(state.mode).toBe('idle');
    expect(state.personaAnchor).toBe(1);
  });

  it('accepts initial state overrides', () => {
    const controller = new CognitionController({
      initial: { mode: 'listening', workload: 0.5 },
    });
    const state = controller.getState();
    expect(state.mode).toBe('listening');
    expect(state.workload).toBe(0.5);
  });

  it('handles events and updates state', () => {
    const controller = new CognitionController();
    controller.handleEvent({ type: 'run.started', runId: 'r1' });
    const state = controller.getState();
    expect(state.mode).toBe('deliberating');
    expect(state.focusRunId).toBe('r1');
  });

  it('tick advances decay', () => {
    const controller = new CognitionController({
      initial: { errorStress: 0.5 },
    });
    controller.tick(1000);
    const state = controller.getState();
    expect(state.errorStress).toBeLessThan(0.5);
  });

  it('emits change events', () => {
    const controller = new CognitionController();
    const handler = vi.fn();
    controller.on('change', handler);
    controller.handleEvent({ type: 'ui.input_received' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('getEmotionTarget returns anchor and AVO', () => {
    const controller = new CognitionController({
      initial: { mode: 'listening' },
    });
    const target = controller.getEmotionTarget();
    expect(target.anchor).toBe('listening');
    expect(target.avo).toBeDefined();
  });

  it('adjusts openness based on personaDriftRisk', () => {
    // Low drift risk - openness stays near base
    const controllerLow = new CognitionController({
      initial: { mode: 'explaining', personaDriftRisk: 0 },
    });
    const targetLow = controllerLow.getEmotionTarget();

    // High drift risk - openness should be reduced
    const controllerHigh = new CognitionController({
      initial: { mode: 'explaining', personaDriftRisk: 0.8 },
    });
    const targetHigh = controllerHigh.getEmotionTarget();

    // 'explaining' mode has base openness of 0.85
    // With 0.8 drift risk, openness should drop by ~0.24 (0.8 * 0.3)
    expect(targetHigh.avo.openness).toBeLessThan(targetLow.avo.openness);
    expect(targetLow.avo.openness).toBeCloseTo(0.85, 2);
    expect(targetHigh.avo.openness).toBeCloseTo(0.61, 2);
  });

  it('clamps openness to valid range with high personaDriftRisk', () => {
    const controller = new CognitionController({
      initial: { mode: 'blocked', personaDriftRisk: 1.0 },
    });
    const target = controller.getEmotionTarget();
    // 'blocked' has base openness 0.3, with drift risk 1.0 drop of 0.3 = 0
    expect(target.avo.openness).toBeGreaterThanOrEqual(0);
    expect(target.avo.openness).toBeLessThanOrEqual(1);
  });

  it('handles dynamics.update event', () => {
    const controller = new CognitionController();
    controller.handleEvent({
      type: 'dynamics.update',
      dynamics: {
        potentialV: 0.5,
        actionRate: 0.3,
      },
    });
    const state = controller.getState();
    expect(state.dynamics?.potentialV).toBe(0.5);
    expect(state.dynamics?.actionRate).toBe(0.3);
  });

  it('handles policy.update event', () => {
    const controller = new CognitionController();
    controller.handleEvent({
      type: 'policy.update',
      policy: { safetyMode: true, trustTier: 'tier-2' },
      personality: { style: 'professional', riskTolerance: 'conservative', autonomy: 'low' },
    });
    const state = controller.getState();
    expect(state.policy?.safetyMode).toBe(true);
    expect(state.policy?.trustTier).toBe('tier-2');
    expect(state.personality?.style).toBe('professional');
  });
});
