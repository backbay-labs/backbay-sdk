# RFC-03: Split the glia Mega-Package

**Status:** Proposed
**Effort:** Large (multi-session)
**Priority:** High

## Problem

`@backbay/glia` has **441+ source files** doing the job of 5+ packages. The single
`package.json` (`packages/glia/package.json`) already exposes **17 export paths**,
which is a strong signal that the package is doing too much:

```
.           ./core        ./protocol    ./hooks       ./speakeasy
./components ./workspace  ./primitives  ./theme       ./emotion
./vision    ./audio       ./cognition   ./desktop     ./desktop/core
./desktop/themes  ./styles  ./styles.css
```

This causes:

1. **Massive bundle size** -- consumers who only need glass primitives pull in
   Three.js, Zustand stores for the desktop shell, speakeasy auth, emotion
   controllers, and a ray tracer.
2. **Slow builds** -- everything recompiles together under a single
   `bunx tsc || true` command (see RFC-01 for the `|| true` problem).
3. **Unclear ownership boundaries** -- desktop shell bugs are mixed with 3D
   rendering issues in the same issue tracker and changelog.
4. **Import side effects** -- module-level Zustand singletons
   (`useWindowManagerStore`, `useTaskbarStore`, `useDoormanStore`, etc.) execute
   on import even if the consumer never uses the desktop shell.

## Current Structure

| Domain | Location | Files | Description | Key Dependencies |
|--------|----------|------:|-------------|------------------|
| UI Primitives | `src/primitives/ui/` | 23 | Radix wrappers with `cn()`+Tailwind | Radix, clsx, tailwind-merge |
| Glass Atoms | `src/primitives/atoms/` | 55 | Glass-themed atoms with cva+framer-motion | cva, framer-motion, theme tokens |
| Glass Molecules | `src/primitives/molecules/` | 17 | Glass-themed molecules | atoms, cva, framer-motion |
| Glass Organisms | `src/primitives/organisms/` | 28 | Glass-themed organisms (ChatThread, Sidebar, Table) | atoms, molecules, Radix |
| Three.js / R3F | `src/primitives/three/` | 132 | 3D components (Glyph, Sentinel, QuantumField, AmbientField) | three, @react-three/fiber, @react-three/drei |
| Ambient Layers | `src/primitives/ambient/` | 7 | 2D particle/star layers | framer-motion, theme tokens |
| Desktop Shell | `src/desktop/` | 47 | Window manager, taskbar, start menu, file browser, notifications | Zustand, react-rnd, theme |
| Speakeasy | `src/speakeasy/` | 23 | Doorman auth state machine, capability tokens | Zustand, zod |
| Emotion | `src/emotion/` | 23 | AVO model, emotion controller, micro-expressions | standalone (types only) |
| Cognition | `src/cognition/` | 19 | Cognition state, persona drift, signals | emotion types |
| Audio | `src/audio/` | 17 | Speech synthesis, barge-in, hybrid speech | emotion, cognition, protocol |
| Vision / Raymond | `src/vision/` | 21 | Ray tracer | standalone |
| Components | `src/components/` | 29 | BBProvider, ClusterHero, AgentPanel | protocol, hooks |
| Theme | `src/theme/` | 9 | UiThemeProvider, registry, bridge, nebula/solarpunk tokens | standalone |
| Hooks | `src/hooks/` | 6 | useAgentRun, useSync, useRunStream, usePlaySession, useIntensity | protocol types |
| Workspace | `src/workspace/` | 15 | Component registry, WorkspaceRenderer | React context |
| Protocol | `src/protocol/` | 5 | Branded types, DOM protocol, type definitions | zod |

**Total: ~476 files across 17 domains.**

## Proposed Package Split

### 1. `@backbay/glia` -- Core Primitives (shrunk)

Keep only the universal UI layer:

- `src/primitives/ui/` -- Radix wrappers
- `src/primitives/atoms/` -- glass atoms
- `src/primitives/molecules/` -- glass molecules
- `src/primitives/organisms/` -- glass organisms
- `src/primitives/ambient/` -- ambient layers
- `src/theme/` -- UiThemeProvider, token hooks, registry
- `src/hooks/` -- shared hooks
- `src/protocol/` -- branded types

**Dependencies:** Radix, cva, framer-motion, clsx, tailwind-merge, zod

### 2. `@backbay/glia-desktop` -- Desktop Shell

- `src/desktop/` -- window manager, taskbar, start menu, system tray,
  notifications, file browser, snap zones, context menu, themes

**Dependencies:** `@backbay/glia` (theme tokens + primitives), zustand, react-rnd, lucide-react

### 3. `@backbay/glia-three` -- 3D Components

