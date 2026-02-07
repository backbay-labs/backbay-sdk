# @backbay/contract

> Shared TypeScript types and API contracts for the Backbay platform.

`@backbay/contract` is the foundational type package that every other TypeScript package in the SDK depends on. It defines entity types, API request/response shapes, event schemas, and UI visualization contracts -- with zero runtime dependencies.

## Installation

```bash
bun add @backbay/contract
```

## Quick Start

```typescript
import type { Job, Node, Receipt, TrustTier } from "@backbay/contract";

function renderJob(job: Job) {
  console.log(`${job.type} job [${job.status}] — ${job.progress}%`);
}
```

## API Overview

### Modules

| Module | Description |
|--------|-------------|
| `common` | `SuccessResponse<T>`, `PaginatedResponse<T>` wrappers |
| `system` | `HealthResponse`, `ReadyResponse`, `MeResponse`, `IdentityKind` |
| `entities` | Core domain types: `Node`, `Job`, `Receipt`, `Listing`, `Realm`, etc. |
| `events` | `LiveEvent`, `EventCategory`, `EventSeverity`, `generateEventId()` |
| `marketplace` | `Offer`, `Task`, `Attestation`, `Incident`, encryption envelopes |
| `agent` | `AgentSession`, `AgentMessage`, `AgentCall`, `AgentRecommendation` |
| `ui` | Ambient field, spatial workspace, agent console, entity visual mappings |

### Key Types

| Export | Kind | Description |
|--------|------|-------------|
| `TrustTier` | type | `"bronze" \| "silver" \| "gold"` |
| `Job` | interface | Compute job with steps, gate status, receipt link |
| `Node` | interface | Network node (operator, fab, verifier, relay) |
| `Receipt` | interface | Verification receipt with hashes, policies, anchors |
| `Offer` | interface | Marketplace offer (builder, verifier, responder) |
| `Task` | interface | Marketplace task with escrow and deadline |
| `AgentSession` | interface | Agent conversation session |
| `AgentMessage` | interface | Message with optional tool calls |
| `LiveEvent` | interface | Real-time platform event |
| `JOB_STATUS_VISUALS` | const | Job status to 3D visual mapping |
| `BACKBAY_COLORS` | const | Platform color palette |

### Enums (Union Types)

```typescript
type JobStatus = "queued" | "running" | "completed" | "blocked" | "quarantine";
type NodeType = "operator" | "fab" | "verifier" | "relay";
type ReceiptStatus = "pending" | "passed" | "failed";
type SessionIntent = "GENERAL" | "JOB_MANAGEMENT" | "RECEIPT_VERIFICATION" | ...;
type MessageRole = "user" | "assistant" | "system";
```

## Development

```bash
cd packages/contract
bun run build       # tsc → dist/
bun run typecheck   # tsc --noEmit
bun test            # vitest
```

## License

MIT
