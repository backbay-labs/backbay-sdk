import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { HeroScene } from "./HeroScene";
import type { FieldConfig, PaletteMode } from "./types";

// -----------------------------------------------------------------------------
// Story Meta
// -----------------------------------------------------------------------------

const meta: Meta = {
  title: "Primitives/3D/Fields/HeroScenes/Celestial",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof meta>;

// -----------------------------------------------------------------------------
// 1. Supernova
//    Orchid hex lattice + deep-space base with bloom + sparks.
//    Purple nebula lattice with bright expanding bloom at center, golden sparks
//    like ejected stellar matter, and deep nebula sky. An exploding star.
// -----------------------------------------------------------------------------

export const Supernova: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "orchid",
        latticeMode: "hex",
        baseVisibility: 0.38,
        microGrid1: 52,
        microGrid2: 158,
        microGridStrength: 0.85,
        microWarp: 0.02,
        iridescenceStrength: 0.88,
        iridescenceScale: 28,
        exposure: 1.45,
        filmic: 0.78,
        grainStrength: 0.008,
        crtStrength: 0,
        copperStrength: 0.06,
      }}
      environment={{ preset: "deep-space", intensity: 1 }}
      customEnvironment={{
        weather: { type: "sparks", intensity: 0.75, color: "#ffd080" },
        light: { type: "bloom", color: "#ffffffee", intensity: 0.85 },
      }}
      environmentIntensity={0.9}
      background="linear-gradient(to bottom, #06001a, #000005)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 2. EventHorizon
//    Gothic-void tri lattice + deep-space base with bloom + volumetric fog.
//    Black hole aesthetic — the darkest possible void lattice with a singular
//    bloom pulling everything in, volumetric fog, cosmic nebula barely visible.
// -----------------------------------------------------------------------------

export const EventHorizon: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-void" as PaletteMode,
        latticeMode: "tri",
        baseVisibility: 0.08,
        microGrid1: 72,
        microGrid2: 230,
        microGridStrength: 0.9,
        microWarp: 0.035,
        iridescenceStrength: 0,
        iridescenceScale: 4,
        exposure: 0.6,
        filmic: 0.96,
        grainStrength: 0.05,
        crtStrength: 0.08,
        copperStrength: 0.04,
      }}
      environment={{ preset: "deep-space", intensity: 1 }}
      customEnvironment={{
        light: { type: "bloom", color: "#cc2200", intensity: 0.55 },
        fog: { type: "volumetric", color: "#080204", intensity: 0.7 },
      }}
      environmentIntensity={0.75}
      background="#000"
    />
  ),
};

// -----------------------------------------------------------------------------
// 3. NebulaGarden
//    Orchid tri lattice + ethereal base with spores + aurora sky.
//    Purple fractured lattice floating in a nebula cloud garden with bright
//    spores like newborn stars, soft bloom, and aurora-nebula hybrid sky.
//    The most colorful celestial scene.
// -----------------------------------------------------------------------------

export const NebulaGarden: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "orchid",
        latticeMode: "tri",
        baseVisibility: 0.36,
        microGrid1: 44,
        microGrid2: 140,
        microGridStrength: 0.82,
        microWarp: 0.028,
        iridescenceStrength: 0.82,
        iridescenceScale: 24,
        exposure: 1.2,
        filmic: 0.8,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0.05,
      }}
      environment={{ preset: "ethereal", intensity: 1 }}
      customEnvironment={{
        weather: { type: "spores", intensity: 0.8, color: "#e0c0ff" },
        sky: { type: "aurora", intensity: 0.75, colors: ["#6a0dad", "#ff69b4", "#00e5ff"] },
      }}
      environmentIntensity={0.88}
      background="linear-gradient(to bottom, #0a0018, #000008)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 4. StarfieldCathedral
//    Gothic-cathedral hex lattice + cozy-night base with dust + godrays.
//    Sacred gold lattice under a vast starfield with gentle dust motes catching
//    light, warm godrays from above, and starry sky. Reverent and cosmic.
// -----------------------------------------------------------------------------

export const StarfieldCathedral: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-cathedral" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.22,
        microGrid1: 48,
        microGrid2: 144,
        microGridStrength: 0.76,
        microWarp: 0.018,
        iridescenceStrength: 0.48,
        iridescenceScale: 16,
        exposure: 0.98,
        filmic: 0.88,
        grainStrength: 0.01,
        crtStrength: 0.06,
        copperStrength: 0.2,
      }}
      environment={{ preset: "cozy-night", intensity: 1 }}
      customEnvironment={{
        weather: { type: "dust", intensity: 0.4, color: "#d4a860" },
        light: { type: "godrays", color: "#e8b850", intensity: 0.6 },
      }}
      environmentIntensity={0.8}
      background="linear-gradient(to bottom, #080608, #000002)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 5. CosmicOcean
//    Ice hex lattice + underwater base with nebula sky override.
//    Icy lattice submerged in a cosmic ocean — turquoise spores, caustic
//    lights, but with a nebula sky above instead of underwater tones.
//    Space meets water.
// -----------------------------------------------------------------------------

export const CosmicOcean: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "ice",
        latticeMode: "hex",
        baseVisibility: 0.32,
        microGrid1: 56,
        microGrid2: 168,
        microGridStrength: 0.8,
        microWarp: 0.02,
        iridescenceStrength: 0.68,
        iridescenceScale: 22,
        exposure: 1.08,
        filmic: 0.84,
        grainStrength: 0.012,
        crtStrength: 0.1,
        copperStrength: 0.08,
      }}
      environment={{ preset: "underwater", intensity: 1 }}
      customEnvironment={{
        sky: { type: "nebula", intensity: 0.7, colors: ["#0a0a3a", "#2d1466", "#006688"] },
      }}
      environmentIntensity={0.85}
      background="linear-gradient(to bottom, #000818, #000005)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 6. DarkMatter
//    Mono rect lattice + deep-space base with rim light + dust.
//    The subtlest cosmic scene — barely-visible monochrome grid with faint
//    dust particles, pale cyan rim light as the only illumination, and deep
//    space void. Dark matter made visible.
// -----------------------------------------------------------------------------

export const DarkMatter: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "mono",
        latticeMode: "rect",
        baseVisibility: 0.12,
        microGrid1: 64,
        microGrid2: 210,
        microGridStrength: 0.72,
        microWarp: 0.01,
        iridescenceStrength: 0,
        iridescenceScale: 6,
        exposure: 0.75,
        filmic: 0.9,
        grainStrength: 0.035,
        crtStrength: 0.28,
        copperStrength: 0.03,
      }}
      environment={{ preset: "deep-space", intensity: 1 }}
      customEnvironment={{
        weather: { type: "dust", intensity: 0.25, color: "#e0e8f0" },
        light: { type: "rim", color: "#80d4e8", intensity: 0.4 },
      }}
      environmentIntensity={0.7}
      background="#000003"
    />
  ),
};
