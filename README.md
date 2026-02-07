<p align="center">
  <img src=".github/assets/bb-sdk-hero.png" alt="Backbay SDK" width="100%" />
</p>

<p align="center">
  <samp>Build for the decentralized autonomous production marketplace. The factory floor is everywhere.</samp>
  <br /><em>Ex machina, industria</em>
</p>

<br />

<p align="center">
  <a href="#architecture"><kbd>Architecture</kbd></a>&nbsp;&nbsp;
  <a href="#packages"><kbd>Packages</kbd></a>&nbsp;&nbsp;
  <a href="#quick-start"><kbd>Quick Start</kbd></a>&nbsp;&nbsp;
  <a href="#development"><kbd>Development</kbd></a>&nbsp;&nbsp;
  <a href="#documentation"><kbd>Docs</kbd></a>
</p>

<br />

<p align="center">
  <sub>Built by <a href="https://backbay.industries">Backbay Industries</a></sub>
</p>

---

## Architecture

Backbay SDK is a multi-language monorepo (TypeScript, Python, Cairo) providing everything needed to build AI-agent-native applications: a component library with a desktop-OS shell, P2P encrypted messaging, attestation verification, an onchain world, and the orchestration layer that ties them together.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Applications                             │
│   (BackbayOS desktop shell, cluster apps, game clients)         │
└────────┬──────────┬──────────┬──────────┬──────────┬────────────┘
         │          │          │          │          │
┌────────▼───┐ ┌────▼────┐ ┌──▼───┐ ┌────▼────┐ ┌──▼──────────┐
│   glia     │ │speakeasy│ │notary│ │  cyntra  │ │ api-client  │
│ UI + Shell │ │ P2P msg │ │ Web3 │ │ Agents   │ │ HTTP client │
└────────┬───┘ └────┬────┘ └──┬───┘ └────┬────┘ └──┬──────────┘
         │          │         │          │          │
┌────────▼──────────▼─────────▼──────────▼──────────▼────────────┐
│                        contract                                 │
│              Shared TypeScript types & schemas                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   witness    │  │witness-react │  │  gameworld   │
│ WASM verify  │  │ React hooks  │  │ Cairo/Dojo   │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Packages

### TypeScript

| Package | Description |
|---------|-------------|
| [`@backbay/glia`](packages/glia/README.md) | UI primitives, desktop-OS shell, agent components, emotion system |
| [`@backbay/contract`](packages/contract/README.md) | Shared types, enums, and API contracts for all packages |
| [`@backbay/api-client`](packages/api-client/README.md) | Typed HTTP client for Backbay BFF services (Eden/Elysia) |
| [`@backbay/speakeasy`](packages/speakeasy/README.md) | P2P encrypted messaging with Ed25519 identity and libp2p transport |
| [`@backbay/notary`](packages/notary/README.md) | Web3 integration: IPFS uploads, EAS attestations, Starknet bridge |
| [`@backbay/witness`](packages/witness/README.md) | Browser-side attestation verification via WebAssembly |
| [`@backbay/witness-react`](packages/witness-react/README.md) | React hooks and components for witness verification |

### Python

| Package | Description |
|---------|-------------|
| [`cyntra`](packages/cyntra/README.md) | Agent orchestration framework (DSPy, LangGraph, memory, tools) |

### Cairo

| Package | Description |
|---------|-------------|
| [`cyntra_world`](packages/gameworld/README.md) | Onchain world state and systems on Starknet (Dojo ECS) |

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.x
- Node.js >= 20
- [UV](https://docs.astral.sh/uv/) (Python packages)
- [Dojo CLI](https://book.dojoengine.org/) (Cairo/Starknet work, optional)

### Install & Build

```bash
# Clone and install
git clone <repo-url>
cd backbay-sdk
bun install

# Build all TypeScript packages
bun run build

# Type-check
bun run typecheck

# Run tests
bun run test
```

### Use a package

```bash
bun add @backbay/speakeasy
```

```typescript
import { generateIdentity, useIdentity } from "@backbay/speakeasy";

// Generate a new cryptographic identity
const identity = await generateIdentity();

// Or use the React hook
const { identity, create, recover } = useIdentity();
```

### Python (cyntra)

```bash
uv sync --all-extras
uv run pytest
```

### Storybook (glia)

```bash
cd packages/glia
node scripts/storybook.mjs dev -p 6006
```

Opens at [http://localhost:6006](http://localhost:6006) with 85+ component stories.

---

## Development

```bash
bun run build          # Build all TS packages (ordered)
bun run typecheck      # Type-check all packages
bun run test           # Run vitest across workspace
bun run lint           # ESLint all packages
bun run format         # Prettier format
bun run clean          # Remove dist/ from all packages
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor guide.

---

## Documentation

- [Architecture Decision Records](docs/adr/)
- [Roadmap / RFCs](docs/roadmap/)

---

---

---

<br />

<p align="center">
  <img src=".github/assets/slogan.svg" alt="「 Memento, homo… 」" height="40" />
</p>

---

---

---
