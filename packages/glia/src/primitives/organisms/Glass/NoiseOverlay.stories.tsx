"use client";

import type { Meta, StoryObj } from "@storybook/react";
import { NoiseOverlay, type NoiseOverlayProps } from "./NoiseOverlay";
import { NOISE_PRESETS, type NoisePreset } from "../../../lib/noise";

const DarkWrapper = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#02040a", padding: 40, minHeight: 400 }}>
    {children}
  </div>
);

function GlassBox({
  children,
  label,
  width = 260,
  height = 180,
}: {
  children?: React.ReactNode;
  label?: string;
  width?: number;
  height?: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 16,
        background: "rgba(4, 8, 16, 0.94)",
        border: "1px solid rgba(34, 211, 238, 0.12)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
      {label && (
        <span
          style={{
            position: "relative",
            zIndex: 2,
            color: "#94A3B8",
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

const meta: Meta<NoiseOverlayProps> = {
  title: "Glass/NoiseOverlay",
  component: NoiseOverlay,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
};

export default meta;

type Story = StoryObj<NoiseOverlayProps>;

/** Default NoiseOverlay with the 'glass' preset on a dark glass surface. */
export const Default: Story = {
  render: () => (
    <DarkWrapper>
      <GlassBox label="glass preset">
        <NoiseOverlay preset="glass" />
      </GlassBox>
    </DarkWrapper>
  ),
};

/** Side-by-side comparison of all four presets. */
export const Presets: Story = {
  render: () => (
    <DarkWrapper>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {(Object.keys(NOISE_PRESETS) as NoisePreset[]).map((preset) => (
          <GlassBox key={preset} label={preset}>
            <NoiseOverlay preset={preset} />
          </GlassBox>
        ))}
      </div>
    </DarkWrapper>
  ),
};

/** Interactive story with adjustable noise parameters. */
export const CustomConfig: Story = {
  args: {
    config: {
      baseFrequency: 0.8,
      numOctaves: 3,
      opacity: 0.06,
      seed: 2,
      size: 200,
    },
  },
  argTypes: {
    config: { control: "object" },
    opacity: { control: { type: "range", min: 0, max: 0.3, step: 0.01 } },
    blendMode: {
      control: "select",
      options: ["overlay", "soft-light", "screen", "multiply", "normal"],
    },
  },
  render: (args) => (
    <DarkWrapper>
      <GlassBox width={400} height={300} label="custom config">
        <NoiseOverlay {...args} />
      </GlassBox>
    </DarkWrapper>
  ),
};

/** NoiseOverlay inside a mock GlassPanel (styled div, no provider dependency). */
export const OnGlassPanel: Story = {
  render: () => (
    <DarkWrapper>
      <div
        style={{
          position: "relative",
          width: 360,
          minHeight: 240,
          borderRadius: 16,
          background: "rgba(4, 8, 16, 0.94)",
          border: "1px solid rgba(34, 211, 238, 0.12)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow:
            "0 8px 32px rgba(2, 4, 8, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.02)",
          overflow: "hidden",
          padding: 24,
        }}
      >
        <NoiseOverlay preset="glass" />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              paddingBottom: 12,
              marginBottom: 16,
              background:
                "linear-gradient(to right, rgba(255,255,255,0.025), rgba(255,255,255,0.015), transparent)",
              marginLeft: -24,
              marginRight: -24,
              marginTop: -24,
              padding: "12px 24px",
            }}
          >
            <span
              style={{
                color: "#E5E7EB",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Panel Header
            </span>
          </div>
          <p
            style={{
              color: "#94A3B8",
              fontSize: 12,
              lineHeight: 1.6,
              fontFamily: "monospace",
              margin: 0,
            }}
          >
            This mock GlassPanel has a NoiseOverlay with the &quot;glass&quot;
            preset applied. The noise adds subtle grain texture that enhances
            the frosted-glass effect.
          </p>
        </div>
      </div>
    </DarkWrapper>
  ),
};

/** Compare different blend modes side by side. */
export const BlendModes: Story = {
  render: () => {
    const modes: React.CSSProperties["mixBlendMode"][] = [
      "overlay",
      "soft-light",
      "screen",
      "multiply",
    ];
    return (
      <DarkWrapper>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {modes.map((mode) => (
            <GlassBox key={mode} label={mode}>
              <NoiseOverlay preset="card" blendMode={mode} />
            </GlassBox>
          ))}
        </div>
      </DarkWrapper>
    );
  },
};
