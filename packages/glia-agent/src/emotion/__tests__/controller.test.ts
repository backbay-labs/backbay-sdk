// packages/bb-ui/src/emotion/__tests__/controller.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmotionController } from '../controller';
import { ANCHOR_STATES, DEFAULT_AVO } from '../constants';

describe('EmotionController', () => {
  let controller: EmotionController;

  beforeEach(() => {
    controller = new EmotionController();
  });

  afterEach(() => {
    controller.dispose();
  });

  describe('initialization', () => {
    it('should initialize with default AVO', () => {
      expect(controller.getDimensions()).toEqual(DEFAULT_AVO);
    });

    it('should accept initial dimensions', () => {
      const custom = new EmotionController({ initial: { arousal: 0.5, valence: 0.5, openness: 0.5 } });
      expect(custom.getDimensions().arousal).toBe(0.5);
      custom.dispose();
    });

    it('should accept initial anchor state', () => {
      const custom = new EmotionController({ initialAnchor: 'listening' });
      expect(custom.getDimensions()).toEqual(ANCHOR_STATES.listening);
      custom.dispose();
    });
  });

  describe('setDimensions', () => {
    it('should update dimensions immediately', () => {
      controller.setDimensions({ arousal: 0.8 });
      expect(controller.getDimensions().arousal).toBe(0.8);
    });

    it('should clamp out-of-range values', () => {
      controller.setDimensions({ arousal: 1.5, valence: -0.2 });
      const dims = controller.getDimensions();
      expect(dims.arousal).toBe(1);
      expect(dims.valence).toBe(0);
    });

    it('should emit change event', () => {
      const handler = vi.fn();
      controller.on('change', handler);
      controller.setDimensions({ arousal: 0.7 });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('transitionTo', () => {
    it('should not be transitioning initially', () => {
      expect(controller.isTransitioning()).toBe(false);
    });

    it('should mark as transitioning during transition', () => {
      controller.transitionTo({ arousal: 0.9 }, { duration: 100 });
      expect(controller.isTransitioning()).toBe(true);
    });
  });

  describe('transitionToAnchor', () => {
    it('should transition to anchor state coordinates', () => {
      controller.transitionToAnchor('listening', { duration: 0 });
      // With duration 0, should be immediate
      controller.tick(0);
      const dims = controller.getDimensions();
      const target = ANCHOR_STATES.listening;
      // Use approximate comparison due to floating point arithmetic
      expect(dims.arousal).toBeCloseTo(target.arousal, 5);
      expect(dims.valence).toBeCloseTo(target.valence, 5);
      expect(dims.openness).toBeCloseTo(target.openness, 5);
    });
  });

  describe('events', () => {
    it('should emit transitionStart on transition', () => {
      const handler = vi.fn();
      controller.on('transitionStart', handler);
      controller.transitionTo({ arousal: 0.9 }, { duration: 100 });
      expect(handler).toHaveBeenCalled();
    });

    it('should unsubscribe correctly', () => {
      const handler = vi.fn();
      const unsub = controller.on('change', handler);
      unsub();
      controller.setDimensions({ arousal: 0.5 });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('handleEvent', () => {
    it('should transition to listening on input_received', () => {
      controller.handleEvent({ type: 'input_received' });
      expect(controller.isTransitioning()).toBe(true);
    });

    it('should transition to thinking on processing_start', () => {
      controller.handleEvent({ type: 'processing_start' });
      expect(controller.isTransitioning()).toBe(true);
    });

    it('should transition to error on high-intensity error_occurred', () => {
      controller.handleEvent({ type: 'error_occurred', intensity: 0.8 });
      expect(controller.isTransitioning()).toBe(true);
    });

    it('should transition to concerned on low-intensity error_occurred', () => {
      controller.handleEvent({ type: 'error_occurred', intensity: 0.5 });
      expect(controller.isTransitioning()).toBe(true);
    });

    it('should transition to satisfied on success', () => {
      controller.handleEvent({ type: 'success' });
      expect(controller.isTransitioning()).toBe(true);
    });

    it('should spike arousal on interrupt without transition', () => {
      const before = controller.getDimensions().arousal;
      controller.handleEvent({ type: 'interrupt' });
      expect(controller.getDimensions().arousal).toBeGreaterThan(before);
      expect(controller.isTransitioning()).toBe(false);
    });
  });

  describe('blendToward', () => {
    it('should partially blend toward target', () => {
      controller.setDimensions({ arousal: 0, valence: 0, openness: 0 });
      controller.blendToward({ arousal: 1 }, 0.5);
      expect(controller.getDimensions().arousal).toBeCloseTo(0.5, 1);
    });

    it('should emit change event', () => {
      const handler = vi.fn();
      controller.on('change', handler);
      controller.blendToward({ valence: 0.8 }, 0.3);
      expect(handler).toHaveBeenCalled();
    });
  });
});
