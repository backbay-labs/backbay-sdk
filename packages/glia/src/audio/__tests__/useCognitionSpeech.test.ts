import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCognitionSpeech } from '../hooks/useCognitionSpeech.js';

describe('useCognitionSpeech', () => {
  const createMockProvider = () => ({
    providerId: 'mock',
    synthesizeSpeech: vi.fn().mockResolvedValue({
      audio: new Blob(['test'], { type: 'audio/wav' }),
      artifact: {
        id: 'a1',
        format: 'wav',
        sha256: 'abc',
        durationMs: 1000,
      },
    }),
  });

  const mockVoices = {
    get: (id: string) =>
      id === 'v1'
        ? { voiceId: 'v1', licenseCategory: 'cc0' as const, tags: ['default'] }
        : null,
    list: () => [{ voiceId: 'v1', licenseCategory: 'cc0' as const, tags: ['default'] }],
  };

  const createBaseOptions = (provider = createMockProvider()) => ({
    provider,
    voices: mockVoices,
    policy: { safetyMode: false, voiceCloningAllowed: false },
  });

  it('provides cognition state and speak function', () => {
    const { result } = renderHook(() =>
      useCognitionSpeech({ ...createBaseOptions(), autoTick: false })
    );

    expect(result.current.cognition.mode).toBe('idle');
    expect(typeof result.current.speak).toBe('function');
  });

  it('uses cognition state when speaking', async () => {
    const { result } = renderHook(() =>
      useCognitionSpeech({ ...createBaseOptions(), autoTick: false })
    );

    act(() => {
      result.current.emitCognition({ type: 'run.started', runId: 'r1' });
    });

    expect(result.current.cognition.mode).toBe('deliberating');
  });

  it('provides emotion target from cognition', () => {
    const { result } = renderHook(() =>
      useCognitionSpeech({ ...createBaseOptions(), autoTick: false })
    );

    expect(result.current.emotion).toBeDefined();
    expect(result.current.emotion.anchor).toBe('idle');
    expect(result.current.emotion.avo).toBeDefined();
  });

  it('updates emotion when cognition mode changes', () => {
    const { result } = renderHook(() =>
      useCognitionSpeech({ ...createBaseOptions(), autoTick: false })
    );

    act(() => {
      result.current.emitCognition({ type: 'run.started', runId: 'r1' });
    });

    expect(result.current.emotion.anchor).toBe('thinking');
  });

  it('tracks persona drift risk through text messages', () => {
    const { result } = renderHook(() =>
      useCognitionSpeech({ ...createBaseOptions(), autoTick: false })
    );

    const initialDriftRisk = result.current.cognition.personaDriftRisk;

    act(() => {
      result.current.emitCognition({
        type: 'text.user_message',
        text: 'What are you?',
        categories: ['meta_reflection'],
      });
    });

    expect(result.current.cognition.personaDriftRisk).toBeGreaterThan(initialDriftRisk);
  });

  it('includes handleCognition as alias for emitCognition', () => {
    const { result } = renderHook(() =>
      useCognitionSpeech({ ...createBaseOptions(), autoTick: false })
    );

    expect(typeof result.current.handleCognition).toBe('function');

    act(() => {
      result.current.handleCognition({ type: 'ui.input_received' });
    });

    expect(result.current.cognition.mode).toBe('listening');
  });

  it('passes cognition state to speech synthesis', async () => {
    const mockProvider = createMockProvider();
    const { result } = renderHook(() =>
      useCognitionSpeech({ ...createBaseOptions(mockProvider), autoTick: false })
    );

    // Set up some cognition state
    act(() => {
      result.current.emitCognition({ type: 'run.started', runId: 'r1' });
    });

    // Call speak
    await act(async () => {
      await result.current.speak('Hello world');
    });

    // Verify the provider was called
    expect(mockProvider.synthesizeSpeech).toHaveBeenCalledTimes(1);
    const request = mockProvider.synthesizeSpeech.mock.calls[0][0];
    expect(request.text).toBe('Hello world');
  });

  it('allows accepting initial cognition state', () => {
    const { result } = renderHook(() =>
      useCognitionSpeech({
        ...createBaseOptions(),
        autoTick: false,
        initialCognition: { mode: 'explaining', confidence: 0.9 },
      })
    );

    expect(result.current.cognition.mode).toBe('explaining');
    expect(result.current.cognition.confidence).toBe(0.9);
  });
});
