/**
 * Speakeasy Doorman - Type Definitions
 *
 * Gesture-based authentication ritual for gating entry into privileged UI/runtime mode.
 */

// ============================================================================
// Gesture Types
// ============================================================================

export type GestureStepType = 'tap' | 'hold' | 'radial_drag' | 'flick';

export interface TapStep {
  type: 'tap';
  count: number;
  region: 'center' | 'edge';
}

export interface HoldStep {
  type: 'hold';
  durationMs: number;
  region: 'center' | 'edge';
}

export interface RadialDragStep {
  type: 'radial_drag';
  fromAngle: number; // degrees, 0 = right, 90 = up
  toAngle: number;
  notches: number; // discrete angular positions hit
}

export interface FlickStep {
  type: 'flick';
  direction: 'up' | 'down' | 'left' | 'right';
  velocity: number; // px/ms
}

export type GestureStep = TapStep | HoldStep | RadialDragStep | FlickStep;

export interface GestureSequence {
  steps: GestureStep[];
  totalDurationMs: number;
  rhythmHash: string; // SHA256 of timing intervals (anti-replay)
  timestamp: number; // When gesture started
}

// ============================================================================
// Doorman State Machine Types
// ============================================================================

export type DoormanState =
  | 'IDLE'
  | 'CHALLENGED'
  | 'VERIFYING'
  | 'ADMITTED'
  | 'DECOY'
  | 'COOLDOWN'
  | 'LOCKED';

export type DoormanEvent =
  | { type: 'KNOCK_DETECTED'; timestamp: number }
  | { type: 'GESTURE_COMPLETE'; gestureData: GestureSequence }
  | { type: 'VERIFICATION_SUCCESS'; capability: CapabilityToken }
  | { type: 'VERIFICATION_FAILURE'; reason: string }
  | { type: 'CHALLENGE_TIMEOUT' }
  | { type: 'COOLDOWN_ELAPSED' }
  | { type: 'LOCK_EXPIRED' }
  | { type: 'EXIT_REQUESTED' }
  | { type: 'ADMISSION_TIMEOUT' }
  | { type: 'PANIC_GESTURE'; decoyMode: boolean };

export interface DoormanConfig {
  challengeWindowMs: number; // Time to complete gesture after knock (default: 30s)
  admissionTtlMs: number; // Duration of speakeasy session (default: 5min)
  decoyTtlMs: number; // Duration of decoy mode session (default: 1min)
  maxConsecutiveFailures: number; // Before lockout (default: 3)
  cooldownBaseMs: number; // Exponential backoff base (default: 1s)
  lockDurationMs: number; // Lockout duration (default: 5min)
  panicGestureEnabled: boolean; // Enable decoy mode trigger
  panicAction: 'lock' | 'decoy';
  panicLockMultiplier: number; // Multiplier on lockDurationMs for panic
}

export const DEFAULT_DOORMAN_CONFIG: DoormanConfig = {
  challengeWindowMs: 30_000,
  admissionTtlMs: 300_000,
  decoyTtlMs: 60_000,
  maxConsecutiveFailures: 3,
  cooldownBaseMs: 1_000,
  lockDurationMs: 300_000,
  panicGestureEnabled: true,
  panicAction: 'lock',
  panicLockMultiplier: 2,
};

