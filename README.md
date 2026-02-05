<p align="center">
  <img src=".github/assets/bb-sdk-hero.png" alt="Backbay SDK" width="100%" />
</p>

<p align="center">
  <strong>Build for the decentralized autonomous production marketplace</strong>
</p>

<p align="center">
  <a href="#packages">Packages</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#development">Development</a>
</p>

---

## Packages

### TypeScript

| Package | Description |
|---------|-------------|
| [`@backbay/contract`](./packages/contract) | Shared types and contracts |
| [`@backbay/api-client`](./packages/api-client) | Typed API client for Backbay services |
| [`@backbay/speakeasy`](./packages/speakeasy) | P2P encrypted messaging — identity, transport, React hooks |
| [`@backbay/glia`](./packages/glia) | Agent-native UI components and design system |
| [`@backbay/notary`](./packages/notary) | Web3 attestations, IPFS, and verification |
| [`@backbay/witness`](./packages/witness) | Browser-side verification of Backbay attestations |
| [`@backbay/witness-react`](./packages/witness-react) | React hooks for verification |

### Python

| Package | Description |
|---------|-------------|
| [`cyntra`](./packages/cyntra) | Everything your agent needs to industrialize |

### Cairo

| Package | Description |
|---------|-------------|
| [`cyntra_world`](./packages/gameworld) | On-chain game state and systems (Starknet/Dojo) |

---

## Quick Start

```bash
# Install a package
bun add @backbay/speakeasy

# Or with npm
npm install @backbay/speakeasy
```

```typescript
import { generateIdentity, useIdentity } from '@backbay/speakeasy'

// Generate a new cryptographic identity
const identity = await generateIdentity()

// Or use the React hook
const { identity, create, recover } = useIdentity()
```

---

## Development

```bash
# Install dependencies
bun install

# Typecheck
bun run typecheck

# Lint
bun run lint

# Build all packages
bun run build
```

### Python (cyntra)

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Sync dependencies
uv sync --all-extras

# Run tests
uv run pytest
```

---

<p align="center">
  <sub>Built by <a href="https://backbay.industries">Backbay Industries</a></sub>
</p>
