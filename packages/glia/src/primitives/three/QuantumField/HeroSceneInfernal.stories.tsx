import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { HeroScene } from "./HeroScene";
import type { FieldConfig, PaletteMode } from "./types";

// -----------------------------------------------------------------------------
// Story Meta
// -----------------------------------------------------------------------------

const meta: Meta = {
  title: "Primitives/3D/Fields/HeroScenes/Infernal",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof meta>;

// -----------------------------------------------------------------------------
// 1. EmberCathedral
//    Gothic-cathedral hex lattice + volcanic base with godrays + ground fog.
//    Sacred gold grid with rising embers and warm god rays through haze.
// -----------------------------------------------------------------------------

export const EmberCathedral: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-cathedral" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.28,
        microGrid1: 46,
        microGrid2: 138,
        microGridStrength: 0.78,
        microWarp: 0.022,
        iridescenceStrength: 0.62,
        iridescenceScale: 20,
        exposure: 1.05,
        filmic: 0.92,
        grainStrength: 0.022,
        crtStrength: 0.12,
        copperStrength: 0.22,
      }}
      environment={{ preset: "volcanic", intensity: 1 }}
      customEnvironment={{
        light: { type: "godrays", color: "#ffb347", intensity: 0.7 },
        fog: { type: "ground", color: "#1a0800", intensity: 0.6 },
      }}
      environmentIntensity={0.85}
      background="linear-gradient(to bottom, #0a0500, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 2. MoltenForge
//    Amber rect lattice + apocalypse base with embers + heat sky.
//    Industrial circuit board with molten amber traces, ash, furnace sky.
// -----------------------------------------------------------------------------

export const MoltenForge: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "amber",
        latticeMode: "rect",
        baseVisibility: 0.24,
        microGrid1: 68,
        microGrid2: 220,
        microGridStrength: 0.82,
        microWarp: 0.012,
        iridescenceStrength: 0.22,
        iridescenceScale: 8,
        exposure: 1.1,
        filmic: 0.82,
        grainStrength: 0.04,
        crtStrength: 0.35,
        copperStrength: 0.55,
      }}
      environment={{ preset: "apocalypse", intensity: 1 }}
      customEnvironment={{
        weather: { type: "embers", intensity: 0.8, color: "#ff6a00" },
        sky: { type: "heat", intensity: 0.7, colors: ["#1a0000", "#4a1800", "#6b2000"] },
      }}
      environmentIntensity={0.9}
      background="linear-gradient(to bottom, #080200, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 3. PhoenixRising
//    Gothic-rose hex + volcanic base with bloom + sunset sky.
//    Crimson-gold lattice with rising embers, warm bloom, sunset heat.
// -----------------------------------------------------------------------------

export const PhoenixRising: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-rose" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.3,
        microGrid1: 50,
        microGrid2: 150,
        microGridStrength: 0.8,
        microWarp: 0.02,
        iridescenceStrength: 0.65,
        iridescenceScale: 18,
        exposure: 1.25,
        filmic: 0.88,
        grainStrength: 0.018,
        crtStrength: 0.14,
        copperStrength: 0.28,
      }}
      environment={{ preset: "volcanic", intensity: 1 }}
      customEnvironment={{
        light: { type: "bloom", color: "#ffc85e", intensity: 0.65 },
        sky: { type: "sunset", intensity: 0.6, colors: ["#1a0500", "#6b1a00", "#cc6600"] },
      }}
      environmentIntensity={0.8}
      background="linear-gradient(to bottom, #0c0300, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 4. Hellscape
//    Gothic-void tri lattice + apocalypse preset (no overrides).
//    Aggressive triangular void lattice with heavy ash, volumetric fog, storm.
//    The darkest and most menacing.
// -----------------------------------------------------------------------------

export const Hellscape: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-void" as PaletteMode,
        latticeMode: "tri",
        baseVisibility: 0.14,
        microGrid1: 76,
        microGrid2: 240,
        microGridStrength: 0.88,
        microWarp: 0.038,
        iridescenceStrength: 0.12,
        iridescenceScale: 6,
        exposure: 0.7,
        filmic: 0.96,
        grainStrength: 0.055,
        crtStrength: 0.45,
        copperStrength: 0.38,
      }}
      environment={{ preset: "apocalypse", intensity: 1 }}
      environmentIntensity={0.95}
      background="#000"
    />
  ),
};

// -----------------------------------------------------------------------------
// 5. CandlelitSanctum
//    Gothic-sanctum rect + cozy-night base with dim embers.
//    Bronze patina circuit with gentle embers, soft bloom, starry sky.
//    Warm but subdued.
// -----------------------------------------------------------------------------

export const CandlelitSanctum: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-sanctum" as PaletteMode,
        latticeMode: "rect",
        baseVisibility: 0.22,
        microGrid1: 54,
        microGrid2: 162,
        microGridStrength: 0.75,
        microWarp: 0.016,
        iridescenceStrength: 0.32,
        iridescenceScale: 12,
        exposure: 0.88,
        filmic: 0.86,
        grainStrength: 0.015,
        crtStrength: 0.18,
        copperStrength: 0.38,
      }}
      environment={{ preset: "cozy-night", intensity: 1 }}
      customEnvironment={{
        weather: { type: "embers", intensity: 0.35, color: "#e8a050" },
      }}
      environmentIntensity={0.7}
      background="linear-gradient(to bottom, #060402, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 6. InfernalBloom
//    Amber hex + haunted base with bloom light + heat sky.
//    Honeycomb amber grid with eerie blue-shifted embers, ground fog,
//    and bloom creating an otherworldly volcanic-haunted hybrid.
// -----------------------------------------------------------------------------

export const InfernalBloom: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "amber",
        latticeMode: "hex",
        baseVisibility: 0.26,
        microGrid1: 48,
        microGrid2: 148,
        microGridStrength: 0.76,
        microWarp: 0.018,
        iridescenceStrength: 0.38,
        iridescenceScale: 14,
        exposure: 0.98,
        filmic: 0.88,
        grainStrength: 0.022,
        crtStrength: 0.2,
        copperStrength: 0.25,
      }}
      environment={{ preset: "haunted", intensity: 1 }}
      customEnvironment={{
        light: { type: "bloom", color: "#e89830", intensity: 0.6 },
        sky: { type: "heat", intensity: 0.55, colors: ["#08001a", "#2a0e00", "#5a2a00"] },
      }}
      environmentIntensity={0.85}
      background="linear-gradient(to bottom, #050008, #000)"
    />
  ),
};
