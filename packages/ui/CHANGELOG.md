# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Branded types for type-safe IDs (AgentId, RunId, WorkspaceId)
- Comprehensive hook test suite
- Package README with quick start guide
- Prebuilt stylesheet export (`@backbay/bb-ui/styles.css`) for UI + theme defaults
- Lightweight entrypoint (`@backbay/bb-ui/core`) for protocol/hooks/components without optional-heavy modules
- Environment layers now support `stylePreset` (`ui` | `cinematic`) for different realism levels

### Fixed
- `useSync` conflict detection now persists sync metadata and avoids false conflicts after reload
- Environment particles are less jittery (stable opacity, more natural motion/spawn for weather effects)

## [0.2.0] - 2026-01-18

### Added
- **Workspace System** (migrated from @oos/ag-ui-ext)
  - WorkspaceSpec type for agent-composable UI
  - WorkspaceRenderer component
  - Component registry with manifest system
  - Layout types: split, stack, tabs, grid, panel, slot
  - Validation utilities

- **UI Primitives** (migrated from @oos/ag-ui-ext)
  - Atoms: GlowButton, HUDProgressRing, TypingAnimation, GlitchText, etc.
  - Molecules: KPIStat, NeonToast, ThreeDCard
  - Organisms: CommandPalette, GlassPanel, BentoGrid
  - Three.js: Graph3D, ParticleField, AmbientField
  - 16 Radix UI component wrappers

- **Theme System** (migrated from @oos/ag-ui-ext)
  - UiThemeProvider with token hooks
  - Nebula theme (clinical cyberpunk)
  - Solarpunk theme (botanical)
  - Token types: colors, glass, elevation, motion, controls

### Changed
- Reorganized exports into 7 entry points for better tree-shaking

## [0.1.0] - 2026-01-17

### Added
- **Protocol Layer**
  - BBManifest schema with Zod validation
  - DOM annotation utilities (findAction, findEntity, extractEntity)
  - Capability type definitions (query, mutation, workflow)
  - Authentication config types
  - Constraint and safety types

- **Components Layer**
  - BBProvider context for agent state management
  - SyncDocument render-prop component
  - AgentPanel component stub
  - PlaySession component for external environments

- **Hooks Layer**
  - useSync: Offline-first data synchronization
  - useAgentRun: Agent capability execution
  - useRunStream: Real-time run status streaming
  - usePlaySession: Play session lifecycle management
  - useIntensity: Agent activity intensity feedback

- **Utilities**
  - cn(): Class name merging (clsx + tailwind-merge)
  - glow(): Glow effect generator
  - hudGrad(): HUD gradient generator
  - formatNumber(): Number formatting

### Infrastructure
- TypeScript strict mode
- Bun build with esbuild
- Vitest test runner
- 50 initial tests

## Types of Changes

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.

[Unreleased]: https://github.com/backbay/bb-ui/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/backbay/bb-ui/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/backbay/bb-ui/releases/tag/v0.1.0
