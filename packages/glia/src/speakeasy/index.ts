/**
 * Speakeasy - Gesture-based authentication ritual
 *
 * A "universal digital speakeasy doorman" interaction that gates entry
 * into a privileged UI/runtime mode via gesture-based signatures.
 *
 * ## Package boundary
 *
 * - **`@backbay/speakeasy`** = P2P identity (Ed25519) + transport (libp2p) + message signing.
 *   Handles peer discovery, key exchange, and signed message transport between nodes.
 *
 * - **`@backbay/glia/speakeasy`** (this module) = Gesture-based auth (WebCrypto) +
 *   DoormanStateMachine (Zustand) + UI components (React). Handles local user
 *   authentication via gesture rituals, challenge-response verification, capability
 *   token issuance, and the visual orb/dialog components.
 *
 * - **No shared crypto layer yet** -- the two packages use independent crypto
 *   primitives (WebCrypto here, libsodium/noble in `@backbay/speakeasy`). A unified
 *   crypto adapter is planned for a future release.
 *
 * ## Planned deduplication (RFC-03)
 *
 * The two speakeasy packages share overlapping crypto primitives. The plan is:
 *
 * 1. Extract shared crypto primitives into `@backbay/speakeasy/core`:
 *    - Key derivation (PBKDF2, HKDF)
 *    - Random bytes generation
 *    - Constant-time comparison
 *    - Base encoding (base64url, hex)
 *
 * 2. Both packages would depend on `@backbay/speakeasy/core` for crypto ops,
 *    eliminating the divergent WebCrypto vs libsodium implementations.
 *
 * 3. This module (`@backbay/glia/speakeasy`) is **not** being moved to a
 *    separate package because it depends heavily on glia's React infrastructure
 *    (Zustand stores, theme context, UI primitives). Moving it would create
 *    circular dependencies.
 *
 * @example
 * ```tsx
 * import { SpeakeasyProvider, useSpeakeasy, SpeakeasyOrb } from '@backbay/glia/speakeasy';
 *
 * function App() {
 *   return (
 *     <SpeakeasyProvider>
 *       <Desktop />
 *       <SpeakeasyOrb />
 *     </SpeakeasyProvider>
 *   );
 * }
 *
 * function SecretPanel() {
 *   const { isAdmitted, knock } = useSpeakeasy();
 *
 *   if (!isAdmitted) {
 *     return <button onClick={knock}>Request Access</button>;
 *   }
 *
 *   return <div>Secret content revealed!</div>;
 * }
 * ```
 */

// Types
export * from './types.js';

// Hooks
export { useGestureRecognizer } from './hooks/useGestureRecognizer.js';

// State Machine
export {
  useDoormanStore,
  createDoormanStore,
  type DoormanStoreApi,
  startDoormanTimeouts,
} from './doorman/DoormanStateMachine.js';

// Provider
export { SpeakeasyProvider, useSpeakeasy } from './SpeakeasyProvider.js';

// Components
export { SpeakeasyOrb } from './components/SpeakeasyOrb.js';
export { SpeakeasyRitualPad } from './components/SpeakeasyRitualPad.js';
export { SpeakeasyRegistrationDialog } from './components/SpeakeasyRegistrationDialog.js';
export { SpeakeasyConsentDialog } from './components/SpeakeasyConsentDialog.js';

// Auth
export { SpeakeasyAuth } from './auth/SpeakeasyAuth.js';
export { fingerprintGestureSequence } from './auth/SpeakeasyAuth.js';
export {
  createCapabilityToken,
  verifyCapabilityToken,
} from './auth/CapabilityIssuer.js';
export type { SpeakeasyStorage } from './auth/storage.js';
export {
  createDefaultSpeakeasyStorage,
  createIndexedDbSpeakeasyStorage,
  createInMemorySpeakeasyStorage,
  createLocalStorageSpeakeasyStorage,
  // Encrypted storage (AES-256-GCM with PBKDF2)
  createEncryptedSpeakeasyStorage,
  createEncryptedIndexedDbSpeakeasyStorage,
  createEncryptedLocalStorageSpeakeasyStorage,
  // Migration
  migrateV1ToV2,
} from './auth/storage.js';
export type { SpeakeasyDeviceSecretProvider } from './auth/deviceSecret.js';
export {
  createDefaultDeviceSecretProvider,
  createInMemoryDeviceSecretProvider,
  createLocalStorageDeviceSecretProvider,
} from './auth/deviceSecret.js';

// Panic ritual
export {
  DEFAULT_PANIC_GESTURE_PATTERN,
  isPanicGesture,
} from './doorman/panic.js';
