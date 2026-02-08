"use client";

import { cn, prefersReducedMotion } from "../../../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import React from "react";

// ============================================================================
// VARIANTS
// ============================================================================

const glassBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-mono uppercase tracking-[0.12em] border transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-cyan-neon/10 text-cyan-neon border-cyan-neon/30",
        success:
          "bg-emerald-neon/10 text-emerald-neon border-emerald-neon/30",
        warning:
          "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
        error:
          "bg-red-500/10 text-red-400 border-red-500/30",
        info:
          "bg-violet-500/10 text-violet-400 border-violet-500/30",
      },
      size: {
        sm: "px-2 py-0.5 text-[9px]",
        md: "px-2.5 py-1 text-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// ============================================================================
// TYPES
// ============================================================================

export interface GlassBadgeProps
  extends Omit<
      React.HTMLAttributes<HTMLSpanElement>,
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
    VariantProps<typeof glassBadgeVariants> {
  /** Badge content */
  children: React.ReactNode;
  /** Show pulse animation */
  pulse?: boolean;
  /** Leading icon */
  icon?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GlassBadge({
  className,
  variant,
  size,
  children,
  pulse = false,
  icon,
  ...props
}: GlassBadgeProps) {
  const reducedMotion = prefersReducedMotion();
  const shouldPulse = pulse && !reducedMotion;

  return (
    <motion.span
      className={cn(glassBadgeVariants({ variant, size }), className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        ...(shouldPulse ? { boxShadow: ["0 0 0 0 currentColor", "0 0 0 4px transparent"] } : {}),
      }}
      transition={{
        duration: 0.2,
        ...(shouldPulse
          ? {
              boxShadow: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
              },
            }
          : {}),
      }}
      {...props}
    >
      {icon && <span className="flex-shrink-0 [&>svg]:h-3 [&>svg]:w-3">{icon}</span>}
      {children}
      {shouldPulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
    </motion.span>
  );
}
