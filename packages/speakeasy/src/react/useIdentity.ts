/**
 * React hook for Speakeasy identity management
 */

import { useCallback, useEffect, useState } from 'react';
import {
  generateIdentity,
  hasIdentity,
  loadIdentity,
  recoverIdentity,
  saveIdentity,
  deleteIdentity,
  type BayChatIdentity,
} from '../core';

export interface UseIdentityState {
  /** Current identity (null if not loaded/created) */
  identity: BayChatIdentity | null;
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Whether seed phrase is being shown (only after creation) */
  showingSeedPhrase: boolean;
}

export interface UseIdentityActions {
  /** Generate a new identity */
  create: () => Promise<BayChatIdentity>;
  /** Recover identity from seed phrase */
  recover: (seedPhrase: string[]) => Promise<BayChatIdentity>;
  /** Update nickname */
  setNickname: (nickname: string) => Promise<void>;
  /** Clear identity (logout) */
  clear: () => Promise<void>;
  /** Acknowledge seed phrase has been saved */
  acknowledgeSeedPhrase: () => void;
}

export type UseIdentityReturn = UseIdentityState & UseIdentityActions;

/**
 * Hook for managing BayChat identity
 *
 * Automatically loads existing identity from IndexedDB on mount.
 * Provides methods to create, recover, and manage identity.
 *
 * @example
 * ```tsx
 * function IdentityManager() {
 *   const { identity, loading, create, recover } = useIdentity();
 *
 *   if (loading) return <Loading />;
 *   if (!identity) return <CreateIdentity onCreate={create} onRecover={recover} />;
 *
 *   return <Profile identity={identity} />;
 * }
 * ```
 */
export function useIdentity(): UseIdentityReturn {
  const [identity, setIdentity] = useState<BayChatIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showingSeedPhrase, setShowingSeedPhrase] = useState(false);

  // Load existing identity on mount
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const exists = await hasIdentity();
        if (exists && mounted) {
          const loaded = await loadIdentity();
          if (mounted) {
            setIdentity(loaded);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load identity'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const create = useCallback(async (): Promise<BayChatIdentity> => {
    setLoading(true);
    setError(null);

    try {
      const newIdentity = await generateIdentity();
      await saveIdentity(newIdentity);
      setIdentity(newIdentity);
      setShowingSeedPhrase(true); // Show seed phrase after creation
      return newIdentity;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create identity');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const recover = useCallback(async (seedPhrase: string[]): Promise<BayChatIdentity> => {
    setLoading(true);
    setError(null);

    try {
      const recovered = await recoverIdentity(seedPhrase);
      await saveIdentity(recovered);
      setIdentity(recovered);
      setShowingSeedPhrase(false); // Don't show seed phrase on recovery
      return recovered;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to recover identity');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const setNickname = useCallback(
    async (nickname: string): Promise<void> => {
      if (!identity) {
        throw new Error('No identity to update');
      }

      const updated = { ...identity, nickname };
      await saveIdentity(updated);
      setIdentity(updated);
    },
    [identity]
  );

  const clear = useCallback(async (): Promise<void> => {
    await deleteIdentity();
    setIdentity(null);
    setShowingSeedPhrase(false);
  }, []);

  const acknowledgeSeedPhrase = useCallback(() => {
    setShowingSeedPhrase(false);
  }, []);

  return {
    identity,
    loading,
    error,
    showingSeedPhrase,
    create,
    recover,
    setNickname,
    clear,
    acknowledgeSeedPhrase,
  };
}
