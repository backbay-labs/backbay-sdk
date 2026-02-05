/**
 * Tests for BBProvider component
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BBProvider, useBBContext, useBBContextOptional } from '../../src/components/BBProvider.js';
import type { BBConfig, Agent } from '../../src/protocol/types.js';
import type { ReactNode } from 'react';

const testConfig: BBConfig = {
  apiBaseUrl: 'https://api.example.com',
  syncDebounce: 1000,
  conflictResolution: 'prompt',
  costTracking: true,
};

const testAgents: Agent[] = [
  { id: 'writer', name: 'Writer Agent', costPerRun: 0.05 },
  { id: 'reviewer', name: 'Reviewer Agent', costPerRun: 0.03 },
];

const wrapper = ({ children }: { children: ReactNode }) => (
  <BBProvider config={testConfig} agents={testAgents}>
    {children}
  </BBProvider>
);

describe('BBProvider', () => {
  describe('useBBContext', () => {
    it('should provide config', () => {
      const { result } = renderHook(() => useBBContext(), { wrapper });
      expect(result.current.config).toEqual(testConfig);
    });

    it('should provide agents', () => {
      const { result } = renderHook(() => useBBContext(), { wrapper });
      expect(result.current.agents).toEqual(testAgents);
    });

    it('should start with empty runs', () => {
      const { result } = renderHook(() => useBBContext(), { wrapper });
      expect(result.current.activeRuns).toEqual([]);
      expect(result.current.runHistory).toEqual([]);
    });

    it('should start with zero total cost', () => {
      const { result } = renderHook(() => useBBContext(), { wrapper });
      expect(result.current.totalCost).toBe(0);
    });

    it('should start with synced status', () => {
      const { result } = renderHook(() => useBBContext(), { wrapper });
      expect(result.current.syncStatus).toBe('synced');
    });

    it('should throw outside provider', () => {
      expect(() => {
        renderHook(() => useBBContext());
      }).toThrow('useBBContext must be used within a BBProvider');
    });
  });

  describe('useBBContextOptional', () => {
    it('should return null outside provider', () => {
      const { result } = renderHook(() => useBBContextOptional());
      expect(result.current).toBeNull();
    });

    it('should return context inside provider', () => {
      const { result } = renderHook(() => useBBContextOptional(), { wrapper });
      expect(result.current).not.toBeNull();
    });
  });

  describe('run management', () => {
    it('should add a run', () => {
      const { result } = renderHook(() => useBBContext(), { wrapper });

      act(() => {
        result.current.addRun({
          id: 'run-1',
          agentId: 'writer',
          prompt: 'Write something',
          status: 'running',
          startedAt: Date.now(),
        });
      });

      expect(result.current.activeRuns).toHaveLength(1);
      expect(result.current.runHistory).toHaveLength(1);
      expect(result.current.activeRuns[0].id).toBe('run-1');
    });

    it('should update a run', () => {
      const { result } = renderHook(() => useBBContext(), { wrapper });

      act(() => {
        result.current.addRun({
          id: 'run-1',
          agentId: 'writer',
          prompt: 'Write something',
          status: 'running',
          startedAt: Date.now(),
        });
      });

      act(() => {
        result.current.updateRun('run-1', {
          status: 'completed',
          output: 'Done!',
          cost: 0.05,
        });
      });

      // Completed runs are removed from activeRuns
      expect(result.current.activeRuns).toHaveLength(0);
      // But remain in history
      expect(result.current.runHistory[0].status).toBe('completed');
      expect(result.current.runHistory[0].output).toBe('Done!');
    });

    it('should accumulate cost from completed runs', () => {
      const { result } = renderHook(() => useBBContext(), { wrapper });

      act(() => {
        result.current.addRun({
          id: 'run-1',
          agentId: 'writer',
          prompt: 'Test 1',
          status: 'running',
          startedAt: Date.now(),
        });
      });

      act(() => {
        result.current.updateRun('run-1', { status: 'completed', cost: 0.05 });
      });

      act(() => {
        result.current.addRun({
          id: 'run-2',
          agentId: 'reviewer',
          prompt: 'Test 2',
          status: 'running',
          startedAt: Date.now(),
        });
      });

      act(() => {
        result.current.updateRun('run-2', { status: 'completed', cost: 0.03 });
      });

      expect(result.current.totalCost).toBeCloseTo(0.08);
    });
  });

  describe('agent lookup', () => {
    it('should get agent by ID', () => {
      const { result } = renderHook(() => useBBContext(), { wrapper });
      const agent = result.current.getAgent('writer');
      expect(agent).toEqual(testAgents[0]);
    });

    it('should return undefined for unknown agent', () => {
      const { result } = renderHook(() => useBBContext(), { wrapper });
      const agent = result.current.getAgent('unknown');
      expect(agent).toBeUndefined();
    });
  });

  describe('sync status', () => {
    it('should update sync status', () => {
      const { result } = renderHook(() => useBBContext(), { wrapper });

      act(() => {
        result.current.setSyncStatus('pending');
      });

      expect(result.current.syncStatus).toBe('pending');

      act(() => {
        result.current.setSyncStatus('conflict');
      });

      expect(result.current.syncStatus).toBe('conflict');
    });
  });
});
