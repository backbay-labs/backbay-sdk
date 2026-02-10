import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { FieldLayer } from "./FieldLayer";
import { FieldProvider } from "./FieldProvider";
import type { FieldConfig, PaletteMode } from "./types";
import {
  THEME_GOTHIC_CATHEDRAL,
  THEME_GOTHIC_VOID,
  THEME_GOTHIC_SANCTUM,
  THEME_GOTHIC_ROSE,
} from "./themes";

// -----------------------------------------------------------------------------
// Story Meta
// -----------------------------------------------------------------------------

const meta: Meta = {
  title: "Primitives/3D/Fields/QuantumFieldPresets",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// -----------------------------------------------------------------------------
// Shared Base Config
// -----------------------------------------------------------------------------

const PRESET_BASE: Partial<FieldConfig> = {
  style: "pcb",
  ambientReveal: 0.8,
  lensEnabled: false,
  enableTrails: false,
};

// -----------------------------------------------------------------------------
// Helper Component
// -----------------------------------------------------------------------------

function StaticPreset({ config }: { config: Partial<FieldConfig> }) {
  const merged = { ...PRESET_BASE, ...config };
  return (
    <FieldProvider config={merged}>
      <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
        <FieldLayer config={merged} pinToViewport zIndex={0} />
      </div>
    </FieldProvider>
  );
}

// -----------------------------------------------------------------------------
// A. Signature Presets (9) - one per palette, best-matched lattice
// -----------------------------------------------------------------------------

export const CyanCircuitry: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "glia-cyan",
        latticeMode: "rect",
        baseVisibility: 0.25,
        microGrid1: 60,
        microGrid2: 200,
        microGridStrength: 0.8,
        microWarp: 0.015,
        iridescenceStrength: 0.35,
        iridescenceScale: 14,
        exposure: 1.0,
        filmic: 0.85,
        grainStrength: 0.015,
        crtStrength: 0.25,
        copperStrength: 0.15,
      }}
    />
  ),
};

export const OrchidMuseum: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "orchid",
        latticeMode: "hex",
        baseVisibility: 0.30,
        microGrid1: 55,
        microGrid2: 180,
        microGridStrength: 0.85,
        microWarp: 0.020,
        iridescenceStrength: 0.45,
        iridescenceScale: 16,
        exposure: 0.95,
        filmic: 0.90,
        grainStrength: 0.015,
        crtStrength: 0.20,
        copperStrength: 0.12,
      }}
    />
  ),
};

export const AmberForge: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "amber",
        latticeMode: "rect",
        baseVisibility: 0.28,
        microGrid1: 65,
        microGrid2: 210,
        microGridStrength: 0.75,
        microWarp: 0.010,
        iridescenceStrength: 0.25,
        iridescenceScale: 10,
        exposure: 1.05,
        filmic: 0.80,
        grainStrength: 0.020,
        crtStrength: 0.30,
        copperStrength: 0.35,
      }}
    />
  ),
};

export const MonoTerminal: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "mono",
        latticeMode: "rect",
        baseVisibility: 0.20,
        microGrid1: 70,
        microGrid2: 250,
        microGridStrength: 0.90,
        microWarp: 0.008,
        iridescenceStrength: 0.15,
        iridescenceScale: 8,
        exposure: 0.90,
        filmic: 0.85,
        grainStrength: 0.025,
        crtStrength: 0.40,
        copperStrength: 0.10,
      }}
    />
  ),
};

export const IceCrystal: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "ice",
        latticeMode: "hex",
        baseVisibility: 0.35,
        microGrid1: 50,
        microGrid2: 160,
        microGridStrength: 0.80,
        microWarp: 0.025,
        iridescenceStrength: 0.55,
        iridescenceScale: 20,
        exposure: 1.10,
        filmic: 0.85,
        grainStrength: 0.010,
        crtStrength: 0.15,
        copperStrength: 0.08,
      }}
    />
  ),
};

