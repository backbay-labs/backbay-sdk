"use client";

import { cn, prefersReducedMotion } from "../../../lib/utils";
import { motion } from "framer-motion";
import React from "react";
import { GlowButton } from "../../atoms/GlowButton";

// ============================================================================
// TYPES
// ============================================================================

export interface GlassEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Large centered icon */
  icon: React.ReactNode;
  /** Monospace uppercase title */
  title: string;
  /** Description text */
  description?: string;
  /** CTA callback */
  action?: () => void;
  /** CTA label */
  actionLabel?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GlassEmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  className,
  ...props
}: GlassEmptyStateProps) {
  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !reducedMotion;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl px-8 py-12 text-center",
        className
      )}
      style={{
        background: "rgba(2,4,10,0.6)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
      {...props}
    >
      {/* Floating icon */}
      <motion.div
        className="flex items-center justify-center text-[var(--glia-color-text-soft,#64748B)] [&>svg]:h-12 [&>svg]:w-12 opacity-40"
        animate={
          shouldAnimate
            ? { y: [0, -6, 0] }
            : undefined
        }
        transition={
          shouldAnimate
            ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      >
        {icon}
      </motion.div>

      {/* Title */}
      <h3 className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--glia-color-text-primary,#CBD5E1)]">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="max-w-sm text-sm text-[var(--glia-color-text-soft,#64748B)]">
          {description}
        </p>
      )}

      {/* CTA */}
      {action && actionLabel && (
        <GlowButton variant="outline" size="sm" onClick={action}>
          {actionLabel}
        </GlowButton>
      )}
    </div>
  );
}
