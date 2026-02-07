"use client";

import type { Meta, StoryObj } from "@storybook/react";
import {
  prefersReducedTransparency,
  usePrefersReducedTransparency,
  usePrefersReducedMotion,
} from "./accessibility";

function ReducedTransparencyDemo() {
  const reduceTransparency = usePrefersReducedTransparency();
  const reduceMotion = usePrefersReducedMotion();
  const staticValue = prefersReducedTransparency();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: 32,
        maxWidth: 520,
        fontFamily: "monospace",
        color: "#e2e8f0",
      }}
    >
      {/* Status indicators */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 16,
          borderRadius: 12,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>
          Current Preferences
        </h3>

        <StatusRow
          label="prefers-reduced-transparency"
          value={reduceTransparency}
        />
        <StatusRow
          label="prefers-reduced-motion"
          value={reduceMotion}
        />
        <StatusRow
          label="prefersReducedTransparency() (static)"
          value={staticValue}
        />
      </div>

      {/* Glass demo panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>
          Glass Panel Demo
        </h3>
        <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
          This panel switches from glass (transparent + blur) to solid when
          reduced transparency is active.
        </p>

        <div
          style={{
            position: "relative",
            borderRadius: 16,
            padding: 24,
            border: "1px solid rgba(255,255,255,0.12)",
            ...(reduceTransparency
              ? {
                  background: "#1e293b",
                  backdropFilter: "none",
                }
              : {
                  background: "rgba(15, 23, 42, 0.6)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                }),
            transition: reduceMotion ? "none" : "all 300ms ease",
          }}
        >
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <strong>
              {reduceTransparency ? "Solid mode" : "Glass mode"}
            </strong>
            <br />
            {reduceTransparency
              ? "Transparency is disabled. Background is opaque with no backdrop-filter blur."
              : "Transparency is enabled. Background is semi-transparent with backdrop-filter blur."}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: "rgba(56, 189, 248, 0.06)",
          border: "1px solid rgba(56, 189, 248, 0.15)",
          fontSize: 11,
          lineHeight: 1.7,
          color: "#94a3b8",
        }}
      >
        <strong style={{ color: "#38bdf8" }}>How to test</strong>
        <br />
        <br />
        <strong>Chrome DevTools:</strong> Open DevTools &rarr; Rendering tab
        &rarr; "Emulate CSS media feature prefers-reduced-transparency" &rarr;
        select "reduce".
        <br />
        <br />
        <strong>macOS:</strong> System Settings &rarr; Accessibility &rarr;
        Display &rarr; "Reduce transparency".
        <br />
        <br />
        <strong>Note:</strong> Browser support for{" "}
        <code>prefers-reduced-transparency</code> is limited (Safari 16.4+,
        Firefox 113+). Chrome 118+ supports it behind a flag.
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 12 }}>{label}</span>
      <span
        style={{
          fontSize: 11,
          padding: "2px 8px",
          borderRadius: 6,
          background: value
            ? "rgba(52, 211, 153, 0.15)"
            : "rgba(248, 113, 113, 0.15)",
          color: value ? "#34d399" : "#f87171",
          fontWeight: 600,
        }}
      >
        {value ? "true" : "false"}
      </span>
    </div>
  );
}

const meta: Meta = {
  title: "Accessibility/ReducedTransparency",
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <ReducedTransparencyDemo />,
};
