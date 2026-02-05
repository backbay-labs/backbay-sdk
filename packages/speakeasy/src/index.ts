/**
 * @backbay/speakeasy
 *
 * P2P encrypted messaging - identity, transport, and React hooks
 */

// Core - cryptographic identity and signing
export * from './core';

// Transport - libp2p networking
export * from './transport';

// React hooks (tree-shakeable, only included if react is available)
export * from './react';
