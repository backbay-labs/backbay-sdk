/**
 * SyncDocument - Wrapper for documents that need offline-first sync
 *
 * Provides render props for content, setContent, status, and lastSaved.
 * Handles conflict resolution UI delegation.
 */

import type { ReactNode, ReactElement } from 'react';
import { useSync, type UseSyncOptions } from '../hooks/useSync.js';
import type { SyncStatus, SyncConflict, ConflictResolution } from '../protocol/types.js';

// =============================================================================
// Types
// =============================================================================

export interface SyncDocumentRenderProps<T> {
  /** Current document content */
  content: T | null;

  /** Update document content */
  setContent: (data: T | ((prev: T | null) => T)) => void;

  /** Current sync status */
  status: SyncStatus;

  /** Timestamp of last successful sync */
  lastSaved: number | null;

  /** Number of pending changes */
  pendingChanges: number;

  /** Force immediate save */
  save: () => Promise<void>;

  /** Refresh from server */
  refresh: () => Promise<void>;

  /** Whether initial load is complete */
  isLoaded: boolean;
}

export interface SyncDocumentProps<T> {
  /** Unique document identifier */
  documentId: string;

  /** API endpoint (documentId will be appended) */
  endpoint: string;

  /** Debounce time in ms (default: 1000) */
  debounce?: number;

  /** Initial content */
  initialContent?: T;

  /** Conflict resolution UI renderer */
  onConflict?: (
    local: T,
    remote: T,
    resolve: (resolution: ConflictResolution) => void
  ) => ReactNode;

  /** Called on sync error */
  onError?: (error: Error) => void;

  /** Called on successful sync */
  onSave?: (content: T) => void;

  /** Render function for document UI */
  children: (props: SyncDocumentRenderProps<T>) => ReactElement;

  /** Custom fetch function */
  fetcher?: (endpoint: string) => Promise<T>;

  /** Custom save function */
  saver?: (endpoint: string, data: T) => Promise<T>;
}

// =============================================================================
// Component
// =============================================================================

export function SyncDocument<T>({
  documentId,
  endpoint,
  debounce = 1000,
  initialContent,
  onConflict,
  onError,
  onSave,
  children,
  fetcher,
  saver,
}: SyncDocumentProps<T>): ReactElement {
  const fullEndpoint = `${endpoint}/${documentId}`;

  const {
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
  } = useSync<T>({
    key: `sync-doc:${documentId}`,
    endpoint: fullEndpoint,
    debounce,
    initialData: initialContent,
    fetcher,
    saver,
    onConflict: onConflict
      ? (c: SyncConflict<T>) => {
          // Conflict will be rendered in the component
        }
      : undefined,
    onError,
    onSync: onSave,
  });

  // Render conflict UI if provided and conflict exists
  const conflictUI =
    conflict && onConflict
      ? onConflict(conflict.local, conflict.remote, resolveConflict)
      : null;

  return (
    <>
      {conflictUI}
      {children({
        content: data,
        setContent: setData,
        status,
        lastSaved: lastSyncedAt,
        pendingChanges,
        save: forceSave,
        refresh,
        isLoaded,
      })}
    </>
  );
}
