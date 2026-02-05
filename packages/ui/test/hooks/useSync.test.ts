/**
 * useSync Tests
 *
 * Tests for offline-first sync hook with conflict resolution.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSync } from '../../src/hooks/useSync.js';

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
};

// Mock fetch
const mockFetch = vi.fn();

describe('useSync', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });
    global.fetch = mockFetch;
    localStorageMock.clear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should start with initial data when provided', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'server' }),
      });

      const { result } = renderHook(() =>
        useSync<{ content: string }>({
          key: 'test-doc',
          endpoint: '/api/docs/1',
          initialData: { content: 'initial' },
        })
      );

      expect(result.current.data).toEqual({ content: 'initial' });
      expect(result.current.isLoaded).toBe(false);
    });

    it('should load from localStorage on mount', async () => {
      const stored = {
        data: { content: 'cached' },
        timestamp: Date.now(),
        version: 1,
      };
      localStorageMock.setItem('test-doc', JSON.stringify(stored));

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'server' }),
      });

      const { result } = renderHook(() =>
        useSync<{ content: string }>({
          key: 'test-doc',
          endpoint: '/api/docs/1',
        })
      );

      // Should use cached data first
      expect(result.current.data).toEqual({ content: 'cached' });
    });

    it('should set status to offline when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const onError = vi.fn();
      const { result } = renderHook(() =>
        useSync<{ content: string }>({
          key: 'test-doc',
          endpoint: '/api/docs/1',
          onError,
        })
      );

      // Wait for the async load to complete
      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      expect(result.current.status).toBe('offline');
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('data updates', () => {
    it('should update data locally and save to localStorage', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'server' }),
      });

      const { result } = renderHook(() =>
        useSync<{ content: string }>({
          key: 'test-doc',
          endpoint: '/api/docs/1',
          initialData: { content: 'initial' },
          debounce: 1000,
        })
      );

      act(() => {
        result.current.setData({ content: 'updated' });
      });

      expect(result.current.data).toEqual({ content: 'updated' });
      expect(result.current.status).toBe('pending');
      expect(result.current.pendingChanges).toBe(1);

      // Check localStorage was updated
      const storedRaw = localStorageMock.getItem('test-doc');
      expect(storedRaw).toBeTruthy();
      const stored = JSON.parse(storedRaw!);
      expect(stored.data).toEqual({ content: 'updated' });
    });

    it('should support functional updates', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'server' }),
      });

      const { result } = renderHook(() =>
        useSync<{ content: string; count: number }>({
          key: 'test-doc',
          endpoint: '/api/docs/1',
          initialData: { content: 'initial', count: 0 },
        })
      );

      act(() => {
        result.current.setData((prev) => ({
          ...prev!,
          count: prev!.count + 1,
        }));
      });

      expect(result.current.data).toEqual({ content: 'initial', count: 1 });
    });
  });

  describe('forceSave', () => {
    it('should save immediately', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'saved' }),
      });

      const { result } = renderHook(() =>
        useSync<{ content: string }>({
          key: 'test-doc',
          endpoint: '/api/docs/1',
          initialData: { content: 'initial' },
          debounce: 5000,
        })
      );

      act(() => {
        result.current.setData({ content: 'updated' });
      });

      // Should be pending (debounce not elapsed)
      expect(result.current.status).toBe('pending');

      await act(async () => {
        await result.current.forceSave();
      });

      // Should be synced after force save
      expect(result.current.status).toBe('synced');
    });
  });

  describe('refresh', () => {
    it('should fetch fresh data from server', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: callCount === 1 ? 'initial' : 'refreshed'
          }),
        });
      });

      const { result } = renderHook(() =>
        useSync<{ content: string }>({
          key: 'test-doc',
          endpoint: '/api/docs/1',
        })
      );

      // Wait for initial load
      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      expect(result.current.isLoaded).toBe(true);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.data).toEqual({ content: 'refreshed' });
      expect(result.current.status).toBe('synced');
    });
  });

  describe('conflict resolution', () => {
    it('should detect conflict when local changes exist', async () => {
      // Set up stored data with recent timestamp
      const stored = {
        data: { content: 'local changes' },
        lastModifiedAt: Date.now(),
        lastSyncedAt: Date.now() - 10_000,
        lastSyncedHash: 'different-from-remote',
      };
      localStorageMock.setItem('test-doc', JSON.stringify(stored));

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'server data' }),
      });

      const onConflict = vi.fn();
      const { result } = renderHook(() =>
        useSync<{ content: string }>({
          key: 'test-doc',
          endpoint: '/api/docs/1',
          onConflict,
        })
      );

      // Wait for async operations
      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      expect(result.current.status).toBe('conflict');
      expect(result.current.conflict).toBeTruthy();
      expect(result.current.conflict?.local).toEqual({ content: 'local changes' });
      expect(result.current.conflict?.remote).toEqual({ content: 'server data' });
      expect(onConflict).toHaveBeenCalled();
    });

    it('should resolve conflict with keep_local', async () => {
      const stored = {
        data: { content: 'local' },
        lastModifiedAt: Date.now(),
        lastSyncedAt: Date.now() - 10_000,
        lastSyncedHash: 'different-from-remote',
      };
      localStorageMock.setItem('test-doc', JSON.stringify(stored));

      mockFetch.mockImplementation((url: string, options?: { method?: string }) => {
        const isPut = options?.method === 'PUT';
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(isPut ? { content: 'local' } : { content: 'server' }),
        });
      });

      const { result } = renderHook(() =>
        useSync<{ content: string }>({
          key: 'test-doc',
          endpoint: '/api/docs/1',
        })
      );

      // Wait for conflict to be detected
      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      expect(result.current.conflict).toBeTruthy();

      await act(async () => {
        await result.current.resolveConflict('keep_local');
      });

      expect(result.current.data).toEqual({ content: 'local' });
      expect(result.current.conflict).toBeNull();
    });

    it('should resolve conflict with use_remote', async () => {
      const stored = {
        data: { content: 'local' },
        lastModifiedAt: Date.now(),
        lastSyncedAt: Date.now() - 10_000,
        lastSyncedHash: 'different-from-remote',
      };
      localStorageMock.setItem('test-doc', JSON.stringify(stored));

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'server' }),
      });

      const { result } = renderHook(() =>
        useSync<{ content: string }>({
          key: 'test-doc',
          endpoint: '/api/docs/1',
        })
      );

      // Wait for conflict to be detected
      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      expect(result.current.conflict).toBeTruthy();

      await act(async () => {
        await result.current.resolveConflict('use_remote');
      });

      expect(result.current.data).toEqual({ content: 'server' });
      expect(result.current.conflict).toBeNull();
      expect(result.current.status).toBe('synced');
    });
  });

  describe('callbacks', () => {
    it('should call onSync when forceSave succeeds', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'saved' }),
      });

      const onSync = vi.fn();
      const { result } = renderHook(() =>
        useSync<{ content: string }>({
          key: 'test-doc',
          endpoint: '/api/docs/1',
          initialData: { content: 'initial' },
          onSync,
        })
      );

      act(() => {
        result.current.setData({ content: 'updated' });
      });

      await act(async () => {
        await result.current.forceSave();
      });

      expect(onSync).toHaveBeenCalledWith({ content: 'saved' });
    });
  });
});
