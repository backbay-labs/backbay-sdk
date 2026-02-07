import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'three/index': 'src/three/index.ts',
    'environment/index': 'src/environment/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react', 'react-dom', 'three',
    '@react-three/fiber', '@react-three/drei', 'three-stdlib',
    'framer-motion', 'styled-components',
    '@backbay/glia-agent', '@backbay/contract',
  ],
  tsconfig: 'tsconfig.json',
  target: 'es2022',
});
