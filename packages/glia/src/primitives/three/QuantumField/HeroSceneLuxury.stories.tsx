import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { HeroScene } from "./HeroScene";
import type { FieldConfig, PaletteMode } from "./types";

// -----------------------------------------------------------------------------
// Story Meta
// -----------------------------------------------------------------------------

const meta: Meta = {
  title: "Primitives/3D/Fields/HeroScenes/Luxury",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof meta>;

// -----------------------------------------------------------------------------
// 1. BlackDiamond
//    Amber rect + noir base with barely-there dust motes and a single spotlight.
//    The most premium preset -- sparse gold rectangular grid on pure black,
//    depth fog, maximum lattice visibility, zero noise. Like a luxury watch ad.
// -----------------------------------------------------------------------------

export const BlackDiamond: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "amber",
        latticeMode: "rect",
        baseVisibility: 0.80,
        microGrid1: 28,
        microGrid2: 180,
        microGridStrength: 0.95,
        microWarp: 0.012,
        iridescenceStrength: 0,
        iridescenceScale: 10,
        exposure: 1.8,
        filmic: 0.92,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0,
      }}
      environment={{ preset: "noir", intensity: 1 }}
      customEnvironment={{
        weather: { type: "dust", intensity: 0.15, color: "#c8a84e" },
        fog: { type: "depth", color: "#000000", intensity: 0.3 },
        light: { type: "spotlight", color: "#ffe8b0", intensity: 0.35 },
      }}
      environmentIntensity={0.4}
      background="#000"
    />
  ),
};

// -----------------------------------------------------------------------------
// 2. GoldenHour
//    Amber hex + zen-garden base with warm bloom and the faintest sakura.
//    Warm gold honeycomb barely visible through a golden bloom haze. Sunset
//    warmth without the drama -- serene, meditative, expensive.
// -----------------------------------------------------------------------------

export const GoldenHour: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "amber",
        latticeMode: "hex",
        baseVisibility: 0.45,
        microGrid1: 38,
        microGrid2: 160,
        microGridStrength: 0.72,
        microWarp: 0.018,
        iridescenceStrength: 0.15,
        iridescenceScale: 18,
        exposure: 1.4,
        filmic: 0.88,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0,
      }}
      environment={{ preset: "zen-garden", intensity: 1 }}
      customEnvironment={{
        weather: { type: "sakura", intensity: 0.18, color: "#ffe0c0" },
        light: { type: "bloom", color: "#daa520", intensity: 0.4 },
      }}
      environmentIntensity={0.5}
      background="linear-gradient(to bottom, #0a0600, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 3. PlatinumMist
//    Ice hex + arctic base at whisper-level intensity. Cool platinum hex grid
//    with the faintest snow, barely-visible mist, and the subtlest rim light.
//    Like frosted glass on a Rolls-Royce -- silent, precise, immaculate.
// -----------------------------------------------------------------------------

export const PlatinumMist: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "ice",
        latticeMode: "hex",
        baseVisibility: 0.65,
        microGrid1: 34,
        microGrid2: 170,
        microGridStrength: 0.85,
        microWarp: 0.01,
        iridescenceStrength: 0.3,
        iridescenceScale: 20,
        exposure: 1.3,
        filmic: 0.9,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0,
      }}
      environment={{ preset: "arctic", intensity: 1 }}
      customEnvironment={{
        fog: { type: "mist", color: "#0a0e14", intensity: 0.25 },
        light: { type: "rim", color: "#c0d8f0", intensity: 0.3 },
      }}
      environmentIntensity={0.3}
      background="linear-gradient(to bottom, #040810, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 4. VelvetNight
//    Orchid hex + cozy-night base with soft fireflies and distant starlight.
//    Purple-black velvet lattice -- sensual and dark. Like a luxury perfume ad.
// -----------------------------------------------------------------------------

export const VelvetNight: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "orchid",
        latticeMode: "hex",
        baseVisibility: 0.42,
        microGrid1: 40,
        microGrid2: 150,
        microGridStrength: 0.78,
        microWarp: 0.016,
        iridescenceStrength: 0.28,
        iridescenceScale: 16,
        exposure: 0.9,
        filmic: 0.92,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0,
      }}
      environment={{ preset: "cozy-night", intensity: 1 }}
      customEnvironment={{
        weather: { type: "fireflies", intensity: 0.2, color: "#cc99ff" },
        sky: { type: "stars", intensity: 0.3, colors: ["#06001a", "#0e0030"] },
      }}
      environmentIntensity={0.4}
      background="linear-gradient(to bottom, #08001a, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 5. Obsidian
//    Gothic-void rect + deep-space base at minimal intensity. Near-invisible
//    red-black rectangular lattice on absolute black with barely-there white
//    spores like distant galaxies. The most minimal -- almost nothing, but
//    what's there is perfect.
// -----------------------------------------------------------------------------

export const Obsidian: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-void" as PaletteMode,
        latticeMode: "rect",
        baseVisibility: 0.1,
        microGrid1: 64,
        microGrid2: 220,
        microGridStrength: 0.7,
        microWarp: 0.008,
        iridescenceStrength: 0,
        iridescenceScale: 6,
        exposure: 0.7,
        filmic: 0.95,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0,
      }}
      environment={{ preset: "deep-space", intensity: 1 }}
      customEnvironment={{
        weather: { type: "spores", intensity: 0.1, color: "#ffffff" },
      }}
      environmentIntensity={0.2}
      background="#000"
    />
  ),
};

// -----------------------------------------------------------------------------
// 6. Champagne
//    Gothic-cathedral hex + cozy-night base with golden sparks rising like
//    champagne bubbles, soft warm bloom, and starry sky. Sacred gold lattice
//    in a celebratory glow -- luxury without austerity.
// -----------------------------------------------------------------------------

export const Champagne: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-cathedral" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.55,
        microGrid1: 36,
        microGrid2: 140,
        microGridStrength: 0.88,
        microWarp: 0.014,
        iridescenceStrength: 0.22,
        iridescenceScale: 18,
        exposure: 1.5,
        filmic: 0.86,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0,
      }}
      environment={{ preset: "cozy-night", intensity: 1 }}
      customEnvironment={{
        weather: { type: "sparks", intensity: 0.25, color: "#daa520" },
        light: { type: "bloom", color: "#e8c860", intensity: 0.35 },
        sky: { type: "stars", intensity: 0.35, colors: ["#0a0600", "#141008"] },
      }}
      environmentIntensity={0.45}
      background="linear-gradient(to bottom, #0a0600, #000)"
    />
  ),
};
