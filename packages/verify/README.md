# @cyntra/verify

Browser-side verification of Cyntra attestations using WebAssembly.

## Features

- **Ed25519 signature verification** - Verify kernel, verifier, and provider signatures
- **Merkle proof verification** - Validate event inclusion proofs
- **SHA-256 and Keccak-256 hashing** - Compute hashes for receipt verification
- **Chain fetchers** - Fetch attestations from Rekor, EAS, and Solana
- **<200KB gzipped** - Lightweight WASM bundle

## Installation

```bash
npm install @cyntra/verify
# or
bun add @cyntra/verify
```

## Usage

```typescript
import {
  initWasm,
  verifyReceipt,
  fetchAndVerifyChain,
  sha256,
  verifyMerkleProof,
} from '@cyntra/verify';

// Initialize WASM (call once at startup)
await initWasm();

// Verify a signed receipt
const result = verifyReceipt(signedReceipt, {
  kernel: '0xabc123...',
  verifier: '0xdef456...',
});

if (result.valid) {
  console.log('All signatures valid!');
} else {
  console.error('Verification failed:', result.errors);
}

// Verify complete attestation chain
const chain = await fetchAndVerifyChain(receiptId, {
  rekor: true,
  eas: { chainId: 8453 }, // Base
  solana: { cluster: 'mainnet-beta' },
});

console.log('Rekor:', chain.rekor?.verified);
console.log('EAS:', chain.eas?.verified);
console.log('Solana:', chain.solana?.verified);
```

## API

### Core Functions

#### `initWasm(): Promise<void>`

Initialize the WASM module. Must be called before any verification.

#### `verifyReceipt(receipt, publicKeys): VerificationResult`

Verify a signed RunReceipt against public keys.

#### `verifyMerkleProof(leafHash, proof, root): boolean`

Verify a Merkle inclusion proof.

#### `sha256(data: Uint8Array): string`

Compute SHA-256 hash.

#### `keccak256(data: Uint8Array): string`

Compute Keccak-256 hash (Ethereum-compatible).

#### `verifySignature(publicKey, message, signature): boolean`

Verify an Ed25519 signature.

### Chain Verification

#### `fetchAndVerifyChain(receiptId, options): Promise<AttestationChain>`

Fetch and verify attestations from multiple sources:
- **Rekor** - Sigstore transparency log
- **EAS** - Ethereum Attestation Service
- **Solana** - Aegis Registry

## Configuration

All chain verifiers support custom configuration for endpoints, program IDs, and RPC URLs. This allows using private infrastructure without forking the code.

### Simple Configuration

```typescript
const chain = await fetchAndVerifyChain(receiptHash, {
  rekor: true,
  eas: { chainId: 8453 },           // Base
  solana: { cluster: 'devnet' },
});
```

### Advanced Configuration

```typescript
const chain = await fetchAndVerifyChain(receiptHash, {
  rekor: true,
  eas: {
    chainId: 8453,
    graphqlUrl: 'https://my-graphql.example.com',  // Custom GraphQL
    rpcUrl: 'https://my-rpc.example.com',          // Custom RPC
  },
  solana: {
    cluster: 'mainnet-beta',
    rpcUrl: 'https://my-solana-rpc.example.com',   // Custom RPC
    programIds: {
      registryProgramId: 'MyProgramId...',         // Custom program
    },
    commitment: 'finalized',                        // Commitment level
  },
});
```

### Solana Configuration

The Solana fetcher supports these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cluster` | `'mainnet-beta' \| 'devnet' \| 'testnet'` | Required | Solana cluster |
| `rpcUrl` | `string` | Public cluster endpoint | Custom RPC endpoint |
| `programIds.registryProgramId` | `string` | From `infra/solana/program_ids.json` | Aegis Registry program ID |
| `programIds.feeMarketProgramId` | `string` | None | Aegis Fee Market program ID |
| `commitment` | `'processed' \| 'confirmed' \| 'finalized'` | `'confirmed'` | Connection commitment |

**Direct Solana fetcher usage:**

```typescript
import { fetchFromSolana, SolanaConfig } from '@cyntra/verify/fetchers/solana';

const config: SolanaConfig = {
  cluster: 'devnet',
  rpcUrl: 'https://my-rpc.example.com',
  programIds: {
    registryProgramId: '5612LDBwkX4voFX4PP3mwHnrVigveTEXDxH7tAaxN5P8',
  },
};

const result = await fetchFromSolana(receiptHash, config);
```

**Default program IDs** are sourced from `infra/solana/program_ids.json`:

| Cluster | Registry Program ID |
|---------|---------------------|
| devnet | `5612LDBwkX4voFX4PP3mwHnrVigveTEXDxH7tAaxN5P8` |
| mainnet-beta | Not deployed |
| testnet | Not deployed |

### EAS Configuration

The EAS fetcher supports these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chainId` | `number` | Required | EVM chain ID |
| `graphqlUrl` | `string` | Public EASScan endpoint | Custom GraphQL endpoint |
| `rpcUrl` | `string` | Public RPC | Custom RPC for tx lookups |

**Supported chains:**

| Chain | ID | Default GraphQL Endpoint |
|-------|-----|-------------------------|
| Ethereum | 1 | `https://easscan.org/graphql` |
| Optimism | 10 | `https://optimism.easscan.org/graphql` |
| Arbitrum | 42161 | `https://arbitrum.easscan.org/graphql` |
| Base | 8453 | `https://base.easscan.org/graphql` |

**Direct EAS fetcher usage:**

```typescript
import { fetchFromEAS, EASConfig } from '@cyntra/verify/fetchers/eas';

const config: EASConfig = {
  chainId: 8453,
  graphqlUrl: 'https://my-graphql.example.com',
  rpcUrl: 'https://my-rpc.example.com',
};

const result = await fetchFromEAS(receiptHash, config);
```

### Helper Functions

The Solana module exports helper functions for offline use:

```typescript
import {
  deriveReceiptPDA,
  deriveConfigPDA,
  parseReceiptAccount,
  parseRegistryConfig,
  receiptHashToBytes,
  normalizeReceiptHash,
} from '@cyntra/verify/fetchers/solana';

// Derive PDA without network calls
const [receiptPda, bump] = deriveReceiptPDA(
  '0xabcd...',
  '5612LDBwkX4voFX4PP3mwHnrVigveTEXDxH7tAaxN5P8'
);

// Parse account data from raw bytes
const receiptData = parseReceiptAccount(rawAccountBytes);
console.log(receiptData.status); // 'verified' | 'pending' | 'quarantined'
```

## Testing

Run the test suite:

```bash
cd packages/verify
bun install
bun test
```

Tests are fully offline - they use fixture bytes to verify parsing logic without making network calls.

## Building from Source

```bash
# Build WASM
./scripts/build-wasm.sh

# Or manually:
cd crates/cyntra-trust-wasm
wasm-pack build --target web --release
```

## License

MIT
