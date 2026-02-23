<p align="center">
  <img src=".github/assets/bb-sdk-hero.png" alt="Backbay SDK" width="100%" />
</p>

<p align="center">
  <samp>Build for the decentralized autonomous production marketplace. The factory floor is everywhere.</samp>
  <br /><em>Ex machina, industria</em>
</p>

<br />

<p align="center">
  <a href="#packages"><kbd>Packages</kbd></a>&nbsp;&nbsp;
  <a href="#quick-start"><kbd>Quick Start</kbd></a>&nbsp;&nbsp;
  <a href="#development"><kbd>Development</kbd></a>&nbsp;&nbsp;
  <a href="#documentation"><kbd>Docs</kbd></a>
</p>

<br />

<p align="center">
  <sub>Built by <a href="https://backbay.io">Backbay Industries</a></sub>
</p>

---

## Packages

### TypeScript

| Package | Description |
|---------|-------------|
| [`@backbay/glia`](packages/glia) | Umbrella — re-exports all sub-packages for convenience |
| [`@backbay/glia-three`](packages/glia-three) | 3D components, environment layers (weather, fog, volumetric light) |
| [`@backbay/glia-agent`](packages/glia-agent) | Emotion engine, cognition modes, audio/speech hooks |
| [`@backbay/glia-desktop`](packages/glia-desktop) | Desktop-OS shell: window manager, taskbar, start menu, file browser |
| [`@backbay/raymond`](packages/raymond) | CPU ray tracer (zero deps) |
| [`@backbay/contract`](packages/contract) | Shared TypeScript types, enums, and API schemas |
| [`@backbay/api-client`](packages/api-client) | Typed HTTP client for Backbay BFF services (Eden/Elysia) |
| [`@backbay/speakeasy`](packages/speakeasy) | P2P encrypted messaging with PBKDF2 identity and domain binding |
| [`@backbay/notary`](packages/notary) | Web3 integration: IPFS, EAS attestations, Herodotus cross-chain proofs |
| [`@backbay/witness`](packages/witness) | Browser-side attestation verification via WebAssembly |
| [`@backbay/witness-react`](packages/witness-react) | React hooks and components for witness verification |
| [`@backbay/npctv`](packages/npc-tv) | OpenClaw plugin — turn any agent into a live NPC.tv streamer |
| [`@backbay/npctv-relay`](packages/npctv-relay) | Real-time relay — event fanout, chat, and presence for agent streams |

### Python

| Package | Description |
|---------|-------------|
| [`cyntra`](packages/cyntra) | Agent orchestration framework (DSPy, LangGraph, memory, tools) |

### Cairo

| Package | Description |
|---------|-------------|
| [`cyntra_world`](packages/gameworld) | Onchain world state and systems on Starknet (Dojo ECS) |

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

<p align="center">
  <img src=".github/assets/slogan.svg" alt="「 Memento, homo… 」" height="40" />
</p>
