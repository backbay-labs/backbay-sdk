/**
 * BBProvider - Root context provider for bb-ui
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { Agent, AgentRun, BBConfig, SyncStatus } from '../protocol/types.js';

// =============================================================================
// Context Types
// =============================================================================

interface BBContextValue {
  /** Configuration */
  config: BBConfig;

  /** Available agents */
  agents: Agent[];

  /** Currently executing runs */
  activeRuns: AgentRun[];

  /** All runs in this session */
  runHistory: AgentRun[];

  /** Session cost accumulator */
  totalCost: number;

  /** Global sync status */
  syncStatus: SyncStatus;

  /** Add a run to tracking */
  addRun: (run: AgentRun) => void;

  /** Update a run */
  updateRun: (runId: string, updates: Partial<AgentRun>) => void;

  /** Set global sync status */
  setSyncStatus: (status: SyncStatus) => void;

  /** Get an agent by ID */
  getAgent: (agentId: string) => Agent | undefined;
}

// =============================================================================
// Context
// =============================================================================

const BBContext = createContext<BBContextValue | null>(null);

// =============================================================================
// Provider Props
// =============================================================================

export interface BBProviderProps {
  children: ReactNode;

  /** Configuration for bb-ui */
  config: BBConfig;

  /** Available agents */
  agents?: Agent[];

  /** Initial sync status */
  initialSyncStatus?: SyncStatus;
}

// =============================================================================
// Provider Component
// =============================================================================

export function BBProvider({
  children,
  config,
  agents = [],
  initialSyncStatus = 'synced',
}: BBProviderProps) {
  const [activeRuns, setActiveRuns] = useState<AgentRun[]>([]);
  const [runHistory, setRunHistory] = useState<AgentRun[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(initialSyncStatus);

  // Calculate total cost from run history
  const totalCost = useMemo(() => {
    return runHistory.reduce((sum, run) => sum + (run.cost ?? 0), 0);
  }, [runHistory]);

  // Add a new run
  const addRun = useCallback((run: AgentRun) => {
    setActiveRuns((prev) => [...prev, run]);
    setRunHistory((prev) => [...prev, run]);
  }, []);

  // Update an existing run
  const updateRun = useCallback((runId: string, updates: Partial<AgentRun>) => {
    const updateInList = (runs: AgentRun[]) =>
      runs.map((run) => (run.id === runId ? { ...run, ...updates } : run));

    setActiveRuns((prev) => {
      const updated = updateInList(prev);
      // Remove completed/failed/cancelled runs from active
      return updated.filter(
        (run) => run.status === 'idle' || run.status === 'running'
      );
    });

    setRunHistory(updateInList);
  }, []);

  // Get agent by ID
  const getAgent = useCallback(
    (agentId: string) => agents.find((a) => a.id === agentId),
    [agents]
  );

  const value = useMemo<BBContextValue>(
    () => ({
      config,
      agents,
      activeRuns,
      runHistory,
      totalCost,
      syncStatus,
      addRun,
      updateRun,
      setSyncStatus,
      getAgent,
    }),
    [
      config,
      agents,
      activeRuns,
      runHistory,
      totalCost,
      syncStatus,
      addRun,
      updateRun,
      getAgent,
    ]
  );

  return <BBContext.Provider value={value}>{children}</BBContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Access the bb-ui context
 */
export function useBBContext(): BBContextValue {
  const context = useContext(BBContext);
  if (!context) {
    throw new Error('useBBContext must be used within a BBProvider');
  }
  return context;
}

/**
 * Check if we're inside a BBProvider
 */
export function useBBContextOptional(): BBContextValue | null {
  return useContext(BBContext);
}
