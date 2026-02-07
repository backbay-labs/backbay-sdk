# RFC-02: Add a Real Test Suite

**Priority:** High
**Effort:** Large (2-3 sessions)
**Packages affected:** All 7 TypeScript packages + root workspace

## Problem

The root workspace test script is a no-op:

**`package.json:23`**
```json
"test": "echo \"No tests configured yet\""
```

Only `@backbay/glia` has any test infrastructure. The other 6 packages either have placeholder `"test": "bun test"` scripts that find zero test files (`@backbay/contract`, `@backbay/notary`) or have `"test": "vitest"` configured but no test files (`@backbay/witness`, `@backbay/witness-react`). Two packages have no test script at all (`@backbay/api-client`, `@backbay/speakeasy`).

### Existing test inventory

The ~36 test files that do exist are all inside `@backbay/glia`, split between two directories:

**`packages/glia/src/**/__tests__/` (20 files, colocated)**
| Directory | Files | Runner |
|-----------|-------|--------|
| `src/speakeasy/__tests__/` | 7: crypto, panic, storage, CapabilityIssuer, DoormanStateMachine, SpeakeasyAuth, SpeakeasyNotReadyError | Vitest (crypto, storage, CapabilityIssuer, DoormanStateMachine, SpeakeasyAuth, SpeakeasyNotReadyError) / bun:test (panic) |
| `src/emotion/__tests__/` | 6: constants, controller, mapping, micro-expressions, transitions, useEmotion | Vitest |
| `src/cognition/__tests__/` | 5: controller, reducers, schema, types, useCognition | Vitest |
| `src/audio/__tests__/` | 2: planner, useCognitionSpeech | Vitest |

**`packages/glia/test/` (16 files, legacy directory)**
| Directory | Files |
|-----------|-------|
| `test/audio/` | overlay, planner, schema |
| `test/components/` | BBProvider |
| `test/hooks/` | useAgentRun, usePlaySession, useRunStream, useSync |
| `test/primitives/three/SpatialWorkspace/` | adapters, nexusAdapter, types |
| `test/protocol/` | branded, dom, schema |
| `test/speakeasy/` | DoormanStateMachine, SpeakeasyAuth |

Note: `panic.test.ts` imports from `bun:test` instead of `vitest`, creating a runner inconsistency.

### Vitest config

Glia's vitest config (`packages/glia/vitest.config.mjs`) includes both directories:
```js
include: [
  'test/**/*.test.ts',
  'test/**/*.test.tsx',
  'src/**/__tests__/**/*.test.ts',
  'src/**/__tests__/**/*.test.tsx',
],
```

Environment is `happy-dom`, which is appropriate for DOM-dependent component tests.

## What Has ZERO Test Coverage

### Entire packages (6 of 7)

| Package | Test Script | Test Files | Risk |
|---------|------------|------------|------|
| `@backbay/contract` | `"bun test"` | 0 | Shared types used by every other package |
| `@backbay/api-client` | None | 0 | Network layer for all API calls |
| `@backbay/speakeasy` | None | 0 | **Ed25519 identity, message signing, P2P transport** |
| `@backbay/notary` | `"bun test"` | 0 | EAS attestations, IPFS, SIWE auth |
| `@backbay/witness` | `"vitest"` | 0 | Browser-side attestation verification, WASM |
| `@backbay/witness-react` | `"vitest"` | 0 | React hooks for witness verification |

### Within `@backbay/glia` (untested areas)

- **All primitives** -- 80+ components across `atoms/`, `molecules/`, `organisms/`, `ui/` have zero tests
- **Desktop shell** -- Window (`src/desktop/components/window/Window.tsx`), Taskbar, StartMenu, SystemTray, NotificationCenter, FileBrowser
- **Desktop state** -- WindowManager store, Taskbar store, SnapZones
- **Theme system** -- Theme bridge, 6 token hooks (`useGlassTokens`, `useColorTokens`, `useElevationTokens`, `useMotionTokens`, `useControlTokens`, `useAmbientTokens`), CSS variable generation
- **Workspace renderer** -- Spatial workspace, R3F integration
- **Hooks** -- `useRunStream`, `useSync`, `useAgentRun`, `usePlaySession` have tests in `test/` but not `src/__tests__/` (duplicated)
- **Three.js / R3F components** -- `AgentConsole`, `SpatialWorkspace`, voice/captions

## Proposed Solution

### 1. Workspace-level Vitest configuration

Create a shared vitest config at the workspace root that each package extends:

```
backbay-sdk/
  vitest.workspace.ts          # NEW - workspace config
  packages/
    contract/vitest.config.ts  # NEW - extends workspace
    api-client/vitest.config.ts # NEW
    speakeasy/vitest.config.ts  # NEW
    notary/vitest.config.ts     # NEW
    witness/vitest.config.ts    # NEW
    witness-react/vitest.config.ts # NEW (already has vitest dep)
    glia/vitest.config.mjs      # EXISTS - migrate to .ts, extend workspace
```

### 2. Add `"test": "vitest run"` to every package

Standardize on Vitest across all packages. Replace `"bun test"` and empty scripts:

| Package | Current | Proposed |
|---------|---------|----------|
| Root | `echo "No tests configured yet"` | `vitest run --workspace vitest.workspace.ts` |
| `@backbay/contract` | `bun test` | `vitest run` |
| `@backbay/api-client` | _(none)_ | `vitest run` |
| `@backbay/speakeasy` | _(none)_ | `vitest run` |
| `@backbay/notary` | `bun test` | `vitest run` |
| `@backbay/witness` | `vitest` | `vitest run` |
| `@backbay/witness-react` | `vitest` | `vitest run` |
| `@backbay/glia` | `node scripts/vitest.mjs run` | `vitest run` (investigate why wrapper was needed) |

