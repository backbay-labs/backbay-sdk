/**
 * useRunStream Tests
 *
 * Tests for run event streaming hook with EventSource and polling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useRunStream } from '../../src/hooks/useRunStream.js';
import { BBProvider } from '../../src/components/BBProvider.js';

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close() {
    this.readyState = 2;
    const index = MockEventSource.instances.indexOf(this);
    if (index > -1) {
      MockEventSource.instances.splice(index, 1);
    }
  }

  // Test helper to simulate connection opening
  simulateOpen() {
    this.readyState = 1;
    this.onopen?.();
  }

  // Test helper to simulate messages
  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  // Test helper to simulate errors
  simulateError() {
    this.onerror?.();
  }
}

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

describe('useRunStream', () => {
  beforeEach(() => {
    global.EventSource = MockEventSource as unknown as typeof EventSource;
    global.fetch = mockFetch;
    MockEventSource.instances = [];
    mockFetch.mockReset();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/runs/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'running',
            progress: 0.5,
          }),
        });
      }
      return Promise.reject(new Error('Not mocked'));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with empty events and idle status when no runId', () => {
      const { result } = renderHook(
        () => useRunStream(null),
        { wrapper: createWrapper() }
      );

      expect(result.current.events).toEqual([]);
      expect(result.current.latestEvent).toBeNull();
      expect(result.current.status).toBe('idle');
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('EventSource connection', () => {
    it('should connect to EventSource when runId is provided', async () => {
      const { result } = renderHook(
        () => useRunStream('run-123'),
        { wrapper: createWrapper() }
      );

      // Give hook time to create EventSource
      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      expect(MockEventSource.instances.length).toBe(1);
      expect(MockEventSource.instances[0].url).toContain('/runs/run-123/events');
    });

    it('should set isConnected to true when connection opens', async () => {
      const { result } = renderHook(
        () => useRunStream('run-123'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      const es = MockEventSource.instances[0];

      await act(async () => {
        es.simulateOpen();
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('should record connected event', async () => {
      const { result } = renderHook(
        () => useRunStream('run-123'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      const es = MockEventSource.instances[0];

      await act(async () => {
        es.simulateOpen();
      });

      expect(result.current.events.length).toBeGreaterThan(0);
      expect(result.current.events[0].type).toBe('connected');
    });
  });

  describe('receiving events', () => {
    it('should accumulate events as they arrive', async () => {
      const onEvent = vi.fn();
      const { result } = renderHook(
        () => useRunStream('run-123', { onEvent }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      const es = MockEventSource.instances[0];

      await act(async () => {
        es.simulateOpen();
      });

      // Simulate status events
      await act(async () => {
        es.simulateMessage({ type: 'status', progress: 0.25 });
      });

      await act(async () => {
        es.simulateMessage({ type: 'status', progress: 0.5 });
      });

      await act(async () => {
        es.simulateMessage({ type: 'status', progress: 0.75 });
      });

      // Should have connected + 3 status events
      expect(result.current.events.length).toBe(4);
      expect(onEvent).toHaveBeenCalledTimes(4);
    });

    it('should update latestEvent on each message', async () => {
      const { result } = renderHook(
        () => useRunStream('run-123'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      const es = MockEventSource.instances[0];

      await act(async () => {
        es.simulateOpen();
        es.simulateMessage({ type: 'thinking', message: 'Processing...' });
      });

      expect(result.current.latestEvent?.type).toBe('thinking');

      await act(async () => {
        es.simulateMessage({ type: 'generating', message: 'Writing...' });
      });

      expect(result.current.latestEvent?.type).toBe('generating');
    });

    it('should update status from event data', async () => {
      const { result } = renderHook(
        () => useRunStream('run-123'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      const es = MockEventSource.instances[0];

      await act(async () => {
        es.simulateOpen();
        es.simulateMessage({ type: 'status', status: 'running' });
      });

      expect(result.current.status).toBe('running');
    });
  });

  describe('completion events', () => {
    it('should handle completed event', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(
        () => useRunStream('run-123', { onComplete }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      const es = MockEventSource.instances[0];

      await act(async () => {
        es.simulateOpen();
        es.simulateMessage({
          type: 'completed',
          run: { id: 'run-123', status: 'completed', output: 'Done!' },
        });
      });

      expect(result.current.status).toBe('completed');
      expect(result.current.run?.output).toBe('Done!');
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle failed event', async () => {
      const { result } = renderHook(
        () => useRunStream('run-123'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      const es = MockEventSource.instances[0];

      await act(async () => {
        es.simulateOpen();
        es.simulateMessage({
          type: 'failed',
          run: { id: 'run-123', status: 'failed', error: 'Something went wrong' },
        });
      });

      expect(result.current.status).toBe('failed');
    });

    it('should handle cancelled event', async () => {
      const { result } = renderHook(
        () => useRunStream('run-123'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      const es = MockEventSource.instances[0];

      await act(async () => {
        es.simulateOpen();
        es.simulateMessage({
          type: 'cancelled',
          run: { id: 'run-123', status: 'cancelled' },
        });
      });

      expect(result.current.status).toBe('cancelled');
    });
  });

  describe('disconnect and reconnect', () => {
    it('should disconnect when called', async () => {
      const { result } = renderHook(
        () => useRunStream('run-123'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      expect(MockEventSource.instances.length).toBe(1);

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
    });

    it('should reconnect and reset state', async () => {
      const { result } = renderHook(
        () => useRunStream('run-123'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      const es = MockEventSource.instances[0];

      // Add some events
      await act(async () => {
        es.simulateOpen();
        es.simulateMessage({ type: 'status', progress: 0.5 });
      });

      expect(result.current.events.length).toBe(2);

      // Disconnect and reconnect
      act(() => {
        result.current.disconnect();
      });

      act(() => {
        result.current.reconnect();
      });

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      // Events should be reset
      expect(result.current.events.length).toBe(0);
    });
  });

  describe('polling fallback', () => {
    it('should use polling when preferPolling is true', async () => {
      const { result } = renderHook(
        () => useRunStream('run-123', { preferPolling: true, pollInterval: 1000 }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 100));
      });

      // Should not create EventSource
      expect(MockEventSource.instances.length).toBe(0);

      // Should have made a fetch call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/runs/run-123'),
        expect.any(Object)
      );
    });
  });

  describe('cleanup', () => {
    it('should disconnect when runId changes to null', async () => {
      const { result, rerender } = renderHook(
        ({ runId }) => useRunStream(runId),
        {
          wrapper: createWrapper(),
          initialProps: { runId: 'run-123' as string | null },
        }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      expect(MockEventSource.instances.length).toBe(1);

      rerender({ runId: null });

      expect(result.current.isConnected).toBe(false);
    });

    it('should reconnect when runId changes', async () => {
      const { result, rerender } = renderHook(
        ({ runId }) => useRunStream(runId),
        {
          wrapper: createWrapper(),
          initialProps: { runId: 'run-123' },
        }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      const firstUrl = MockEventSource.instances[0]?.url;
      expect(firstUrl).toContain('run-123');

      rerender({ runId: 'run-456' });

      await act(async () => {
        await new Promise(r => setTimeout(r, 10));
      });

      // Should have new EventSource for new run
      const latestInstance = MockEventSource.instances[MockEventSource.instances.length - 1];
      expect(latestInstance?.url).toContain('run-456');
    });
  });
});
