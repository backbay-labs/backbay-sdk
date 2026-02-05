# Notary (`@backbay/notary`)

Notary is the repo's **Web3 integration layer** for publishing and verifying "receipts":

- **IPFS uploads** (w3up / web3.storage)
- **EAS attestations** (Base / Base Sepolia)
- **Starknet wallet/session bridge** (Cartridge Controller) + signature verification

It's the bridge between "offchain proof bundles" and "onchain pointers".

## How it fits (Backbay / Cyntra)

- **Kernel → Notary (publish):** `kernel/src/cyntra/trust/notary/client.py` calls Notary to upload artifacts and mint an EAS attestation.
- **Starknet registry consumes attestations:** `packages/bb-dojo/` stores the attestation UID and can verify its existence via Herodotus proofs.
- **Clients verify receipts:** `packages/verify/` fetches and verifies attestations (Rekor/EAS/Solana) in-browser.

## Run locally

```bash
cd packages/notary

# Dev (hot)
bun run dev

# CLI (after build)
bun run build
notary --help
notary start
```

Default server: `http://localhost:7331`.

## Configuration

Notary is configured via environment variables (see `packages/notary/src/lib/config.ts`):

- `NOTARY_PORT` (default `7331`)
- `NOTARY_CHAIN` (default `base-sepolia`)
- `NOTARY_SCHEMA_UID` (EAS schema UID)
- `NOTARY_PRIVATE_KEY` (EVM key for signing transactions)
- `NOTARY_W3UP_SPACE_DID` (web3.storage space DID)
- `NOTARY_IPFS_GATEWAY` (default `https://w3s.link/ipfs/{cid}`)

Run `notary setup` / `notary status` for guided setup and sanity checks.

## HTTP Surface (high level)

- **Publish:** upload artifacts + attest receipt: `POST /publish`
- **IPFS:** `POST /upload`
- **EAS:** `POST /attest`, `GET /verify/:uid`
- **Auth:** `POST /auth/nonce`, `POST /auth/verify`
- **Identity:** `POST /identity/nonce`, `POST /identity/verify-siwe`, `GET /identity/session/:token`, `POST /identity/link`
- **Starknet:** `POST /starknet/nonce`, `POST /starknet/verify`
- **Controller:** `POST /controller/connect`, `POST /controller/execute`, `GET /controller/session/:id`

Additional experimental routes exist under `packages/notary/src/routes/` (ENS, Tableland, Lit, Bacalhau).
