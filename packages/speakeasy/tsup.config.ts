import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    core: 'src/core/index.ts',
    transport: 'src/transport/index.ts',
    react: 'src/react/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@noble/ed25519', '@noble/hashes', 'libp2p'],
});
