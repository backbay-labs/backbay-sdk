import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { HeroScene } from "./HeroScene";
import type { FieldConfig, PaletteMode } from "./types";

// -----------------------------------------------------------------------------
// Story Meta
// -----------------------------------------------------------------------------

const meta: Meta = {
  title: "Primitives/3D/Fields/HeroScenes/Cyber",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof meta>;

// -----------------------------------------------------------------------------
// 1. NeonRain
//    Glia-cyan rect lattice + cyberpunk-city preset.
//    The definitive cyberpunk scene — cyan circuit grid with heavy rain,
//    purple volumetric fog, hot magenta neon light bar, dark gradient sky.
//    Blade Runner vibes.
// -----------------------------------------------------------------------------

export const NeonRain: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "glia-cyan",
        latticeMode: "rect",
        baseVisibility: 0.22,
        microGrid1: 64,
        microGrid2: 210,
        microGridStrength: 0.8,
        microWarp: 0.01,
        iridescenceStrength: 0.15,
        iridescenceScale: 8,
        exposure: 0.92,
        filmic: 0.88,
        grainStrength: 0.035,
        crtStrength: 0.32,
        copperStrength: 0.18,
      }}
      environment={{ preset: "cyberpunk-city", intensity: 1 }}
      environmentIntensity={0.9}
      background="linear-gradient(to bottom, #0a001a, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 2. DigitalStorm
//    Orchid tri lattice + rave preset with scanner override.
//    Aggressive fractured purple lattice with fast sparks, scanning laser
//    sweep, and cosmic sky. Energetic and chaotic.
// -----------------------------------------------------------------------------

export const DigitalStorm: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "orchid",
        latticeMode: "tri",
        baseVisibility: 0.34,
        microGrid1: 72,
        microGrid2: 230,
        microGridStrength: 0.88,
        microWarp: 0.028,
        iridescenceStrength: 0.42,
        iridescenceScale: 16,
        exposure: 1.35,
        filmic: 0.82,
        grainStrength: 0.025,
        crtStrength: 0.28,
        copperStrength: 0.12,
      }}
      environment={{ preset: "rave", intensity: 1 }}
      customEnvironment={{
        light: { type: "scanner", color: "#ff00cc", intensity: 0.85 },
        weather: { type: "sparks", intensity: 0.9, color: "#cc44ff" },
      }}
      environmentIntensity={0.92}
      background="linear-gradient(to bottom, #08001a, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 3. MatrixSanctum
//    Mono rect lattice + matrix preset.
//    Green-on-black rectangular circuit grid with green rain, green scanner
//    sweep, and deep green gradient sky. Pure hacker aesthetic.
// -----------------------------------------------------------------------------

export const MatrixSanctum: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "mono",
        latticeMode: "rect",
        baseVisibility: 0.2,
        microGrid1: 60,
        microGrid2: 200,
        microGridStrength: 0.82,
        microWarp: 0.008,
        iridescenceStrength: 0,
        iridescenceScale: 1,
        exposure: 0.78,
        filmic: 0.92,
        grainStrength: 0.05,
        crtStrength: 0.55,
        copperStrength: 0.08,
      }}
      environment={{ preset: "matrix", intensity: 1 }}
      environmentIntensity={0.88}
      background="#000"
    />
  ),
};

// -----------------------------------------------------------------------------
// 3b. ClawdstrikeSanctum
//     MatrixSanctum recolored to Clawdstrike brand — prestige gold lattice
//     with amber rain, crimson scanner searchlight, dark gold gradient sky.
// -----------------------------------------------------------------------------

