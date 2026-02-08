import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootNodeModules = resolve(__dirname, "../../../node_modules");

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "./addons/aesthetic-grade/manager",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: [
    "../public",
    { from: "../.visual-review/grades", to: "/grades" },
  ],
  viteFinal: async (config) => {
    return {
      ...config,
      define: {
        ...config.define,
        "process.env": {},
      },
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          // @storybook/blocks was removed in Storybook 10; MDX docs import
          // Meta/Canvas/etc. from there — redirect to addon-docs/blocks.
          "@storybook/blocks": "@storybook/addon-docs/blocks",
          // Deduplicate R3F: both packages/glia/node_modules and root
          // node_modules have copies — force single copy so Canvas context
          // is shared between hooks and the <Canvas> provider.
          "@react-three/fiber": resolve(rootNodeModules, "@react-three/fiber"),
          "@react-three/drei": resolve(rootNodeModules, "@react-three/drei"),
          "three": resolve(rootNodeModules, "three"),
        },
        // Ensure Vite doesn't create separate bundles for duplicate packages
        dedupe: [
          ...(config.resolve?.dedupe || []),
          "three",
          "@react-three/fiber",
          "@react-three/drei",
          "react",
          "react-dom",
        ],
      },
    };
  },
};

export default config;
