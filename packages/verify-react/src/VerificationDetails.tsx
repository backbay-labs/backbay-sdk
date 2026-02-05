/**
 * Detailed verification panel component
 */

import { useEffect, type CSSProperties } from 'react';
import { useVerification } from './useVerification';
import { useChainVerification } from './useChainVerification';
import type { SignedRunReceipt, PublicKeySet } from '@cyntra/verify';

export interface VerificationDetailsProps {
  /** Signed receipt to verify */
  receipt: SignedRunReceipt;
  /** Public keys for verification */
  publicKeys: PublicKeySet;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

const styles: Record<string, CSSProperties> = {
  panel: {
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  label: {
    color: '#374151',
  },
  value: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: '12px',
    color: '#6b7280',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  badgeValid: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeInvalid: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  badgePending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
};

/**
 * Detailed verification panel with links to external verifiers.
 *
 * @example
 * ```tsx
 * <VerificationDetails
 *   receipt={signedReceipt}
 *   publicKeys={{ kernel: '0x...' }}
 * />
 * ```
 */
export function VerificationDetails({
  receipt,
  publicKeys,
  className,
  style,
}: VerificationDetailsProps) {
  const { verify, result, isVerifying, isInitializing } = useVerification();
  const { verifyChain, chain, isVerifying: isVerifyingChain } = useChainVerification();

  useEffect(() => {
    verify(receipt, publicKeys);
    verifyChain(receipt.receipt.receipt_id);
  }, [receipt.receipt.receipt_id]);

  const isLoading = isInitializing || isVerifying || isVerifyingChain;

  return (
    <div className={className} style={{ ...styles.panel, ...style }}>
      <div style={styles.header}>
        <h3 style={styles.title}>Trust Verification</h3>
        {!isLoading && (
          <span
            style={{
              ...styles.badge,
              ...(result?.valid && chain?.allValid ? styles.badgeValid : styles.badgeInvalid),
            }}
          >
            {result?.valid && chain?.allValid ? '✓ Verified' : '✗ Failed'}
          </span>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Signatures</div>
        <SignatureRow
          label="Kernel"
          valid={result?.kernel_sig_valid}
          isLoading={isLoading}
        />
        <SignatureRow
          label="Verifier"
          valid={result?.verifier_sig_valid ?? undefined}
          isLoading={isLoading}
          optional={!receipt.signatures.verifier}
        />
        <SignatureRow
          label="Provider"
          valid={result?.provider_sig_valid ?? undefined}
          isLoading={isLoading}
          optional={!receipt.signatures.provider}
        />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>External Attestations</div>

        <div style={styles.row}>
          <span style={styles.label}>Sigstore Rekor</span>
          {isLoading ? (
            <span style={{ ...styles.badge, ...styles.badgePending }}>Loading...</span>
          ) : chain?.rekor ? (
            <a
              href={`https://search.sigstore.dev/?logIndex=${chain.rekor.logIndex}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              Log #{chain.rekor.logIndex}
            </a>
          ) : (
            <span style={{ ...styles.badge, ...styles.badgeInvalid }}>Not Found</span>
          )}
        </div>

        <div style={styles.row}>
          <span style={styles.label}>EAS (Base)</span>
          {isLoading ? (
            <span style={{ ...styles.badge, ...styles.badgePending }}>Loading...</span>
          ) : chain?.eas ? (
            <a
              href={`https://base.easscan.org/attestation/view/${chain.eas.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              {chain.eas.uid.slice(0, 10)}...
            </a>
          ) : (
            <span style={{ ...styles.badge, ...styles.badgeInvalid }}>Not Found</span>
          )}
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Solana Aegis</span>
          {isLoading ? (
            <span style={{ ...styles.badge, ...styles.badgePending }}>Loading...</span>
          ) : chain?.solana ? (
            <span
              style={{
                ...styles.badge,
                ...(chain.solana.verified ? styles.badgeValid : styles.badgeInvalid),
              }}
            >
              {chain.solana.verified ? 'Finalized' : 'Pending'}
            </span>
          ) : (
            <span style={{ ...styles.badge, ...styles.badgeInvalid }}>Not Found</span>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Receipt Info</div>
        <div style={styles.row}>
          <span style={styles.label}>Receipt ID</span>
          <span style={styles.value}>{receipt.receipt.receipt_id}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Run ID</span>
          <span style={styles.value}>{receipt.receipt.run.id}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Toolchain</span>
          <span style={styles.value}>{receipt.receipt.run.toolchain}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Verdict</span>
          <span
            style={{
              ...styles.badge,
              ...(receipt.receipt.verdict.passed ? styles.badgeValid : styles.badgeInvalid),
            }}
          >
            {receipt.receipt.verdict.passed ? 'Passed' : 'Failed'}
          </span>
        </div>
      </div>

      {result?.errors && result.errors.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Errors</div>
          {result.errors.map((err, i) => (
            <div key={i} style={{ color: '#991b1b', padding: '4px 0' }}>
              {err}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SignatureRow({
  label,
  valid,
  isLoading,
  optional,
}: {
  label: string;
  valid?: boolean;
  isLoading: boolean;
  optional?: boolean;
}) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      {isLoading ? (
        <span style={{ ...styles.badge, ...styles.badgePending }}>Verifying...</span>
      ) : valid === undefined && optional ? (
        <span style={{ color: '#9ca3af' }}>Not provided</span>
      ) : valid ? (
        <span style={{ ...styles.badge, ...styles.badgeValid }}>✓ Valid</span>
      ) : (
        <span style={{ ...styles.badge, ...styles.badgeInvalid }}>✗ Invalid</span>
      )}
    </div>
  );
}
