"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

import { cn, prefersReducedMotion } from "../../../lib/utils";
import { useControlTokens, useColorTokens, useMotionTokens } from "../../../theme/UiThemeProvider";

// ============================================================================
// VARIANTS
// ============================================================================

const radioItemSizeVariants = cva(
  "shrink-0 rounded-full border-[1.5px] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
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

const dotSizeMap = {
  sm: 6,
  default: 8,
  lg: 10,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface GlassRadioGroupProps
  extends Omit<React.ComponentProps<typeof RadioGroupPrimitive.Root>, "children"> {
  children: React.ReactNode;
  label?: string;
  error?: string;
  direction?: "vertical" | "horizontal";
  className?: string;
}

export interface GlassRadioGroupItemProps
  extends Omit<React.ComponentProps<typeof RadioGroupPrimitive.Item>, "children">,
    VariantProps<typeof radioItemSizeVariants> {
  label: string;
  description?: string;
  disableAnimations?: boolean;
}

// ============================================================================
// CONTEXT (for sharing group-level state with items)
// ============================================================================

interface RadioGroupContextValue {
  value: string | undefined;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({
  value: undefined,
});

// ============================================================================
// GROUP COMPONENT
// ============================================================================

export const GlassRadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  GlassRadioGroupProps
>(function GlassRadioGroup(
  {
    className,
    children,
    label,
    error,
    direction = "vertical",
    value,
    defaultValue,
    onValueChange,
    ...props
  },
  ref
) {
  const colors = useColorTokens();
  const motionTokens = useMotionTokens();
  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !reducedMotion;

  // Track internal value for item styling
  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    defaultValue
  );
  const currentValue = value !== undefined ? (value ?? undefined) : internalValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [value, onValueChange]
  );

  const internalId = React.useId();
  const errorId = `${internalId}-error`;

  return (
    <RadioGroupContext.Provider value={{ value: currentValue }}>
      <div className="flex flex-col gap-2">
        {label && (
          <span
            className="text-sm font-medium leading-none"
            style={{ color: colors.text.primary }}
          >
            {label}
          </span>
        )}

        <RadioGroupPrimitive.Root
          ref={ref}
          className={cn(
            direction === "vertical" ? "grid gap-3" : "flex flex-wrap gap-4",
            className
          )}
          value={value}
          defaultValue={defaultValue}
          onValueChange={handleValueChange}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          {...props}
        >
          {children}
        </RadioGroupPrimitive.Root>

        {error && (
          <motion.p
            id={errorId}
            className="text-xs flex items-center gap-1"
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
    </RadioGroupContext.Provider>
  );
});

GlassRadioGroup.displayName = "GlassRadioGroup";

// ============================================================================
// ITEM COMPONENT
// ============================================================================

export const GlassRadioGroupItem = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  GlassRadioGroupItemProps
>(function GlassRadioGroupItem(
  {
    className,
    size = "default",
    label,
    description,
    disableAnimations = false,
    value,
    id,
    ...props
  },
  ref
) {
  const controls = useControlTokens();
  const colors = useColorTokens();
  const motionTokens = useMotionTokens();

  const { value: groupValue } = React.useContext(RadioGroupContext);

  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  const internalId = React.useId();
  const finalId = id || internalId;

  const isSelected = groupValue === value;
  const dotSize = dotSizeMap[size || "default"];

  return (
    <div className="flex items-start gap-2.5">
      <RadioGroupPrimitive.Item
        ref={ref}
        id={finalId}
        value={value}
        className={cn(radioItemSizeVariants({ size }), className)}
        style={{
          backgroundColor: isSelected
            ? controls.switch.track.bg.on
            : controls.switch.track.bg.off,
          borderColor: isSelected
            ? controls.switch.track.border.on
            : controls.switch.track.border.off,
          boxShadow: isSelected ? controls.switch.thumb.shadow.on : "none",
          "--tw-ring-offset-color": "transparent",
          "--tw-ring-color": colors.ring,
        } as React.CSSProperties}
        {...props}
      >
        <RadioGroupPrimitive.Indicator forceMount asChild>
          <span className="flex items-center justify-center">
            <AnimatePresence>
              {isSelected && (
                <motion.span
                  key="dot"
                  className="block rounded-full"
                  style={{
                    width: dotSize,
                    height: dotSize,
                    backgroundColor: controls.switch.thumb.bg.on,
                  }}
                  initial={shouldAnimate ? { scale: 0, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={shouldAnimate ? { scale: 0, opacity: 0 } : {}}
                  transition={
                    shouldAnimate
                      ? { type: "spring", damping: motionTokens.spring.damping, stiffness: motionTokens.spring.stiffness }
                      : { duration: 0 }
                  }
                />
              )}
            </AnimatePresence>
          </span>
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>

      {(label || description) && (
        <div className="flex flex-col gap-0.5 pt-px">
          <label
            htmlFor={finalId}
            className="text-sm font-medium leading-none cursor-pointer select-none"
            style={{ color: colors.text.primary }}
          >
            {label}
          </label>
          {description && (
            <p
              className="text-xs leading-relaxed"
              style={{ color: colors.text.muted }}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

GlassRadioGroupItem.displayName = "GlassRadioGroupItem";
