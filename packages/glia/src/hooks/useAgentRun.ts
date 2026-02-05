/**
 * useAgentRun - Hook for executing agent runs
 */

import { useState, useCallback, useRef } from 'react';
import type { AgentRun, RunStatus } from '../protocol/types.js';
import { useBBContext } from '../components/BBProvider.js';

// =============================================================================
// Types
// =============================================================================

export interface UseAgentRunOptions {
  /** Called when run starts */
  onStart?: (run: AgentRun) => void;

  /** Called when run completes */
  onComplete?: (run: AgentRun) => void;

  /** Called when run fails */
  onError?: (run: AgentRun, error: Error) => void;

  /** Called when run is cancelled */
  onCancel?: (run: AgentRun) => void;
}

export interface UseAgentRunReturn {
  /** Current run object or null */
  run: AgentRun | null;

  /** Current status */
  status: RunStatus;

  /** Run output when completed */
  output: string | null;

  /** Error message if failed */
  error: string | null;

  /** Actual cost incurred */
  cost: number | null;

  /** Time taken in ms */
  latency: number | null;

  /** Start a new run */
  start: (agentId: string, prompt: string, context?: Record<string, unknown>) => Promise<void>;

  /** Cancel the current run */
  cancel: () => void;

  /** Whether a run is in progress */
  isRunning: boolean;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAgentRun(options: UseAgentRunOptions = {}): UseAgentRunReturn {
  const { onStart, onComplete, onError, onCancel } = options;

  const { config, addRun, updateRun, getAgent } = useBBContext();

  const [run, setRun] = useState<AgentRun | null>(null);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const start = useCallback(
    async (agentId: string, prompt: string, context?: Record<string, unknown>) => {
      // Cancel any existing run
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const startedAt = Date.now();

      const newRun: AgentRun = {
        id: runId,
        agentId,
        prompt,
        context,
        status: 'running',
        startedAt,
      };

      // Update state
      setRun(newRun);
      setStatus('running');
      setOutput(null);
      setError(null);
      setCost(null);
      setLatency(null);

      // Add to global tracking
      addRun(newRun);
      onStart?.(newRun);

      try {
        // Make API call
        const response = await fetch(`${config.apiBaseUrl}/runs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          body: JSON.stringify({
            agentId,
            prompt,
            context,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        const completedAt = Date.now();
        const runLatency = completedAt - startedAt;

        // Get agent cost estimate
        const agent = getAgent(agentId);
        const runCost = result.cost ?? agent?.costPerRun ?? 0;

        const completedRun: AgentRun = {
          ...newRun,
          status: 'completed',
          output: result.output,
          cost: runCost,
          tokenCount: result.tokenCount,
          latencyMs: runLatency,
          completedAt,
        };

        // Update state
        setRun(completedRun);
        setStatus('completed');
        setOutput(result.output);
        setCost(runCost);
        setLatency(runLatency);

        // Update global tracking
        updateRun(runId, completedRun);
        onComplete?.(completedRun);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Cancelled
          const cancelledRun: AgentRun = {
            ...newRun,
            status: 'cancelled',
            completedAt: Date.now(),
          };
          setRun(cancelledRun);
          setStatus('cancelled');
          updateRun(runId, cancelledRun);
          onCancel?.(cancelledRun);
          return;
        }

        // Failed
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const failedRun: AgentRun = {
          ...newRun,
          status: 'failed',
          error: errorMessage,
          completedAt: Date.now(),
        };

        setRun(failedRun);
        setStatus('failed');
        setError(errorMessage);

        updateRun(runId, failedRun);
        onError?.(failedRun, err instanceof Error ? err : new Error(errorMessage));
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [config, addRun, updateRun, getAgent, onStart, onComplete, onError, onCancel]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    run,
    status,
    output,
    error,
    cost,
    latency,
    start,
    cancel,
    isRunning: status === 'running',
  };
}
