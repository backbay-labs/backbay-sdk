"use client";

import { createContext, useContext, useCallback, useState, type ReactNode } from "react";

// ============================================================================
// CONTEXT
// ============================================================================

export interface ErrorBoundaryContextValue {
  throwError: (error: Error) => void;
}

export const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(null);

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook that provides a `throwError` function to trigger the nearest
 * GliaErrorBoundary from a function component.
 *
 * @example
 * ```tsx
 * const { throwError } = useErrorBoundary();
 * stream.on('error', (err) => throwError(err));
 * ```
 */
export function useErrorBoundary(): ErrorBoundaryContextValue {
  const ctx = useContext(ErrorBoundaryContext);
  if (!ctx) {
    throw new Error("useErrorBoundary must be used within a GliaErrorBoundary");
  }
  return ctx;
}

// ============================================================================
// ERROR THROWER (internal helper)
// ============================================================================

/**
 * Internal component that catches programmatic errors thrown via context
 * and re-throws them during render so React's error boundary catches them.
 */
export function ErrorThrower({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    throw error;
  }

  const throwError = useCallback((err: Error) => {
    setError(err);
  }, []);

  return (
    <ErrorBoundaryContext.Provider value={{ throwError }}>
      {children}
    </ErrorBoundaryContext.Provider>
  );
}
