/**
 * @backbay/witness-react - React hooks and components for Backbay verification
 *
 * @example
 * ```tsx
 * import { useVerification, VerificationBadge } from '@backbay/witness-react';
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
