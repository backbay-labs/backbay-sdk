/**
 * usePlaySession - Hook for managing play sessions with external environments
 *
 * Handles session lifecycle, LiveKit connections, and JSON-RPC calls to adapters.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { PlaySessionData, PlaySessionStatus, JsonRpcResponse } from '../protocol/types.js';
import { useBBContext } from '../components/BBProvider.js';

// =============================================================================
// Types
// =============================================================================

export interface UsePlaySessionOptions {
  /** Adapter ID (e.g., 'openrct2', 'bbdoom') */
  adapter: string;

  /** Auto-connect on mount */
  autoConnect?: boolean;

  /** Connection timeout in ms */
  timeout?: number;

  /** Called when session is established */
  onConnect?: (session: PlaySessionData) => void;

  /** Called when session ends */
  onDisconnect?: () => void;

  /** Called on RPC result */
  onRpcResult?: (response: JsonRpcResponse) => void;

  /** Called on error */
  onError?: (error: Error) => void;
}

export interface UsePlaySessionReturn {
  /** Current session or null */
  session: PlaySessionData | null;

  /** Session status */
  status: PlaySessionStatus;

  /** LiveKit video track (for rendering) */
  videoTrack: MediaStreamTrack | null;

  /** LiveKit audio track */
  audioTrack: MediaStreamTrack | null;

  /** Make a JSON-RPC call */
  call: <T = unknown>(method: string, params?: Record<string, unknown>) => Promise<JsonRpcResponse<T>>;

  /** Shorthand for observe.* methods */
  observe: <T = unknown>(key: string) => Promise<T>;

  /** Shorthand for act.* methods */
  act: <T = unknown>(action: string, params?: Record<string, unknown>) => Promise<T>;

  /** Connect to the session */
  connect: (options?: { timeout?: number }) => Promise<void>;

  /** Disconnect from the session */
  disconnect: () => Promise<void>;

  /** Whether currently connected */
  isConnected: boolean;

  /** Error message if any */
  error: string | null;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function usePlaySession({
  adapter,
  autoConnect = false,
  timeout = 30000,
  onConnect,
  onDisconnect,
  onRpcResult,
  onError,
}: UsePlaySessionOptions): UsePlaySessionReturn {
  const { config } = useBBContext();

  // State
  const [session, setSession] = useState<PlaySessionData | null>(null);
  const [status, setStatus] = useState<PlaySessionStatus>('disconnected');
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const rpcIdRef = useRef(0);
  const pendingCallsRef = useRef<Map<number, {
    resolve: (value: JsonRpcResponse) => void;
    reject: (error: Error) => void;
  }>>(new Map());

  // Connect to session
  const connect = useCallback(
    async (options?: { timeout?: number }) => {
      if (status === 'connecting' || status === 'connected') return;

      setStatus('connecting');
      setError(null);

      const connectTimeout = options?.timeout ?? timeout;

      try {
        // Create session via API
        const response = await fetch(`${config.apiBaseUrl}/play-sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          body: JSON.stringify({ adapter }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const sessionData = await response.json();
        const newSession: PlaySessionData = {
          id: sessionData.id,
          adapter,
          capabilityToken: sessionData.capabilityToken,
          createdAt: Date.now(),
          expiresAt: sessionData.expiresAt,
          livekitUrl: sessionData.livekitUrl,
          livekitToken: sessionData.livekitToken,
        };

        setSession(newSession);

        // Connect WebSocket for RPC
        const wsUrl = sessionData.wsUrl ?? `${config.apiBaseUrl.replace('http', 'ws')}/play-sessions/${newSession.id}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Set up WebSocket handlers
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
          }, connectTimeout);

          ws.onopen = () => {
            clearTimeout(timeoutId);
            resolve();
          };

          ws.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error('WebSocket connection failed'));
          };
        });

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            // Handle RPC response
            if ('id' in message && pendingCallsRef.current.has(message.id)) {
              const pending = pendingCallsRef.current.get(message.id)!;
              pendingCallsRef.current.delete(message.id);
              pending.resolve(message);
              onRpcResult?.(message);
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onclose = () => {
          setStatus('disconnected');
          setSession(null);
          wsRef.current = null;
          onDisconnect?.();
        };

        ws.onerror = () => {
          setError('WebSocket error');
          onError?.(new Error('WebSocket error'));
        };

        // Connect to LiveKit if available
        if (newSession.livekitUrl && newSession.livekitToken) {
          // Note: LiveKit connection would typically use @livekit/client-sdk
          // For now, we just store the connection info for the consumer to use
        }

        setStatus('connected');
        onConnect?.(newSession);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        setStatus('error');
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    },
    [adapter, config, status, timeout, onConnect, onDisconnect, onRpcResult, onError]
  );

  // Disconnect
  const disconnect = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Optionally notify server
    if (session) {
      try {
        await fetch(`${config.apiBaseUrl}/play-sessions/${session.id}`, {
          method: 'DELETE',
          headers: config.headers,
        });
      } catch {
        // Ignore errors on disconnect
      }
    }

    setSession(null);
    setStatus('disconnected');
    setVideoTrack(null);
    setAudioTrack(null);
    onDisconnect?.();
  }, [session, config, onDisconnect]);

  // Make RPC call
  const call = useCallback(
    <T = unknown>(method: string, params?: Record<string, unknown>): Promise<JsonRpcResponse<T>> => {
      return new Promise((resolve, reject) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reject(new Error('Not connected'));
          return;
        }

        const id = ++rpcIdRef.current;
        const request = {
          jsonrpc: '2.0',
          id,
          method,
          params: params ?? {},
        };

        pendingCallsRef.current.set(id, {
          resolve: resolve as (value: JsonRpcResponse) => void,
          reject,
        });

        wsRef.current.send(JSON.stringify(request));

        // Timeout for RPC call
        setTimeout(() => {
          if (pendingCallsRef.current.has(id)) {
            pendingCallsRef.current.delete(id);
            reject(new Error('RPC call timeout'));
          }
        }, 30000);
      });
    },
    []
  );

  // Observe shorthand
  const observe = useCallback(
    async <T = unknown>(key: string): Promise<T> => {
      const response = await call<T>(`observe.${key}`);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.result as T;
    },
    [call]
  );

  // Act shorthand
  const act = useCallback(
    async <T = unknown>(action: string, params?: Record<string, unknown>): Promise<T> => {
      const response = await call<T>(`act.${action}`, params);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.result as T;
    },
    [call]
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
  }, [autoConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    session,
    status,
    videoTrack,
    audioTrack,
    call,
    observe,
    act,
    connect,
    disconnect,
    isConnected: status === 'connected',
    error,
  };
}
