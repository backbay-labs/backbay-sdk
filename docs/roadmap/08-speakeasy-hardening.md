# RFC-08: Speakeasy Security Hardening

**Priority:** High
**Effort:** Medium (2-3 sessions)
**Packages affected:** `@backbay/speakeasy`, `@backbay/glia` (speakeasy subsystem)

## Problem

Speakeasy is the P2P encrypted messaging and gesture-based authentication system. It handles Ed25519 keypairs, BIP39 seed phrases, HMAC-SHA256 challenge-response auth, AES-256-GCM encrypted storage, and capability token issuance. Despite being the most security-critical code in the SDK, it has several structural issues.

### 1. Code duplication across two packages

Speakeasy functionality exists in **two separate locations** with different scopes and zero code sharing:

**`@backbay/speakeasy` (`packages/speakeasy/src/`)**
P2P messaging layer -- Ed25519 identity, message signing, libp2p transport.

| File | Purpose | Lines |
|------|---------|-------|
| `core/identity.ts` | BIP39 keygen, Ed25519 keypair, IndexedDB storage | 309 |
| `core/signing.ts` | Message hash, sign, verify (Ed25519) | 268 |
| `core/sigil.ts` | Visual identity derivation from fingerprint | ~130 |
| `core/types.ts` | Identity types, message types, verification types | ~200 |
| `transport/transport.ts` | libp2p node management, gossipsub | ~270 |
| `transport/topics.ts` | Topic naming, channel management | ~75 |
| `transport/types.ts` | Transport configuration types | ~160 |
| `react/useIdentity.ts` | Identity management hook | ~140 |
| `react/useMessages.ts` | Message sending/receiving hook | ~175 |
| `react/useTransport.ts` | Transport lifecycle hook | ~180 |

**`@backbay/glia` (`packages/glia/src/speakeasy/`)**
Gesture-based authentication -- doorman state machine, challenge-response, capability tokens.

| File | Purpose | Lines |
|------|---------|-------|
| `auth/SpeakeasyAuth.ts` | Gesture verification, verifier derivation, domain binding | 203 |
| `auth/crypto.ts` | WebCrypto wrappers (SHA-256, HMAC-SHA-256, timingSafeEqual) | 88 |
| `auth/storage.ts` | Encrypted storage (AES-256-GCM + PBKDF2), multiple backends | 425 |
| `auth/CapabilityIssuer.ts` | HMAC-signed capability tokens | 89 |
| `auth/deviceSecret.ts` | Device-bound secret management | ~80 |
| `doorman/DoormanStateMachine.ts` | Zustand state machine (IDLE->CHALLENGED->VERIFYING->ADMITTED->LOCKED) | 471 |
| `doorman/panic.ts` | Panic gesture detection | ~50 |
| `hooks/useGestureRecognizer.ts` | Gesture input processing | ~120 |
| `SpeakeasyProvider.tsx` | React provider wiring auth + doorman + UI | ~340 |
| `components/SpeakeasyOrb.tsx` | Entry point UI | ~100 |
| `components/SpeakeasyRitualPad.tsx` | Gesture input surface | ~120 |
| `components/SpeakeasyRegistrationDialog.tsx` | First-time setup | ~80 |
| `components/SpeakeasyConsentDialog.tsx` | Consent prompt | ~60 |
| `types.ts` | Doorman types, gesture types, capability types | ~260 |

Both packages implement their own crypto independently:
- `@backbay/speakeasy` uses `@noble/ed25519` + `@noble/hashes` for Ed25519 signing
- `@backbay/glia/speakeasy` uses raw WebCrypto for SHA-256, HMAC-SHA-256, and AES-256-GCM

There is no shared crypto layer.

### 2. Test gaps

Tests exist **only** in glia's copy (7 files in `src/speakeasy/__tests__/`, 2 more in legacy `test/speakeasy/`). The standalone `@backbay/speakeasy` package has **zero tests** -- no test script, no test files, no test runner configured.

