/**
 * @cyntra/verify-react - React hooks and components for Cyntra verification
 *
 * @example
 * ```tsx
 * import { useVerification, VerificationBadge } from '@cyntra/verify-react';
 *
 * function RunDetails({ receipt }) {
 *   return <VerificationBadge receipt={receipt} showDetails />;
 * }
 * ```
 */

export { useVerification, type UseVerificationResult } from './useVerification';
export { useChainVerification, type UseChainVerificationResult } from './useChainVerification';
export { VerificationBadge, type VerificationBadgeProps } from './VerificationBadge';
export { VerificationDetails, type VerificationDetailsProps } from './VerificationDetails';
export { VerificationProvider, useVerificationContext } from './VerificationContext';
