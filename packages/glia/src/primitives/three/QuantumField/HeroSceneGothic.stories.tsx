import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { HeroScene } from "./HeroScene";
import type { FieldConfig, PaletteMode } from "./types";

// -----------------------------------------------------------------------------
// Story Meta
// -----------------------------------------------------------------------------

const meta: Meta = {
  title: "Primitives/3D/Fields/HeroScenes/Gothic",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof meta>;

// -----------------------------------------------------------------------------
// 1. HauntedCathedral
//    Gothic-cathedral hex lattice + haunted base with storm sky override.
//    Purple-gold stained glass lattice with eerie embers, deep ground fog,
//    cold godrays, and an intensified stormy sky. The haunted church.
// -----------------------------------------------------------------------------

export const HauntedCathedral: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-cathedral" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.26,
        microGrid1: 44,
        microGrid2: 132,
        microGridStrength: 0.8,
        microWarp: 0.02,
        iridescenceStrength: 0.72,
        iridescenceScale: 22,
        exposure: 0.92,
        filmic: 0.9,
        grainStrength: 0.028,
        crtStrength: 0.16,
        copperStrength: 0.2,
      }}
      environment={{ preset: "haunted", intensity: 1 }}
      customEnvironment={{
        weather: { type: "embers", intensity: 0.5, color: "#9060cc" },
        fog: { type: "ground", color: "#0a0018", intensity: 0.7 },
        light: { type: "godrays", color: "#8888cc", intensity: 0.55 },
        sky: { type: "storm", intensity: 0.8, colors: ["#0c0020", "#1a0040", "#2a1060"] },
      }}
      environmentIntensity={0.9}
      background="linear-gradient(to bottom, #06001a, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 2. BloodMoon
//    Gothic-void tri lattice + apocalypse base with red bloom + nebula sky.
//    Blood-red fractured lattice under a crimson nebula sky with bloom light,
//    ash falling, volumetric fog. Total dread.
// -----------------------------------------------------------------------------

export const BloodMoon: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-void" as PaletteMode,
        latticeMode: "tri",
        baseVisibility: 0.18,
        microGrid1: 72,
        microGrid2: 228,
        microGridStrength: 0.85,
        microWarp: 0.032,
        iridescenceStrength: 0.1,
        iridescenceScale: 5,
        exposure: 0.68,
        filmic: 0.95,
        grainStrength: 0.05,
        crtStrength: 0.42,
        copperStrength: 0.35,
      }}
      environment={{ preset: "apocalypse", intensity: 1 }}
      customEnvironment={{
        weather: { type: "ash", intensity: 0.7, color: "#4a0000" },
        fog: { type: "volumetric", color: "#1a0000", intensity: 0.65 },
        light: { type: "bloom", color: "#8b0000", intensity: 0.75 },
        sky: { type: "nebula", intensity: 0.7, colors: ["#0a0000", "#3a0000", "#600000"] },
      }}
      environmentIntensity={0.95}
      background="#000"
    />
  ),
};

// -----------------------------------------------------------------------------
// 3. SpectralRuins
//    Gothic-sanctum tri lattice + haunted base with spores + rim light.
//    Bronze-green fractured lattice with ghostly purple spores rising,
//    ground fog, and a cold rim light halo. Ancient ruins with spirits.
// -----------------------------------------------------------------------------

export const SpectralRuins: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-sanctum" as PaletteMode,
        latticeMode: "tri",
        baseVisibility: 0.24,
        microGrid1: 56,
        microGrid2: 168,
        microGridStrength: 0.76,
        microWarp: 0.025,
        iridescenceStrength: 0.4,
        iridescenceScale: 16,
        exposure: 0.85,
        filmic: 0.88,
        grainStrength: 0.02,
        crtStrength: 0.2,
        copperStrength: 0.32,
      }}
      environment={{ preset: "haunted", intensity: 1 }}
      customEnvironment={{
        weather: { type: "spores", intensity: 0.6, color: "#9a70cc" },
        fog: { type: "ground", color: "#081008", intensity: 0.55 },
        light: { type: "rim", color: "#70cc88", intensity: 0.5 },
      }}
      environmentIntensity={0.85}
      background="linear-gradient(to bottom, #040a04, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 4. DarkSanctum
//    Gothic-void rect lattice + noir preset (no overrides).
//    The purest noir horror -- blood-red rect grid barely visible through
//    depth fog, harsh white spotlight, and dark clouds. Stark and terrifying.
// -----------------------------------------------------------------------------

export const DarkSanctum: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-void" as PaletteMode,
        latticeMode: "rect",
        baseVisibility: 0.1,
        microGrid1: 80,
        microGrid2: 260,
        microGridStrength: 0.9,
        microWarp: 0.01,
        iridescenceStrength: 0,
        iridescenceScale: 4,
        exposure: 0.6,
        filmic: 0.94,
        grainStrength: 0.035,
        crtStrength: 0.32,
        copperStrength: 0.28,
      }}
      environment={{ preset: "noir", intensity: 1 }}
      environmentIntensity={0.9}
      background="#000"
    />
  ),
};

// -----------------------------------------------------------------------------
// 5. CursedGarden
//    Gothic-rose hex lattice + enchanted-forest base with ash + storm overrides.
//    Rose-window lattice in a corrupted enchanted forest -- ash instead of
//    fireflies, sickly green fog, godrays, stormy sky replacing aurora.
// -----------------------------------------------------------------------------

export const CursedGarden: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-rose" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.25,
        microGrid1: 50,
        microGrid2: 150,
        microGridStrength: 0.78,
        microWarp: 0.024,
        iridescenceStrength: 0.48,
        iridescenceScale: 16,
        exposure: 0.9,
        filmic: 0.88,
        grainStrength: 0.032,
        crtStrength: 0.22,
        copperStrength: 0.26,
      }}
      environment={{ preset: "enchanted-forest", intensity: 1 }}
      customEnvironment={{
        weather: { type: "ash", intensity: 0.6, color: "#443322" },
        fog: { type: "ground", color: "#0a1a08", intensity: 0.6 },
        light: { type: "godrays", color: "#88aa44", intensity: 0.5 },
        sky: { type: "storm", intensity: 0.7, colors: ["#061008", "#142010", "#283820"] },
      }}
      environmentIntensity={0.85}
      background="linear-gradient(to bottom, #060a04, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 6. ShadowVeil
//    Gothic-cathedral hex lattice + ethereal base with dust + ground fog.
//    Purple-gold lattice veiled by falling dust motes, deep ground fog,
//    soft purple bloom, and nebula sky. Mysterious and reverent.
// -----------------------------------------------------------------------------

export const ShadowVeil: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-cathedral" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.34,
        microGrid1: 42,
        microGrid2: 126,
        microGridStrength: 0.82,
        microWarp: 0.018,
        iridescenceStrength: 0.7,
        iridescenceScale: 24,
        exposure: 1.02,
        filmic: 0.86,
        grainStrength: 0.012,
        crtStrength: 0.1,
        copperStrength: 0.18,
      }}
      environment={{ preset: "ethereal", intensity: 1 }}
      customEnvironment={{
        weather: { type: "dust", intensity: 0.55, color: "#ccaaee" },
        fog: { type: "ground", color: "#12001e", intensity: 0.65 },
        light: { type: "bloom", color: "#9966cc", intensity: 0.5 },
        sky: { type: "nebula", intensity: 0.6, colors: ["#08001a", "#1a0036", "#2e1050"] },
      }}
      environmentIntensity={0.8}
      background="linear-gradient(to bottom, #08001a, #000)"
    />
  ),
};