The existing glia tests cover:
- `crypto.test.ts` -- Good coverage of primitive crypto ops (utf8ToBytes, hexToBytes, sha256, hmacSha256, timingSafeEqual)
- `SpeakeasyAuth.test.ts` -- Registration and verification flows
- `CapabilityIssuer.test.ts` -- Token creation and verification
- `DoormanStateMachine.test.ts` -- State transitions
- `storage.test.ts` -- Storage backend tests
- `panic.test.ts` -- Panic gesture detection (uses `bun:test` instead of vitest)
- `SpeakeasyNotReadyError.test.ts` -- Error class

**What is NOT tested:**
- Ed25519 identity generation and recovery (`@backbay/speakeasy/core/identity.ts`)
- Message signing and verification (`@backbay/speakeasy/core/signing.ts`)
- Full handshake lifecycle across both packages (init -> challenge -> gesture -> verify -> capability -> session)
- Encrypted storage encrypt/decrypt roundtrip with AES-256-GCM
- Storage version migration (v1 fixed-salt -> v2 random-salt payloads)
- Panic gesture -> DoormanStateMachine -> decoy/lock integration
- Any libp2p transport functionality
- Any React hook (`useIdentity`, `useMessages`, `useTransport`, `useSpeakeasy`, `useGestureRecognizer`)

### 3. Singleton state machine

`DoormanStateMachine.ts:318` creates a module-level Zustand store:

```ts
export const useDoormanStore = create<DoormanStore>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL_CONTEXT,
    // ...
  }))
);
```

This is a **module-level singleton**. Consequences:
- Tests share state between runs unless manually calling `reset()` in `afterEach`
- Cannot have multiple independent Speakeasy instances (e.g., testing two users in the same process)
- Module-level timeout IDs at lines 391-394 (`challengeTimeoutId`, `cooldownTimeoutId`, etc.) create shared mutable state

The `startDoormanTimeouts()` function (line 399) subscribes to the singleton store and manages timeouts via module-level variables -- this is not testable in isolation.

### 4. No integration tests

Unit tests exist for individual pieces but there is no test that exercises the full handshake lifecycle:

```
1. User registers gesture -> SpeakeasyAuth.registerGesture() stores verifier
2. DoormanStateMachine: IDLE -> dispatches KNOCK_DETECTED
3. DoormanStateMachine: IDLE -> CHALLENGED (generates nonce + salt)
4. User performs gesture -> SpeakeasyAuth.computeResponse()
5. DoormanStateMachine: CHALLENGED -> VERIFYING
6. SpeakeasyAuth.verifyGesture() validates response
7. CapabilityIssuer.createCapabilityToken() issues token
8. DoormanStateMachine: VERIFYING -> ADMITTED (stores capability)
```

Failure paths are also untested end-to-end:
- Wrong gesture -> VERIFYING -> COOLDOWN (exponential backoff)
- Max failures -> VERIFYING -> LOCKED
- Panic gesture -> CHALLENGED -> DECOY or LOCKED

### 5. No Storybook stories

Zero stories exist for any Speakeasy component. The following UI components have no visual testing:
- `SpeakeasyOrb` -- the floating entry point
- `SpeakeasyRitualPad` -- the gesture input surface
- `SpeakeasyRegistrationDialog` -- first-time setup flow
- `SpeakeasyConsentDialog` -- consent prompt

### 6. Panic/wipe not e2e tested

The panic gesture system (`doorman/panic.ts`) has unit tests for gesture pattern detection, but the full flow is untested:
- Panic gesture detection -> dispatch `PANIC_GESTURE` event
- DoormanStateMachine transitions to `DECOY` (decoyMode=true) or `LOCKED` (decoyMode=false)
- Decoy mode: shows fake "admitted" state that auto-expires
- Lock mode: applies `panicLockMultiplier` to lock duration
- Neither path is tested through the SpeakeasyProvider

## Audit Findings

### `@backbay/speakeasy` (standalone package)

**`core/identity.ts`** -- Ed25519 keypair management

- `generateIdentity()`: Generates 24-word BIP39 mnemonic, derives Ed25519 keypair from first 32 bytes of seed. Returns full identity with seed phrase (show-once).
- `recoverIdentity()`: Recovers from seed phrase. Validates mnemonic before deriving.
- `saveIdentity()`: Persists to IndexedDB **without seed phrase** (correct -- user should back it up separately).
- Key concern: `getSecretKeyBytes()` returns `hexToBytes(secretKey).slice(0, 32)` -- slicing the first 32 bytes of the 64-byte Ed25519 expanded key. This is correct but worth asserting in tests.

