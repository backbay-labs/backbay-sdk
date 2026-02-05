/**
 * useSync - Offline-first sync hook with conflict resolution
 *
 * Implements the hybrid local+API sync pattern from Backbay.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { SyncStatus, SyncConflict, ConflictResolution } from '../protocol/types.js';

// =============================================================================
// Types
// =============================================================================

export interface UseSyncOptions<T> {
  /** Unique key for localStorage */
  key: string;

  /** API endpoint for sync */
  endpoint: string;

  /** Debounce time in ms (default: 2000) */
  debounce?: number;

  /** Initial data */
  initialData?: T;

  /** Custom fetch function */
  fetcher?: (endpoint: string) => Promise<T>;

  /** Custom save function */
  saver?: (endpoint: string, data: T) => Promise<T>;

  /** Called when conflict is detected */
  onConflict?: (conflict: SyncConflict<T>) => void;

  /** Called on sync error */
  onError?: (error: Error) => void;

  /** Called on successful sync */
  onSync?: (data: T) => void;
}

export interface UseSyncReturn<T> {
  /** Current data */
  data: T | null;

  /** Update data locally (triggers debounced sync) */
  setData: (data: T | ((prev: T | null) => T)) => void;

  /** Current sync status */
  status: SyncStatus;

  /** Number of pending changes */
  pendingChanges: number;

  /** Timestamp of last successful sync */
  lastSyncedAt: number | null;

  /** Current conflict if status === 'conflict' */
  conflict: SyncConflict<T> | null;

  /** Resolve a conflict */
  resolveConflict: (resolution: ConflictResolution) => Promise<void>;

  /** Force immediate save (bypass debounce) */
  forceSave: () => Promise<void>;

  /** Refresh from server */
  refresh: () => Promise<void>;

  /** Whether initial load is complete */
  isLoaded: boolean;
}

// =============================================================================
// Local Storage Helpers
// =============================================================================

type StoredDataV1<T> = {
  data: T;
  timestamp: number;
  version: number;
};

interface StoredDataV2<T> {
  data: T;
  /** When the data last changed locally (ms since epoch). */
  lastModifiedAt: number;
  /** When we last successfully synced to server (ms since epoch). 0 means "unknown/never". */
  lastSyncedAt: number;
  /** Hash of the server data at the last successful sync (empty string means "unknown/never"). */
  lastSyncedHash: string;
}

type StoredData<T> = StoredDataV2<T>;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const encoded = JSON.stringify(value);
    return encoded === undefined ? "null" : encoded;
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`).join(",")}}`;
}

function hashString(input: string): string {
  // FNV-1a 32-bit
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

function hashData(value: unknown): string {
  return hashString(stableStringify(value));
}

function normalizeStoredData<T>(raw: unknown): StoredData<T> | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;

  // v2
  if (
    "data" in record &&
    typeof record.lastModifiedAt === "number" &&
    typeof record.lastSyncedAt === "number" &&
    typeof record.lastSyncedHash === "string"
  ) {
    return record as unknown as StoredData<T>;
  }

  // v1 (legacy)
  if ("data" in record && typeof record.timestamp === "number" && typeof record.version === "number") {
    const legacy = record as StoredDataV1<T>;
    const syncedHash = hashData(legacy.data);
    return {
      data: legacy.data,
      lastModifiedAt: legacy.timestamp,
      lastSyncedAt: legacy.timestamp,
      lastSyncedHash: syncedHash,
    };
  }

  return null;
}

function getStoredData<T>(key: string): StoredData<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return normalizeStoredData<T>(parsed);
  } catch {
    return null;
  }
}

