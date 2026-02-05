import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Resolve packages from root node_modules
const rootNodeModules = resolve(__dirname, "../../node_modules");

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@storybook/react",
      "@storybook/react-vite",
      "@storybook/builder-vite",
      "storybook",
    ],
    alias: {
      "@storybook/builder-vite": resolve(rootNodeModules, "@storybook/builder-vite"),
    },
  },
});
