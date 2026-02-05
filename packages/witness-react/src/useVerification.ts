/**
 * Hook for verifying signed receipts
 */

import { useState, useEffect, useCallback } from 'react';
import {
  initWasm,
  isWasmInitialized,
  verifyReceipt,
  type SignedRunReceipt,
  type VerificationResult,
  type PublicKeySet,
} from '@backbay/witness';

export interface UseVerificationResult {
  /** Whether WASM is still initializing */
  isInitializing: boolean;
  /** Whether WASM is initialized and ready */
  isInitialized: boolean;
  /** Whether verification is in progress */
  isVerifying: boolean;
  /** Verification result (null until verified) */
  result: VerificationResult | null;
  /** Error if verification failed */
  error: Error | null;
  /** Verify a receipt */
  verify: (receipt: SignedRunReceipt, publicKeys: PublicKeySet) => Promise<VerificationResult>;
  /** Reset verification state */
  reset: () => void;
}

/**
 * Hook for verifying Cyntra receipts.
 *
 * Automatically initializes WASM on first use.
 *
 * @example
 * ```tsx
 * function ReceiptVerifier({ receipt, kernelPubkey }) {
 *   const { verify, result, isVerifying, error } = useVerification();
 *
 *   useEffect(() => {
 *     verify(receipt, { kernel: kernelPubkey });
 *   }, [receipt, kernelPubkey]);
 *
 *   if (isVerifying) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   if (result?.valid) return <ValidBadge />;
 *   return <InvalidBadge errors={result?.errors} />;
 * }
 * ```
 */
export function useVerification(): UseVerificationResult {
  const [isInitializing, setIsInitializing] = useState(!isWasmInitialized());
  const [isInitialized, setIsInitialized] = useState(isWasmInitialized());
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize WASM on mount
  useEffect(() => {
    if (isInitialized) return;

    let cancelled = false;

    initWasm()
      .then(() => {
        if (!cancelled) {
          setIsInitialized(true);
          setIsInitializing(false);
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

  const verify = useCallback(
    async (
      receipt: SignedRunReceipt,
      publicKeys: PublicKeySet,
    ): Promise<VerificationResult> => {
      if (!isInitialized) {
        await initWasm();
      }

      setIsVerifying(true);
      setError(null);

      try {
        const verificationResult = verifyReceipt(receipt, publicKeys);
        setResult(verificationResult);
        return verificationResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsVerifying(false);
      }
    },
    [isInitialized],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsVerifying(false);
  }, []);

  return {
    isInitializing,
    isInitialized,
    isVerifying,
    result,
    error,
    verify,
    reset,
  };
}
