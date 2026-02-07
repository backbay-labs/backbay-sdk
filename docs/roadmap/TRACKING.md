# Implementation Tracking

> Living document. Update checkboxes as work is completed.

## Phase 1 — Stop the Bleeding

### RFC-01: Fix Silent Build Failures
**Status:** COMPLETE | **Effort:** Small | **Priority:** P0

- [x] Remove `|| true` from `packages/glia/package.json:95` (change `;` to `&&`)
- [x] Remove `|| true` from `packages/witness-react/package.json:22`
- [x] Fix `MotionConfig.ease` type in `src/theme/types.ts` (narrow from `string | number[]` to `EaseName | CubicBezier`)
- [x] Fix `motion[Component]` dynamic access in `GlassPanel.tsx:192` (use lookup object)
- [x] Enable `strict: true` in `packages/witness-react/tsconfig.json` and fix resulting errors
- [x] Set `noEmitOnError: true` in glia, witness, witness-react tsconfigs
- [x] Add `"typecheck": "tsc --noEmit"` to witness and witness-react
- [x] Update root `typecheck` script to cover all packages
- [x] Verify `bun run build` fails on type errors end-to-end

### RFC-05: Add Error Boundaries
**Status:** COMPLETE | **Effort:** Small | **Priority:** P0

- [x] Create `GliaErrorBoundary` base component at `src/primitives/atoms/GliaErrorBoundary/`
  - [x] Class-based with `componentDidCatch` + `getDerivedStateFromError`
  - [x] Configurable fallback (inline/card/fullscreen variants)
  - [x] `onError` callback for telemetry
  - [x] Auto-retry support
  - [x] Glass-themed fallback UI using theme tokens
- [x] Create `useErrorBoundary()` hook for programmatic triggering
- [x] Add `WindowErrorBoundary` wrapping children in `Window.tsx`
  - [x] "Close Window" + "Retry" buttons
  - [x] Error doesn't propagate to desktop shell
- [x] Add `ThreeErrorBoundary` for R3F/WebGL crashes
  - [x] WebGL context loss detection (MutationObserver + webglcontextlost event)
  - [x] 2D fallback placeholder (glass-themed)
- [x] Add `SpeakeasyErrorBoundary` in `SpeakeasyProvider.tsx`
  - [x] Resets DoormanStateMachine to IDLE
  - [x] Clears in-flight challenge data
  - [x] Does NOT clear stored keys
- [x] Add app-level `GliaErrorBoundary` in `BBProvider.tsx`
- [x] Write Storybook stories (7 stories: card/inline/fullscreen/hook/custom/autoretry/callback)
- [x] Export from package barrel

### RFC-02: Add Test Suite (Phase 1 scope — infra + Tier A/B only)
**Status:** COMPLETE | **Effort:** Medium | **Priority:** P1

- [x] Create `vitest.workspace.ts` at workspace root
- [x] Add `vitest.config.ts` to each package (contract, api-client, speakeasy, notary, witness, witness-react)
- [x] Migrate glia's `vitest.config.mjs` to `.ts`, extend workspace config
- [x] Update all package.json test scripts to `"vitest run"`
- [x] Update root test script to `"vitest run --workspace vitest.workspace.ts"`
- [x] Fix all `bun:test` imports → `vitest` (panic, SpeakeasyAuth, storage, DoormanStateMachine, CapabilityIssuer, SpeakeasyNotReadyError, notary tests)
- [x] Consolidate `packages/glia/test/speakeasy/` — deleted 2 duplicate files (SpeakeasyAuth, DoormanStateMachine)
- [x] **Tier A tests (security-critical):**
  - [x] SpeakeasyAuth gesture verification + verifier derivation
  - [x] CapabilityIssuer token creation + signature + expiry
  - [x] Encrypted storage roundtrip
  - [x] SpeakeasyNotReadyError
  - [x] Standalone speakeasy signing (signMessage, verifyMessage) — 31 tests in speakeasy/src/__tests__/signing.test.ts
  - [x] Standalone identity generation + recovery — 42 tests in speakeasy/src/__tests__/identity.test.ts
- [x] **Tier B tests (state machines):**
  - [x] DoormanStateMachine transitions (pre-existing, migrated + timing fix)
  - [x] WindowManager store — 20 new tests
  - [x] Taskbar store — 10 new tests
  - [x] NotificationCenter store — new tests
- [x] Add `bun run test` to CI workflow
- [x] Configure coverage reporting (v8 provider, text + lcov)

**Result:** 46 test files passing, 776 tests, 0 failures

---

## Phase 2 — Architecture

### RFC-03: Split glia Mega-Package
**Status:** PARTIALLY COMPLETE (2 of 5 packages extracted) | **Effort:** Large | **Priority:** P2

