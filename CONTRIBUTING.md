# Contributing to Backbay SDK

Thanks for your interest in contributing to the Backbay SDK.

## Prerequisites

- **Bun** >= 1.x ([install](https://bun.sh))
- **Node.js** >= 20
- **UV** ([install](https://docs.astral.sh/uv/)) -- for Python packages
- **Dojo CLI** ([install](https://book.dojoengine.org/)) -- only needed for Cairo/Starknet work

## Setup

```bash
git clone <repo-url>
cd backbay-sdk
bun install
```

For Python development:

```bash
uv sync --all-extras
```

## Development Commands

### TypeScript

```bash
bun run build          # Build all packages (ordered)
bun run typecheck      # Type-check all packages
bun run test           # Run vitest across workspace
bun run lint           # ESLint all package source
bun run lint:fix       # ESLint with auto-fix
bun run format         # Prettier format all files
bun run format:check   # Check formatting without writing
bun run clean          # Remove dist/ from all packages
```

### Storybook (glia)

```bash
cd packages/glia
node scripts/storybook.mjs dev -p 6006
```

### Python (cyntra)

```bash
cd packages/cyntra
uv run pytest              # Run tests
uv run mypy src/           # Type check
uv run ruff check src/     # Lint
```

### Cairo (gameworld)

```bash
cd packages/gameworld
sozo build
sozo test
```

## Code Style

- **TypeScript** strict mode (`"strict": true`)
- **Tailwind CSS** for utility classes in UI components
- **cva** (class-variance-authority) for variant-driven component styling
- **framer-motion** for animations
- **Pydantic** for Python schemas and settings
- **ruff** for Python linting and formatting

## Project Structure

```
packages/
  contract/       # Shared TS types (zero deps, other packages depend on this)
  api-client/     # HTTP client for BFF
  speakeasy/      # P2P messaging (Ed25519 + libp2p)
  glia/           # UI components, desktop shell, agent components
  notary/         # Web3 integration (IPFS, EAS, Starknet)
  witness/        # WASM attestation verification
  witness-react/  # React hooks for witness
  cyntra/         # Python agent orchestration
  gameworld/      # Cairo/Dojo onchain contracts
```

## PR Process

1. Create a feature branch from `main`
2. Make your changes
3. Run `bunx changeset` to describe your change (this creates a changeset file for versioning)
4. Ensure CI passes:
   ```bash
   bun run build && bun run typecheck && bun run test
   ```
5. Open a PR against `main`

## Changesets

We use [changesets](https://github.com/changesets/changesets) for version management. When your PR changes package behavior:

```bash
bunx changeset
```

Follow the prompts to select affected packages and describe the change. This creates a markdown file in `.changeset/` that will be committed with your PR.

## Commit Messages

Use conventional-style commit messages:

```
feat(glia): add GlassSlider component
fix(witness): handle missing WASM init
docs(contract): add API overview to README
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
