# RFC-10: Documentation and SDK Onboarding

**Priority:** Medium
**Effort:** Medium (1-2 sessions)
**Packages affected:** All packages, root workspace

## Problem

The Backbay SDK contains 9 packages across TypeScript, Cairo, and Rust, with the `glia` package alone containing 441 source files. Despite this scale, documentation is sparse, inconsistent, and largely absent for most packages. New developers have no structured path from "clone the repo" to "build something."

### Current Documentation State

#### Package READMEs

| Package | README? | Quality | Notes |
|---------|---------|---------|-------|
| `@backbay/glia` | Yes (`packages/glia/README.md`, 493 lines) | Good | Comprehensive: install, exports, API reference, emotion system, ClusterHero. The best README in the repo. |
| `@backbay/witness` | Yes (`packages/witness/README.md`, 251 lines) | Good | Complete: install, usage, API, config tables, testing instructions. |
| `@backbay/notary` | Yes (`packages/notary/README.md`, 57 lines) | Adequate | Covers routes and config, but thin on API details. |
| `cyntra_world` | Yes (`packages/gameworld/README.md`, 187 lines) | Good | Architecture diagram, models, systems, dev setup, deploy instructions. |
| `@backbay/contract` | No | -- | No README. |
| `@backbay/api-client` | No | -- | No README. |
| `@backbay/speakeasy` | No | -- | No README. |
| `@backbay/witness-react` | No | -- | No README. |
| `@backbay/cyntra` | No | -- | No README. |

**5 of 9 packages have no README at all.**

#### Changelogs

| Package | CHANGELOG? | Quality |
|---------|-----------|---------|
| `@backbay/glia` | Yes (`packages/glia/CHANGELOG.md`, 95 lines) | Good -- follows Keep a Changelog format, covers 0.1.0 and 0.2.0 releases plus an Unreleased section. |
| All other packages | No | -- |

Only 1 of 9 packages has a changelog. No automated changelog tooling (`@changesets/cli`, `semantic-release`, etc.) is configured.

#### API Documentation

A `typedoc.json` exists at the repo root with 7 entry points configured:

```json
{
  "entryPoints": [
    "packages/contract/src/index.ts",
    "packages/api-client/src/index.ts",
    "packages/speakeasy/src/index.ts",
    "packages/glia/src/index.ts",
    "packages/notary/src/index.ts",
    "packages/witness/src/index.ts",
    "packages/witness-react/src/index.ts"
  ],
  "out": "docs/api",
  "name": "Backbay SDK",
  "skipErrorChecking": true
}
```

The config exists but **no generated docs are present** in `docs/api/` -- typedoc has never been run, or its output is gitignored. The `skipErrorChecking: true` flag suggests it was set up to work around the same type errors documented in RFC-01.

#### Storybook Documentation

- **Getting Started story** exists at `packages/glia/src/stories/GettingStarted.stories.tsx` (104 lines). It renders a static page with install instructions, style imports, recommended import paths, and a theming example. It is a basic starting point but not a structured tutorial.
- **~87 story files** exist across the component library covering primitives, desktop shell, themes, and AI/agent components.
- **Zero MDX doc pages** -- all stories are pure component demos, not documentation pages.
- **No "Theming" guide**, no "Desktop Shell" guide, no component category overviews.
- **Speakeasy system** has zero stories.

#### Architecture Documentation