export const ClawdstrikeSanctum: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "amber",
        latticeMode: "rect",
        baseVisibility: 0.2,
        microGrid1: 60,
        microGrid2: 200,
        microGridStrength: 0.82,
        microWarp: 0.008,
        iridescenceStrength: 0,
        iridescenceScale: 1,
        exposure: 0.78,
        filmic: 0.92,
        grainStrength: 0.05,
        crtStrength: 0.55,
        copperStrength: 0.08,
      }}
      environment={{ preset: "matrix", intensity: 1 }}
      customEnvironment={{
        weather: { type: "rain", intensity: 0.9, color: "#c4a265" },
        light: { type: "scanner", intensity: 0.4, color: "#8b1a1a", source: { x: 0.5, y: 0 } },
        sky: { type: "gradient", intensity: 0.8, colors: ["#0a0800", "#1a1000", "#000800"] },
      }}
      environmentIntensity={0.88}
      background="#000"
    />
  ),
};

// -----------------------------------------------------------------------------
// 4. SynthwaveHorizon
//    Orchid hex lattice + synthwave preset with bloom override.
//    Purple honeycomb lattice with magenta sparks, soft bloom replacing
//    scanner, vivid pink-to-purple gradient sky. Retro-futuristic.
// -----------------------------------------------------------------------------

export const SynthwaveHorizon: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "orchid",
        latticeMode: "hex",
        baseVisibility: 0.32,
        microGrid1: 52,
        microGrid2: 160,
        microGridStrength: 0.84,
        microWarp: 0.014,
        iridescenceStrength: 0.72,
        iridescenceScale: 22,
        exposure: 1.28,
        filmic: 0.78,
        grainStrength: 0,
        crtStrength: 0.15,
        copperStrength: 0.1,
      }}
      environment={{ preset: "synthwave", intensity: 1 }}
      customEnvironment={{
        light: { type: "bloom", color: "#ff2896", intensity: 0.75 },
        fog: { type: "mist", color: "#1a0028", intensity: 0.5 },
      }}
      environmentIntensity={0.88}
      background="linear-gradient(to bottom, #0c0018, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 5. VoidTerminal
//    Gothic-void rect lattice + cyberpunk-city preset with neon overrides.
//    Blood-red void lattice grid under cyberpunk rain, red neon light
//    instead of magenta, dark stormy sky. Ominous tech noir.
// -----------------------------------------------------------------------------

export const VoidTerminal: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-void" as PaletteMode,
        latticeMode: "rect",
        baseVisibility: 0.14,
        microGrid1: 70,
        microGrid2: 240,
        microGridStrength: 0.86,
        microWarp: 0.02,
        iridescenceStrength: 0,
        iridescenceScale: 1,
        exposure: 0.72,
        filmic: 0.94,
        grainStrength: 0.055,
        crtStrength: 0.48,
        copperStrength: 0.3,
      }}
      environment={{ preset: "cyberpunk-city", intensity: 1 }}
      customEnvironment={{
        light: { type: "neon", color: "#ff2020", intensity: 0.8 },
        sky: { type: "storm", intensity: 0.7, colors: ["#080004", "#1a0008", "#2a0010"] },
      }}
      environmentIntensity={0.92}
      background="#000"
    />
  ),
};

// -----------------------------------------------------------------------------
// 6. LaserGrid
//    Glia-cyan tri lattice + rave preset.
//    Fractured cyan triangular lattice with sparks, red laser beam sweeping,
//    and cosmic sky. The most visually aggressive — a rave in a circuit board.
// -----------------------------------------------------------------------------

export const LaserGrid: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "glia-cyan",
        latticeMode: "tri",
        baseVisibility: 0.36,
        microGrid1: 74,
        microGrid2: 245,
        microGridStrength: 0.9,
        microWarp: 0.032,
        iridescenceStrength: 0.38,
        iridescenceScale: 14,
        exposure: 1.32,
        filmic: 0.8,
        grainStrength: 0.02,
        crtStrength: 0.34,
        copperStrength: 0.14,
      }}
      environment={{ preset: "rave", intensity: 1 }}
      environmentIntensity={0.95}
      background="linear-gradient(to bottom, #06001a, #000)"
    />
  ),
};
