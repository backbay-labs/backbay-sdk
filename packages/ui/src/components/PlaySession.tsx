/**
 * PlaySession - Component for managing play session lifecycle
 *
 * Provides render props for session control, video rendering, and RPC calls.
 */

import { useRef, useEffect, type ReactElement, type RefObject } from 'react';
import { usePlaySession, type UsePlaySessionOptions } from '../hooks/usePlaySession.js';
import type { PlaySessionData, PlaySessionStatus, JsonRpcResponse } from '../protocol/types.js';

// =============================================================================
// Types
// =============================================================================

export interface PlaySessionRenderProps {
  /** Current session or null */
  session: PlaySessionData | null;

  /** Session status */
  status: PlaySessionStatus;

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

  /** Video element ref (attach to your video element) */
  videoRef: RefObject<HTMLVideoElement | null>;

  /** Whether currently connected */
  isConnected: boolean;

  /** Error message if any */
  error: string | null;
}

export interface PlaySessionProps extends Omit<UsePlaySessionOptions, 'onConnect' | 'onDisconnect' | 'onRpcResult' | 'onError'> {
  /** Called when session starts */
  onSessionStart?: (session: PlaySessionData) => void;

  /** Called when session ends */
  onSessionEnd?: () => void;

  /** Called on RPC result */
  onRpcResult?: (result: JsonRpcResponse) => void;

  /** Called on error */
  onError?: (error: Error) => void;

  /** Render function for session UI */
  children: (props: PlaySessionRenderProps) => ReactElement;

  /** Custom class name for the wrapper */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PlaySession({
  adapter,
  autoConnect = false,
  timeout,
  onSessionStart,
  onSessionEnd,
  onRpcResult,
  onError,
  children,
  className,
}: PlaySessionProps): ReactElement {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    session,
    status,
    videoTrack,
    audioTrack,
    call,
    observe,
    act,
    connect,
    disconnect,
    isConnected,
    error,
  } = usePlaySession({
    adapter,
    autoConnect,
    timeout,
    onConnect: onSessionStart,
    onDisconnect: onSessionEnd,
    onRpcResult,
    onError,
  });

  // Attach video track to video element when available
  useEffect(() => {
    if (videoRef.current && videoTrack) {
      const stream = new MediaStream([videoTrack]);
      videoRef.current.srcObject = stream;
    }
  }, [videoTrack]);

  // Attach audio track when available
  useEffect(() => {
    if (videoRef.current && audioTrack) {
      const currentStream = videoRef.current.srcObject as MediaStream | null;
      if (currentStream) {
        currentStream.addTrack(audioTrack);
      }
    }
  }, [audioTrack]);

  return (
    <div
      className={`bb-play-session ${className ?? ''}`}
      data-bb-state={status}
      data-bb-adapter={adapter}
      data-bb-session-id={session?.id}
    >
      {children({
        session,
        status,
        call,
        observe,
        act,
        connect,
        disconnect,
        videoRef,
        isConnected,
        error,
      })}
    </div>
  );
}
