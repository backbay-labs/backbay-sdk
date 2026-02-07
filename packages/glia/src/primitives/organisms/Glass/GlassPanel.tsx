"use client";

import { cn } from "../../../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import * as React from "react";
import { usePrefersReducedTransparency } from "../../../lib/accessibility";
import { useElevationTokens, useGlassTokens, useMotionTokens } from "../../../theme";
import {
  getGlassMaterial,
  buildBackdropFilter,
  getReducedTransparencyStyles,
  type GlassMaterialId,
} from "../../../theme/materials";
import { NoiseOverlay } from "./NoiseOverlay";

// ============================================================================
// GLASS PANEL VARIANTS
// ============================================================================

const glassPanelVariants = cva("relative overflow-hidden", {
  variants: {
    variant: {
      /** Standard panel surface */
      default: "rounded-xl",
      /** Larger, more prominent panel */
      prominent: "rounded-2xl",
      /** Subtle card within a panel */
      card: "rounded-lg",
      /** Full-bleed panel (no rounding) */
      flush: "rounded-none",
    },
    elevation: {
      /** Flat, no shadow */
      none: "",
      /** Subtle drop shadow */
      soft: "",
      /** HUD panel shadow */
      hud: "",
      /** Modal/overlay shadow */
      modal: "",
    },
    interactive: {
      true: "cursor-pointer",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    elevation: "soft",
    interactive: false,
  },
});

// ============================================================================
// TYPES
// ============================================================================

export interface GlassPanelProps
  extends Omit<HTMLMotionProps<"div">, "children">, VariantProps<typeof glassPanelVariants> {
  children: React.ReactNode;
  /** Show hover glow effect */
  showHoverGlow?: boolean;
  /** Show active state styling */
  isActive?: boolean;
  /** Disable animations */
  disableAnimations?: boolean;
  /** Custom background override */
  background?: string;
  /** Custom border override */
  border?: string;
  /** As container element */
  as?: "div" | "section" | "article" | "aside" | "nav";
  /** Glass material preset. Controls blur, opacity, noise, saturate, brightness. */
  material?: GlassMaterialId;
  /** Show noise texture overlay. Defaults to material's setting. */
  showNoise?: boolean;
  /** Noise opacity override (0-1) */
  noiseOpacity?: number;
  /** Force reduced transparency mode (overrides system preference) */
  forceReducedTransparency?: boolean;
}

// ============================================================================
// HOVER GLOW COMPONENT
// ============================================================================

interface HoverGlowProps {
  isHovered: boolean;
  intensity?: "subtle" | "medium";
  color?: string;
}

function HoverGlow({ isHovered, intensity = "subtle", color }: HoverGlowProps) {
  const motionTokens = useMotionTokens();
  const glassTokens = useGlassTokens();
  const opacityMax = intensity === "subtle" ? 0.35 : 0.5;

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: isHovered ? opacityMax : 0,
        scale: isHovered ? 1.05 : 0.95,
      }}
      transition={motionTokens.normal}
      className="pointer-events-none absolute inset-0 -z-10 blur-3xl"
      style={{
        background: `radial-gradient(ellipse at center, ${
          color ?? glassTokens.hoverBg
        }, transparent 70%)`,
      }}
    />
  );
}

