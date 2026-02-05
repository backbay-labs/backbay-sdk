/**
 * React hook for Speakeasy P2P transport
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createTransport,
  createEnvelope,
  type ConnectionState,
  type KnownPeer,
  type MessageEnvelope,
  type NodeConfig,
  type SpeakeasyTopic,
  type Transport,
} from '../transport';
import type { AnyMessage } from '../core';

export interface UseTransportState {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Connected peers */
  peers: KnownPeer[];
  /** Active speakeasy subscriptions */
  subscriptions: Map<string, SpeakeasyTopic>;
  /** Connection error if any */
  error: Error | null;
}

export interface UseTransportActions {
  /** Connect to the network */
  connect: () => Promise<void>;
  /** Disconnect from the network */
  disconnect: () => Promise<void>;
  /** Join a speakeasy */
  joinSpeakeasy: (speakeasyId: string) => Promise<SpeakeasyTopic>;
  /** Leave a speakeasy */
  leaveSpeakeasy: (speakeasyId: string) => Promise<void>;
  /** Publish a message */
  publish: (topic: string, message: AnyMessage) => Promise<void>;
}

export type UseTransportReturn = UseTransportState & UseTransportActions;

export interface UseTransportOptions extends NodeConfig {
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Callback for received messages */
  onMessage?: (topic: string, envelope: MessageEnvelope) => void;
  /** Callback for peer events */
  onPeerConnect?: (peer: KnownPeer) => void;
  onPeerDisconnect?: (peerId: string) => void;
}

/**
 * Hook for managing P2P transport connection
 *
 * @example
 * ```tsx
 * function Chat({ speakeasyId }: { speakeasyId: string }) {
 *   const { connectionState, connect, joinSpeakeasy, publish } = useTransport({
 *     autoConnect: true,
 *     onMessage: (topic, envelope) => {
 *       console.log('Received:', envelope.payload);
 *     },
 *   });
 *
 *   useEffect(() => {
 *     if (connectionState === 'connected') {
 *       joinSpeakeasy(speakeasyId);
 *     }
 *   }, [connectionState, speakeasyId]);
 *
 *   // ...
 * }
 * ```
 */
export function useTransport(options: UseTransportOptions = {}): UseTransportReturn {
  const {
    autoConnect = false,
    onMessage,
    onPeerConnect,
    onPeerDisconnect,
    ...config
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [peers, setPeers] = useState<KnownPeer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Map<string, SpeakeasyTopic>>(new Map());
  const [error, setError] = useState<Error | null>(null);

  // Store transport instance
  const transportRef = useRef<Transport | null>(null);

  // Store callbacks in refs to avoid recreating transport
  const callbacksRef = useRef({ onMessage, onPeerConnect, onPeerDisconnect });
  useEffect(() => {
    callbacksRef.current = { onMessage, onPeerConnect, onPeerDisconnect };
  }, [onMessage, onPeerConnect, onPeerDisconnect]);

  // Create transport on mount
  useEffect(() => {
    const transport = createTransport(config);
    transportRef.current = transport;

    // Set up event handlers
    transport.on('connection:state', ({ state, error }) => {
      setConnectionState(state);
      if (error) setError(error);
    });

    transport.on('peer:connect', ({ peerId }) => {
      const peer: KnownPeer = {
        peerId,
        addrs: [],
        lastSeen: Date.now(),
      };
      setPeers((prev) => [...prev, peer]);
      callbacksRef.current.onPeerConnect?.(peer);
    });

    transport.on('peer:disconnect', ({ peerId }) => {
      setPeers((prev) => prev.filter((p) => p.peerId.toString() !== peerId.toString()));
      callbacksRef.current.onPeerDisconnect?.(peerId.toString());
    });

    transport.on('message:received', ({ topic, envelope }) => {
      callbacksRef.current.onMessage?.(topic, envelope);
    });

    // Auto-connect if requested
    if (autoConnect) {
      transport.start().catch((err) => {
        setError(err);
      });
    }

    return () => {
      transport.stop();
      transportRef.current = null;
    };
  }, []); // Only run once on mount

  const connect = useCallback(async (): Promise<void> => {
    if (!transportRef.current) {
      throw new Error('Transport not initialized');
    }

    setError(null);
    await transportRef.current.start();
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    if (!transportRef.current) {
      return;
    }

    await transportRef.current.stop();
    setSubscriptions(new Map());
  }, []);

  const joinSpeakeasy = useCallback(async (speakeasyId: string): Promise<SpeakeasyTopic> => {
    if (!transportRef.current) {
      throw new Error('Transport not initialized');
    }

    const topic = await transportRef.current.joinSpeakeasy(speakeasyId);
    setSubscriptions((prev) => new Map(prev).set(speakeasyId, topic));
    return topic;
  }, []);

  const leaveSpeakeasy = useCallback(async (speakeasyId: string): Promise<void> => {
    if (!transportRef.current) {
      return;
    }

    await transportRef.current.leaveSpeakeasy(speakeasyId);
    setSubscriptions((prev) => {
      const next = new Map(prev);
      next.delete(speakeasyId);
      return next;
    });
  }, []);

  const publish = useCallback(async (topic: string, message: AnyMessage): Promise<void> => {
    if (!transportRef.current) {
      throw new Error('Transport not initialized');
    }

    const envelope = createEnvelope('message', message);
    await transportRef.current.publish(topic, envelope);
  }, []);

  return {
    connectionState,
    peers,
    subscriptions,
    error,
    connect,
    disconnect,
    joinSpeakeasy,
    leaveSpeakeasy,
    publish,
  };
}
