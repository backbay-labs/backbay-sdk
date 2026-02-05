/**
 * usePlaySession Tests
 *
 * Tests for play session management hook with WebSocket RPC.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { usePlaySession } from '../../src/hooks/usePlaySession.js';
import { BBProvider } from '../../src/components/BBProvider.js';

// Mock fetch
const mockFetch = vi.fn();

// Track WebSocket instances
interface MockWS {
  url: string;
  readyState: number;
  onopen: (() => void) | null;
  onmessage: ((e: { data: string }) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
  close: () => void;
  send: (data: string) => void;
  sentMessages: string[];
  simulateOpen: () => void;
  simulateMessage: (data: unknown) => void;
  simulateClose: () => void;
}

const wsInstances: MockWS[] = [];

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

describe('usePlaySession', () => {
  beforeEach(() => {
    wsInstances.length = 0;

    // Mock WebSocket
    const MockWebSocket = vi.fn().mockImplementation((url: string) => {
      const instance: MockWS = {
        url,
        readyState: 0, // CONNECTING
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null,
        close: vi.fn(() => {
          instance.readyState = 3;
          instance.onclose?.();
        }),
        send: vi.fn((data: string) => {
          instance.sentMessages.push(data);
        }),
        sentMessages: [],
        simulateOpen() {
          this.readyState = 1;
          this.onopen?.();
        },
        simulateMessage(data: unknown) {
          this.onmessage?.({ data: JSON.stringify(data) });
        },
        simulateClose() {
          this.readyState = 3;
          this.onclose?.();
        },
      };
      wsInstances.push(instance);
      return instance;
    });

    // Set WebSocket constants
    MockWebSocket.CONNECTING = 0;
    MockWebSocket.OPEN = 1;
    MockWebSocket.CLOSING = 2;
    MockWebSocket.CLOSED = 3;

    global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start disconnected', () => {
      const { result } = renderHook(
        () => usePlaySession({ adapter: 'openrct2' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.status).toBe('disconnected');
      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('connecting', () => {
    it('should set status to connecting when connect is called', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'session-123',
          wsUrl: 'ws://localhost:8080/ws',
        }),
      });

      const { result } = renderHook(
        () => usePlaySession({ adapter: 'openrct2' }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.connect();
        // Give state time to update
        await new Promise(r => setTimeout(r, 10));
      });

      // Status should be connecting or connected depending on timing
      expect(['connecting', 'connected']).toContain(result.current.status);
    });

    it('should create session via API', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'session-123',
          wsUrl: 'ws://localhost:8080/ws',
        }),
      });

      const { result } = renderHook(
        () => usePlaySession({ adapter: 'openrct2' }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.connect();
        await new Promise(r => setTimeout(r, 50));
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('play-sessions'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should create WebSocket connection after session is created', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'session-123',
          wsUrl: 'ws://localhost:8080/ws',
        }),
      });

      const { result } = renderHook(
        () => usePlaySession({ adapter: 'openrct2' }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.connect();
        await new Promise(r => setTimeout(r, 50));
      });

      expect(wsInstances.length).toBe(1);
    });

    it('should set connected status when WebSocket opens', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'session-123',
          wsUrl: 'ws://localhost:8080/ws',
        }),
      });

      const { result } = renderHook(
        () => usePlaySession({ adapter: 'openrct2' }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.connect();
        await new Promise(r => setTimeout(r, 50));
      });

      const ws = wsInstances[0];

      await act(async () => {
        ws.simulateOpen();
      });

      expect(result.current.status).toBe('connected');
    });
  });

  describe('session data', () => {
    it('should populate session with returned data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'session-123',
          wsUrl: 'ws://localhost:8080/ws',
        }),
      });

      const { result } = renderHook(
        () => usePlaySession({ adapter: 'openrct2' }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.connect();
        await new Promise(r => setTimeout(r, 50));
      });

      const ws = wsInstances[0];

      await act(async () => {
        ws.simulateOpen();
      });

      expect(result.current.session).toBeTruthy();
      expect(result.current.session?.id).toBe('session-123');
      expect(result.current.session?.adapter).toBe('openrct2');
    });
  });

  describe('disconnecting', () => {
    it('should reset state on disconnect', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'session-123',
          wsUrl: 'ws://localhost:8080/ws',
        }),
      });

      const { result } = renderHook(
        () => usePlaySession({ adapter: 'openrct2' }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.connect();
        await new Promise(r => setTimeout(r, 50));
      });

      const ws = wsInstances[0];

      await act(async () => {
        ws.simulateOpen();
      });

      expect(result.current.status).toBe('connected');

      await act(async () => {
        result.current.disconnect();
      });

      expect(result.current.status).toBe('disconnected');
      expect(result.current.session).toBeNull();
    });

    it('should close WebSocket on disconnect', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'session-123',
          wsUrl: 'ws://localhost:8080/ws',
        }),
      });

      const { result } = renderHook(
        () => usePlaySession({ adapter: 'openrct2' }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.connect();
        await new Promise(r => setTimeout(r, 50));
      });

      const ws = wsInstances[0];

      await act(async () => {
        ws.simulateOpen();
      });

      await act(async () => {
        result.current.disconnect();
      });

      expect(ws.close).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const onError = vi.fn();

      const { result } = renderHook(
        () => usePlaySession({ adapter: 'openrct2', onError }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.connect();
        await new Promise(r => setTimeout(r, 50));
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBeTruthy();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('autoConnect', () => {
    it('should auto-connect when autoConnect is true', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'session-123',
          wsUrl: 'ws://localhost:8080/ws',
        }),
      });

      const { result } = renderHook(
        () => usePlaySession({ adapter: 'openrct2', autoConnect: true }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await new Promise(r => setTimeout(r, 100));
      });

      // Should have initiated connection
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should disconnect on unmount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'session-123',
          wsUrl: 'ws://localhost:8080/ws',
        }),
      });

      const { result, unmount } = renderHook(
        () => usePlaySession({ adapter: 'openrct2' }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.connect();
        await new Promise(r => setTimeout(r, 50));
      });

      const ws = wsInstances[0];

      await act(async () => {
        ws.simulateOpen();
      });

      unmount();

      expect(ws.close).toHaveBeenCalled();
    });
  });
});
