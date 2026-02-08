"use client";

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import type { ClusterRailProps, ButtonConfig } from "./types.js";

// ============================================================================
// Animation Variants
// ============================================================================

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const fadeUpTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1],
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

// ============================================================================
// Sub-components
// ============================================================================

function ClusterName({ name }: { name: string }) {
  return (
    <motion.h2
      variants={fadeUpVariants}
      className="text-4xl md:text-5xl lg:text-6xl font-semibold uppercase text-white"
      style={{
        fontVariant: "small-caps",
        letterSpacing: "0.12em",
      }}
    >
      {name}
    </motion.h2>
  );
}

function Tagline({ text }: { text: string }) {
  return (
    <motion.p
      variants={fadeUpVariants}
      className="text-lg md:text-xl text-white/70 font-light italic leading-relaxed mt-3"
    >
      {text}
    </motion.p>
  );
}

function MetricsRow({
  metrics,
}: {
  metrics: { realms: number; output24h: string; rank?: number };
}) {
  const formattedRealms = metrics.realms.toLocaleString();

  return (
    <motion.div
      variants={fadeUpVariants}
      className="flex items-center gap-2 font-mono text-xs text-white/50 mt-4 tracking-wide"
    >
      <span>{formattedRealms} realms</span>
      <span className="text-white/30">•</span>
      <span>{metrics.output24h} output</span>
      {metrics.rank !== undefined && (
        <>
          <span className="text-white/30">•</span>
          <span>Rank #{metrics.rank}</span>
        </>
      )}
    </motion.div>
  );
}

function RailButton({ button }: { button: ButtonConfig }) {
  const baseClasses =
    "w-full px-6 py-3 text-sm font-medium tracking-wider uppercase transition-all duration-300 text-center";

  const variantClasses: Record<ButtonConfig["variant"], string> = {
    primary: "text-neutral-900 hover:brightness-110 hover:scale-[1.02]",
    secondary:
      "bg-transparent border hover:bg-[var(--cluster-accent)]/10",
    ghost:
      "bg-transparent border-none text-white/50 hover:text-white/80",
  };

  const variantStyles: Record<ButtonConfig["variant"], React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--cluster-accent)",
    },
    secondary: {
      borderColor: "var(--cluster-accent)",
      color: "var(--cluster-accent)",
    },
    ghost: {},
  };

  return (
    <motion.a
      variants={fadeUpVariants}
      href={button.href}
      className={cn(baseClasses, variantClasses[button.variant])}
      style={variantStyles[button.variant]}
      {...(button.external && {
        target: "_blank",
        rel: "noopener noreferrer",
      })}
    >
      {button.label}
    </motion.a>
  );
}

function ButtonStack({ buttons }: { buttons: ButtonConfig[] }) {
  return (
    <div className="flex flex-col gap-3 mt-8 w-full max-w-xs">
      {buttons.map((button) => (
        <RailButton key={button.label} button={button} />
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ClusterRail renders the bottom-left cluster identity panel with:
 * - Cluster name in small caps with wide tracking
 * - Italic tagline at reduced opacity
 * - Metrics row with dot separators (monospace)
 * - Vertically stacked CTA buttons (primary/secondary/ghost)
 *
 * Uses CSS variable --cluster-accent for theming.
 */
export function ClusterRail({
  name,
  tagline,
  metrics,
  buttons,
  accentColor,
  className,
}: ClusterRailProps) {
  return (
    <motion.aside
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn("flex flex-col items-start", className)}
      style={
        {
          "--cluster-accent": accentColor,
        } as React.CSSProperties
      }
    >
      <ClusterName name={name} />
      <Tagline text={tagline} />
      <MetricsRow metrics={metrics} />
      <ButtonStack buttons={buttons} />
    </motion.aside>
  );
}

export default ClusterRail;