export interface DoormanContext {
  state: DoormanState;
  challenge: Challenge | null;
  consecutiveFailures: number;
  cooldownEndsAt: number | null;
  lockEndsAt: number | null;
  admissionEndsAt: number | null;
  capability: CapabilityToken | null;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface Challenge {
  nonce: string; // 32-byte hex random
  salt: string; // 16-byte hex random
  issuedAt: number; // timestamp
  expiresAt: number; // timestamp
}

export interface Verifier {
  /** KDF output (MVP stores this verifier directly) */
  hash: string;
  /** Random salt used during registration (hex) */
  salt: string;
  /** Domain binding for anti-phishing */
  domain: string;
  /** When verifier was created */
  createdAt: number;
  /** Schema/version for forwards compatibility */
  version: 1;
}

export interface CapabilityToken {
  /** Token ID for revocation */
  tokenId: string;
  /** Issuer public key hex */
  issuer: string;
  /** Scope patterns (e.g., "speakeasy.*", "speakeasy.private_feeds") */
  scopes: string[];
  /** Unix timestamp - token invalid before */
  notBefore: number;
  /** Unix timestamp - token invalid after */
  expiresAt: number;
  /** Optional constraints */
  constraints?: {
    maxUses?: number;
    allowedOrigins?: string[];
  };
  /** Ed25519 signature over payload */
  signature: string;
}

// ============================================================================
// Gesture Recognizer Types
// ============================================================================

export interface GestureRecognizerConfig {
  /** Tap: max duration to count as tap (default: 200ms) */
  tapMaxDurationMs: number;
  /** Tap: max movement to count as tap (default: 10px) */
  tapMaxMovementPx: number;
  /** Tap: max interval between multi-taps (default: 300ms) */
  tapIntervalMs: number;
  /** Hold: min duration to count as hold (default: 500ms) */
  holdMinDurationMs: number;
  /** Drag: min distance to register (default: 20px) */
  dragMinDistancePx: number;
  /** Flick: min velocity to register (default: 0.5 px/ms) */
  flickMinVelocity: number;
  /** Radial: notch angle size (default: 30 degrees) */
  radialNotchDegrees: number;
}

export const DEFAULT_GESTURE_CONFIG: GestureRecognizerConfig = {
  tapMaxDurationMs: 200,
  tapMaxMovementPx: 10,
  tapIntervalMs: 300,
  holdMinDurationMs: 500,
  dragMinDistancePx: 20,
  flickMinVelocity: 0.5,
  radialNotchDegrees: 30,
};

export interface Point {
  x: number;
  y: number;
}

export interface GestureRecognizerState {
  isActive: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  startTime: number | null;
  steps: GestureStep[];
  pendingTapCount: number;
}

// ============================================================================
// Orb Component Types
// ============================================================================

export type OrbState =
  | 'idle'
  | 'challenged'
  | 'verifying'
  | 'admitted'
  | 'decoy'
  | 'locked';

export interface OrbVisualConfig {
  /** Base orb size in pixels */
  size: number;
  /** Glow intensity (0-1) for each state */
  glowIntensity: Record<OrbState, number>;
  /** Pulse speed (ms) for each state */
  pulseSpeed: Record<OrbState, number>;
  /** Colors for each state */
  colors: Record<OrbState, string>;
}

export const DEFAULT_ORB_CONFIG: OrbVisualConfig = {
  size: 64,
  glowIntensity: {
    idle: 0.2,
    challenged: 0.6,
    verifying: 0.8,
    admitted: 1.0,
    decoy: 0.35,
    locked: 0.1,
  },
  pulseSpeed: {
    idle: 4000,
    challenged: 1000,
    verifying: 500,
    admitted: 2000,
    decoy: 1200,
    locked: 0,
  },
  colors: {
    idle: 'var(--text-muted, #6b7280)',
    challenged: 'var(--accent, #d4a84b)',
    verifying: 'var(--accent, #d4a84b)',
    admitted: 'var(--success, #22c55e)',
    decoy: 'var(--accent, #d4a84b)',
    locked: 'var(--error, #ef4444)',
  },
};

// ============================================================================
// Speakeasy Context Types
// ============================================================================

/**
 * Public context - safe for all components.
 * Contains only read-only state and non-sensitive actions.
 */
export interface SpeakeasyPublicContextValue {
  /** Current doorman state */
  state: DoormanState;
  /** Whether the provider is fully initialized (device secret resolved) */
  isReady: boolean;
  /** Whether user is in speakeasy mode */
  isAdmitted: boolean;
  /** Whether user is in panic/decoy mode */
  isDecoy: boolean;
  /** Initiate the knock sequence */
  knock: () => void;
  /** Exit speakeasy mode */
  exit: () => void;
  /** Time remaining in current state (ms) */
  timeRemaining: number | null;
}

/**
 * Private context - only for trusted components.
 * Contains sensitive capability data and registration methods.
 */
export interface SpeakeasyPrivateContextValue {
  /** Current capability token (if admitted) */
  capability: CapabilityToken | null;
  /** Whether gesture secret has been registered */
  isRegistered: boolean;
  /** Register a new gesture secret */
  register: (gesture: GestureSequence) => Promise<void>;
  /** Clear the registered gesture secret */
  clearRegistration: () => Promise<void>;
  /** Submit a gesture for verification (typical entry flow) */
  submitGesture: (gesture: GestureSequence) => Promise<void>;
}

/**
 * Combined context value (legacy - deprecated).
 * Use SpeakeasyPublicContextValue or SpeakeasyPrivateContextValue instead.
 */
export interface SpeakeasyContextValue
  extends SpeakeasyPublicContextValue,
    SpeakeasyPrivateContextValue {}