function setStoredData<T>(key: string, record: StoredData<T>): void {
  localStorage.setItem(key, JSON.stringify(record));
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useSync<T>({
  key,
  endpoint,
  debounce = 2000,
  initialData,
  fetcher,
  saver,
  onConflict,
  onError,
  onSync,
}: UseSyncOptions<T>): UseSyncReturn<T> {
  // State
  const [data, setDataState] = useState<T | null>(initialData ?? null);
  const [status, setStatus] = useState<SyncStatus>('synced');
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [conflict, setConflict] = useState<SyncConflict<T> | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  // Fetcher / saver are injectable to support custom backends.
  const doFetch = useCallback(
    async (url: string) => {
      if (fetcher) return fetcher(url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<T>;
    },
    [fetcher]
  );

  const doSave = useCallback(
    async (url: string, payload: T) => {
      if (saver) return saver(url, payload);
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<T>;
    },
    [saver]
  );

  // Load initial data
  useEffect(() => {
    const loadInitial = async () => {
      // First, check localStorage for cached data
      const stored = getStoredData<T>(key);
      if (stored) {
        setDataState(stored.data);
        const storedSyncedAt = stored.lastSyncedAt > 0 ? stored.lastSyncedAt : null;
        setLastSyncedAt(storedSyncedAt);

        const hasLocalChanges = stored.lastModifiedAt > stored.lastSyncedAt;
        if (hasLocalChanges) {
          setStatus("pending");
          setPendingChanges((c) => Math.max(c, 1));
        }
      }

      // Then fetch from server
      try {
        const serverData = await doFetch(endpoint);
        const remoteTimestamp = Date.now();
        const remoteHash = hashData(serverData);

        if (stored) {
          const hasLocalChanges = stored.lastModifiedAt > stored.lastSyncedAt;
          const baselineHash = stored.lastSyncedHash || hashData(stored.data);
          const remoteChangedSinceSync = remoteHash !== baselineHash;

          if (hasLocalChanges && remoteChangedSinceSync) {
            const localConflict: SyncConflict<T> = {
              local: stored.data,
              remote: serverData,
              localTimestamp: stored.lastModifiedAt,
              remoteTimestamp,
            };
            setConflict(localConflict);
            setStatus("conflict");
            onConflict?.(localConflict);
          } else if (!hasLocalChanges) {
            // No local changes, use server data
            setDataState(serverData);
            setStoredData(key, {
              data: serverData,
              lastModifiedAt: remoteTimestamp,
              lastSyncedAt: remoteTimestamp,
              lastSyncedHash: remoteHash,
            });
            setLastSyncedAt(remoteTimestamp);
            setPendingChanges(0);
            setStatus("synced");
          } else {
            // Local has changes, but server hasn't changed since last sync.
            // Keep local data and remain pending until the next save.
            setStatus("pending");
          }
        } else {
          // No local data, use server data
          setDataState(serverData);
          setStoredData(key, {
            data: serverData,
            lastModifiedAt: remoteTimestamp,
            lastSyncedAt: remoteTimestamp,
            lastSyncedHash: remoteHash,
          });
          setLastSyncedAt(remoteTimestamp);
          setPendingChanges(0);
          setStatus("synced");
        }
      } catch (error) {
        // Offline - use cached data
        setStatus("offline");
        if (error instanceof Error) {
          onError?.(error);
        }
      }

      setIsLoaded(true);
    };

    loadInitial();
  }, [key, endpoint, doFetch, onConflict, onError]);

  // Save to server
  const saveToServer = useCallback(async (payload?: T) => {
    const dataToSave = payload ?? data;
    if (isSavingRef.current || dataToSave === null) return;
    isSavingRef.current = true;

    try {
      setStatus("pending");
      const serverData = await doSave(endpoint, dataToSave);
      const syncedAt = Date.now();
      const syncedHash = hashData(serverData);

      setDataState(serverData);
      setStoredData(key, {
        data: serverData,
        lastModifiedAt: syncedAt,
        lastSyncedAt: syncedAt,
        lastSyncedHash: syncedHash,
      });
      setLastSyncedAt(syncedAt);
      setPendingChanges(0);
      setStatus("synced");
      onSync?.(serverData);
    } catch (error) {
      setStatus("offline");
      if (error instanceof Error) {
        onError?.(error);
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [data, endpoint, key, doSave, onSync, onError]);

  // Set data with debounced sync
  const setData = useCallback(
    (updater: T | ((prev: T | null) => T)) => {
      setDataState((prev) => {
        const newData = typeof updater === "function" ? (updater as (prev: T | null) => T)(prev) : updater;

        const previousStored = getStoredData<T>(key);
        const now = Date.now();

        setStoredData(key, {
          data: newData,
          lastModifiedAt: now,
          lastSyncedAt: previousStored?.lastSyncedAt ?? 0,
          lastSyncedHash: previousStored?.lastSyncedHash ?? "",
        });

        setPendingChanges((c) => c + 1);
        setStatus("pending");

        // Clear existing debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Set new debounce timer
        debounceTimerRef.current = setTimeout(() => {
          saveToServer();
        }, debounce);

        return newData;
      });
    },
    [key, debounce, saveToServer]
  );

  // Force save (bypass debounce)
  const forceSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await saveToServer();
  }, [saveToServer]);

  // Refresh from server
  const refresh = useCallback(async () => {
    try {
      const serverData = await doFetch(endpoint);
      const syncedAt = Date.now();
      const syncedHash = hashData(serverData);

      setDataState(serverData);
      setStoredData(key, {
        data: serverData,
        lastModifiedAt: syncedAt,
        lastSyncedAt: syncedAt,
        lastSyncedHash: syncedHash,
      });
      setLastSyncedAt(syncedAt);
      setPendingChanges(0);
      setConflict(null);
      setStatus("synced");
    } catch (error) {
      setStatus("offline");
      if (error instanceof Error) {
        onError?.(error);
      }
    }
  }, [endpoint, key, doFetch, onError]);

  // Resolve conflict
  const resolveConflict = useCallback(
    async (resolution: ConflictResolution) => {
      if (!conflict) return;

      switch (resolution) {
        case "keep_local":
          // Keep local, push to server
          setDataState(conflict.local);
          setConflict(null);
          setStatus("pending");
          setPendingChanges((c) => Math.max(c, 1));
          await saveToServer(conflict.local);
          break;

        case "use_remote": {
          // Use remote, discard local
          const remoteHash = hashData(conflict.remote);
          setDataState(conflict.remote);
          setStoredData(key, {
            data: conflict.remote,
            lastModifiedAt: conflict.remoteTimestamp,
            lastSyncedAt: conflict.remoteTimestamp,
            lastSyncedHash: remoteHash,
          });
          setLastSyncedAt(conflict.remoteTimestamp);
          setPendingChanges(0);
          setConflict(null);
          setStatus("synced");
          break;
        }

        case "create_copy":
          // Keep local as copy, also keep remote
          // This would typically save local to a new key/endpoint
          // For now, we just keep local
          setDataState(conflict.local);
          setConflict(null);
          setStatus("pending");
          setPendingChanges((c) => Math.max(c, 1));
          await saveToServer(conflict.local);
          break;
      }
    },
    [conflict, key, saveToServer]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    data,
    setData,
    status,
    pendingChanges,
    lastSyncedAt,
    conflict,
    resolveConflict,
    forceSave,
    refresh,
    isLoaded,
  };
}