export const CathedralVault: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "gothic-cathedral" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.30,
        microGrid1: 48,
        microGrid2: 144,
        microGridStrength: 0.80,
        microWarp: 0.020,
        iridescenceStrength: 0.50,
        iridescenceScale: 18,
        exposure: 0.90,
        filmic: 0.90,
        grainStrength: 0.025,
        crtStrength: 0.15,
        copperStrength: 0.25,
      }}
    />
  ),
};

export const VoidAbyss: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "gothic-void" as PaletteMode,
        latticeMode: "tri",
        baseVisibility: 0.18,
        microGrid1: 72,
        microGrid2: 220,
        microGridStrength: 0.85,
        microWarp: 0.030,
        iridescenceStrength: 0.20,
        iridescenceScale: 8,
        exposure: 0.75,
        filmic: 0.95,
        grainStrength: 0.040,
        crtStrength: 0.30,
        copperStrength: 0.35,
      }}
    />
  ),
};

export const SanctumBronze: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "gothic-sanctum" as PaletteMode,
        latticeMode: "rect",
        baseVisibility: 0.25,
        microGrid1: 56,
        microGrid2: 168,
        microGridStrength: 0.80,
        microWarp: 0.018,
        iridescenceStrength: 0.40,
        iridescenceScale: 12,
        exposure: 0.95,
        filmic: 0.85,
        grainStrength: 0.020,
        crtStrength: 0.20,
        copperStrength: 0.45,
      }}
    />
  ),
};

export const RoseWindow: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "gothic-rose" as PaletteMode,
        latticeMode: "hex",
        baseVisibility: 0.28,
        microGrid1: 52,
        microGrid2: 156,
        microGridStrength: 0.82,
        microWarp: 0.022,
        iridescenceStrength: 0.45,
        iridescenceScale: 16,
        exposure: 0.85,
        filmic: 0.90,
        grainStrength: 0.020,
        crtStrength: 0.18,
        copperStrength: 0.30,
      }}
    />
  ),
};

// -----------------------------------------------------------------------------
// B. Gothic Classics (4) - existing theme presets + ambientReveal
// -----------------------------------------------------------------------------

export const GothicCathedralClassic: Story = {
  render: () => (
    <StaticPreset config={THEME_GOTHIC_CATHEDRAL.config} />
  ),
};

export const GothicVoidClassic: Story = {
  render: () => (
    <StaticPreset config={THEME_GOTHIC_VOID.config} />
  ),
};

export const GothicSanctumClassic: Story = {
  render: () => (
    <StaticPreset config={THEME_GOTHIC_SANCTUM.config} />
  ),
};

export const GothicRoseClassic: Story = {
  render: () => (
    <StaticPreset config={THEME_GOTHIC_ROSE.config} />
  ),
};

// -----------------------------------------------------------------------------
// C. Cross-Pollination (8) - unexpected palette x topology combos
// -----------------------------------------------------------------------------

export const OrchidFracture: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "orchid",
        latticeMode: "tri",
        baseVisibility: 0.28,
        microGrid1: 58,
        microGrid2: 190,
        microGridStrength: 0.82,
        microWarp: 0.022,
        iridescenceStrength: 0.50,
        iridescenceScale: 18,
        exposure: 0.95,
        filmic: 0.88,
        grainStrength: 0.015,
        crtStrength: 0.20,
        copperStrength: 0.15,
      }}
    />
  ),
};

export const AmberHoneycomb: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "amber",
        latticeMode: "hex",
        baseVisibility: 0.30,
        microGrid1: 45,
        microGrid2: 135,
        microGridStrength: 0.78,
        microWarp: 0.015,
        iridescenceStrength: 0.30,
        iridescenceScale: 12,
        exposure: 1.0,
        filmic: 0.82,
        grainStrength: 0.018,
        crtStrength: 0.22,
        copperStrength: 0.30,
      }}
    />
  ),
};

