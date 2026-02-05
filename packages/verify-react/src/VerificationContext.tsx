/**
 * Context for sharing verification state across components
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { initWasm, isWasmInitialized, getWasmVersion } from '@cyntra/verify';

interface VerificationContextValue {
  /** Whether WASM is initialized */
  isInitialized: boolean;
  /** Whether WASM is initializing */
  isInitializing: boolean;
  /** Initialization error */
  error: Error | null;
  /** WASM version */
  version: string | null;
}

const VerificationContext = createContext<VerificationContextValue | null>(null);

export interface VerificationProviderProps {
  /** Child components */
  children: ReactNode;
  /** Custom fallback while initializing */
  fallback?: ReactNode;
}

/**
 * Provider that initializes WASM and shares state.
 *
 * Wrap your app or verification components with this provider
 * to ensure WASM is initialized before verification.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <VerificationProvider fallback={<Loading />}>
 *       <RunDetails />
 *     </VerificationProvider>
 *   );
 * }
 * ```
 */
export function VerificationProvider({
  children,
  fallback,
}: VerificationProviderProps) {
  const [isInitialized, setIsInitialized] = useState(isWasmInitialized());
  const [isInitializing, setIsInitializing] = useState(!isWasmInitialized());
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialized) {
      setVersion(getWasmVersion());
      return;
    }

    let cancelled = false;

    initWasm()
      .then(() => {
        if (!cancelled) {
          setIsInitialized(true);
          setIsInitializing(false);
          setVersion(getWasmVersion());
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setIsInitializing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isInitialized]);

  const value: VerificationContextValue = {
    isInitialized,
    isInitializing,
    error,
    version,
  };

  // Show fallback while initializing
  if (isInitializing && fallback) {
    return <>{fallback}</>;
  }

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
}

/**
 * Hook to access verification context.
 *
 * Must be used within a VerificationProvider.
 */
export function useVerificationContext(): VerificationContextValue {
  const context = useContext(VerificationContext);

  if (!context) {
    throw new Error(
      'useVerificationContext must be used within a VerificationProvider',
    );
  }

  return context;
}