// ============================================================================
// GLASS PANEL
// ============================================================================

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(function GlassPanel(
  {
    children,
    className,
    variant,
    elevation,
    interactive,
    showHoverGlow = false,
    isActive = false,
    disableAnimations = false,
    background,
    border,
    style,
    as: Component = "div",
    material,
    showNoise,
    noiseOpacity,
    forceReducedTransparency,
    onMouseEnter,
    onMouseLeave,
    ...props
  },
  ref
) {
  const glassTokens = useGlassTokens();
  const elevationTokens = useElevationTokens();
  const motionTokens = useMotionTokens();
  const [isHovered, setIsHovered] = React.useState(false);

  const reducedTransparency = usePrefersReducedTransparency();
  const isReducedTransparency = forceReducedTransparency ?? reducedTransparency;

  // Material system: only active when `material` prop is explicitly set
  const mat = material != null ? getGlassMaterial(material) : null;
  const rtOverrides = mat && isReducedTransparency ? getReducedTransparencyStyles(mat) : null;

  // Compute backdrop filter
  const defaultBlur = `blur(${glassTokens.panelBlur ?? "24px"})`;
  const effectiveBackdropFilter = mat
    ? rtOverrides
      ? rtOverrides.backdropFilter
      : buildBackdropFilter(mat)
    : isReducedTransparency
      ? "none"
      : defaultBlur;

  // Compute background (when material is set and no explicit background override)
  const effectiveBackground = background ?? glassTokens.panelBg;

  // Compute noise visibility
  const effectiveShowNoise = showNoise ?? (rtOverrides ? rtOverrides.showNoise : mat?.showNoise ?? false);
  const effectiveNoiseOpacity = noiseOpacity ?? mat?.noiseOpacity ?? 0.03;

  // Map elevation to shadow
  const shadowMap = {
    none: "none",
    soft: elevationTokens.softDrop,
    hud: elevationTokens.hudPanel,
    modal: elevationTokens.modal,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(false);
    onMouseLeave?.(e);
  };

  const motionTags = {
    div: motion.div,
    section: motion.section,
    article: motion.article,
    aside: motion.aside,
    nav: motion.nav,
  } as const;
  const MotionComponent = motionTags[Component];

  return (
    <MotionComponent
      ref={ref}
      className={cn(glassPanelVariants({ variant, elevation, interactive }), className)}
      style={{
          backdropFilter: effectiveBackdropFilter,
          WebkitBackdropFilter: effectiveBackdropFilter,
          background: effectiveBackground,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: isActive ? glassTokens.activeBorder : (border ?? glassTokens.panelBorder),
          boxShadow: isActive ? glassTokens.activeShadow : shadowMap[elevation ?? "soft"],
          ...style,
        }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={
        interactive && !disableAnimations
          ? {
              borderColor: glassTokens.activeBorder,
              transition: motionTokens.fast,
            }
          : undefined
      }
      {...props}
    >
      {effectiveShowNoise && (
        <NoiseOverlay
          preset={mat?.noisePreset ?? "glass"}
          opacity={effectiveNoiseOpacity}
        />
      )}
      {showHoverGlow && <HoverGlow isHovered={isHovered} />}
      {children}
    </MotionComponent>
  );
});

// ============================================================================
// GLASS HEADER
// ============================================================================

export interface GlassHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassHeader({ children, className, style, ...props }: GlassHeaderProps) {
  const glassTokens = useGlassTokens();

  return (
    <div
      className={cn("relative flex items-center justify-between px-4 py-3", "border-b", className)}
      style={{
        background: glassTokens.headerGradient,
        borderColor: glassTokens.cardBorder,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// GLASS CARD
// ============================================================================

export interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  /** Show hover effects */
  interactive?: boolean;
  /** Currently active/selected */
  isActive?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { children, className, interactive = false, isActive = false, style, ...props },
  ref
) {
  const glassTokens = useGlassTokens();
  const elevationTokens = useElevationTokens();
  const motionTokens = useMotionTokens();
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      ref={ref}
      className={cn("relative rounded-xl p-3", interactive && "cursor-pointer", className)}
      style={{
        background: glassTokens.cardBg,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: isActive ? glassTokens.activeBorder : glassTokens.cardBorder,
        boxShadow: isActive ? glassTokens.activeShadow : elevationTokens.softDrop,
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={
        interactive
          ? {
              borderColor: glassTokens.activeBorder,
              boxShadow: `0 4px 20px ${glassTokens.hoverBg}`,
              transition: motionTokens.fast,
            }
          : undefined
      }
      {...props}
    >
      {interactive && <HoverGlow isHovered={isHovered} intensity="subtle" />}
      {children}
    </motion.div>
  );
});

// ============================================================================
// GLASS SECTION
// ============================================================================

export interface GlassSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Section title */
  title?: string;
  /** Compact padding */
  compact?: boolean;
}

export function GlassSection({
  children,
  title,
  compact = false,
  className,
  ...props
}: GlassSectionProps) {
  return (
    <div className={cn(compact ? "p-2" : "p-4", "space-y-2", className)} {...props}>
      {title && (
        <h4 className="text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--glia-color-text-soft,#64748B)] px-1">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}
