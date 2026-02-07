import "../src/styles/globals.css";
import * as React from "react";
import type { Preview } from "@storybook/react";
import { UiThemeProvider } from "../src/theme";

// R3F extend for THREE primitives - ensures Canvas works properly
import * as THREE from "three";
import { extend } from "@react-three/fiber";
extend(THREE);

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          "Introduction",
          "Docs",
          [
            "Getting Started",
            "Theme System",
            "Desktop OS",
            "Architecture",
            "Speakeasy Auth",
          ],
          "Components",
          "Workspace",
          "Primitives",
          [
            "Atoms",
            "Molecules",
            "Organisms",
            "Ambient",
            "Environment",
            "3D",
            ["Workspace", "Agent", "DataViz", "Fields", "Security"],
          ],
          "Systems",
          ["Emotion"],
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0a0a0f" },
        { name: "void", value: "#050508" },
        { name: "cathedral", value: "#0d0d12" },
        { name: "light", value: "#fafafa" },
      ],
    },
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <UiThemeProvider>
        <Story />
      </UiThemeProvider>
    ),
  ],
};

export default preview;
