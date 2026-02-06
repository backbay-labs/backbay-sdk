"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

import { cn, prefersReducedMotion } from "../../../lib/utils";
import { useControlTokens, useColorTokens, useMotionTokens } from "../../../theme/UiThemeProvider";

// ============================================================================
// VARIANTS
// ============================================================================

const checkboxSizeVariants = cva(
  "shrink-0 rounded-[4px] border-[1.5px] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-[14px] w-[14px]",
        default: "h-[18px] w-[18px]",
        lg: "h-[22px] w-[22px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const checkIconSizeMap = {
  sm: 10,
  default: 13,
  lg: 16,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface GlassCheckboxProps
  extends Omit<React.ComponentProps<typeof CheckboxPrimitive.Root>, "children">,
    VariantProps<typeof checkboxSizeVariants> {
  label?: string;
  description?: string;
  error?: string;
  disableAnimations?: boolean;
  containerClassName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GlassCheckbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  GlassCheckboxProps
>(function GlassCheckbox(
  {
    className,
    containerClassName,
    size = "default",
    label,
    description,
    error,
    disableAnimations = false,
    checked,
    defaultChecked,
    onCheckedChange,
    id,
    ...props
  },
  ref
) {
  const controls = useControlTokens();
  const colors = useColorTokens();
  const motionTokens = useMotionTokens();

  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  const internalId = React.useId();
  const finalId = id || internalId;
  const descriptionId = `${finalId}-description`;
  const errorId = `${finalId}-error`;

  const iconSize = checkIconSizeMap[size || "default"];

  // Track internal checked state for animation
  const [internalChecked, setInternalChecked] = React.useState<
    CheckboxPrimitive.CheckedState
  >(defaultChecked ?? false);
  const isChecked = checked !== undefined ? checked : internalChecked;

  const handleCheckedChange = React.useCallback(
    (value: CheckboxPrimitive.CheckedState) => {
      if (checked === undefined) {
        setInternalChecked(value);
      }
      onCheckedChange?.(value);
    },
    [checked, onCheckedChange]
  );

  const isOn = isChecked === true || isChecked === "indeterminate";

  return (
    <div className={cn("flex flex-col gap-1", containerClassName)}>
      <div className="flex items-start gap-2.5">
        <CheckboxPrimitive.Root
          ref={ref}
          id={finalId}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={handleCheckedChange}
          className={cn(checkboxSizeVariants({ size }), className)}
          style={{
            backgroundColor: isOn
              ? controls.switch.track.bg.on
              : controls.switch.track.bg.off,
            borderColor: error
              ? colors.accent.destructive
              : isOn
                ? controls.switch.track.border.on
                : controls.switch.track.border.off,
            color: controls.switch.thumb.bg.on,
            boxShadow: isOn ? controls.switch.thumb.shadow.on : "none",
          } as React.CSSProperties}
          aria-describedby={
            description || error
              ? `${description ? descriptionId : ""} ${error ? errorId : ""}`.trim()
              : undefined
          }
          aria-invalid={error ? "true" : undefined}
          {...props}
        >
          <CheckboxPrimitive.Indicator forceMount asChild>
            <span className="flex items-center justify-center">
              <AnimatePresence>
                {isOn && (
                  <motion.svg
                    key="check"
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    initial={shouldAnimate ? { scale: 0.5, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={shouldAnimate ? { scale: 0.5, opacity: 0 } : {}}
                    transition={
                      shouldAnimate
                        ? { type: "spring", damping: motionTokens.spring.damping, stiffness: motionTokens.spring.stiffness }
                        : { duration: 0 }
                    }
                  >
                    <motion.path
                      d="M3.5 8.5L6.5 11.5L12.5 4.5"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={shouldAnimate ? { pathLength: 0 } : false}
                      animate={{ pathLength: 1 }}
                      transition={
                        shouldAnimate
                          ? { type: "spring", damping: motionTokens.spring.damping, stiffness: motionTokens.spring.stiffness, delay: 0.05 }
                          : { duration: 0 }
                      }
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </span>
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>

        {(label || description) && (
          <div className="flex flex-col gap-0.5 pt-px">
            {label && (
              <label
                htmlFor={finalId}
                className="text-sm font-medium leading-none cursor-pointer select-none"
                style={{ color: colors.text.primary }}
              >
                {label}
              </label>
            )}
            {description && !error && (
              <p
                id={descriptionId}
                className="text-xs leading-relaxed"
                style={{ color: colors.text.muted }}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <motion.p
          id={errorId}
          className="text-xs flex items-center gap-1 ml-[calc(18px+0.625rem)]"
          style={{ color: colors.accent.destructive }}
          initial={shouldAnimate ? { opacity: 0, y: -4 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionTokens.fast.duration }}
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </motion.p>
      )}
    </div>
  );
});

GlassCheckbox.displayName = "GlassCheckbox";
