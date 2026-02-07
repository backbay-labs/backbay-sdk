import { defineConfig } from 'tsup';

/**
 * @backbay/glia tsup build configuration
 *
 * 16 entry points matching package.json "exports" field.
 * CSS is handled separately via tailwindcss CLI (see build script).
 *
 * Tree-shaking verification:
 *   1. Create a test consumer that imports a single export path:
 *      ```ts
 *      import { GlassCheckbox } from '@backbay/glia/primitives';
 *      ```
 *   2. Bundle with esbuild --bundle --analyze:
 *      ```sh
 *      npx esbuild test-consumer.ts --bundle --format=esm --outfile=out.js --analyze
 *      ```
 *   3. Verify only the primitives chunk (and its deps) appear in the output,
 *      NOT the desktop, three, speakeasy, or other unrelated entry points.
 *   4. Alternatively, use `npx source-map-explorer dist/primitives/index.js`
 *      to visualize what is included in each chunk.
 */
export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'core': 'src/core.ts',
    'protocol/index': 'src/protocol/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'speakeasy/index': 'src/speakeasy/index.ts',
    'components/index': 'src/components/index.ts',
    'workspace/index': 'src/workspace/index.ts',
    'primitives/index': 'src/primitives/index.ts',
    'theme/index': 'src/theme/index.ts',
    'emotion/index': 'src/emotion/index.ts',
    'vision/index': 'src/vision/index.ts',
    'audio/index': 'src/audio/index.ts',
    'cognition/index': 'src/cognition/index.ts',
    'desktop/index': 'src/desktop/index.ts',
    'desktop/core/index': 'src/desktop/core/index.ts',
    'desktop/themes/index': 'src/desktop/themes/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  external: [
    // Peer dependencies
    'react',
    'react-dom',
    'react/jsx-runtime',
    // Optional dependencies -- all externalized so consumers provide them
    '@radix-ui/*',
    'framer-motion',
    'motion/react',
    'react-rnd',
    'react-resizable-panels',
    'lucide-react',
    'cmdk',
    'sonner',
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    'shiki',
    // Workspace dependencies
    '@backbay/contract',
  ],
});
