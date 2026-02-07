# @backbay/api-client

> Typed HTTP client for Backbay BFF services.

`@backbay/api-client` wraps the Backbay backend-for-frontend (BFF) API using [Eden](https://elysiajs.com/eden/overview) (the Elysia type-safe client). It provides a structured, namespaced API surface with automatic auth header resolution.

## Installation

```bash
bun add @backbay/api-client
```

Peer dependency: `elysia >= 1.0.0` (optional -- only needed if you share server types).

## Quick Start

```typescript
import { createServerApi } from "@backbay/api-client";

const api = createServerApi({
  baseUrl: "https://api.backbay.industries",
  getToken: () => localStorage.getItem("token"),
});

// System health
const health = await api.system.health();

// Current user
const me = await api.me.get();

// List marketplace offers
const offers = await api.market.offers.list({ type: "builder" });

// Create a task
const task = await api.market.tasks.create({
  offer_id: "offer-123",
  manifest_hash: "0xabc...",
  policy_hash: "0xdef...",
  deadline_ts: Date.now() + 86400000,
  escrow_amount: 100,
});
```

## API Overview

| Namespace | Methods | Description |
|-----------|---------|-------------|
| `system` | `health()`, `ready()` | Health checks and readiness |
| `me` | `get()` | Current user identity |
| `live` | `list()` | Real-time platform events |
| `nodes` | `list()` | Network nodes |
| `ops.jobs` | `list()`, `get(id)` | Job management |
| `ops` | `stats()` | Throughput, cost, pass rate |
| `verify.receipts` | `list()`, `get(id)` | Verification receipts |
| `verify.disputes` | `list()` | Active disputes |
| `market.offers` | `list()`, `create()`, `get(id)` | Marketplace offers |
| `market.tasks` | `create()`, `get(id)`, `claim()`, `complete()` | Task lifecycle |
| `market.verifier.tasks` | `list()`, `attest()` | Verifier attestation workflow |
| `market.incidents` | `create()`, `get(id)`, `verify()` | Security incident reporting |

## Configuration

```typescript
createServerApi({
  // Required: BFF URL (or set BACKBAY_BFF_URL / NEXT_PUBLIC_BACKBAY_BFF_URL env var)
  baseUrl: "https://api.backbay.industries",

  // Optional: async or sync token resolver for Authorization header
  getToken: () => localStorage.getItem("token"),

  // Optional: cookie resolver for SSR/server contexts
  getCookies: () => cookieString,
});
```

## Development

```bash
cd packages/api-client
bun run build       # tsc → dist/
bun run typecheck   # tsc --noEmit
bun test            # vitest
```

## License

MIT
