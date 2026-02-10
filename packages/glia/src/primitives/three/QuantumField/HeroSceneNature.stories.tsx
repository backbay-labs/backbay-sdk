import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { HeroScene } from "./HeroScene";
import type { FieldConfig, PaletteMode } from "./types";

// -----------------------------------------------------------------------------
// Story Meta
// -----------------------------------------------------------------------------

const meta: Meta = {
  title: "Primitives/3D/Fields/HeroScenes/Nature",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof meta>;

// -----------------------------------------------------------------------------
// 1. EnchantedGarden
//    Glia-cyan hex lattice + enchanted-forest preset.
//    Cyan hex lattice like a magical circuit garden with floating fireflies,
//    green ground fog, warm godrays, and aurora sky. Technology meets nature.
// -----------------------------------------------------------------------------

export const EnchantedGarden: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "glia-cyan",
        latticeMode: "hex",
        baseVisibility: 0.24,
        microGrid1: 52,
        microGrid2: 160,
        microGridStrength: 0.72,
        microWarp: 0.018,
        iridescenceStrength: 0.42,
        iridescenceScale: 16,
        exposure: 1.0,
        filmic: 0.88,
        grainStrength: 0.012,
        crtStrength: 0,
        copperStrength: 0.12,
      }}
      environment={{ preset: "enchanted-forest", intensity: 1 }}
      environmentIntensity={0.8}
      background="linear-gradient(to bottom, #050a05, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 2. SakuraDreams
//    Gothic-rose hex lattice + zen-garden preset.
//    Crimson-gold rose lattice with drifting cherry blossom petals, gentle
//    mist, warm godrays, and sunset sky. Romantic, Japanese-inspired.
// -----------------------------------------------------------------------------

export const SakuraDreams: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-rose" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.26,
        microGrid1: 48,
        microGrid2: 144,
        microGridStrength: 0.68,
        microWarp: 0.014,
        iridescenceStrength: 0.48,
        iridescenceScale: 18,
        exposure: 0.95,
        filmic: 0.92,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0.18,
      }}
      environment={{ preset: "zen-garden", intensity: 1 }}
      environmentIntensity={0.85}
      background="linear-gradient(to bottom, #0a0305, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 3. DeepOcean
//    Glia-cyan tri lattice + underwater preset.
//    Fractured cyan lattice like deep-sea bioluminescence with floating
//    turquoise spores, underwater mist, caustic light ripples, and
//    underwater sky. Abyssal and mysterious.
// -----------------------------------------------------------------------------

export const DeepOcean: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "glia-cyan",
        latticeMode: "tri",
        baseVisibility: 0.22,
        microGrid1: 64,
        microGrid2: 200,
        microGridStrength: 0.76,
        microWarp: 0.024,
        iridescenceStrength: 0.68,
        iridescenceScale: 22,
        exposure: 0.92,
        filmic: 0.85,
        grainStrength: 0.01,
        crtStrength: 0.08,
        copperStrength: 0.1,
      }}
      environment={{ preset: "underwater", intensity: 1 }}
      environmentIntensity={0.85}
      background="linear-gradient(to bottom, #020808, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 4. AlienMeadow
//    Orchid hex lattice + alien-world preset with firefly/fog overrides.
//    Purple orchid honeycomb lattice like an alien circuit garden with
//    glowing green spores, purple volumetric fog, green caustics, and
//    nebula sky. Xenobotanical.
// -----------------------------------------------------------------------------

export const AlienMeadow: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "orchid",
        latticeMode: "hex",
        baseVisibility: 0.32,
        microGrid1: 44,
        microGrid2: 132,
        microGridStrength: 0.82,
        microWarp: 0.02,
        iridescenceStrength: 0.72,
        iridescenceScale: 24,
        exposure: 1.15,
        filmic: 0.84,
        grainStrength: 0.014,
        crtStrength: 0.1,
        copperStrength: 0.15,
      }}
      environment={{ preset: "alien-world", intensity: 1 }}
      customEnvironment={{
        weather: { type: "fireflies", intensity: 0.9, color: "#44ff88" },
        fog: { type: "volumetric", color: "#1a0028", intensity: 0.75 },
      }}
      environmentIntensity={0.9}
      background="linear-gradient(to bottom, #06000a, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 5. TwilightForest
//    Gothic-sanctum hex lattice + enchanted-forest preset with star sky.
//    Bronze-green patina lattice like ancient forest circuitry with fireflies,
//    deep green ground fog, godrays, and a starry sky. Ancient and wise.
// -----------------------------------------------------------------------------

export const TwilightForest: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-sanctum" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.2,
        microGrid1: 56,
        microGrid2: 170,
        microGridStrength: 0.7,
        microWarp: 0.02,
        iridescenceStrength: 0.28,
        iridescenceScale: 12,
        exposure: 0.88,
        filmic: 0.9,
        grainStrength: 0.025,
        crtStrength: 0.06,
        copperStrength: 0.32,
      }}
      environment={{ preset: "enchanted-forest", intensity: 1 }}
      customEnvironment={{
        sky: { type: "stars", intensity: 0.65, colors: ["#ffe8c0", "#c8a860"] },
      }}
      environmentIntensity={0.75}
      background="linear-gradient(to bottom, #040604, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 6. BioluminescentReef
//    Ice hex lattice + underwater preset with spore/bloom overrides.
//    Icy blue lattice like a coral circuit reef with bright purple spores,
//    cyan mist, soft bloom light, and underwater sky. Vibrant and alive.
// -----------------------------------------------------------------------------

export const BioluminescentReef: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "ice",
        latticeMode: "hex",
        baseVisibility: 0.34,
        microGrid1: 42,
        microGrid2: 126,
        microGridStrength: 0.85,
        microWarp: 0.016,
        iridescenceStrength: 0.82,
        iridescenceScale: 28,
        exposure: 1.2,
        filmic: 0.82,
        grainStrength: 0.008,
        crtStrength: 0.05,
        copperStrength: 0.08,
      }}
      environment={{ preset: "underwater", intensity: 1 }}
      customEnvironment={{
        weather: { type: "spores", intensity: 0.85, color: "#dd44ff" },
        light: { type: "bloom", color: "#44ddee", intensity: 0.6 },
      }}
      environmentIntensity={0.9}
      background="linear-gradient(to bottom, #020608, #000)"
    />
  ),
};
