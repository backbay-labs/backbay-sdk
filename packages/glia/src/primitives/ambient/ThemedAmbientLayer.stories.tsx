import type { Meta, StoryObj } from "@storybook/react";
import { ThemedAmbientLayer } from "./ThemedAmbientLayer";
import { UiThemeProvider, useUiTheme } from "../../theme";
import * as React from "react";

const meta: Meta<typeof ThemedAmbientLayer> = {
  title: "Primitives/Ambient/ThemedAmbientLayer",
  component: ThemedAmbientLayer,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "void" },
  },
  tags: ["autodocs"],
  argTypes: {
    forceType: {
      control: "select",
      options: [undefined, "nebula-stars", "dust-motes"],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThemedAmbientLayer>;

// Helper component that shows theme info
function ThemeInfo() {
  const { themeId, setThemeId } = useUiTheme();
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-4 items-center p-4 rounded-xl bg-card/80 backdrop-blur-lg border border-border/50">
      <span className="text-sm text-muted-foreground">Current theme:</span>
      <div className="flex gap-2">
        <button
          onClick={() => setThemeId("nebula")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            themeId === "nebula"
              ? "bg-cyan-neon text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Nebula
        </button>
        <button
          onClick={() => setThemeId("solarpunk")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            themeId === "solarpunk"
              ? "bg-emerald-neon text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Solarpunk
        </button>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: (args) => (
    <UiThemeProvider defaultThemeId="nebula">
      <div className="relative w-full h-screen bg-background">
        <ThemedAmbientLayer {...args} />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-4 p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <h1 className="text-4xl font-bold text-foreground">Themed Ambient Layer</h1>
            <p className="text-muted-foreground max-w-md">
              Automatically switches between nebula stars and dust motes based on the active theme.
            </p>
          </div>
        </div>
        <ThemeInfo />
      </div>
    </UiThemeProvider>
  ),
};

export const NebulaTheme: Story = {
  render: (args) => (
    <UiThemeProvider defaultThemeId="nebula">
      <div className="relative w-full h-screen bg-[#02040a]">
        <ThemedAmbientLayer {...args} />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Nebula Theme</h1>
            <p className="text-cyan-neon">Twinkling stars with neon accents</p>
          </div>
        </div>
      </div>
    </UiThemeProvider>
  ),
};

export const SolarpunkTheme: Story = {
  render: (args) => (
    <UiThemeProvider defaultThemeId="solarpunk">
      <div className="relative w-full h-screen bg-[#0a0f14]">
        <ThemedAmbientLayer {...args} />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Solarpunk Theme</h1>
            <p className="text-emerald-neon">Floating dust motes in warm sunlight</p>
          </div>
        </div>
      </div>
    </UiThemeProvider>
  ),
};

export const ForceNebulaStars: Story = {
  render: (args) => (
    <UiThemeProvider defaultThemeId="solarpunk">
      <div className="relative w-full h-screen bg-[#02040a]">
        <ThemedAmbientLayer {...args} forceType="nebula-stars" />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-4 p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
            <h1 className="text-2xl font-bold text-foreground">Force: Nebula Stars</h1>
            <p className="text-sm text-muted-foreground">
              Solarpunk theme active, but forced to show nebula stars
            </p>
          </div>
        </div>
      </div>
    </UiThemeProvider>
  ),
};

export const ForceDustMotes: Story = {
  render: (args) => (
    <UiThemeProvider defaultThemeId="nebula">
      <div className="relative w-full h-screen bg-[#0a0f14]">
        <ThemedAmbientLayer {...args} forceType="dust-motes" />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-4 p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
            <h1 className="text-2xl font-bold text-foreground">Force: Dust Motes</h1>
            <p className="text-sm text-muted-foreground">
              Nebula theme active, but forced to show dust motes
            </p>
          </div>
        </div>
      </div>
    </UiThemeProvider>
  ),
};

export const InteractiveThemeSwitcher: Story = {
  render: () => (
    <UiThemeProvider defaultThemeId="nebula">
      <div className="relative w-full h-screen bg-background transition-colors duration-500">
        <ThemedAmbientLayer />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-6 p-8 rounded-2xl bg-card/50 backdrop-blur-lg border border-border/50 max-w-lg">
            <h1 className="text-3xl font-bold text-foreground">Theme-Aware Ambience</h1>
            <p className="text-muted-foreground">
              Click the buttons below to switch themes. The ambient background automatically
              transitions between twinkling nebula stars and floating dust motes.
            </p>
            <div className="flex gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-neon" />
                <span className="text-muted-foreground">Nebula = Stars</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-neon" />
                <span className="text-muted-foreground">Solarpunk = Motes</span>
              </div>
            </div>
          </div>
        </div>
        <ThemeInfo />
      </div>
    </UiThemeProvider>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <UiThemeProvider defaultThemeId="nebula">
      <div className="relative w-full h-screen bg-background">
        <ThemedAmbientLayer {...args} disabled />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-4 p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
            <h1 className="text-2xl font-bold text-foreground">Disabled State</h1>
            <p className="text-sm text-muted-foreground">
              No ambient effects rendered when disabled
            </p>
          </div>
        </div>
      </div>
    </UiThemeProvider>
  ),
};
