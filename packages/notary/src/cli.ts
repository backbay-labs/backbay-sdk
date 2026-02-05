#!/usr/bin/env bun
/**
 * Notary CLI
 *
 * Commands:
 *   notary              Start the server
 *   notary setup        Configure web3.storage credentials
 *   notary status       Check service status
 */

import { parseArgs } from "node:util";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { startServer } from "./server.js";
import { getConfig, VERSION } from "./lib/config.js";
import { isConfigured as isIpfsConfigured } from "./lib/ipfs.js";
import { isConfigured as isEasConfigured } from "./lib/eas.js";

const CONFIG_DIR = join(homedir(), ".config", "notary");

async function main() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      port: { type: "string", short: "p" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
    allowPositionals: true,
  });

  if (values.version) {
    console.log(`notary v${VERSION}`);
    process.exit(0);
  }

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const command = positionals[0] || "start";

  switch (command) {
    case "start":
      await cmdStart(values.port ? parseInt(values.port, 10) : undefined);
      break;

    case "setup":
      await cmdSetup();
      break;

    case "status":
      await cmdStatus();
      break;

    case "help":
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
notary - Web3 Integration Layer for Cyntra

USAGE:
  notary [command] [options]

COMMANDS:
  start             Start the notary server (default)
  setup             Configure web3.storage and EAS credentials
  status            Check configuration and connectivity status
  help              Show this help message

OPTIONS:
  -p, --port <port>  Server port (default: 7331)
  -v, --version      Show version
  -h, --help         Show help

ENVIRONMENT VARIABLES:
  NOTARY_PORT              Server port
  NOTARY_CHAIN             Chain to use (base-sepolia, base, optimism)
  NOTARY_SCHEMA_UID        EAS schema UID for attestations (RunReceipt v2)
  NOTARY_PRIVATE_KEY       Private key for signing (0x prefixed)
  NOTARY_W3UP_SPACE_DID    w3up space DID
  NOTARY_IPFS_GATEWAY      IPFS gateway URL template

EXAMPLES:
  notary                   Start server on default port
  notary --port 8080       Start server on port 8080
  notary setup             Interactive setup wizard
  notary status            Check current configuration
`);
}

async function cmdStart(port?: number) {
  await startServer(port);
}

async function cmdSetup() {
  console.log("\n🔧 Notary Setup\n");

  // Ensure config directory exists
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
    console.log(`Created config directory: ${CONFIG_DIR}`);
  }

  console.log("This setup wizard will help you configure notary for web3.storage and EAS.\n");

  // Check current status
  console.log("Current Configuration:");
  console.log(`  IPFS (w3up):  ${isIpfsConfigured() ? "✓ Configured" : "✗ Not configured"}`);
  console.log(`  EAS:          ${isEasConfigured() ? "✓ Configured" : "✗ Not configured"}`);
  console.log();

  // Interactive IPFS setup
  if (!isIpfsConfigured()) {
    console.log("─────────────────────────────────────────");
    console.log("IPFS Setup (web3.storage)");
    console.log("─────────────────────────────────────────\n");
    console.log("Options:");
    console.log("  1. Set NOTARY_W3UP_SPACE_DID environment variable (recommended)");
    console.log("     - Visit https://console.web3.storage");
    console.log("     - Create or select a space");
    console.log("     - Copy the space DID (starts with did:key:)");
    console.log("     - Add to your shell: export NOTARY_W3UP_SPACE_DID=\"did:key:...\"");
    console.log();
    console.log("  2. Or use the w3up CLI:");
    console.log("     npx @web3-storage/w3cli login <email>");
    console.log("     npx @web3-storage/w3cli space create <name>");
    console.log("     # Then set the space DID in your environment");
    console.log();
  }

  // EAS setup instructions
  if (!isEasConfigured()) {
    console.log("─────────────────────────────────────────");
    console.log("EAS Setup (Attestations)");
    console.log("─────────────────────────────────────────\n");
    console.log("1. Get testnet ETH:");
    console.log("   - Base Sepolia faucet: https://www.coinbase.com/faucets/base-sepolia-faucet");
    console.log();
    console.log("2. Register the schema (one-time):");
    console.log("   NOTARY_PRIVATE_KEY=0x... bun run scripts/register-schemas.ts");
    console.log("   (Use the latest schema to include receiptHash)");
    console.log();
    console.log("3. Set environment variables:");
    console.log('   export NOTARY_CHAIN="base-sepolia"');
    console.log('   export NOTARY_SCHEMA_UID="0x..."  # from step 2');
    console.log('   export NOTARY_PRIVATE_KEY="0x..."');
    console.log();
  }

  // Create placeholder config file
  const configPath = join(CONFIG_DIR, "config.json");
  if (!existsSync(configPath)) {
    const defaultConfig = {
      chain: "base-sepolia",
      port: 7331,
      note: "Most configuration is done via environment variables. See 'notary help' for details.",
    };
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`Created default config: ${configPath}`);
  }

  console.log("─────────────────────────────────────────");
  console.log("Environment Variables Summary");
  console.log("─────────────────────────────────────────\n");
  console.log("Add to your ~/.zshrc or ~/.bashrc:\n");
  console.log('export NOTARY_CHAIN="base-sepolia"');
  console.log('export NOTARY_SCHEMA_UID="0x..."');
  console.log('export NOTARY_PRIVATE_KEY="0x..."');
  console.log('export NOTARY_W3UP_SPACE_DID="did:key:..."');
  console.log();
  console.log("Run 'notary status' to verify your configuration.");
}

async function cmdStatus() {
  const config = getConfig();

  console.log("\n📊 Notary Status\n");
  console.log("Server:");
  console.log(`  Version:     ${VERSION}`);
  console.log(`  Port:        ${config.port}`);
  console.log();

  console.log("Chain:");
  console.log(`  Name:        ${config.chainConfig.name}`);
  console.log(`  Chain ID:    ${config.chainConfig.chainId}`);
  console.log(`  RPC:         ${config.chainConfig.rpcUrl}`);
  console.log(`  EAS:         ${config.chainConfig.easContractAddress}`);
  console.log(`  Explorer:    ${config.chainConfig.explorerUrl}`);
  console.log();

  console.log("Configuration:");
  console.log(`  IPFS (w3up): ${isIpfsConfigured() ? "✓ Configured" : "✗ Not configured"}`);
  console.log(`  EAS Schema:  ${config.schemaUid ? "✓ " + config.schemaUid.slice(0, 18) + "..." : "✗ Not set"}`);
  console.log(`  Signing Key: ${process.env.NOTARY_PRIVATE_KEY ? "✓ Set" : "✗ Not set"}`);
  console.log(`  Space DID:   ${config.w3upSpaceDid ? "✓ " + config.w3upSpaceDid.slice(0, 20) + "..." : "✗ Not set"}`);
  console.log();

  // Check if server is running
  try {
    const response = await fetch(`http://localhost:${config.port}/`);
    const data = (await response.json()) as { uptime: number };
    console.log("Server Status:");
    console.log(`  Running:     ✓ (uptime: ${data.uptime}s)`);
  } catch {
    console.log("Server Status:");
    console.log("  Running:     ✗ Not running");
  }
  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
