import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCognition } from '../hooks/useCognition.js';

describe('useCognition', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useCognition());
    expect(result.current.state.mode).toBe('idle');
  });

  it('accepts initial state overrides', () => {
    const { result } = renderHook(() =>
      useCognition({ initial: { mode: 'listening' } })
    );
    expect(result.current.state.mode).toBe('listening');
  });

  it('emit updates state', () => {
    const { result } = renderHook(() => useCognition({ autoTick: false }));

    act(() => {
      result.current.emit({ type: 'run.started', runId: 'r1' });
    });

    expect(result.current.state.mode).toBe('deliberating');
  });

  it('provides emotion bridge', () => {
    const { result } = renderHook(() => useCognition({ autoTick: false }));
    expect(result.current.emotion.anchor).toBeDefined();
    expect(result.current.emotion.avo).toBeDefined();
  });

  it('calls onChange callback', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCognition({ autoTick: false, onChange })
    );

    act(() => {
      result.current.emit({ type: 'ui.input_received' });
    });

    expect(onChange).toHaveBeenCalled();
  });
});
