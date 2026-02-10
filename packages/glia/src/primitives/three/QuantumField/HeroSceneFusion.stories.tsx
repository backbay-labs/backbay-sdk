import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { HeroScene } from "./HeroScene";
import type { FieldConfig, PaletteMode } from "./types";

// -----------------------------------------------------------------------------
// Story Meta
// -----------------------------------------------------------------------------

const meta: Meta = {
  title: "Primitives/3D/Fields/HeroScenes/Fusion",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof meta>;

// -----------------------------------------------------------------------------
// 1. ArcticFire
//    Ice hex lattice + volcanic base with snow + rim light overrides.
//    Fire and ice collide: icy blue hexagonal grid with rising embers AND
//    falling snow simultaneously, ice-blue rim light, aurora sky bleeding
//    between fire orange and ice blue. The impossible temperature.
// -----------------------------------------------------------------------------

export const ArcticFire: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "ice",
        latticeMode: "hex",
        baseVisibility: 0.38,
        microGrid1: 52,
        microGrid2: 164,
        microGridStrength: 0.84,
        microWarp: 0.018,
        iridescenceStrength: 0.72,
        iridescenceScale: 24,
        exposure: 1.18,
        filmic: 0.82,
        grainStrength: 0.01,
        crtStrength: 0.08,
        copperStrength: 0.06,
      }}
      environment={{ preset: "volcanic", intensity: 1 }}
      customEnvironment={{
        weather: { type: "snow", intensity: 0.7, color: "#c8e8ff" },
        light: { type: "rim", color: "#88ccff", intensity: 0.65 },
        sky: { type: "aurora", intensity: 0.75, colors: ["#001830", "#0044aa", "#ff6a00"] },
      }}
      environmentIntensity={0.85}
      background="linear-gradient(to bottom, #020a18, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 2. NeonForest
//    Glia-cyan hex lattice + enchanted-forest base with sparks + neon overrides.
//    Cyan tech grid invading a magical forest: fireflies replaced by golden
//    sparks, green canopy fog, but a hot magenta neon bar slicing through
//    the natural scene. Technology colonizing nature.
// -----------------------------------------------------------------------------

export const NeonForest: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "glia-cyan",
        latticeMode: "hex",
        baseVisibility: 0.22,
        microGrid1: 58,
        microGrid2: 180,
        microGridStrength: 0.78,
        microWarp: 0.014,
        iridescenceStrength: 0.18,
        iridescenceScale: 10,
        exposure: 0.95,
        filmic: 0.84,
        grainStrength: 0.012,
        crtStrength: 0.28,
        copperStrength: 0.12,
      }}
      environment={{ preset: "enchanted-forest", intensity: 1 }}
      customEnvironment={{
        weather: { type: "sparks", intensity: 0.65, color: "#ffc847" },
        light: { type: "neon", color: "#ff22aa", intensity: 0.7 },
      }}
      environmentIntensity={0.82}
      background="linear-gradient(to bottom, #020a04, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 3. ToxicRain
//    Mono rect lattice + matrix base with volumetric fog + caustics overrides.
//    Green terminal grid drowning in acid rain, volumetric toxic fog, green
//    caustic light ripples. The matrix glitching out and dissolving into
//    corrupted data. High CRT + grain for maximum corruption aesthetic.
// -----------------------------------------------------------------------------

export const ToxicRain: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "mono",
        latticeMode: "rect",
        baseVisibility: 0.2,
        microGrid1: 72,
        microGrid2: 230,
        microGridStrength: 0.86,
        microWarp: 0.01,
        iridescenceStrength: 0,
        iridescenceScale: 4,
        exposure: 0.72,
        filmic: 0.92,
        grainStrength: 0.055,
        crtStrength: 0.48,
        copperStrength: 0.1,
      }}
      environment={{ preset: "matrix", intensity: 1 }}
      customEnvironment={{
        fog: { type: "volumetric", color: "#001a00", intensity: 0.7 },
        light: { type: "caustics", color: "#00ff44", intensity: 0.65 },
      }}
      environmentIntensity={0.9}
      background="#000"
    />
  ),
};

// -----------------------------------------------------------------------------
// 4. CathedralRave
//    Gothic-cathedral hex lattice + rave base (sparks + laser + cosmic).
//    Sacred gold stained-glass lattice at a rave: red laser sweeping across
//    the holy circuit, sparks flying, cosmic sky pulsing. Profane meets
//    sacred. High exposure and zero grain for crystalline clarity.
// -----------------------------------------------------------------------------

export const CathedralRave: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-cathedral" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.36,
        microGrid1: 44,
        microGrid2: 136,
        microGridStrength: 0.82,
        microWarp: 0.02,
        iridescenceStrength: 0.78,
        iridescenceScale: 26,
        exposure: 1.3,
        filmic: 0.78,
        grainStrength: 0,
        crtStrength: 0.06,
        copperStrength: 0.15,
      }}
      environment={{ preset: "rave", intensity: 1 }}
      environmentIntensity={0.95}
      background="linear-gradient(to bottom, #06001a, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 5. OceanStorm
//    Ice tri lattice + underwater base with rain + storm sky overrides.
//    Fractured ice lattice underwater during a storm: rain hammering the
//    caustic surface, heavy spores drifting, violent storm sky. The surface
//    world crashing into the deep. Light shattering through cracked ice.
// -----------------------------------------------------------------------------

export const OceanStorm: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "ice",
        latticeMode: "tri",
        baseVisibility: 0.24,
        microGrid1: 62,
        microGrid2: 190,
        microGridStrength: 0.8,
        microWarp: 0.028,
        iridescenceStrength: 0.68,
        iridescenceScale: 20,
        exposure: 0.92,
        filmic: 0.88,
        grainStrength: 0.018,
        crtStrength: 0.15,
        copperStrength: 0.08,
      }}
      environment={{ preset: "underwater", intensity: 1 }}
      customEnvironment={{
        weather: { type: "rain", intensity: 0.85, color: "#aaccdd", wind: 0.6 },
        sky: { type: "storm", intensity: 0.8, colors: ["#001018", "#002838", "#004050"] },
      }}
      environmentIntensity={0.88}
      background="linear-gradient(to bottom, #000a12, #000)"
    />
  ),
};

// -----------------------------------------------------------------------------
// 6. RoseMatrix
//    Gothic-rose hex lattice + matrix base with scanner + sakura overrides.
//    Crimson-gold rose lattice running the matrix: green rain with pink
//    sakura petals mixed in, magenta scanner sweep instead of green, on a
//    rose-window circuit substrate. Digital cherry blossoms in the machine.
// -----------------------------------------------------------------------------

export const RoseMatrix: Story = {
  render: () => (
    <HeroScene
      fieldConfig={{
        paletteMode: "gothic-rose" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.3,
        microGrid1: 48,
        microGrid2: 148,
        microGridStrength: 0.8,
        microWarp: 0.022,
        iridescenceStrength: 0.55,
        iridescenceScale: 18,
        exposure: 0.98,
        filmic: 0.86,
        grainStrength: 0.014,
        crtStrength: 0.2,
        copperStrength: 0.22,
      }}
      environment={{ preset: "matrix", intensity: 1 }}
      customEnvironment={{
        weather: { type: "sakura", intensity: 0.7, color: "#ff88bb" },
        light: { type: "scanner", color: "#cc22aa", intensity: 0.6 },
      }}
      environmentIntensity={0.85}
      background="linear-gradient(to bottom, #0a0008, #000)"
    />
  ),
};
