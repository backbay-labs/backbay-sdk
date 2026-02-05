/**
 * Verification badge component
 */

import { useEffect, type CSSProperties } from 'react';
import { useVerification } from './useVerification';
import { useChainVerification } from './useChainVerification';
import type { SignedRunReceipt, PublicKeySet } from '@cyntra/verify';

export interface VerificationBadgeProps {
  /** Signed receipt to verify */
  receipt: SignedRunReceipt;
  /** Public keys for verification */
  publicKeys: PublicKeySet;
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
  /** Verify attestation chain (slower) */
  verifyChain?: boolean;
}

const styles: Record<string, CSSProperties> = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  verified: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    border: '1px solid #86efac',
  },
  failed: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
  },
  loading: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    border: '1px solid #d1d5db',
  },
  icon: {
    width: '14px',
    height: '14px',
  },
  details: {
    marginTop: '8px',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '2px',
  },
};

const CheckIcon = () => (
  <svg style={styles.icon} viewBox="0 0 16 16" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06l2.72 2.72 6.72-6.72a.75.75 0 0 1 1.06 0z"
    />
  </svg>
);

const XIcon = () => (
  <svg style={styles.icon} viewBox="0 0 16 16" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z"
    />
  </svg>
);

const Spinner = () => (
  <svg style={{ ...styles.icon, animation: 'spin 1s linear infinite' }} viewBox="0 0 16 16" fill="none" stroke="currentColor">
    <circle cx="8" cy="8" r="6" strokeWidth="2" strokeDasharray="28" strokeDashoffset="7" />
  </svg>
);

/**
 * A badge that shows verification status of a signed receipt.
 *
 * Automatically verifies the receipt on mount and displays the result.
 *
 * @example
 * ```tsx
 * <VerificationBadge
 *   receipt={signedReceipt}
 *   publicKeys={{ kernel: '0x...' }}
 *   showDetails
 * />
 * ```
 */
export function VerificationBadge({
  receipt,
  publicKeys,
  showDetails = false,
  className,
  style,
  verifyChain: shouldVerifyChain = false,
}: VerificationBadgeProps) {
  const { verify, result, isVerifying, isInitializing, error } = useVerification();
  const { verifyChain, chain, isVerifying: isVerifyingChain } = useChainVerification();
  const receiptKey = receipt.receipt.receipt_id;
  const verifierKey = publicKeys.verifier ?? '';
  const providerKey = publicKeys.provider ?? '';

  // Verify on mount or when receipt changes
  useEffect(() => {
    verify(receipt, publicKeys);
  }, [receiptKey, publicKeys.kernel, verifierKey, providerKey]);

  // Optionally verify chain
  useEffect(() => {
    if (shouldVerifyChain && result?.valid) {
      verifyChain(receipt);
    }
  }, [shouldVerifyChain, result?.valid, receiptKey, verifyChain]);

  const isLoading = isInitializing || isVerifying || (shouldVerifyChain && isVerifyingChain);
  const isValid = result?.valid && (!shouldVerifyChain || chain?.allValid);
  const hasError = !!error || (result && !result.valid);

  const badgeStyle: CSSProperties = {
    ...styles.badge,
    ...(isLoading ? styles.loading : isValid ? styles.verified : styles.failed),
    ...style,
  };

  return (
    <div className={className}>
      <div style={badgeStyle}>
        {isLoading ? (
          <>
            <Spinner />
            <span>Verifying...</span>
          </>
        ) : isValid ? (
          <>
            <CheckIcon />
            <span>Verified</span>
          </>
        ) : (
          <>
            <XIcon />
            <span>Failed</span>
          </>
        )}
      </div>

      {showDetails && result && !isLoading && (
        <div style={styles.details}>
          <Detail label="Kernel Signature" valid={result.kernel_sig_valid} />
          {result.verifier_sig_valid !== null && (
            <Detail label="Verifier Signature" valid={result.verifier_sig_valid} />
          )}
          {result.provider_sig_valid !== null && (
            <Detail label="Provider Signature" valid={result.provider_sig_valid} />
          )}
          {shouldVerifyChain && chain && (
            <>
              {chain.rekor && <Detail label="Rekor" valid={chain.rekor.verified} />}
              {chain.eas && <Detail label="EAS" valid={chain.eas.verified} />}
              {chain.solana && <Detail label="Solana" valid={chain.solana.verified} />}
            </>
          )}
          {result.errors.length > 0 && (
            <div style={{ color: '#991b1b', marginTop: '4px' }}>
              {result.errors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, valid }: { label: string; valid: boolean }) {
  return (
    <div style={styles.detailItem}>
      <span style={{ color: valid ? '#166534' : '#991b1b' }}>
        {valid ? '✓' : '✗'}
      </span>
      <span>{label}</span>
    </div>
  );
}
