import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'themes/index': 'src/themes/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'framer-motion', 'react-rnd', 'zustand'],
  tsconfig: 'tsconfig.json',
  target: 'es2022',
});