export const CyanTriangle: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "glia-cyan",
        latticeMode: "tri",
        baseVisibility: 0.25,
        microGrid1: 55,
        microGrid2: 175,
        microGridStrength: 0.82,
        microWarp: 0.018,
        iridescenceStrength: 0.40,
        iridescenceScale: 15,
        exposure: 1.0,
        filmic: 0.85,
        grainStrength: 0.015,
        crtStrength: 0.22,
        copperStrength: 0.18,
      }}
    />
  ),
};

export const IceTriangular: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "ice",
        latticeMode: "tri",
        baseVisibility: 0.30,
        microGrid1: 52,
        microGrid2: 170,
        microGridStrength: 0.80,
        microWarp: 0.020,
        iridescenceStrength: 0.50,
        iridescenceScale: 18,
        exposure: 1.05,
        filmic: 0.85,
        grainStrength: 0.012,
        crtStrength: 0.18,
        copperStrength: 0.10,
      }}
    />
  ),
};

export const MonoHex: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "mono",
        latticeMode: "hex",
        baseVisibility: 0.22,
        microGrid1: 50,
        microGrid2: 180,
        microGridStrength: 0.85,
        microWarp: 0.012,
        iridescenceStrength: 0.20,
        iridescenceScale: 10,
        exposure: 0.92,
        filmic: 0.88,
        grainStrength: 0.022,
        crtStrength: 0.35,
        copperStrength: 0.12,
      }}
    />
  ),
};

export const VoidRectangular: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "gothic-void" as PaletteMode,
        latticeMode: "rect",
        baseVisibility: 0.20,
        microGrid1: 65,
        microGrid2: 200,
        microGridStrength: 0.85,
        microWarp: 0.025,
        iridescenceStrength: 0.22,
        iridescenceScale: 10,
        exposure: 0.78,
        filmic: 0.92,
        grainStrength: 0.035,
        crtStrength: 0.32,
        copperStrength: 0.30,
      }}
    />
  ),
};

export const CathedralTriangular: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "gothic-cathedral" as PaletteMode,
        latticeMode: "tri",
        baseVisibility: 0.28,
        microGrid1: 52,
        microGrid2: 160,
        microGridStrength: 0.82,
        microWarp: 0.022,
        iridescenceStrength: 0.48,
        iridescenceScale: 16,
        exposure: 0.92,
        filmic: 0.88,
        grainStrength: 0.022,
        crtStrength: 0.18,
        copperStrength: 0.22,
      }}
    />
  ),
};

export const RoseRectangular: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "gothic-rose" as PaletteMode,
        latticeMode: "rect",
        baseVisibility: 0.26,
        microGrid1: 58,
        microGrid2: 175,
        microGridStrength: 0.80,
        microWarp: 0.018,
        iridescenceStrength: 0.42,
        iridescenceScale: 14,
        exposure: 0.88,
        filmic: 0.88,
        grainStrength: 0.018,
        crtStrength: 0.22,
        copperStrength: 0.28,
      }}
    />
  ),
};

// -----------------------------------------------------------------------------
// D. Extreme Atmosphere (5) - dramatic pushed parameters
// -----------------------------------------------------------------------------

export const PrismaticOverload: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "orchid",
        latticeMode: "hex",
        baseVisibility: 0.35,
        microGrid1: 50,
        microGrid2: 160,
        microGridStrength: 0.85,
        microWarp: 0.025,
        iridescenceStrength: 0.85,
        iridescenceScale: 22,
        accentIntensity: 1.8,
        exposure: 1.3,
        filmic: 0.90,
        grainStrength: 0.010,
        crtStrength: 0.15,
        copperStrength: 0.10,
      }}
    />
  ),
};

