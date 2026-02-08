"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cn, prefersReducedMotion } from "../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import * as React from "react";
import { useGlassTokens, useElevationTokens, useMotionTokens } from "../../../theme";
import { NoiseOverlay } from "../Glass/NoiseOverlay";

// ============================================================================
// TYPES
// ============================================================================

export interface GlassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  className?: string;
}

// ============================================================================
// SIZE MAP
// ============================================================================

const sizeClasses: Record<NonNullable<GlassModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

// ============================================================================
// GLASS MODAL
// ============================================================================

export function GlassModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  className,
}: GlassModalProps) {
  const glassTokens = useGlassTokens();
  const elevationTokens = useElevationTokens();
  const motionTokens = useMotionTokens();
  const reducedMotion = prefersReducedMotion();

  const springTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 400, damping: 30 };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60"
                style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
                initial={reducedMotion ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reducedMotion ? {} : { opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
              />
            </Dialog.Overlay>

            {/* Content */}
            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)]",
                  sizeClasses[size],
                  "rounded-2xl overflow-hidden",
                  "focus:outline-none",
                  className,
                )}
                style={{
                  x: "-50%",
                  y: "-50%",
                  background: "rgba(2,4,10,0.92)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: glassTokens.panelBorder,
                  boxShadow: elevationTokens.modal,
                }}
                initial={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                transition={springTransition}
              >
                {/* Noise overlay */}
                <NoiseOverlay preset="glass" opacity={0.03} />

                {/* Decorative top gradient border */}
                <div
                  className="h-[2px] w-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #22D3EE 0%, #F43F5E 50%, transparent 100%)",
                  }}
                  aria-hidden="true"
                />

                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="relative z-10 flex items-start justify-between px-6 pt-5 pb-0">
                    <div className="flex-1 min-w-0">
                      {title && (
                        <Dialog.Title className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/90 leading-tight">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="mt-1.5 text-sm text-white/50 leading-relaxed">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {showCloseButton && (
                      <Dialog.Close asChild>
                        <button
                          className="relative z-10 ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/40 transition-all duration-200 hover:text-[#22D3EE] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/50"
                          aria-label="Close"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </Dialog.Close>
                    )}
                  </div>
                )}

                {/* Body */}
                <div className="relative z-10 px-6 py-4">{children}</div>

                {/* Footer */}
                {footer && (
                  <div
                    className="relative z-10 flex items-center justify-end gap-2 px-6 pb-5 pt-0"
                  >
                    {footer}
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
