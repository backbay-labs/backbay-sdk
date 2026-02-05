"use client";

import { cn } from "../../lib/utils";
import { getClusterConfigWithResolvedUrls } from "./config.js";
import type { ClusterHeroProps } from "./types.js";
import { VideoBackground } from "./VideoBackground.js";
import { GradientVeil } from "./GradientVeil.js";
import { ClusterAtmosphere } from "./ClusterAtmosphere.js";
import { StructuralElements } from "./StructuralElements.js";
import { BriefingPanel } from "./BriefingPanel.js";
import { SigilMonument } from "./SigilMonument.js";
import { LiveStrip } from "./LiveStrip.js";
import { ClusterRail } from "./ClusterRail.js";
import { useVideoPreload } from "./useVideoPreload.js";

/**
 * ClusterHero is the main hero component for cluster landing pages.
 * Uses a "Monument + Briefing" layout with 12-column grid:
 *
 * Layout:
 * - cols 1-4: BriefingPanel (top-left)
 * - cols 5-8: Empty space (mood/atmosphere)
 * - cols 9-12: SigilMonument (mid-right)
 * - cols 5-12, bottom: LiveStrip
 * - Bottom-left fixed: ClusterRail
 *
 * Layers (z-index order):
 * - z-0: VideoBackground
 * - z-5: StructuralElements (brackets, vignette, grid)
 * - z-10: ClusterAtmosphere
 * - z-20: GradientVeil
 * - z-30: Grid content (BriefingPanel, SigilMonument, LiveStrip, ClusterRail)
 */
export function ClusterHero({ cluster, className }: ClusterHeroProps) {
  const config = getClusterConfigWithResolvedUrls(cluster);
  const fallbackBackground = `radial-gradient(900px 600px at 65% 25%, rgba(${config.accentColorRGB}, 0.22), rgba(0,0,0,0) 62%), radial-gradient(700px 520px at 25% 78%, rgba(${config.accentColorRGB}, 0.10), rgba(0,0,0,0) 58%), #000`;

  // Preload video and poster assets for faster loading
  useVideoPreload({
    videoSrc: config.videoSrc,
    posterSrc: config.videoPoster,
  });

  return (
    <section
      className={cn(
        "relative min-h-screen h-full w-full overflow-hidden bg-black",
        className
      )}
      style={{ "--cluster-accent": config.accentColor } as React.CSSProperties}
    >
      {/* Background layers */}
      <VideoBackground
        videoSrc={config.videoSrc}
        posterSrc={config.videoPoster}
        preload={true}
        fallbackBackground={fallbackBackground}
        className="z-0"
      />
      <StructuralElements
        accentColor={config.accentColor}
        className="z-[5]"
      />
      <ClusterAtmosphere
        config={config.atmosphere}
        accentColor={config.accentColor}
        className="z-10"
      />
      <GradientVeil className="z-20" />

      {/* Briefing Panel - top-left */}
      <div
        className="absolute z-30"
        style={{ top: '80px', left: '48px', maxWidth: '380px' }}
      >
        <BriefingPanel
          description={config.description}
          capabilities={config.capabilities}
          fastPath={config.fastPath}
          status={config.status}
          accentColor={config.accentColor}
        />
      </div>

      {/* Sigil Monument - right center */}
      <div
        className="absolute z-30"
        style={{ top: '50%', right: '80px', transform: 'translateY(-50%)' }}
      >
        <SigilMonument
          name={config.name}
          tagline={config.tagline}
          latinMotto={config.latinMotto}
          sigilSrc={config.sigilSrc}
          accentColor={config.accentColor}
        />
      </div>

      {/* Live Strip - bottom center */}
      <div
        className="absolute z-30"
        style={{ bottom: '80px', left: '50%', transform: 'translateX(-50%)', maxWidth: '600px', width: '100%' }}
      >
        <LiveStrip
          moduleType={config.liveModule}
          content={config.liveContent}
          accentColor={config.accentColor}
        />
      </div>

      {/* Cluster Rail - bottom-left */}
      <div
        className="absolute z-40"
        style={{ bottom: '32px', left: '48px', maxWidth: '280px' }}
      >
        <ClusterRail
          name={config.name}
          tagline={config.tagline}
          metrics={config.metrics}
          buttons={config.buttons}
          accentColor={config.accentColor}
        />
      </div>
    </section>
  );
}

export default ClusterHero;
