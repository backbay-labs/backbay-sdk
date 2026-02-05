/**
 * Hook for verifying attestation chains
 */

import { useState, useCallback } from 'react';
import {
  initWasm,
  isWasmInitialized,
  fetchAndVerifyChain,
  type SignedRunReceipt,
  type AttestationChain,
  type ChainVerificationOptions,
} from '@cyntra/verify';

export interface UseChainVerificationResult {
  /** Whether verification is in progress */
  isVerifying: boolean;
  /** Chain verification result */
  chain: AttestationChain | null;
  /** Error if verification failed */
  error: Error | null;
  /** Verify attestation chain */
  verifyChain: (
    receipt: SignedRunReceipt | SignedRunReceipt['receipt'] | string,
    options?: ChainVerificationOptions,
  ) => Promise<AttestationChain>;
  /** Reset state */
  reset: () => void;
}

const DEFAULT_OPTIONS: ChainVerificationOptions = {
  rekor: true,
  eas: { chainId: 8453 }, // Base
  solana: { cluster: 'mainnet-beta' },
};

/**
 * Hook for verifying complete attestation chains.
 *
 * Fetches attestations from Rekor, EAS, and Solana and verifies each.
 *
 * @example
 * ```tsx
 * function ChainStatus({ receipt }) {
 *   const { verifyChain, chain, isVerifying, error } = useChainVerification();
 *
 *   useEffect(() => {
 *     verifyChain(receipt, { rekor: true, eas: { chainId: 8453 } });
 *   }, [receipt]);
 *
 *   if (isVerifying) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <div>
 *       <Badge label="Rekor" valid={chain?.rekor?.verified} />
 *       <Badge label="EAS" valid={chain?.eas?.verified} />
 *       <Badge label="Solana" valid={chain?.solana?.verified} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useChainVerification(): UseChainVerificationResult {
  const [isVerifying, setIsVerifying] = useState(false);
  const [chain, setChain] = useState<AttestationChain | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const verifyChain = useCallback(
    async (
      receipt: SignedRunReceipt | SignedRunReceipt['receipt'] | string,
      options: ChainVerificationOptions = DEFAULT_OPTIONS,
    ): Promise<AttestationChain> => {
      if (!isWasmInitialized()) {
        await initWasm();
      }

      setIsVerifying(true);
      setError(null);

      try {
        const receiptInput =
          typeof receipt === 'string'
            ? receipt
            : 'receipt' in receipt
              ? receipt.receipt
              : receipt;
        const result = await fetchAndVerifyChain(receiptInput, options);
        setChain(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsVerifying(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setChain(null);
    setError(null);
    setIsVerifying(false);
  }, []);

  return {
    isVerifying,
    chain,
    error,
    verifyChain,
    reset,
  };
}
