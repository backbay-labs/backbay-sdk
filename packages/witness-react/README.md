# @backbay/witness-react

> React hooks and components for Backbay attestation verification.

`@backbay/witness-react` provides React bindings around [`@backbay/witness`](../witness/README.md). It handles WASM initialization, verification state management, and ready-made UI components for displaying verification results.

## Installation

```bash
bun add @backbay/witness-react
```

Peer dependencies: `react >= 18.0.0`, `@backbay/witness` (installed automatically).

## Quick Start

```tsx
import {
  VerificationProvider,
  VerificationBadge,
  useVerification,
} from "@backbay/witness-react";

// Wrap your app (initializes WASM once)
function App() {
  return (
    <VerificationProvider>
      <ReceiptViewer receipt={receipt} />
    </VerificationProvider>
  );
}

// Use the badge component for quick display
function ReceiptViewer({ receipt }) {
  return <VerificationBadge receipt={receipt} showDetails />;
}

// Or use the hook for full control
function CustomVerifier({ receipt, publicKeys }) {
  const { verify, result, isVerifying, error } = useVerification();

  return (
    <button onClick={() => verify(receipt, publicKeys)} disabled={isVerifying}>
      {isVerifying ? "Verifying..." : "Verify Receipt"}
    </button>
  );
}
```

## API Overview

### Hooks

| Export | Kind | Description |
|--------|------|-------------|
| `useVerification()` | hook | Verify signed receipts against public keys |
| `useChainVerification()` | hook | Verify attestation chains (Rekor, EAS, Solana) |
| `useVerificationContext()` | hook | Access shared verification state from provider |

### Components

| Export | Kind | Description |
|--------|------|-------------|
| `VerificationProvider` | component | Context provider, initializes WASM once |
| `VerificationBadge` | component | Compact pass/fail badge with optional details |
| `VerificationDetails` | component | Full verification breakdown (signatures, chains) |

### Hook Details

#### `useVerification()`

```typescript
const {
  isInitializing,  // WASM loading
  isInitialized,   // WASM ready
  isVerifying,     // Verification in progress
  result,          // VerificationResult | null
  error,           // Error | null
  verify,          // (receipt, publicKeys) => Promise<VerificationResult>
  reset,           // () => void
} = useVerification();
```

#### `useChainVerification()`

```typescript
const {
  isVerifying,
  chain,           // AttestationChain | null
  error,
  verifyChain,     // (receipt, options?) => Promise<AttestationChain>
  reset,
} = useChainVerification();

// Verify across Rekor, EAS (Base), and Solana
await verifyChain(receipt, {
  rekor: true,
  eas: { chainId: 8453 },
  solana: { cluster: "mainnet-beta" },
});
```

## Development

```bash
cd packages/witness-react
bun run build       # tsc → dist/
bun run typecheck   # tsc --noEmit
bun test            # vitest
```

## License

MIT