### 3. Add `@testing-library/react` for component tests

Already in `@backbay/glia` devDependencies. Add to `@backbay/witness-react` as well. Component tests should use `renderHook` for hook testing and `render` + user events for component testing.

### 4. Priority test areas (by risk)

**Tier A -- Security-critical (first session)**

Target: 15-20 tests covering the most dangerous code paths.

| Area | Files to test | Why |
|------|---------------|-----|
| Speakeasy crypto | `glia/src/speakeasy/auth/crypto.ts` | Core crypto primitives (sha256, hmac, timingSafeEqual) |
| SpeakeasyAuth | `glia/src/speakeasy/auth/SpeakeasyAuth.ts` | Gesture verification, verifier derivation, domain binding |
| CapabilityIssuer | `glia/src/speakeasy/auth/CapabilityIssuer.ts` | Token creation, signature verification, expiry checks |
| Standalone signing | `speakeasy/src/core/signing.ts` | Ed25519 message signing (`signMessage`, `verifyMessage`, `createSignedMessage`) |
| Standalone identity | `speakeasy/src/core/identity.ts` | Key generation (`generateIdentity`), recovery (`recoverIdentity`), fingerprinting |
| Encrypted storage | `glia/src/speakeasy/auth/storage.ts` | AES-256-GCM encrypt/decrypt roundtrip, version migration (v1 -> v2) |

**Tier B -- State machines (first session)**

Target: 10-15 tests covering state management correctness.

| Area | Files to test | Why |
|------|---------------|-----|
| DoormanStateMachine | `glia/src/speakeasy/doorman/DoormanStateMachine.ts` | Full state machine transitions: IDLE->CHALLENGED->VERIFYING->ADMITTED, failure paths, lockout, panic gesture routing |
| WindowManager store | `glia/src/desktop/core/window/useWindowManager.ts` | Window open/close/focus/minimize/maximize lifecycle, z-index stacking |
| Taskbar store | `glia/src/desktop/core/shell/useTaskbar.ts` | Pin/unpin apps, window tracking |
| NotificationCenter | `glia/src/primitives/organisms/NotificationCenter/store.ts` | Add/dismiss/clear notifications, toast queue |

**Tier C -- Theme logic (second session)**

Target: 8-10 tests covering theme token computation.

| Area | Files to test | Why |
|------|---------------|-----|
| Theme bridge | `glia/src/primitives/atoms/ThemeBridge/` | UiTheme <-> DesktopOSTheme mapping correctness |
| Token hooks | `glia/src/theme/tokens/*.ts` | CSS variable generation from theme tokens |
| Glass materials | `glia/src/primitives/atoms/GlassMaterial/` | Material preset computation |

**Tier D -- Components (second session)**

Target: 8-10 smoke tests for critical components.

| Area | Files to test | Why |
|------|---------------|-----|
| BBProvider | `glia/src/components/BBProvider.tsx` | Context provides correct values, `useBBContext` throws outside provider |
| DesktopOSProvider | `glia/src/desktop/providers/DesktopOSProvider.tsx` | Process launch/terminate, window creation |
| Glass primitives | GlassCheckbox, GlassSlider, GlassRadioGroup | Render without crash, forward refs, handle controlled/uncontrolled |

### 5. Coverage reporting

Add `c8` / `istanbul` coverage via Vitest's built-in `--coverage` flag:

```ts
// vitest.workspace.ts
export default {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      thresholds: {
        // Start low, ratchet up over time
        lines: 10,
        branches: 10,
        functions: 10,
      },
    },
  },
};
```

### 6. Add test step to CI

Add to `.github/workflows/ci.yml` in the existing `typescript` job, after the build step:

```yaml
- name: Run tests
  run: bun run test

- name: Upload coverage
  if: github.event_name == 'pull_request'
  uses: actions/upload-artifact@v4
  with:
    name: coverage
    path: coverage/
```

## Test Naming Convention

Adopt colocated `__tests__/` directories (matching glia's existing `src/**/__tests__/` pattern):

```
src/
  speakeasy/
    auth/
      SpeakeasyAuth.ts
      crypto.ts
    __tests__/
      SpeakeasyAuth.test.ts
      crypto.test.ts
  desktop/
    core/
      window/
        useWindowManager.ts
      __tests__/
        useWindowManager.test.ts
```

File naming: `{ModuleName}.test.ts` for pure logic, `{ComponentName}.test.tsx` for React components.

Consolidate the legacy `packages/glia/test/` directory into `src/**/__tests__/` to avoid duplicated test files (e.g., `test/speakeasy/DoormanStateMachine.test.ts` vs `src/speakeasy/__tests__/DoormanStateMachine.test.ts`).

Fix the `panic.test.ts` runner inconsistency -- it imports from `bun:test` while all other tests use `vitest`. Migrate to vitest.

## Acceptance Criteria

- [ ] Every package has a working `"test": "vitest run"` script
- [ ] Root `bun run test` runs all package tests via vitest workspace
- [ ] Coverage reporting configured with `v8` provider
- [ ] CI runs `bun run test` and blocks PRs on test failure
- [ ] Initial 30-40 tests covering Tier A (security) and Tier B (state machines)
- [ ] Legacy `test/` directory consolidated into `src/__tests__/`
- [ ] `panic.test.ts` migrated from `bun:test` to `vitest`
- [ ] No test file imports from `bun:test` -- vitest only
