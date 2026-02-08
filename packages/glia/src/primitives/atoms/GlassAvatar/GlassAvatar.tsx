"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, prefersReducedMotion } from "../../../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import React from "react";

// ============================================================================
// VARIANTS
// ============================================================================

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-14 w-14",
        xl: "h-20 w-20",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const fallbackFontSize = {
  xs: "text-[8px]",
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base",
} as const;

// ============================================================================
// STATUS DOT
// ============================================================================

const statusColors = {
  online: "bg-emerald-400",
  offline: "bg-neutral-600",
  busy: "bg-red-400",
  away: "bg-yellow-400",
} as const;

function StatusDot({
  status,
  size,
}: {
  status: "online" | "offline" | "busy" | "away";
  size: keyof typeof sizeMap;
}) {
  const reducedMotion = prefersReducedMotion();
  const dotSize = size === "xs" || size === "sm" ? "h-2 w-2" : "h-3 w-3";
  const offset = size === "xs" || size === "sm" ? "-right-0 -bottom-0" : "-right-0.5 -bottom-0.5";

  return (
    <span
      className={cn(
        "absolute rounded-full border-2 border-[rgba(2,4,10,0.95)]",
        dotSize,
        offset,
        statusColors[status]
      )}
      style={
        status === "online" && !reducedMotion
          ? {
              boxShadow: "0 0 6px rgba(52,211,153,0.7), 0 0 12px rgba(52,211,153,0.4)",
              animation: "glass-avatar-breathe 2s ease-in-out infinite",
            }
          : undefined
      }
    />
  );
}

// ============================================================================
// TYPES
// ============================================================================

export type AvatarSize = keyof typeof sizeMap;
export type AvatarStatus = "online" | "offline" | "busy" | "away";

export interface GlassAvatarProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof avatarVariants> {
  /** Image source URL */
  src?: string;
  /** Alt text for image */
  alt?: string;
  /** Fallback text (e.g. initials) */
  fallback?: string;
  /** Online status indicator */
  status?: AvatarStatus;
  /** Show neon ring border */
  showRing?: boolean;
  /** Ring glow color */
  ringColor?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GlassAvatar = React.forwardRef<HTMLSpanElement, GlassAvatarProps>(
  function GlassAvatar(
    {
      className,
      size = "md",
      src,
      alt = "",
      fallback,
      status,
      showRing = false,
      ringColor,
      style,
      ...props
    },
    ref
  ) {
    const effectiveSize = size ?? "md";
    const ringStyle = showRing
      ? {
          boxShadow: `0 0 0 2px rgba(2,4,10,0.95), 0 0 0 3px ${ringColor ?? "hsl(var(--cyan-neon))"}, 0 0 12px ${ringColor ?? "hsl(var(--cyan-neon))"}40`,
        }
      : undefined;

    return (
      <span
        ref={ref}
        className={cn("relative inline-block", className)}
        style={style}
        {...props}
      >
        <AvatarPrimitive.Root
          className={cn(avatarVariants({ size }))}
          style={{
            ...ringStyle,
            background: "rgba(2,4,10,0.85)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <AvatarPrimitive.Image
            src={src}
            alt={alt}
            className="h-full w-full rounded-full object-cover"
          />
          <AvatarPrimitive.Fallback
            className={cn(
              "flex h-full w-full items-center justify-center rounded-full font-mono uppercase tracking-[0.12em]",
              fallbackFontSize[effectiveSize],
              "bg-[rgba(2,4,10,0.85)] text-[hsl(var(--cyan-neon))]"
            )}
            delayMs={src ? 600 : 0}
          >
            {fallback ?? alt?.charAt(0)?.toUpperCase() ?? "?"}
          </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>
        {status && <StatusDot status={status} size={effectiveSize} />}
        <style>{`
          @keyframes glass-avatar-breathe {
            0%, 100% { box-shadow: 0 0 6px rgba(52,211,153,0.7), 0 0 12px rgba(52,211,153,0.4); }
            50% { box-shadow: 0 0 10px rgba(52,211,153,0.9), 0 0 20px rgba(52,211,153,0.6); }
          }
        `}</style>
      </span>
    );
  }
);
