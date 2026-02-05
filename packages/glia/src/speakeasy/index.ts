/**
 * Speakeasy - Gesture-based authentication ritual
 *
 * A "universal digital speakeasy doorman" interaction that gates entry
 * into a privileged UI/runtime mode via gesture-based signatures.
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