**`core/signing.ts`** -- Message signing

- `computeMessageHash()`: Builds canonical string from message fields, then SHA-256. The canonical format is `type|sender|timestamp|nonce|...content_fields`.
- `signMessage()` / `verifyMessage()`: Ed25519 sign/verify over the hash.
- `createSignedMessage()`: Adds timestamp, nonce, ID, and signature to a message.
- `verifySentinelResponse()`: Verifies signature AND checks sender is a known sentinel.
- Key concern: `generateNonce()` uses `crypto.getRandomValues` directly -- should validate availability like glia's `randomHex()` does.

### `@backbay/glia` speakeasy subsystem

**`auth/SpeakeasyAuth.ts`** -- Challenge-response authentication

- `SpeakeasyAuth` class requires `deviceSecret` at construction (fails fast if missing).
- `registerGesture()`: Derives verifier key via PBKDF2-like chain: `SHA-256(header + canonicalized_gesture + deviceSecret)`. Stores verifier hash + salt + domain.
- `verifyGesture()`: Re-derives key from gesture, computes HMAC response, uses `timingSafeEqual` for comparison.
- `canonicalizeGestureStep()`: Normalizes gesture inputs (bucketing duration to 50ms intervals, rounding angles).
- Key concern: Domain binding defaults to `location.origin` or `'unknown'` -- the `'unknown'` fallback in server-side rendering contexts could weaken domain binding.

**`auth/crypto.ts`** -- WebCrypto wrappers

- `timingSafeEqual()`: Constant-time comparison using XOR accumulation. Correct implementation.
- `sha256()` / `hmacSha256()`: Thin wrappers over `crypto.subtle`.
- `randomHex()`: Validates `crypto.getRandomValues` availability before use.

**`auth/storage.ts`** -- Encrypted storage

- AES-256-GCM encryption with PBKDF2 key derivation (600,000 iterations).
- Two payload versions: v1 (legacy, fixed salt) and v2 (random per-encryption salt).
- `decryptVerifier()` handles both versions for migration.
- Key concern: v1 used `'bb-ui:speakeasy:encrypted-storage:v1'` as a **fixed salt** for PBKDF2, which weakens key derivation. v2 fixes this with random salts.

**`auth/CapabilityIssuer.ts`** -- Token issuance

- `createCapabilityToken()`: HMAC-SHA-256 signed tokens with `notBefore` / `expiresAt` time bounds.
- `verifyCapabilityToken()`: Checks time bounds, then verifies HMAC signature using `timingSafeEqual`.
- `canonicalizePayload()`: Fixed-order JSON serialization to ensure deterministic hashing.

**`doorman/DoormanStateMachine.ts`** -- State machine

- States: `IDLE`, `CHALLENGED`, `VERIFYING`, `ADMITTED`, `COOLDOWN`, `LOCKED`, `DECOY`
- Exponential backoff on failures: `cooldownBaseMs * 2^(failures-1)`
- Max consecutive failures triggers `LOCKED` state
- Panic gesture from `CHALLENGED` or `VERIFYING` -> `DECOY` (decoyMode=true) or `LOCKED` (decoyMode=false, multiplied lock duration)

## Proposed Solution

### 1. Deduplicate: Choose one canonical location

The two packages serve different purposes and should remain separate, but share a common crypto layer:

```
@backbay/speakeasy          -- P2P identity + transport (Ed25519, libp2p)
@backbay/glia/speakeasy     -- Gesture auth + UI (WebCrypto, Zustand, React)
@backbay/speakeasy/core     -- Shared: crypto primitives, types
```

**Action items:**
- Extract common crypto types and utilities into `@backbay/speakeasy/core`
- Have `@backbay/glia/speakeasy/auth/crypto.ts` import from `@backbay/speakeasy/core` instead of reimplementing
- Keep gesture auth, DoormanStateMachine, and UI components in glia (they depend on React, Zustand, and the theme system)
- Keep P2P transport in standalone speakeasy (it has heavy libp2p dependencies)
- Document the boundary clearly in both packages' README