- [x] Extract `@backbay/raymond` (src/vision/raymond/) — 14 files, zero deps, tsup build
- [x] Extract `@backbay/glia-agent` (src/emotion/, cognition/, audio/) — 4 entry points, ~30 files
- [x] Glia re-exports from new packages (backward-compat preserved)
- [x] Verify no circular cross-package dependencies — build passes 9/9
- [x] Document speakeasy deduplication plan in speakeasy/index.ts JSDoc
- [ ] Extract `@backbay/glia-three` (src/primitives/three/, environment/, ambient/) — deferred (132 files, complex)
- [ ] Extract `@backbay/glia-desktop` (src/desktop/) — deferred (47 files, store dependencies)
- [ ] Deduplicate speakeasy shared crypto layer — deferred (needs @backbay/speakeasy/core)
- [ ] Full migration guide for changed import paths

### RFC-04: Unify Theme Systems
**Status:** COMPLETE | **Effort:** Medium | **Priority:** P2

- [x] Extend UiTheme with fonts/radii/spacing token groups
- [x] Standardize CSS variable naming on `--glia-*` prefix with backward-compat aliases
- [x] Create `<GliaThemeProvider>` that sets CSS vars AND provides token hooks
- [x] New hooks: useFontTokens(), useRadiiTokens(), useSpacingTokens(), useGliaTheme()
- [x] Update nebula + solarpunk themes with new token values
- [x] Backward-compat: --theme-* and --bb-* aliases via var() references
- [x] Deprecate old UiThemeProvider + DesktopOS ThemeProvider with console warnings
- [x] Update bridge.ts to source from UiTheme instead of hardcoded values
- [x] Update tailwind.config.js for --glia-tw-* variables
- [x] Migrate desktop shell components from `--bb-*` to `--glia-*` — 23 files migrated
- [x] Migrate primitives from `--theme-*` to `--glia-*` — 4 files migrated

---

## Phase 3 — Hardening

### RFC-08: Speakeasy Security Hardening
**Status:** COMPLETE | **Effort:** Medium | **Priority:** P2

- [x] Choose canonical location for speakeasy code — documented boundary in speakeasy/index.ts
- [x] Integration test: full handshake lifecycle — 8 tests (register→knock→challenge→verify→capability→admitted + failure paths)
- [x] Property-based tests on crypto functions — 10 tests with fast-check (hex roundtrip, timingSafeEqual, SHA-256, HMAC-SHA-256)
- [x] Convert DoormanStateMachine from singleton to factory/context-scoped (done in RFC-07)
- [x] Fix v1 fixed-salt PBKDF2 issue — migrateV1ToV2() helper + console.warn on v1 detection + 5 new tests
- [x] Fix domain binding 'unknown' fallback — throws in non-browser env instead of 'unknown' + 1 new test
- [x] Add Storybook stories for auth UI flow — 4 story files (SpeakeasyOrb, RitualPad, Registration, Consent), 16 stories
- [x] Test panic/wipe e2e — 11 tests (decoy mode, locked mode, multiplied duration, panic disabled)

### RFC-07: State Management Cleanup
**Status:** MOSTLY COMPLETE | **Effort:** Medium | **Priority:** P3

- [x] Convert 9 module-level Zustand singletons to context-scoped store factories
  - [x] createWindowManagerStore + WindowManagerStoreProvider
  - [x] createTaskbarStore + TaskbarStoreProvider
  - [x] createNotificationStore + NotificationStoreProvider (crypto.randomUUID SSR guard)
  - [x] createStartMenuStore + StartMenuStoreProvider
  - [x] createFileBrowserStore + FileBrowserStoreProvider
  - [x] createSnapZoneStore + SnapZoneStoreProvider
  - [x] createSystemTrayStore + SystemTrayStoreProvider
  - [x] createDoormanStore + closure-scoped timeouts (no module-level timeout IDs)
  - [x] createSentinelStore with persist middleware
- [x] Create `<GliaProviders>` convenience wrapper (src/GliaProviders.tsx)
- [x] Fix SSR safety: crypto.randomUUID guarded in useNotifications
- [x] Legacy singleton hooks preserved for backward compatibility
- [ ] Document provider tree hierarchy in README (deferred)
- [ ] Audit 19 contexts — remove/merge unnecessary ones (deferred — deprecated SpeakeasyContext still present)
- [ ] Nest store providers inside DesktopOSProvider/SpeakeasyProvider (deferred — follow-up)

### RFC-09: Accessibility Audit
**Status:** COMPLETE (manual screen reader testing deferred) | **Effort:** Medium | **Priority:** P3

- [x] Add `eslint-plugin-jsx-a11y` to lint config
- [x] Add `@storybook/addon-a11y` (v10.2.7) to Storybook config
- [x] Audit + fix critical components (ARIA attributes):
  - [x] Window.tsx: role="dialog", aria-label, aria-hidden when minimized
  - [x] Taskbar.tsx: role="toolbar", aria-label, aria-pressed
  - [x] SystemTray.tsx: already had good ARIA (verified)
  - [x] MessageThread.tsx: role="log", aria-live="polite", aria-label
  - [x] ChatInput.tsx: aria-label on textarea
  - [x] CommandPalette.tsx: role="dialog", aria-modal="true"
  - [x] GlassSlider.tsx: aria-labelledby linked via useId()
