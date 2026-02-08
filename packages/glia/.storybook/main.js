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
        },
      },
    };
  },
};

export default config;
