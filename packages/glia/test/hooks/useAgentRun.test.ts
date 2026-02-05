/**
 * useAgentRun Tests
 *
 * Tests for agent run execution hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useAgentRun } from '../../src/hooks/useAgentRun.js';
import { BBProvider } from '../../src/components/BBProvider.js';

// Mock fetch
const mockFetch = vi.fn();

// Create wrapper with BBProvider
function createWrapper(overrides = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(BBProvider, {
      config: {
        apiBaseUrl: '/api',
        ...overrides,
      },
    }, children);
  };
}

describe('useAgentRun', () => {
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with idle status', () => {
      const { result } = renderHook(() => useAgentRun(), {
        wrapper: createWrapper(),
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.run).toBeNull();
      expect(result.current.output).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.cost).toBeNull();
      expect(result.current.latency).toBeNull();
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('starting a run', () => {
    it('should execute a run and track status', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          output: 'Hello, world!',
          cost: 0.05,
          tokenCount: 100,
        }),
      });

      const onStart = vi.fn();
      const onComplete = vi.fn();

      const { result } = renderHook(
        () => useAgentRun({ onStart, onComplete }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.start('agent-1', 'Say hello');
      });

      expect(result.current.status).toBe('completed');
      expect(result.current.output).toBe('Hello, world!');
      expect(result.current.cost).toBe(0.05);
      expect(result.current.latency).toBeGreaterThanOrEqual(0);
      expect(onStart).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle run failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const onError = vi.fn();

      const { result } = renderHook(
        () => useAgentRun({ onError }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.start('agent-1', 'Do something');
      });

      expect(result.current.status).toBe('failed');
      expect(result.current.error).toContain('500');
      expect(onError).toHaveBeenCalled();
    });

    it('should track status during execution', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ output: 'done' }),
      });

      const { result } = renderHook(() => useAgentRun(), {
        wrapper: createWrapper(),
      });

      // Before start
      expect(result.current.isRunning).toBe(false);
      expect(result.current.status).toBe('idle');

      // Execute the run
      await act(async () => {
        await result.current.start('agent-1', 'Test');
      });

      // After completion
      expect(result.current.isRunning).toBe(false);
      expect(result.current.status).toBe('completed');
    });
  });

  describe('cancellation', () => {
    it('should have cancel method available', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ output: 'done' }),
      });

      const { result } = renderHook(
        () => useAgentRun(),
        { wrapper: createWrapper() }
      );

      // Cancel should be callable
      expect(typeof result.current.cancel).toBe('function');

      // Calling cancel when not running should be safe
      act(() => {
        result.current.cancel();
      });

      expect(result.current.status).toBe('idle');
    });
  });

  describe('run object', () => {
    it('should populate run object with correct fields', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          output: 'Result',
          cost: 0.01,
          tokenCount: 50,
        }),
      });

      const { result } = renderHook(() => useAgentRun(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.start('agent-1', 'Test prompt', { key: 'value' });
      });

      expect(result.current.run).toBeTruthy();
      expect(result.current.run?.agentId).toBe('agent-1');
      expect(result.current.run?.prompt).toBe('Test prompt');
      expect(result.current.run?.context).toEqual({ key: 'value' });
      expect(result.current.run?.status).toBe('completed');
      expect(result.current.run?.output).toBe('Result');
      expect(result.current.run?.cost).toBe(0.01);
      expect(result.current.run?.tokenCount).toBe(50);
      expect(result.current.run?.startedAt).toBeTruthy();
      expect(result.current.run?.completedAt).toBeTruthy();
    });
  });
});