- The `docs/roadmap/` directory exists with this RFC series (proposals 01-10).
- No architecture decision records (ADRs).
- No architecture diagrams for the overall SDK or individual packages.
- No contribution guide (`CONTRIBUTING.md` is referenced in glia's README but does not exist).

#### Root README

The repo root has no README.md (or if one exists, it was not found in the file scan). Developers cloning the repo have no orientation document.

## Proposed Solution

### 1. Root README.md

Create a root `README.md` with:

- Project description and purpose
- Architecture diagram (text-based, like the one in gameworld's README)
- Package map with one-line descriptions
- Quick start (prerequisites, install, first run)
- Links to per-package READMEs and Storybook

```
backbay-sdk/
├── packages/
│   ├── glia/           → UI primitives, desktop OS shell, agent components
│   ├── contract/       → Shared TypeScript types and contracts
│   ├── api-client/     → HTTP client for Backbay APIs
│   ├── speakeasy/      → P2P encrypted messaging (libp2p)
│   ├── notary/         → Web3 integration (IPFS, EAS, Starknet)
│   ├── witness/        → Browser-side attestation verification (WASM)
│   ├── witness-react/  → React bindings for witness
│   ├── cyntra/         → Python orchestration bridge
│   └── gameworld/      → Cairo/Dojo onchain world (Starknet)
└── docs/
    ├── roadmap/        → Improvement proposals (this RFC series)
    └── api/            → Auto-generated API docs (typedoc)
```

### 2. Per-Package READMEs

Create READMEs for the 5 packages that lack them. Each should follow a standard template:

```markdown
# @backbay/<package-name>

> One-line description.

## Installation

\`\`\`bash
bun add @backbay/<package-name>
\`\`\`

## Quick Start

\`\`\`ts
import { ... } from "@backbay/<package-name>";
// Minimal working example
\`\`\`

## API Overview

### Key Exports

| Export | Type | Description |
|--------|------|-------------|
| `Foo` | function | Does X |
| `Bar` | class | Manages Y |

## Configuration

(If applicable -- env vars, options objects, etc.)

## Development

\`\`\`bash
cd packages/<package-name>
bun install
bun run build
bun test
\`\`\`

## License

MIT
```

Packages needing READMEs:

| Package | Key things to document |
|---------|----------------------|
| `@backbay/contract` | Shared types (AgentId, RunId, etc.), Zod schemas, how other packages depend on it |
| `@backbay/api-client` | API endpoints, auth, request/response types |
| `@backbay/speakeasy` | P2P architecture, libp2p usage, key exchange, room management |
| `@backbay/witness-react` | React hooks wrapping witness, how it differs from bare witness |
| `@backbay/cyntra` | Python bridge purpose, how it connects to the kernel |

### 3. API Reference with typedoc

The `typedoc.json` already exists. Make it operational:

**Step 1:** Add a build script to root `package.json`:
```json
"docs:api": "typedoc"
```

**Step 2:** Fix the `skipErrorChecking: true` -- once RFC-01 (Fix Silent Builds) is complete, this can be set to `false` so typedoc validates types during doc generation.

**Step 3:** Add typedoc as a dev dependency if not already present:
```bash
bun add -D typedoc
```

**Step 4:** Run and verify output in `docs/api/`. Consider adding to `.gitignore` if generated docs should not be committed (publish to a docs site instead).

**Step 5:** Consider adding `typedoc-plugin-markdown` for markdown output that can be hosted on a static site or read directly in the repo.

### 4. Changelogs with @changesets/cli

Set up automated changelog generation:

```bash
bun add -D @changesets/cli @changesets/changelog-github
```

Initialize:
```bash
bunx changeset init
```

Configure `.changeset/config.json`:
```json
{
  "changelog": ["@changesets/changelog-github", { "repo": "backbay/backbay-sdk" }],
  "commit": false,
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["cyntra_world"]
}
```

Workflow:
1. Developer runs `bunx changeset` to describe their change
2. CI validates that a changeset exists for PRs touching package source
3. `bunx changeset version` bumps versions and updates changelogs
4. `bunx changeset publish` publishes to npm

This replaces the manually-maintained `CHANGELOG.md` in glia. The existing changelog content can be preserved as historical entries.

### 5. Storybook Documentation Enhancement

#### 5a. Enhance Getting Started

The current `GettingStarted.stories.tsx` at `packages/glia/src/stories/GettingStarted.stories.tsx` renders a static page with basic install instructions. Enhance it into a multi-page tutorial:

| Story | Content |
|-------|---------|
| `Introduction/Getting Started` | Existing content (install, styles, imports) -- already exists |
| `Introduction/Theming` | How the theme system works, token hooks, creating custom themes |
| `Introduction/Desktop Shell` | How to set up the desktop OS shell, window management, taskbar |
| `Introduction/Agent Components` | How to use ChatInput, MessageThread, StreamingText for AI UIs |

#### 5b. Add MDX Category Pages

For each component category, add an MDX overview page:

- `Atoms/Overview.mdx` -- What atoms are, list of available atoms, when to use which
- `Molecules/Overview.mdx` -- Composite components
- `Organisms/Overview.mdx` -- Complex components (CommandPalette, ChatThread, etc.)
- `Desktop/Overview.mdx` -- Desktop OS shell architecture, window lifecycle
- `Three/Overview.mdx` -- 3D components, React Three Fiber usage

#### 5c. Document Component Props

Ensure all component stories include:
- `argTypes` for interactive prop controls
- JSDoc comments on prop interfaces (these appear in Storybook's docs tab)
- Default value documentation

### 6. Architecture Decision Records (ADRs)

Create a `docs/adr/` directory for recording major architectural decisions. Use the standard ADR format:

```markdown
# ADR-NNN: Title

## Status
Accepted | Proposed | Deprecated | Superseded by ADR-XXX

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?
```

Initial ADRs to retroactively document:

| ADR | Decision |
|-----|----------|
| ADR-001 | Two-tier styling system (Radix+Tailwind for UI, cva+framer-motion for glass) |
| ADR-002 | Dual theme systems (UiTheme + DesktopOSTheme) |
| ADR-003 | Module-level singleton Zustand stores |
| ADR-004 | Glia as a mega-package (and plans to split per RFC-03) |
| ADR-005 | libp2p for P2P messaging (Speakeasy) |
| ADR-006 | Cairo/Dojo for onchain world state |

### 7. Contributing Guide

Create `CONTRIBUTING.md` at the repo root (glia's README already links to it at line 488):

```markdown
# Contributing to Backbay SDK

## Prerequisites
- Bun >= 1.x
- Node.js >= 20
- UV (for Python packages)
- Dojo CLI (for Cairo/Starknet work)

## Setup
git clone ...
bun install
uv sync

## Development
bun run build          # Build all packages
bun run typecheck      # Type check all packages
bun run test           # Run all tests

## Storybook (glia)
cd packages/glia
node scripts/storybook.mjs dev -p 6006

## Code Style
- TypeScript strict mode
- Tailwind CSS for utility classes
- cva for variant-driven styling
- framer-motion for animations

## PR Process
1. Create a feature branch
2. Run `bunx changeset` to describe your change
3. Ensure `bun run build && bun run typecheck && bun run test` passes
4. Open a PR against `main`
```

## Documentation Map

Target directory structure after this RFC is complete:

```
backbay-sdk/
├── README.md                     ← NEW: Root orientation doc
├── CONTRIBUTING.md               ← NEW: Contributor guide
├── docs/
│   ├── roadmap/                  ← EXISTS: RFC proposals (this series)
│   │   ├── README.md
│   │   ├── 01-fix-silent-builds.md
│   │   ├── ...
│   │   └── 10-documentation.md
│   ├── adr/                      ← NEW: Architecture decision records
│   │   ├── 001-two-tier-styling.md
│   │   ├── 002-dual-theme-systems.md
│   │   └── ...
│   └── api/                      ← NEW: Auto-generated typedoc output
│       └── (generated files)
├── packages/
│   ├── glia/
│   │   ├── README.md             ← EXISTS: Already comprehensive
│   │   └── CHANGELOG.md          ← EXISTS: Will be managed by changesets
│   ├── contract/
│   │   └── README.md             ← NEW
│   ├── api-client/
│   │   └── README.md             ← NEW
│   ├── speakeasy/
│   │   └── README.md             ← NEW
│   ├── witness/
│   │   └── README.md             ← EXISTS: Already comprehensive
│   ├── witness-react/
│   │   └── README.md             ← NEW
│   ├── notary/
│   │   └── README.md             ← EXISTS: Adequate
│   ├── cyntra/
│   │   └── README.md             ← NEW
│   └── gameworld/
│       └── README.md             ← EXISTS: Already comprehensive
└── .changeset/                   ← NEW: Changesets config
    └── config.json
```

## Acceptance Criteria

- [ ] Root `README.md` exists with architecture diagram and package map
- [ ] Every package has a README with install instructions and quick start
- [ ] `typedoc` generates API docs successfully (`bun run docs:api`)
- [ ] `@changesets/cli` configured and initialized
- [ ] Storybook has at least 4 documentation pages (Getting Started, Theming, Desktop Shell, Agent Components)
- [ ] `CONTRIBUTING.md` exists at repo root
- [ ] At least 3 retroactive ADRs written for major past decisions
- [ ] The dead reference to `CONTRIBUTING.md` in glia's README (`packages/glia/README.md:488`) resolves to a real file

## Risk

Low. This is purely additive documentation work. No source code changes are required except adding build scripts for typedoc and changesets. The main risk is documentation becoming stale -- mitigate by integrating doc generation into CI (typedoc on build, changeset validation on PR).
