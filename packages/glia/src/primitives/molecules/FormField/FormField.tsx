"use client";

import { cn, prefersReducedMotion } from "../../../lib/utils";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import React, { createContext, useContext, useId } from "react";

interface FormFieldContextValue {
  fieldId: string;
  error?: string;
  disabled?: boolean;
  descriptionId: string;
  errorId: string;
}

export const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export function useFormField() {
  const ctx = useContext(FormFieldContext);
  if (!ctx) {
    throw new Error("useFormField must be used within a <FormField>");
  }
  return ctx;
}

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Field label text */
  label?: string;
  /** Explicit htmlFor override (defaults to auto-generated ID) */
  htmlFor?: string;
  /** Helper description text */
  description?: string;
  /** Error message */
  error?: string;
  /** Show required asterisk */
  required?: boolean;
  /** Disable the field */
  disabled?: boolean;
  /** Disable entrance animations */
  disableAnimations?: boolean;
  /** Field size */
  size?: "default" | "sm" | "lg";
  /** Field content (control slot) */
  children: React.ReactNode;
}

const sizeSpacing: Record<NonNullable<FormFieldProps["size"]>, string> = {
  sm: "space-y-1",
  default: "space-y-1.5",
  lg: "space-y-2",
};

export function FormField({
  label,
  htmlFor,
  description,
  error,
  required = false,
  disabled = false,
  disableAnimations = false,
  size = "default",
  children,
  className,
  ...props
}: FormFieldProps) {
  const autoId = useId();
  const fieldId = htmlFor || autoId;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  return (
    <FormFieldContext.Provider
      value={{ fieldId, error, disabled, descriptionId, errorId }}
    >
      <div
        className={cn(sizeSpacing[size], disabled && "opacity-60", className)}
        {...props}
      >
        {/* Label */}
        {label && (
          <motion.label
            htmlFor={fieldId}
            className={cn(
              "text-sm font-medium leading-none",
              disabled && "cursor-not-allowed"
            )}
            initial={shouldAnimate ? { opacity: 0, y: -4 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && (
              <span
                className="ml-0.5 text-destructive"
                aria-hidden="true"
              >
                *
              </span>
            )}
          </motion.label>
        )}

        {/* Control slot */}
        {children}

        {/* Description (hidden when error is shown) */}
        {description && !error && (
          <motion.p
            id={descriptionId}
            className="text-sm text-muted-foreground"
            initial={shouldAnimate ? { opacity: 0, y: 4 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {description}
          </motion.p>
        )}

        {/* Error message */}
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            className="text-sm text-destructive flex items-center gap-1"
            initial={shouldAnimate ? { opacity: 0, y: 4 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </motion.p>
        )}
      </div>
    </FormFieldContext.Provider>
  );
}