### 2. Integration tests: Full handshake lifecycle

Create `packages/glia/src/speakeasy/__tests__/handshake.integration.test.ts`:

```ts
describe('Speakeasy handshake lifecycle', () => {
  it('completes full registration -> challenge -> verify -> capability flow', async () => {
    // 1. Register gesture
    const auth = new SpeakeasyAuth({ deviceSecret: testSecret, storage: inMemoryStorage() });
    const verifier = await auth.registerGesture(testGesture);

    // 2. Simulate knock -> challenge
    useDoormanStore.getState().dispatch({ type: 'KNOCK_DETECTED', timestamp: Date.now() });
    expect(useDoormanStore.getState().state).toBe('CHALLENGED');
    const challenge = useDoormanStore.getState().challenge;

    // 3. Compute response
    const result = await auth.verifyGesture(testGesture, challenge);
    expect(result.ok).toBe(true);

    // 4. Issue capability token
    const token = await createCapabilityToken({
      verifierKeyHex: verifier.hash,
      issuer: 'test',
      scopes: ['speakeasy:enter'],
      ttlMs: 60_000,
    });

    // 5. Dispatch success
    useDoormanStore.getState().dispatch({
      type: 'VERIFICATION_SUCCESS',
      capability: token,
    });
    expect(useDoormanStore.getState().state).toBe('ADMITTED');

    // 6. Verify capability token
    const valid = await verifyCapabilityToken({
      token,
      verifierKeyHex: verifier.hash,
    });
    expect(valid).toBe(true);
  });

  it('handles wrong gesture -> cooldown -> retry flow', ...);
  it('handles max failures -> lockout', ...);
  it('handles panic gesture -> decoy mode', ...);
  it('handles panic gesture -> extended lockout', ...);
  it('handles challenge timeout', ...);
  it('handles domain mismatch rejection', ...);
});
```

Create `packages/speakeasy/src/__tests__/identity-signing.integration.test.ts`:

```ts
describe('Identity + Signing lifecycle', () => {
  it('generates identity, signs message, verifies signature', async () => {
    const identity = await generateIdentity();
    const message = await createSignedMessage({ type: 'chat', content: 'hello' }, identity);
    const result = await verifyMessage(message);
    expect(result.valid).toBe(true);
  });

  it('recovers identity from seed phrase and signs with same key', ...);
  it('rejects signature from different identity', ...);
  it('rejects tampered message', ...);
});
```

### 3. Fuzz crypto paths with property-based testing

Use `fast-check` for property-based tests on the crypto primitives:

```ts
import * as fc from 'fast-check';

describe('crypto property tests', () => {
  it('hexToBytes(bytesToHex(x)) === x for all byte arrays', () => {
    fc.assert(fc.property(
      fc.uint8Array({ minLength: 0, maxLength: 256 }),
      (bytes) => {
        const hex = bytesToHex(bytes);
        const roundtripped = hexToBytes(hex);
        return timingSafeEqual(bytes, roundtripped);
      }
    ));
  });

  it('timingSafeEqual is reflexive', () => {
    fc.assert(fc.property(
      fc.uint8Array({ minLength: 0, maxLength: 64 }),
      (bytes) => timingSafeEqual(bytes, bytes) === true
    ));
  });

  it('SHA-256 always produces 32 bytes', () => {
    fc.assert(fc.asyncProperty(
      fc.uint8Array({ minLength: 0, maxLength: 1024 }),
      async (bytes) => (await sha256(bytes)).length === 32
    ));
  });

  it('HMAC-SHA-256 produces different output for different keys', () => {
    fc.assert(fc.asyncProperty(
      fc.uint8Array({ minLength: 1, maxLength: 64 }),
      fc.uint8Array({ minLength: 1, maxLength: 64 }),
      fc.uint8Array({ minLength: 1, maxLength: 256 }),
      async (key1, key2, msg) => {
        if (timingSafeEqual(key1, key2)) return true; // skip equal keys
        const mac1 = await hmacSha256(key1, msg);
        const mac2 = await hmacSha256(key2, msg);
        return !timingSafeEqual(mac1, mac2);
      }
    ));
  });
});
```

