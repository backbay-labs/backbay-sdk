// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmotion } from '../hooks/useEmotion';
import { ANCHOR_STATES } from '../constants';

describe('useEmotion', () => {
  it('should initialize with default dimensions', () => {
    const { result } = renderHook(() => useEmotion({ autoTick: false }));
    expect(result.current.dimensions).toBeDefined();
    expect(result.current.dimensions.arousal).toBeGreaterThanOrEqual(0);
    expect(result.current.dimensions.arousal).toBeLessThanOrEqual(1);
    expect(result.current.dimensions.valence).toBeGreaterThanOrEqual(0);
    expect(result.current.dimensions.valence).toBeLessThanOrEqual(1);
    expect(result.current.dimensions.openness).toBeGreaterThanOrEqual(0);
    expect(result.current.dimensions.openness).toBeLessThanOrEqual(1);
  });

  it('should initialize with custom anchor', () => {
    const { result } = renderHook(() =>
      useEmotion({ initialAnchor: 'listening', autoTick: false })
    );
    expect(result.current.baseDimensions).toEqual(ANCHOR_STATES.listening);
  });

  it('should update dimensions with set()', () => {
    const { result } = renderHook(() => useEmotion({ autoTick: false }));

    act(() => {
      result.current.set({ arousal: 0.9 });
    });

    expect(result.current.dimensions.arousal).toBe(0.9);
  });

  it('should provide visual state', () => {
    const { result } = renderHook(() => useEmotion({ autoTick: false }));
    expect(result.current.visualState).toBeDefined();
    expect(result.current.visualState.breathingRate).toBeGreaterThan(0);
    expect(result.current.visualState.coreHue).toBeGreaterThanOrEqual(0);
    expect(result.current.visualState.particleFlowDirection).toBeDefined();
    expect(result.current.visualState.overallIntensity).toBeGreaterThan(0);
  });

  it('should call onChange when dimensions change', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useEmotion({ onChange, autoTick: false })
    );

    act(() => {
      result.current.set({ arousal: 0.5 });
    });

    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ arousal: 0.5 })
    );
  });

  it('should transition to anchor with goTo()', () => {
    const { result } = renderHook(() => useEmotion({ autoTick: false }));

    act(() => {
      result.current.goTo('thinking', { duration: 0 });
      result.current.tick(0);
    });

    // After immediate transition (duration: 0), should be at thinking state
    const thinking = ANCHOR_STATES.thinking;
    expect(result.current.baseDimensions.arousal).toBeCloseTo(thinking.arousal, 5);
    expect(result.current.baseDimensions.valence).toBeCloseTo(thinking.valence, 5);
    expect(result.current.baseDimensions.openness).toBeCloseTo(thinking.openness, 5);
  });

  it('should handle emotion events with emit()', () => {
    const { result } = renderHook(() => useEmotion({ autoTick: false }));

    act(() => {
      result.current.emit({ type: 'processing_start' });
    });

    // Should be transitioning to thinking state
    expect(result.current.isTransitioning).toBe(true);
  });

  it('should report isTransitioning during transition', () => {
    const { result } = renderHook(() => useEmotion({ autoTick: false }));

    expect(result.current.isTransitioning).toBe(false);

    act(() => {
      result.current.transition({ arousal: 0.9 }, { duration: 1000 });
    });

    expect(result.current.isTransitioning).toBe(true);
  });

  it('should support manual tick when autoTick is false', () => {
    const { result } = renderHook(() =>
      useEmotion({ autoTick: false, microExpressions: false })
    );

    act(() => {
      result.current.transition({ arousal: 1.0 }, { duration: 100 });
    });

    // Tick halfway
    act(() => {
      result.current.tick(50);
    });

    // Should be partway through transition
    expect(result.current.dimensions.arousal).toBeGreaterThan(0.25); // default idle arousal

    // Complete transition
    act(() => {
      result.current.tick(100);
    });

    expect(result.current.dimensions.arousal).toBeCloseTo(1.0, 5);
    expect(result.current.isTransitioning).toBe(false);
  });

  it('should initialize with custom dimensions', () => {
    const { result } = renderHook(() =>
      useEmotion({
        initial: { arousal: 0.7, valence: 0.3, openness: 0.5 },
        autoTick: false,
        microExpressions: false,
      })
    );

    expect(result.current.baseDimensions.arousal).toBe(0.7);
    expect(result.current.baseDimensions.valence).toBe(0.3);
    expect(result.current.baseDimensions.openness).toBe(0.5);
  });

  it('should clamp out-of-range values in set()', () => {
    const { result } = renderHook(() =>
      useEmotion({ autoTick: false, microExpressions: false })
    );

    act(() => {
      result.current.set({ arousal: 1.5, valence: -0.5 });
    });

    expect(result.current.dimensions.arousal).toBe(1);
    expect(result.current.dimensions.valence).toBe(0);
  });
});
