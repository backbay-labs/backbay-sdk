/**
 * useRunStream - Hook for streaming run events
 *
 * Implements dual EventSource + polling pattern for resilient real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RunEvent, RunStatus, AgentRun } from '../protocol/types.js';
import { useBBContext } from '../components/BBProvider.js';

// =============================================================================
// Types
// =============================================================================

export interface UseRunStreamOptions {
  /** Polling interval in ms (default: 4000) */
  pollInterval?: number;

  /** Whether to use polling as primary (if EventSource unavailable) */
  preferPolling?: boolean;

  /** Called on each event */
  onEvent?: (event: RunEvent) => void;

  /** Called when run completes */
  onComplete?: (run: AgentRun) => void;

  /** Called on error */
  onError?: (error: Error) => void;
}

export interface UseRunStreamReturn {
  /** All received events */
  events: RunEvent[];

  /** Most recent event */
  latestEvent: RunEvent | null;

  /** Derived run status */
  status: RunStatus;

  /** Whether EventSource is connected */
  isConnected: boolean;

  /** Current run data (if available) */
  run: AgentRun | null;

  /** Manually disconnect */
  disconnect: () => void;

  /** Manually reconnect */
  reconnect: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useRunStream(
  runId: string | null,
  options: UseRunStreamOptions = {}
): UseRunStreamReturn {
  const { pollInterval = 4000, preferPolling = false, onEvent, onComplete, onError } = options;

  const { config } = useBBContext();

  const [events, setEvents] = useState<RunEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<RunEvent | null>(null);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [run, setRun] = useState<AgentRun | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef = useRef(true);

  // Handle incoming event
  const handleEvent = useCallback(
    (event: RunEvent) => {
      if (!isActiveRef.current) return;

      setEvents((prev) => [...prev, event]);
      setLatestEvent(event);
      onEvent?.(event);

      // Update status from event
      if (event.data?.status) {
        setStatus(event.data.status);
      }

      // Handle completion events
      if (event.type === 'completed' || event.type === 'failed' || event.type === 'cancelled') {
        const finalStatus =
          event.type === 'completed'
            ? 'completed'
            : event.type === 'failed'
              ? 'failed'
              : 'cancelled';
        setStatus(finalStatus);

        if (event.data?.run) {
          setRun(event.data.run);
          if (event.type === 'completed') {
            onComplete?.(event.data.run);
          }
        }
      }
    },
    [onEvent, onComplete]
  );

  // Setup EventSource
  const setupEventSource = useCallback(() => {
    if (!runId || preferPolling) return;

    const url = `${config.apiBaseUrl}/runs/${runId}/events`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
      handleEvent({
        type: 'connected',
        runId,
        timestamp: Date.now(),
      });
    };

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        handleEvent({
          type: data.type ?? 'status',
          runId,
          timestamp: Date.now(),
          data,
        });
      } catch (err) {
        console.error('Failed to parse event:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      // EventSource will auto-reconnect, but we'll start polling as fallback
      startPolling();
    };

    eventSourceRef.current = eventSource;
  }, [runId, config.apiBaseUrl, preferPolling, handleEvent]);

  // Setup polling
  const startPolling = useCallback(() => {
    if (!runId || pollingIntervalRef.current) return;

    const poll = async () => {
      if (!isActiveRef.current || !runId) return;

      try {
        const response = await fetch(`${config.apiBaseUrl}/runs/${runId}`, {
          headers: config.headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        handleEvent({
          type: 'status',
          runId,
          timestamp: Date.now(),
          data: {
            status: data.status,
            output: data.output,
            run: data,
          },
        });

        // Stop polling if run is complete
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          stopPolling();
          handleEvent({
            type: data.status,
            runId,
            timestamp: Date.now(),
            data: { run: data },
          });
        }
      } catch (err) {
        if (err instanceof Error) {
          onError?.(err);
        }
      }
    };

    // Initial poll
    poll();

    // Setup interval
    pollingIntervalRef.current = setInterval(poll, pollInterval);
  }, [runId, config, pollInterval, handleEvent, onError]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Disconnect everything
  const disconnect = useCallback(() => {
    isActiveRef.current = false;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    stopPolling();
    setIsConnected(false);
  }, [stopPolling]);

  // Reconnect
  const reconnect = useCallback(() => {
    disconnect();
    isActiveRef.current = true;

    // Reset state
    setEvents([]);
    setLatestEvent(null);
    setStatus('idle');

    // Restart
    if (preferPolling) {
      startPolling();
    } else {
      setupEventSource();
    }
  }, [disconnect, preferPolling, startPolling, setupEventSource]);

  // Effect: Setup on mount / runId change
  useEffect(() => {
    if (!runId) {
      disconnect();
      return;
    }

    isActiveRef.current = true;
    setEvents([]);
    setLatestEvent(null);
    setStatus('running');

    if (preferPolling) {
      startPolling();
    } else {
      setupEventSource();
      // Also start polling as fallback with longer interval
      setTimeout(() => {
        if (isActiveRef.current && !isConnected) {
          startPolling();
        }
      }, 2000);
    }

    return () => {
      disconnect();
    };
  }, [runId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    events,
    latestEvent,
    status,
    isConnected,
    run,
    disconnect,
    reconnect,
  };
}

// =============================================================================
// Utility: Subscribe to run events (non-hook version)
// =============================================================================

export function subscribeToRunEvents(
  apiBaseUrl: string,
  runId: string,
  callback: (event: RunEvent) => void,
  options: { headers?: Record<string, string> } = {}
): () => void {
  const url = `${apiBaseUrl}/runs/${runId}/events`;
  const eventSource = new EventSource(url);

  eventSource.onopen = () => {
    callback({
      type: 'connected',
      runId,
      timestamp: Date.now(),
    });
  };

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      callback({
        type: data.type ?? 'status',
        runId,
        timestamp: Date.now(),
        data,
      });
    } catch (err) {
      console.error('Failed to parse event:', err);
    }
  };

  eventSource.onerror = () => {
    // EventSource handles reconnection automatically
  };

  return () => eventSource.close();
}