### 4. Convert DoormanStateMachine from singleton to context-scoped

Replace the module-level `create()` with a factory function:

```ts
// Before (singleton):
export const useDoormanStore = create<DoormanStore>()(...);

// After (factory):
export function createDoormanStore(config?: Partial<DoormanConfig>) {
  return create<DoormanStore>()(
    subscribeWithSelector((set, get) => ({
      ...INITIAL_CONTEXT,
      config: { ...DEFAULT_DOORMAN_CONFIG, ...config },
      transitions: createTransitions({ ...DEFAULT_DOORMAN_CONFIG, ...config }),
      // ... rest of store
    }))
  );
}

export type DoormanStoreApi = ReturnType<typeof createDoormanStore>;
```

Provide the store instance via React Context in `SpeakeasyProvider`:

```tsx
const DoormanStoreContext = createContext<DoormanStoreApi | null>(null);

export function SpeakeasyProvider({ children, config }: SpeakeasyProviderProps) {
  const [store] = useState(() => createDoormanStore(config));
  // ...
  return (
    <DoormanStoreContext.Provider value={store}>
      {children}
    </DoormanStoreContext.Provider>
  );
}

export function useDoormanStore() {
  const store = useContext(DoormanStoreContext);
  if (!store) throw new Error('useDoormanStore must be used within SpeakeasyProvider');
  return store;
}
```

Move timeout management into the provider (no more module-level timeout IDs):

```tsx
useEffect(() => {
  const cleanup = startDoormanTimeouts(store);
  return cleanup;
}, [store]);
```

Benefits:
- Tests can create isolated store instances
- Multiple Speakeasy instances can coexist
- No shared mutable state between test runs
- Timeouts are scoped to the provider lifecycle

### 5. Add Storybook stories for auth UI flow

Create stories for the four Speakeasy UI components:

| Story file | Components | States to cover |
|-----------|------------|-----------------|
| `SpeakeasyOrb.stories.tsx` | SpeakeasyOrb | idle, pulsing (knock detected), admitted glow |
| `SpeakeasyRitualPad.stories.tsx` | SpeakeasyRitualPad | empty, recording gesture, gesture complete |
| `SpeakeasyRegistrationDialog.stories.tsx` | SpeakeasyRegistrationDialog | open, gesture captured, confirmation |
| `SpeakeasyConsentDialog.stories.tsx` | SpeakeasyConsentDialog | open, accepted, declined |

Each story should use a mock `SpeakeasyProvider` with in-memory storage and pre-configured DoormanStateMachine state, avoiding real crypto operations.

### 6. Test panic/wipe e2e

Add integration tests that exercise the full panic flow:

```ts
describe('panic gesture e2e', () => {
  it('panic with decoyMode=true -> DECOY state -> fake admission -> auto-expire', async () => {
    // Setup: register + challenge
    // Dispatch PANIC_GESTURE with decoyMode: true
    // Assert: state is DECOY, admissionEndsAt is set
    // Assert: capability is null (not a real admission)
    // Fast-forward time -> assert state returns to IDLE
  });

  it('panic with decoyMode=false -> LOCKED with multiplied duration', async () => {
    // Dispatch PANIC_GESTURE with decoyMode: false
    // Assert: state is LOCKED
    // Assert: lockEndsAt uses panicLockMultiplier
  });
});
```

## Acceptance Criteria

- [ ] Single source of truth: shared crypto primitives extracted to `@backbay/speakeasy/core`
- [ ] `@backbay/glia/speakeasy/auth/crypto.ts` imports from shared layer instead of reimplementing
- [ ] Full handshake lifecycle integration test passing (register -> challenge -> verify -> capability)
- [ ] Identity + signing integration test in `@backbay/speakeasy`
- [ ] Crypto functions have property-based tests using `fast-check`
- [ ] DoormanStateMachine converted from module-level singleton to context-scoped factory
- [ ] Module-level timeout IDs eliminated in favor of provider-scoped lifecycle
- [ ] Storybook stories for all 4 Speakeasy UI components
- [ ] Panic/wipe e2e tests for both decoy and lock paths
- [ ] `panic.test.ts` migrated from `bun:test` to `vitest`
