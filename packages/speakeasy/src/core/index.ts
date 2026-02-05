/**
 * Speakeasy Core
 *
 * Cryptographic identity and message signing for decentralized chat.
 */

// Types
export type {
  AnyMessage,
  BaseMessage,
  BayChatIdentity,
  BountyClaimedMessage,
  BountyCreatedMessage,
  BountySettledMessage,
  BountySubmittedMessage,
  BountyVerifiedMessage,
  ChatMessage,
  DeepVerificationResult,
  EvidenceTier,
  GateResult,
  MessageType,
  PresenceMessage,
  SentinelConfig,
  SentinelRequest,
  SentinelResponse,
  SerializedIdentity,
  SpeakeasySigil,
  TypingMessage,
  VerificationResult,
} from './types';

// Identity
export {
  canSign,
  computeFingerprint,
  createPeerIdentity,
  deleteIdentity,
  deserializeIdentity,
  formatFingerprint,
  generateIdentity,
  getPublicKeyBytes,
  getSecretKeyBytes,
  hasIdentity,
  loadIdentity,
  recoverIdentity,
  saveIdentity,
  serializeIdentity,
  shortenPublicKey,
} from './identity';

// Sigil
export {
  deriveAccentColor,
  deriveColor,
  deriveMutedColor,
  deriveSigil,
  getSigilMetadata,
  getSigilUnicode,
  isValidSigil,
  SIGIL_METADATA,
  SIGILS,
} from './sigil';
export type { SigilMetadata } from './sigil';

// Signing
export {
  computeMessageHash,
  computeMessageId,
  createSignedMessage,
  generateNonce,
  isTimestampRecent,
  signData,
  signMessage,
  verifyData,
  verifyMessage,
  verifySentinelResponse,
} from './signing';