- `src/primitives/three/` -- Glyph, Sentinel, QuantumField, AmbientField,
  AgentConsole, VoiceCaptions, etc.

**Dependencies:** `@backbay/glia` (theme tokens), three, @react-three/fiber, @react-three/drei, zustand (Sentinel store)

### 4. `@backbay/glia-agent` -- AI Agent Systems

- `src/emotion/` -- AVO model, controller, micro-expressions
- `src/cognition/` -- cognition controller, persona drift
- `src/audio/` -- speech synthesis, barge-in
- `src/components/` -- BBProvider, AgentPanel, PlaySession, SyncDocument, ClusterHero

**Dependencies:** `@backbay/glia` (protocol types, hooks), zustand

### 5. `@backbay/raymond` -- Ray Tracer

- `src/vision/raymond/` -- standalone ray tracer with no React dependencies

**Dependencies:** none (fully standalone)

### 6. Deduplicate Speakeasy

`src/speakeasy/` is **duplicated** with the standalone `@backbay/speakeasy`
package. Remove it from glia entirely and point consumers to the canonical
package.

## Dependency Graph

```
                    @backbay/glia (core)
                   /        |        \
                  /         |         \
    @backbay/glia-desktop   |    @backbay/glia-three
                  \         |         /
                   \        |        /
                @backbay/glia-agent
                        |
              (emotion → cognition → audio)

    @backbay/raymond      (standalone, no deps)
    @backbay/speakeasy    (standalone, no deps on glia)
```

Cross-domain import chains found in the current codebase:

- **cognition --> emotion:** `src/cognition/controller.ts:14` imports `AVO` and
  `AnchorState` from `../emotion/types.js`
- **audio --> emotion + cognition:** `src/audio/planner.ts:1-2` imports from
  both emotion and cognition; `src/audio/hooks/useCognitionSpeech.ts:4-7`
  imports `useCognition` hook
- **components --> protocol + hooks:** `src/components/BBProvider.tsx:14`,
  `src/components/AgentPanel.tsx:9-10`
- **desktop --> theme (self-contained):** `src/desktop/providers/` only imports
  from `../themes/` within the desktop domain
- **three --> (self-contained):** no cross-domain imports outside three/

## Migration Strategy

### Phase 1: Deduplicate Speakeasy (Quick Win)

1. Audit differences between `src/speakeasy/` and `@backbay/speakeasy`
2. Move any glia-only additions into `@backbay/speakeasy`
3. Delete `src/speakeasy/`, update `./speakeasy` export to re-export from
   `@backbay/speakeasy`
4. Update `SpeakeasyProvider` imports in consuming apps

**Risk:** Low -- speakeasy is already a separate package.

### Phase 2: Extract `@backbay/glia-three` (Largest, Most Independent)

1. Create `packages/glia-three/` with its own `package.json`
2. Move `src/primitives/three/` into the new package
3. Move the Sentinel Zustand store (`sentinelStore.ts`) -- convert from
   module-level singleton to context-scoped (see RFC-07)
4. Update 132 files' internal imports
5. Add `@backbay/glia` as a peer dependency for theme tokens

**Risk:** Medium -- many files, but the three/ domain is self-contained.

### Phase 3: Extract `@backbay/glia-desktop`

1. Create `packages/glia-desktop/`
2. Move `src/desktop/` including themes, core stores, components
3. Convert 8 module-level Zustand stores to context-scoped (RFC-07)
4. Bridge the desktop theme to the unified theme system (RFC-04)

**Risk:** Medium -- desktop has its own theme system that needs bridging.

### Phase 4: Extract `@backbay/glia-agent`

1. Create `packages/glia-agent/`
2. Move `src/emotion/`, `src/cognition/`, `src/audio/`, `src/components/`
3. Preserve the emotion --> cognition --> audio dependency chain within
   the package

**Risk:** Low -- clean dependency chain, no Zustand singletons.

### Phase 5: Extract `@backbay/raymond`

1. Create `packages/raymond/` (or promote to standalone/)
2. Move `src/vision/raymond/`
3. No React dependencies to untangle

**Risk:** Low -- fully standalone.

## Acceptance Criteria

- [ ] Each package is independently publishable via `workspace:*` protocol
- [ ] Tree-shaking works: importing `@backbay/glia` does NOT pull in Three.js,
      react-rnd, or shiki
- [ ] No circular cross-package dependencies (enforce with `madge` or
      `depcheck`)
- [ ] Each package has its own `tsconfig.json` with strict mode (no `|| true`)
- [ ] Existing import paths documented in a migration guide with codemod scripts
- [ ] All 17 current export paths mapped to their new package locations
- [ ] Storybook can still build with all packages linked via workspace
