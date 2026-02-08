"use client";

import { cn, formatNumber, prefersReducedMotion } from "../../../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import React, { useEffect, useRef } from "react";

// ============================================================================
// VARIANTS
// ============================================================================

const glassDataCardVariants = cva(
  "relative flex flex-col justify-between rounded-xl border backdrop-blur-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card/30 border-border/30",
        success: "bg-emerald-400/5 border-emerald-400/20",
        warning: "bg-yellow-500/5 border-yellow-500/20",
        danger: "bg-destructive/5 border-destructive/20",
        accent: "bg-cyan-400/5 border-cyan-400/20",
      },
      size: {
        compact: "p-3 min-h-[100px]",
        default: "p-4 min-h-[130px]",
        expanded: "p-6 min-h-[160px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// ============================================================================
// GLOW COLOR MAP
// ============================================================================

const glowColorMap: Record<string, string> = {
  default: "rgba(34,211,238,0.15)",
  success: "rgba(52,211,153,0.15)",
  warning: "rgba(234,179,8,0.15)",
  danger: "rgba(239,68,68,0.15)",
  accent: "rgba(34,211,238,0.15)",
};

// ============================================================================
// TYPES
// ============================================================================

export interface GlassDataCardProps
  extends Omit<
      React.HTMLAttributes<HTMLDivElement>,
      | "children"
      | "onDrag"
      | "onDragEnd"
      | "onDragEnter"
      | "onDragExit"
      | "onDragLeave"
      | "onDragOver"
      | "onDragStart"
      | "onDrop"
      | "onAnimationStart"
      | "onAnimationEnd"
      | "onAnimationIteration"
    >,
    VariantProps<typeof glassDataCardVariants> {
  /** Card label */
  label: string;
  /** Display value (e.g. "$45.2K") */
  value: string;
  /** Numeric value for counting animation */
  numericValue?: number;
  /** Value prefix for animated counting */
  prefix?: string;
  /** Value suffix for animated counting */
  suffix?: string;
  /** Trend percentage (positive = up, negative = down, 0 = neutral) */
  trend?: number;
  /** Sparkline data points */
  sparklineData?: number[];
  /** Loading state */
  loading?: boolean;
  /** Disable animations */
  disableAnimations?: boolean;
  /** Click handler */
  onClick?: () => void;
}

// ============================================================================
// SPARKLINE
// ============================================================================

function Sparkline({ data, variant }: { data: number[]; variant?: string | null }) {
  if (data.length < 2) return null;

  const width = 80;
  const height = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((point - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const path = `M ${points.join(" L ")}`;
  const strokeColor =
    variant === "success"
      ? "text-emerald-neon/60"
      : variant === "danger"
        ? "text-destructive/60"
        : "text-cyan-neon/60";

  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;

  return (
    <svg width={width} height={height} className={strokeColor}>
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={width} cy={lastY} r="2" fill="currentColor" />
    </svg>
  );
}

// ============================================================================
// ANIMATED VALUE
// ============================================================================

function AnimatedValue({
  numericValue,
  prefix,
  suffix,
  displayValue,
  shouldAnimate,
}: {
  numericValue?: number;
  prefix?: string;
  suffix?: string;
  displayValue: string;
  shouldAnimate: boolean;
}) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => {
    if (numericValue === undefined) return displayValue;
    return `${prefix ?? ""}${formatNumber(Math.round(v))}${suffix ?? ""}`;
  });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!shouldAnimate || numericValue === undefined) return;
    const controls = animate(motionVal, numericValue, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [numericValue, shouldAnimate, motionVal]);

  if (!shouldAnimate || numericValue === undefined) {
    return <span>{displayValue}</span>;
  }

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

// ============================================================================
// GLASS DATA CARD
// ============================================================================

export function GlassDataCard({
  className,
  variant,
  size,
  label,
  value,
  numericValue,
  prefix,
  suffix,
  trend,
  sparklineData,
  loading = false,
  disableAnimations = false,
  onClick,
  ...props
}: GlassDataCardProps) {
  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  const trendDirection =
    trend !== undefined
      ? trend > 0
        ? "up"
        : trend < 0
          ? "down"
          : "neutral"
      : null;

  const TrendIcon =
    trendDirection === "up"
      ? TrendingUp
      : trendDirection === "down"
        ? TrendingDown
        : Minus;

  const trendColor =
    trendDirection === "up"
      ? "text-emerald-neon"
      : trendDirection === "down"
        ? "text-destructive"
        : "text-cyan-neon";

  const variantKey = variant ?? "default";

  return (
    <motion.div
      className={cn(
        glassDataCardVariants({ variant, size }),
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : {}}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={
        shouldAnimate
          ? {
              boxShadow: `0 0 20px ${glowColorMap[variantKey]}, inset 0 1px 0 rgba(255,255,255,0.02)`,
              scale: onClick ? 1.02 : 1,
              transition: { duration: 0.2 },
            }
          : {}
      }
      {...props}
    >
      {/* Label */}
      <motion.span
        className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground leading-none"
        initial={shouldAnimate ? { opacity: 0, x: -10 } : {}}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {label}
      </motion.span>

      {/* Value + Trend row */}
      <div className="flex items-end justify-between flex-1 mt-2">
        <motion.div
          className="space-y-1"
          initial={shouldAnimate ? { opacity: 0, y: 10 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {loading ? (
            <div className="h-8 w-24 bg-muted/20 rounded animate-pulse" />
          ) : (
            <div className="text-3xl font-bold text-foreground tabular-nums leading-none">
              <AnimatedValue
                numericValue={numericValue}
                prefix={prefix}
                suffix={suffix}
                displayValue={value}
                shouldAnimate={shouldAnimate}
              />
            </div>
          )}
        </motion.div>

        {/* Trend indicator */}
        {trendDirection && !loading && (
          <motion.div
            className={cn("flex items-center gap-1 text-xs", trendColor)}
            initial={shouldAnimate ? { opacity: 0, x: 10 } : {}}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <TrendIcon className="h-3 w-3" />
            <span className="font-medium tabular-nums">
              {Math.abs(trend!).toFixed(1)}%
            </span>
          </motion.div>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && !loading && (
        <motion.div
          className="flex justify-end mt-2"
          initial={shouldAnimate ? { opacity: 0, scaleX: 0 } : {}}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Sparkline data={sparklineData} variant={variant} />
        </motion.div>
      )}

      {/* Loading shimmer */}
      {loading && shouldAnimate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent rounded-xl"
          animate={{ x: [-100, 100] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
