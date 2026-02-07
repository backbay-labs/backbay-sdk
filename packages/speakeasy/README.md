# @backbay/speakeasy

> P2P encrypted messaging with Ed25519 identity and libp2p transport.

`@backbay/speakeasy` provides the full stack for decentralized chat: cryptographic identity generation and management, message signing and verification, sigil-based visual identity, and a libp2p Gossipsub transport layer. React hooks are included for easy integration.

## Installation

```bash
bun add @backbay/speakeasy
```

Optional peer dependency: `react >= 18.0.0` (only needed for the React hooks).

## Quick Start

```typescript
import { generateIdentity, createSignedMessage } from "@backbay/speakeasy";
import { createTransport } from "@backbay/speakeasy/transport";

// Generate an Ed25519 identity
const identity = await generateIdentity();
console.log(identity.sigil);       // e.g. "phoenix"
console.log(identity.publicKey);   // hex-encoded public key

// Sign a message
const signed = await createSignedMessage(identity, {
  type: "chat",
  content: "Hello, world!",
  room: "general",
});

// Create a libp2p transport node and publish
const transport = await createTransport({ identity });
await transport.publish("speakeasy/general", signed);
```

### React Hooks

```tsx
import { useIdentity, useTransport, useMessages } from "@backbay/speakeasy/react";

function Chat({ room }: { room: string }) {
  const { identity, create } = useIdentity();
  const { connected, publish } = useTransport({ identity });
  const { messages, send } = useMessages({ room });

  if (!identity) return <button onClick={create}>Create Identity</button>;

  return (
    <div>
      {messages.map((m) => <p key={m.id}>{m.content}</p>)}
      <button onClick={() => send("Hello!")}>Send</button>
    </div>
  );
}
```

## Entry Points

```typescript
import { ... } from "@backbay/speakeasy";           // Everything
import { ... } from "@backbay/speakeasy/core";       // Identity, signing, sigils
import { ... } from "@backbay/speakeasy/transport";   // libp2p networking
import { ... } from "@backbay/speakeasy/react";       // React hooks
```

## API Overview

### Core (`/core`)

| Export | Kind | Description |
|--------|------|-------------|
| `generateIdentity()` | function | Create a new Ed25519 keypair with sigil |
| `loadIdentity()` / `saveIdentity()` | function | Persist identity to storage |
| `recoverIdentity()` | function | Recover identity from mnemonic |
| `signMessage()` / `verifyMessage()` | function | Ed25519 message signing and verification |
| `createSignedMessage()` | function | Create a signed, timestamped message envelope |
| `deriveSigil()` | function | Derive a visual sigil from a public key |
| `computeFingerprint()` | function | SHA-256 fingerprint of a public key |
| `SIGILS` | const | All available sigil symbols |

### Transport (`/transport`)

| Export | Kind | Description |
|--------|------|-------------|
| `createTransport()` | function | Create a libp2p node with Gossipsub |
| `createEnvelope()` | function | Wrap a message in a transport envelope |
| `createSpeakeasyTopics()` | function | Generate topic strings for a room |
| `GLOBAL_TOPICS` | const | Well-known global pub/sub topics |

### React Hooks (`/react`)

| Export | Kind | Description |
|--------|------|-------------|
| `useIdentity()` | hook | Identity lifecycle (create, load, recover, delete) |
| `useTransport()` | hook | Connection state, publish, subscribe |
| `useMessages()` | hook | Room message history, send, typing indicators |

## Development

```bash
cd packages/speakeasy
bun run build       # tsc → dist/
bun run typecheck   # tsc --noEmit
bun test            # vitest
```

## License

MIT
