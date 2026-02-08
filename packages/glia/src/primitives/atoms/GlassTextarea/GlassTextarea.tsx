"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

import { cn, prefersReducedMotion } from "../../../lib/utils";

// ============================================================================
// VARIANTS
// ============================================================================

const glassTextareaVariants = cva(
  [
    "flex w-full rounded-md border bg-[rgba(2,4,10,0.85)] backdrop-blur-xl px-3 py-2",
    "text-sm font-mono text-foreground placeholder:text-muted-foreground/60",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
    "ring-offset-background transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "resize-none",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-white/[0.06] focus-visible:border-cyan-neon focus-visible:ring-cyan-neon/30 focus-visible:shadow-[0_0_20px_hsl(var(--cyan-neon)/0.15)]",
        error:
          "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/30 focus-visible:shadow-[0_0_20px_hsl(var(--destructive)/0.15)]",
        success:
          "border-emerald-neon/40 focus-visible:border-emerald-neon focus-visible:ring-emerald-neon/30 focus-visible:shadow-[0_0_20px_hsl(var(--emerald-neon)/0.15)]",
      },
      size: {
        default: "min-h-[80px] px-3 py-2 text-sm",
        sm: "min-h-[60px] px-3 py-1.5 text-xs",
        lg: "min-h-[120px] px-4 py-3 text-sm",
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

export interface GlassTextareaProps
  extends Omit<
      React.TextareaHTMLAttributes<HTMLTextAreaElement>,
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
    VariantProps<typeof glassTextareaVariants> {
  /** Textarea label */
  label?: string;
  /** Helper description text */
  description?: string;
  /** Error message */
  error?: string;
  /** Enable auto-resize based on content */
  autoResize?: boolean;
  /** Show character count */
  showCount?: boolean;
  /** Disable glow animations */
  disableAnimations?: boolean;
  /** Container class name */
  containerClassName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GlassTextarea = React.forwardRef<
  HTMLTextAreaElement,
  GlassTextareaProps
>(function GlassTextarea(
  {
    className,
    containerClassName,
    variant,
    size,
    label,
    description,
    error,
    autoResize = false,
    showCount = false,
    maxLength,
    disableAnimations = false,
    id,
    onChange,
    value,
    defaultValue,
    ...props
  },
  ref
) {
  const internalRef = React.useRef<HTMLTextAreaElement | null>(null);
  const internalId = React.useId();
  const finalId = id || internalId;
  const descriptionId = `${finalId}-description`;
  const errorId = `${finalId}-error`;

  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  const finalVariant = error ? "error" : variant;

  const [charCount, setCharCount] = React.useState(() => {
    const initial = (value ?? defaultValue ?? "") as string;
    return initial.length;
  });

  const handleAutoResize = React.useCallback((el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (showCount || maxLength) {
        setCharCount(e.target.value.length);
      }
      if (autoResize) {
        handleAutoResize(e.target);
      }
      onChange?.(e);
    },
    [onChange, autoResize, showCount, maxLength, handleAutoResize]
  );

  // Sync charCount with controlled value
  React.useEffect(() => {
    if (value !== undefined) {
      setCharCount(String(value).length);
    }
  }, [value]);

  // Auto-resize on mount if content exists
  React.useEffect(() => {
    if (autoResize && internalRef.current) {
      handleAutoResize(internalRef.current);
    }
  }, [autoResize, handleAutoResize]);

  const setRefs = React.useCallback(
    (el: HTMLTextAreaElement | null) => {
      internalRef.current = el;
      if (typeof ref === "function") {
        ref(el);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      }
    },
    [ref]
  );

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

      {/* Textarea */}
      <motion.textarea
        ref={setRefs}
        id={finalId}
        className={cn(
          glassTextareaVariants({ variant: finalVariant, size }),
          autoResize && "overflow-hidden",
          className
        )}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={handleChange}
        aria-describedby={
          description || error
            ? `${description ? descriptionId : ""} ${error ? errorId : ""}`.trim()
            : undefined
        }
        aria-invalid={error ? "true" : undefined}
        initial={shouldAnimate ? { opacity: 0, scale: 0.98 } : {}}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        whileFocus={
          shouldAnimate
            ? { scale: 1.005, transition: { duration: 0.1 } }
            : {}
        }
        {...props}
      />

      {/* Footer row: description/error + count */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
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

        {/* Character count */}
        {showCount && (
          <motion.span
            className={cn(
              "text-xs tabular-nums font-mono",
              maxLength && charCount >= maxLength
                ? "text-destructive"
                : "text-muted-foreground/60"
            )}
            initial={shouldAnimate ? { opacity: 0 } : {}}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.3 }}
          >
            {charCount}
            {maxLength ? `/${maxLength}` : ""}
          </motion.span>
        )}
      </div>
    </div>
  );
});

GlassTextarea.displayName = "GlassTextarea";
