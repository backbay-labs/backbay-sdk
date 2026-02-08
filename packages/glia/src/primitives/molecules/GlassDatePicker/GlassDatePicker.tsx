"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { AlertCircle, Calendar } from "lucide-react";

import { cn, prefersReducedMotion } from "../../../lib/utils";

// ============================================================================
// VARIANTS
// ============================================================================

const dateInputVariants = cva(
  [
    "flex w-full items-center rounded-md border px-3 py-2",
    "bg-[rgba(2,4,10,0.85)] backdrop-blur-xl",
    "text-sm font-mono text-foreground tabular-nums",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
    "ring-offset-background transition-all duration-200",
    "focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2",
    "[&:has(:disabled)]:cursor-not-allowed [&:has(:disabled)]:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-white/[0.06] focus-within:border-cyan-neon focus-within:ring-cyan-neon/30 focus-within:shadow-[0_0_20px_hsl(var(--cyan-neon)/0.15)]",
        error:
          "border-destructive/60 focus-within:border-destructive focus-within:ring-destructive/30",
        success:
          "border-emerald-neon/40 focus-within:border-emerald-neon focus-within:ring-emerald-neon/30",
      },
      size: {
        default: "h-10",
        sm: "h-9 text-xs",
        lg: "h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// ============================================================================
// TYPES
// ============================================================================

export interface GlassDatePickerProps
  extends VariantProps<typeof dateInputVariants> {
  /** Input label */
  label?: string;
  /** Helper description text */
  description?: string;
  /** Error message */
  error?: string;
  /** Date value (YYYY-MM-DD) */
  value?: string;
  /** Default date value */
  defaultValue?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Min date (YYYY-MM-DD) */
  min?: string;
  /** Max date (YYYY-MM-DD) */
  max?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Input type: date or date range */
  mode?: "single" | "range";
  /** Range end value (YYYY-MM-DD), only used when mode="range" */
  endValue?: string;
  /** Default end value */
  defaultEndValue?: string;
  /** Range end change handler */
  onEndChange?: (value: string) => void;
  /** Disable glow animations */
  disableAnimations?: boolean;
  /** Container class name */
  containerClassName?: string;
  /** Input class name */
  className?: string;
  /** HTML id */
  id?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GlassDatePicker({
  className,
  containerClassName,
  variant,
  size,
  label,
  description,
  error,
  value,
  defaultValue,
  onChange,
  min,
  max,
  disabled = false,
  mode = "single",
  endValue,
  defaultEndValue,
  onEndChange,
  disableAnimations = false,
  id,
}: GlassDatePickerProps) {
  const internalId = React.useId();
  const finalId = id || internalId;
  const descriptionId = `${finalId}-description`;
  const errorId = `${finalId}-error`;
  const endId = `${finalId}-end`;

  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  const finalVariant = error ? "error" : variant;

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {/* Label */}
      {label && (
        <motion.label
          htmlFor={finalId}
          className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono"
          initial={shouldAnimate ? { opacity: 0, y: -5 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
      )}

      {/* Date input(s) */}
      <motion.div
        className="flex items-center gap-2"
        initial={shouldAnimate ? { opacity: 0, scale: 0.98 } : {}}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <div
          className={cn(
            dateInputVariants({ variant: finalVariant, size }),
            "gap-2",
            className
          )}
        >
          <Calendar className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          <input
            id={finalId}
            type="date"
            value={value}
            defaultValue={defaultValue}
            min={min}
            max={max}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              "w-full bg-transparent outline-none font-mono tabular-nums",
              "text-foreground placeholder:text-muted-foreground/60",
              "[color-scheme:dark]",
              "disabled:cursor-not-allowed"
            )}
            aria-describedby={
              description || error
                ? `${description ? descriptionId : ""} ${error ? errorId : ""}`.trim()
                : undefined
            }
            aria-invalid={error ? "true" : undefined}
          />
        </div>

        {mode === "range" && (
          <>
            <span className="text-xs text-muted-foreground/60 font-mono uppercase tracking-wider shrink-0">
              to
            </span>
            <div
              className={cn(
                dateInputVariants({ variant: finalVariant, size }),
                "gap-2"
              )}
            >
              <Calendar className="h-4 w-4 text-muted-foreground/60 shrink-0" />
              <input
                id={endId}
                type="date"
                value={endValue}
                defaultValue={defaultEndValue}
                min={min}
                max={max}
                disabled={disabled}
                onChange={(e) => onEndChange?.(e.target.value)}
                className={cn(
                  "w-full bg-transparent outline-none font-mono tabular-nums",
                  "text-foreground placeholder:text-muted-foreground/60",
                  "[color-scheme:dark]",
                  "disabled:cursor-not-allowed"
                )}
                aria-label="End date"
              />
            </div>
          </>
        )}
      </motion.div>

      {/* Description */}
      {description && !error && (
        <motion.p
          id={descriptionId}
          className="text-xs text-muted-foreground"
          initial={shouldAnimate ? { opacity: 0, y: 5 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          {description}
        </motion.p>
      )}

      {/* Error message */}
      {error && (
        <motion.p
          id={errorId}
          className="text-xs text-destructive flex items-center gap-1"
          initial={shouldAnimate ? { opacity: 0, y: 5 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </motion.p>
      )}
    </div>
  );
}
