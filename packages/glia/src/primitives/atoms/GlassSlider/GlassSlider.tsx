"use client";

import { cn, prefersReducedMotion } from "../../../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import * as SliderPrimitive from "@radix-ui/react-slider";
import React from "react";
import { useControlTokens, useColorTokens, useMotionTokens } from "../../../theme/UiThemeProvider";

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const trackVariants = cva("relative w-full grow overflow-hidden rounded-full", {
  variants: {
    size: {
      sm: "h-[4px]",
      default: "h-[6px]",
      lg: "h-[8px]",
    },
  },
  defaultVariants: { size: "default" },
});

const thumbVariants = cva(
  "block rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-[14px] w-[14px]",
        default: "h-[18px] w-[18px]",
        lg: "h-[22px] w-[22px]",
      },
    },
    defaultVariants: { size: "default" },
  }
);

// ---------------------------------------------------------------------------
// Accent color map
// ---------------------------------------------------------------------------

const accentFillMap = {
  default: undefined, // uses theme token fill
  accent: "linear-gradient(90deg, #8B5CF6, #a78bfa)",
  success: "linear-gradient(90deg, #10B981, #34d399)",
} as const;

const accentThumbMap = {
  default: undefined,
  accent: "#8B5CF6",
  success: "#10B981",
} as const;

const accentShadowMap = {
  default: undefined,
  accent: "0 0 8px rgba(139, 92, 246, 0.5)",
  success: "0 0 8px rgba(16, 185, 129, 0.5)",
} as const;

const accentHoverShadowMap = {
  default: "0 0 12px rgba(34,211,238,0.5)",
  accent: "0 0 12px rgba(139, 92, 246, 0.6)",
  success: "0 0 12px rgba(16, 185, 129, 0.6)",
} as const;

const accentFocusShadowMap = {
  default: "0 0 16px rgba(34,211,238,0.7), 0 0 4px rgba(34,211,238,0.3)",
  accent: "0 0 16px rgba(139, 92, 246, 0.7), 0 0 4px rgba(139, 92, 246, 0.3)",
  success: "0 0 16px rgba(16, 185, 129, 0.7), 0 0 4px rgba(16, 185, 129, 0.3)",
} as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GlassSliderProps
  extends Omit<React.ComponentProps<typeof SliderPrimitive.Root>, "children">,
    VariantProps<typeof trackVariants> {
  variant?: "default" | "accent" | "success";
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
  label?: string;
  showRange?: boolean;
  showValue?: boolean;
  disableAnimations?: boolean;
  className?: string;
  containerClassName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlassSlider({
  className,
  containerClassName,
  variant = "default",
  size = "default",
  showTooltip = false,
  formatValue = (v) => String(v),
  label,
  showRange = false,
  showValue = false,
  disableAnimations = false,
  defaultValue,
  ...props
}: GlassSliderProps) {
  const controls = useControlTokens();
  const colors = useColorTokens();
  const motionTokens = useMotionTokens();
  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  const [internalValue, setInternalValue] = React.useState<number[]>(
    (props.value as number[]) ?? (defaultValue as number[]) ?? [0]
  );
  const [isDragging, setIsDragging] = React.useState(false);
  const [activeThumb, setActiveThumb] = React.useState<number | null>(null);

  const currentValue = (props.value as number[] | undefined) ?? internalValue;

  const handleValueChange = React.useCallback(
    (value: number[]) => {
      setInternalValue(value);
      props.onValueChange?.(value);
    },
    [props.onValueChange]
  );

  const fillGradient = accentFillMap[variant];
  const fillColor = fillGradient ?? controls.slider.fill;
  const thumbBg = accentThumbMap[variant] ?? controls.slider.thumb.bg;
  const thumbShadow = accentShadowMap[variant] ?? controls.slider.thumb.shadow;
  const thumbHoverShadow = accentHoverShadowMap[variant];
  const thumbFocusShadow = accentFocusShadowMap[variant];

  const min = props.min ?? 0;
  const max = props.max ?? 100;

  const id = React.useId();
  const labelId = label ? `glass-slider-label-${id}` : undefined;

  return (
    <div className={cn("w-full", containerClassName)}>
      {/* Label + value row */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span
              id={labelId}
              className="text-sm font-medium"
              style={{ color: colors.text.muted }}
            >
              {label}
            </span>
          )}
          {showValue && (
            <span
              className="text-sm tabular-nums font-medium"
              style={{ color: colors.text.primary }}
            >
              {currentValue.map(formatValue).join(" - ")}
            </span>
          )}
        </div>
      )}

      <SliderPrimitive.Root
        data-slot="glass-slider"
        defaultValue={defaultValue}
        aria-labelledby={labelId}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        onValueChange={handleValueChange}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => {
          setIsDragging(false);
          setActiveThumb(null);
        }}
        {...props}
      >
        {/* Track */}
        <SliderPrimitive.Track
          className={cn(trackVariants({ size }))}
          style={{
            background: "rgba(2, 4, 10, 0.6)",
            border: `1px solid rgba(255, 255, 255, 0.06)`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
          }}
        >
          {/* Fill (Range) */}
          <SliderPrimitive.Range
            className="absolute h-full rounded-full"
            style={{
              background: fillGradient ?? fillColor,
              boxShadow: "0 0 6px rgba(34,211,238,0.3)",
            }}
          />
        </SliderPrimitive.Track>

        {/* Thumb(s) */}
        {(currentValue).map((val, i) => (
          <SliderPrimitive.Thumb key={i} asChild>
            <motion.span
              className={cn(thumbVariants({ size }))}
              style={{
                background: thumbBg,
                boxShadow: thumbShadow,
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "box-shadow 0.2s ease",
              }}
              whileHover={
                shouldAnimate
                  ? {
                      scale: 1.15,
                      boxShadow: thumbHoverShadow,
                      transition: { duration: motionTokens.fast.duration },
                    }
                  : undefined
              }
              whileTap={
                shouldAnimate
                  ? {
                      scale: 0.95,
                      boxShadow: thumbFocusShadow,
                      transition: { duration: motionTokens.fast.duration },
                    }
                  : undefined
              }
              whileFocus={
                shouldAnimate
                  ? { boxShadow: thumbFocusShadow }
                  : undefined
              }
              onPointerDown={() => setActiveThumb(i)}
              onPointerUp={() => setActiveThumb(null)}
            >
              {/* Tooltip */}
              <AnimatePresence>
                {showTooltip && isDragging && activeThumb === i && shouldAnimate && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: -8, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.9 }}
                    transition={{ duration: motionTokens.fast.duration }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap pointer-events-none"
                    style={{
                      background: colors.bg.elevated,
                      color: colors.text.primary,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {formatValue(val)}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.span>
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>

      {/* Range labels */}
      {showRange && (
        <div className="flex items-center justify-between mt-1.5">
          <span
            className="text-xs"
            style={{ color: colors.text.soft }}
          >
            {formatValue(min)}
          </span>
          <span
            className="text-xs"
            style={{ color: colors.text.soft }}
          >
            {formatValue(max)}
          </span>
        </div>
      )}
    </div>
  );
}
