"use client";

import { motion } from "framer-motion";
import * as React from "react";
import { cn, prefersReducedMotion } from "../../../lib/utils";
import { useElevationTokens, useGlassTokens } from "../../../theme";

// ============================================================================
// TYPES
// ============================================================================

export interface GlassNavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface GlassNavigationProps {
  brand?: React.ReactNode;
  items: GlassNavigationItem[];
  activeId?: string;
  onItemClick?: (id: string) => void;
  actions?: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

// ============================================================================
// GLASS NAVIGATION
// ============================================================================

export function GlassNavigation({
  brand,
  items,
  activeId,
  onItemClick,
  actions,
  sticky = false,
  className,
}: GlassNavigationProps) {
  const glassTokens = useGlassTokens();
  const elevationTokens = useElevationTokens();
  const reducedMotion = prefersReducedMotion();

  return (
    <nav
      className={cn(
        "relative flex w-full items-center select-none z-10",
        sticky && "sticky top-0",
        className,
      )}
      style={{
        backdropFilter: `blur(${glassTokens.panelBlur ?? "24px"})`,
        WebkitBackdropFilter: `blur(${glassTokens.panelBlur ?? "24px"})`,
        background: glassTokens.panelBg,
        borderBottom: `1px solid ${glassTokens.panelBorder}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.02), ${elevationTokens.softDrop}`,
      }}
      role="navigation"
    >
      {/* Brand area */}
      {brand && (
        <div className="flex-shrink-0 flex items-center px-5 h-12">
          {brand}
        </div>
      )}

      {/* Nav items */}
      <div className="relative flex items-center gap-1 h-12 px-2" role="menubar">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                item.onClick?.();
                onItemClick?.(item.id);
              }}
              className={cn(
                "relative flex items-center gap-2 px-3 h-full text-sm transition-colors",
                "font-mono uppercase tracking-[0.06em] text-[11px]",
                isActive
                  ? "text-[var(--glia-color-text-primary,#E2E8F0)]"
                  : "text-[var(--glia-color-text-soft,#64748B)] hover:text-[var(--glia-color-text-primary,#E2E8F0)]",
              )}
              style={{
                background: isActive ? undefined : undefined,
              }}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon && (
                <span className="flex-shrink-0 flex items-center justify-center w-4 h-4">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>

              {/* Active indicator — animated underline */}
              {isActive && (
                <motion.div
                  layoutId="glass-nav-active-indicator"
                  className="absolute bottom-0 left-2 right-2 h-[2px]"
                  style={{
                    background: glassTokens.activeBorder,
                    boxShadow: `0 0 8px ${glassTokens.activeBorder}, 0 0 16px ${glassTokens.activeBorder}`,
                  }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 400, damping: 30 }
                  }
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions area */}
      {actions && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 h-12">
          {actions}
        </div>
      )}
    </nav>
  );
}
