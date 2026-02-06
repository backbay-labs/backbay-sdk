"use client";

/**
 * NoiseOverlay -- SVG grain texture overlay for glass surfaces.
 *
 * Renders an absolutely-positioned, pointer-events-none div with
 * a tiling SVG noise pattern as background-image.
 *
 * @example
 * <div style={{ position: 'relative' }}>
 *   <NoiseOverlay preset="glass" />
 *   {children}
 * </div>
 */

import * as React from "react";
import {
  NOISE_PRESETS,
  generateNoiseDataUrl,
  type NoisePreset,
  type NoiseConfig,
} from "../../../lib/noise";

export interface NoiseOverlayProps {
  /** Use a preset noise configuration */
  preset?: NoisePreset;
  /** Custom noise config (overrides preset) */
  config?: NoiseConfig;
  /** Override opacity (0-1). Overrides both preset and config opacity. */
  opacity?: number;
  /** Blend mode. Default: 'overlay' */
  blendMode?: React.CSSProperties["mixBlendMode"];
  /** Additional className */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

export const NoiseOverlay = React.memo(function NoiseOverlay({
  preset = "glass",
  config,
  opacity,
  blendMode = "overlay",
  className,
  style,
}: NoiseOverlayProps) {
  const noiseUrl = React.useMemo(
    () => (config ? generateNoiseDataUrl(config) : NOISE_PRESETS[preset]),
    [config, preset],
  );

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: `url("${noiseUrl}")`,
        backgroundRepeat: "repeat",
        backgroundSize: `${config?.size ?? 200}px ${config?.size ?? 200}px`,
        mixBlendMode: blendMode,
        opacity: opacity ?? config?.opacity ?? undefined,
        borderRadius: "inherit",
        zIndex: 1,
        ...style,
      }}
    />
  );
});