- [x] Add keyboard navigation: useKeyboardNavigation hook (Ctrl+Tab window cycling, Escape)
- [x] Focus trapping in modal dialogs/windows — useFocusTrap hook, applied to CommandPalette
- [x] Global `prefers-reduced-motion` via framer-motion `MotionConfig` in UiThemeProvider
- [x] Media query hooks: usePrefersColorScheme(), usePrefersHighContrast()
- [ ] Screen reader testing pass (deferred — requires manual testing)

---

## Phase 4 — Polish

### RFC-06: Modernize Build Pipeline
**Status:** MOSTLY COMPLETE | **Effort:** Medium | **Priority:** P4

- [x] Set up Turborepo (turbo@2.8.3) for parallel, cached builds — 263ms cached rebuild (9 packages)
- [x] Migrate contract + api-client to tsup (ESM, dts, sourcemaps)
- [x] Migrate witness + witness-react to tsup
- [x] Migrate speakeasy to tsup (4 entry points: index, core, transport, react)
- [x] Glia tsup config created (`build:tsup` script) — 16 entry points, parallel to tsc build
- [x] Raymond + glia-agent use tsup from creation
- [x] Add source maps to all packages (speakeasy, notary, glia tsconfigs updated)
- [ ] Switch glia default build from tsc to tsup (deferred — validate tree-shaking first)
- [ ] Validate tree-shaking works (needs downstream consumer testing)

### RFC-10: Documentation & Onboarding
**Status:** MOSTLY COMPLETE (Storybook docs deferred) | **Effort:** Medium | **Priority:** P4

- [x] Root README with architecture diagram + quick start
- [x] Per-package READMEs — 5 new (contract, api-client, speakeasy, witness-react, cyntra)
- [x] typedoc script added (`bun run docs:api`)
- [x] Set up @changesets/cli for versioning (.changeset/config.json)
- [x] CONTRIBUTING.md at repo root (fixed glia README's broken link)
- [x] 3 initial ADRs (001-two-tier-styling, 002-dual-theme-systems, 003-singleton-zustand-stores)
- [ ] Enhance Storybook Getting Started into proper tutorial (deferred)
- [ ] Add MDX docs pages in Storybook (deferred)

---

## Velocity Log

| Date | RFC | Work Done | Lines Changed |
|------|-----|-----------|---------------|
| 2026-02-06 | RFC-01 | Remove `\|\| true`, fix MotionConfig.ease type, fix motion[Component] dynamic access, enable strict mode witness-react, noEmitOnError | ~120 |
| 2026-02-06 | RFC-05 | GliaErrorBoundary (3 variants), useErrorBoundary hook, Window/Speakeasy/BBProvider integration, 7 Storybook stories | ~500 |
| 2026-02-06 | RFC-02 | vitest workspace infra, 7 vitest configs, migrate 9 bun:test→vitest, 3 new store test files (30+ tests), fix timing flake | ~600 |
| 2026-02-06 | RFC-02/08 | Consolidate test dirs, handshake integration test (8), crypto property tests (10), panic e2e (11), coverage config, CI step | ~800 |
| 2026-02-06 | RFC-09 | ARIA on Window/Taskbar/Chat/CommandPalette/GlassSlider, global MotionConfig, useKeyboardNavigation, media query hooks | ~350 |
| 2026-02-06 | RFC-10 | Root README, 5 package READMEs, CONTRIBUTING.md, changesets, typedoc script, 3 ADRs | ~1,500 |
| 2026-02-06 | RFC-06 | Turborepo + turbo.json, 4 tsup configs (contract/api-client/witness/witness-react), source maps everywhere | ~300 |
| 2026-02-06 | RFC-04 | GliaThemeProvider (412 lines), extend UiTheme, --glia-* CSS vars, compat aliases, deprecation warnings, tailwind update | ~600 |
| 2026-02-06 | RFC-07 | 9 Zustand store factories + context providers, GliaProviders wrapper, DoormanStateMachine closure-scoped timeouts, SSR guards | ~800 |
| 2026-02-06 | RFC-04 | Migrate 27 files from --bb-*/--theme-* to --glia-* (23 desktop, 4 primitives) | ~400 |
| 2026-02-06 | RFC-08 | migrateV1ToV2 PBKDF2, domain binding throw, 4 Speakeasy story files (16 stories), boundary docs | ~700 |
| 2026-02-06 | RFC-05 | ThreeErrorBoundary with WebGL context loss detection + MutationObserver + 2D fallback | ~200 |
| 2026-02-06 | RFC-06 | Speakeasy tsup config, glia tsup config (16 entry points), raymond + glia-agent tsup configs | ~200 |
| 2026-02-06 | RFC-09 | @storybook/addon-a11y, useFocusTrap hook, CommandPalette focus trapping | ~150 |
| 2026-02-06 | RFC-03 | Extract @backbay/raymond (14 files), @backbay/glia-agent (~30 files), glia re-export wrappers | ~500 |
