# Contributing to `@backbay/glia`

## Setup

- Install Bun: https://bun.sh
- From the repo root, install dependencies: `bun install`

## Development

From `packages/bb-ui`:

- Build: `bun run build`
- Typecheck: `bun run typecheck`
- Tests: `bun run test`
- Storybook: `bun run storybook`

## Making Changes

- Keep public APIs documented in `packages/bb-ui/README.md`.
- If you change the published surface area, update `packages/bb-ui/CHANGELOG.md`.
- Prefer subpath imports (`@backbay/glia/protocol`, `@backbay/glia/hooks`, etc.) for larger modules.

## Storybook Conventions

- Co-locate stories with their components (`ComponentName.stories.tsx` next to the component).
- Use `Meta.title` as the public navigation structure (don’t mirror app-specific naming like `Core/*` or `Dashboard/*`).
- Use this top-level taxonomy:
  - `Components/*` for exported React components
  - `Workspace/*` for workspace rendering
  - `Primitives/*` for building blocks (`Atoms`, `Molecules`, `Organisms`, `Ambient`, `Environment`, `3D`)
  - `Systems/*` for non-UI systems (e.g. `Systems/Emotion/*`)