export const CrushedVoid: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "gothic-void" as PaletteMode,
        latticeMode: "tri",
        baseVisibility: 0.15,
        microGrid1: 75,
        microGrid2: 230,
        microGridStrength: 0.90,
        microWarp: 0.035,
        iridescenceStrength: 0.15,
        iridescenceScale: 6,
        exposure: 0.65,
        filmic: 0.95,
        grainStrength: 0.060,
        crtStrength: 0.50,
        copperStrength: 0.40,
      }}
    />
  ),
};

export const BurningAmber: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "amber",
        latticeMode: "tri",
        baseVisibility: 0.30,
        microGrid1: 60,
        microGrid2: 190,
        microGridStrength: 0.80,
        microWarp: 0.020,
        iridescenceStrength: 0.35,
        iridescenceScale: 12,
        exposure: 1.4,
        filmic: 0.80,
        grainStrength: 0.025,
        crtStrength: 0.25,
        copperStrength: 0.55,
      }}
    />
  ),
};

export const FrozenEternity: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "ice",
        latticeMode: "hex",
        baseVisibility: 0.50,
        microGrid1: 45,
        microGrid2: 140,
        microGridStrength: 0.85,
        microWarp: 0.028,
        iridescenceStrength: 0.80,
        iridescenceScale: 24,
        exposure: 1.5,
        filmic: 0.85,
        grainStrength: 0.008,
        crtStrength: 0.10,
        copperStrength: 0.05,
      }}
    />
  ),
};

export const NeonDecay: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "glia-cyan",
        latticeMode: "rect",
        baseVisibility: 0.22,
        microGrid1: 80,
        microGrid2: 280,
        microGridStrength: 0.90,
        microWarp: 0.012,
        iridescenceStrength: 0.30,
        iridescenceScale: 12,
        exposure: 1.0,
        filmic: 0.85,
        grainStrength: 0.050,
        crtStrength: 0.60,
        copperStrength: 0.20,
      }}
    />
  ),
};

// -----------------------------------------------------------------------------
// E. Quiet Minimalist (4) - clean, delicate, no grain/CRT
// -----------------------------------------------------------------------------

export const WhisperCyan: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "glia-cyan",
        latticeMode: "hex",
        baseVisibility: 0.20,
        microGrid1: 45,
        microGrid2: 150,
        microGridStrength: 0.60,
        microWarp: 0.010,
        iridescenceStrength: 0.25,
        iridescenceScale: 12,
        exposure: 0.95,
        filmic: 0.80,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0,
      }}
    />
  ),
};

export const SilentOrchid: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "orchid",
        latticeMode: "rect",
        baseVisibility: 0.22,
        microGrid1: 50,
        microGrid2: 170,
        microGridStrength: 0.65,
        microWarp: 0.012,
        iridescenceStrength: 0.30,
        iridescenceScale: 14,
        exposure: 0.90,
        filmic: 0.82,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0,
      }}
    />
  ),
};

export const GhostIce: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "ice",
        latticeMode: "tri",
        baseVisibility: 0.25,
        microGrid1: 42,
        microGrid2: 140,
        microGridStrength: 0.70,
        microWarp: 0.018,
        iridescenceStrength: 0.65,
        iridescenceScale: 22,
        exposure: 1.0,
        filmic: 0.85,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0,
      }}
    />
  ),
};

// -----------------------------------------------------------------------------
// F. Custom — Brand-matched presets
// -----------------------------------------------------------------------------

/** Clawdstrike: premium gold — sparse rect grid, high exposure, pure monochrome */
export const Clawdstrike: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "amber" as PaletteMode,
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
    />
  ),
};

export const EmberGlow: Story = {
  render: () => (
    <StaticPreset
      config={{
        paletteMode: "amber",
        latticeMode: "hex",
        baseVisibility: 0.24,
        microGrid1: 48,
        microGrid2: 155,
        microGridStrength: 0.65,
        microWarp: 0.012,
        iridescenceStrength: 0.28,
        iridescenceScale: 10,
        exposure: 0.95,
        filmic: 0.82,
        grainStrength: 0,
        crtStrength: 0,
        copperStrength: 0,
      }}
    />
  ),
};
