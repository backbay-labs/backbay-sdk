import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { HeroScene } from "./HeroScene";

// -----------------------------------------------------------------------------
// Story Meta
// -----------------------------------------------------------------------------

const meta: Meta = {
  title: "Primitives/3D/Fields/HeroScenes/Frozen",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof meta>;

// -----------------------------------------------------------------------------
// 1. AuroraSubstrate
//    Ice hex lattice + arctic preset. Icy blue hex grid with snow, mist,
//    cyan rim light, and aurora borealis sky. Clean and majestic.
// -----------------------------------------------------------------------------

export const AuroraSubstrate: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "ice",
        latticeMode: "hex",
        baseVisibility: 0.38,
        microGrid1: 48,
        microGrid2: 155,
        microGridStrength: 0.82,
        microWarp: 0.022,
        iridescenceStrength: 0.65,
        iridescenceScale: 22,
        exposure: 1.15,
        filmic: 0.88,
        grainStrength: 0.008,
        crtStrength: 0.1,
        copperStrength: 0.05,
      }}
      environment={{ preset: "arctic", intensity: 1 }}
      environmentIntensity={0.85}
      background="linear-gradient(to bottom, #050a15, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 2. CrystalCavern
//    Ice tri lattice + deep-space preset with caustics and ground fog.
//    Fractured ice crystals floating in deep space with cyan caustic ripples.
// -----------------------------------------------------------------------------

export const CrystalCavern: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "ice",
        latticeMode: "tri",
        baseVisibility: 0.28,
        microGrid1: 55,
        microGrid2: 180,
        microGridStrength: 0.85,
        microWarp: 0.018,
        iridescenceStrength: 0.55,
        iridescenceScale: 28,
        exposure: 0.92,
        filmic: 0.90,
        grainStrength: 0.012,
        crtStrength: 0.12,
        copperStrength: 0.08,
      }}
      environment={{ preset: "deep-space", intensity: 1 }}
      customEnvironment={{
        light: { type: "caustics", intensity: 0.6, color: "#60e0ff" },
        fog: { type: "ground", intensity: 0.45, color: "#0a1025" },
      }}
      environmentIntensity={0.8}
      background="linear-gradient(to bottom, #030812, #000005)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 3. FrozenOrchid
//    Orchid hex lattice + arctic preset with bloom and gentler snow.
//    Purple-blue lattice with delicate bloom light and aurora sky.
// -----------------------------------------------------------------------------

export const FrozenOrchid: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "orchid",
        latticeMode: "hex",
        baseVisibility: 0.30,
        microGrid1: 52,
        microGrid2: 170,
        microGridStrength: 0.78,
        microWarp: 0.020,
        iridescenceStrength: 0.42,
        iridescenceScale: 16,
        exposure: 1.0,
        filmic: 0.85,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0.06,
      }}
      environment={{ preset: "arctic", intensity: 1 }}
      customEnvironment={{
        light: { type: "bloom", intensity: 0.5, color: "#c8a0e8" },
        weather: { type: "snow", intensity: 0.45, wind: { x: 0.15, y: 0 } },
      }}
      environmentIntensity={0.8}
      background="linear-gradient(to bottom, #0a0518, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 4. GhostCircuit
//    Mono hex lattice + noir preset with mist and rim overrides.
//    Monochrome grid emerging from dense mist. Eerie, minimalist, haunting.
// -----------------------------------------------------------------------------

export const GhostCircuit: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "mono",
        latticeMode: "hex",
        baseVisibility: 0.16,
        microGrid1: 68,
        microGrid2: 240,
        microGridStrength: 0.88,
        microWarp: 0.010,
        iridescenceStrength: 0,
        iridescenceScale: 8,
        exposure: 0.78,
        filmic: 0.92,
        grainStrength: 0.020,
        crtStrength: 0.35,
        copperStrength: 0.08,
      }}
      environment={{ preset: "noir", intensity: 1 }}
      customEnvironment={{
        fog: { type: "mist", intensity: 0.65, color: "#b0c0d0" },
        light: { type: "rim", intensity: 0.45, color: "#90d8e8" },
      }}
      environmentIntensity={0.75}
      background="linear-gradient(to bottom, #080a0c, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 5. MidnightGlacier
//    Ice hex lattice + ethereal preset with snow and aurora overrides.
//    Maximum iridescence, high exposure. The richest, most layered frozen scene.
// -----------------------------------------------------------------------------

export const MidnightGlacier: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "ice",
        latticeMode: "hex",
        baseVisibility: 0.42,
        microGrid1: 46,
        microGrid2: 148,
        microGridStrength: 0.85,
        microWarp: 0.025,
        iridescenceStrength: 0.82,
        iridescenceScale: 26,
        exposure: 1.35,
        filmic: 0.88,
        grainStrength: 0.006,
        crtStrength: 0.08,
        copperStrength: 0.04,
      }}
      environment={{ preset: "ethereal", intensity: 1 }}
      customEnvironment={{
        weather: { type: "snow", intensity: 0.4, wind: { x: 0.1, y: 0 } },
        sky: {
          type: "aurora",
          intensity: 0.7,
          colors: ["#00ff87", "#60efff", "#8a2be2"],
        },
      }}
      environmentIntensity={0.85}
      background="linear-gradient(to bottom, #06081a, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 6. SpectralDrift
//    Orchid tri lattice + cozy-night preset with spores and rim overrides.
//    Fractured purple lattice with glowing spores drifting upward.
//    Otherworldly and peaceful.
// -----------------------------------------------------------------------------

export const SpectralDrift: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "orchid",
        latticeMode: "tri",
        baseVisibility: 0.28,
        microGrid1: 56,
        microGrid2: 185,
        microGridStrength: 0.80,
        microWarp: 0.024,
        iridescenceStrength: 0.58,
        iridescenceScale: 20,
        exposure: 0.95,
        filmic: 0.88,
        grainStrength: 0,
        crtStrength: 0.1,
        copperStrength: 0.10,
      }}
      environment={{ preset: "cozy-night", intensity: 1 }}
      customEnvironment={{
        weather: { type: "spores", intensity: 0.5, color: "#c080ff" },
        light: { type: "rim", intensity: 0.4, color: "#c8a0e8" },
      }}
      environmentIntensity={0.8}
      background="linear-gradient(to bottom, #080514, #000)"
    />
  ),
};
