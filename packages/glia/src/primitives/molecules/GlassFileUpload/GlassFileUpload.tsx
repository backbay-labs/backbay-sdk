"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

import { cn, prefersReducedMotion } from "../../../lib/utils";

// ============================================================================
// HELPERS
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ============================================================================
// INLINE SVG ICONS
// ============================================================================

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 17V3" />
      <path d="m6 8 6-6 6 6" />
      <path d="M2 21h20" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

// ============================================================================
// VARIANTS
// ============================================================================

const dropZoneVariants = cva(
  [
    "relative flex flex-col items-center justify-center rounded-md border-2 border-dashed",
    "bg-[rgba(2,4,10,0.85)] backdrop-blur-xl",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
    "ring-offset-background transition-all duration-200",
    "cursor-pointer select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-white/[0.06] hover:border-white/[0.12] focus-visible:border-cyan-neon focus-visible:ring-cyan-neon/30",
        error:
          "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/30",
        active:
          "border-cyan-neon/60 bg-[rgba(2,4,10,0.75)] shadow-[0_0_30px_hsl(var(--cyan-neon)/0.1)]",
      },
      size: {
        default: "min-h-[160px] px-6 py-8 gap-3",
        sm: "min-h-[120px] px-4 py-6 gap-2",
        lg: "min-h-[200px] px-8 py-10 gap-4",
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

export interface GlassFileUploadProps
  extends VariantProps<typeof dropZoneVariants> {
  /** Accepted file types (e.g. "image/*,.pdf") */
  accept?: string;
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Callback when files change */
  onFilesChange?: (files: File[]) => void;
  /** Controlled file list */
  files?: File[];
  /** Disabled state */
  disabled?: boolean;
  /** Upload zone label */
  label?: string;
  /** Helper description text */
  description?: string;
  /** Error message */
  error?: string;
  /** Disable glow animations */
  disableAnimations?: boolean;
  /** Container class name */
  containerClassName?: string;
  /** Drop zone class name */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GlassFileUpload = React.forwardRef<
  HTMLDivElement,
  GlassFileUploadProps
>(function GlassFileUpload(
  {
    className,
    containerClassName,
    variant,
    size,
    accept,
    multiple = false,
    maxSize,
    onFilesChange,
    files: controlledFiles,
    disabled = false,
    label,
    description,
    error,
    disableAnimations = false,
  },
  ref
) {
  const internalId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const descriptionId = `${internalId}-description`;
  const errorId = `${internalId}-error`;

  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  const [isDragOver, setIsDragOver] = React.useState(false);
  const [internalFiles, setInternalFiles] = React.useState<File[]>([]);

  const files = controlledFiles ?? internalFiles;
  const isControlled = controlledFiles !== undefined;

  const finalVariant = error ? "error" : isDragOver ? "active" : variant;

  // ---- File handling ----

  const addFiles = React.useCallback(
    (incoming: FileList | File[]) => {
      const newFiles = Array.from(incoming);
      const filtered = newFiles.filter((f) => {
        if (maxSize && f.size > maxSize) return false;
        return true;
      });

      const updated = multiple ? [...files, ...filtered] : filtered.slice(0, 1);

      if (!isControlled) {
        setInternalFiles(updated);
      }
      onFilesChange?.(updated);
    },
    [files, isControlled, maxSize, multiple, onFilesChange]
  );

  const removeFile = React.useCallback(
    (index: number) => {
      const updated = files.filter((_, i) => i !== index);
      if (!isControlled) {
        setInternalFiles(updated);
      }
      onFilesChange?.(updated);
    },
    [files, isControlled, onFilesChange]
  );

  // ---- Drag handlers ----

  const handleDragOver = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    },
    []
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;
      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [disabled, addFiles]
  );

  // ---- Click / keyboard ----

  const handleClick = React.useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!disabled && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled]
  );

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        addFiles(e.target.files);
      }
      // Reset so same file can be re-selected
      e.target.value = "";
    },
    [addFiles]
  );

  return (
    <div ref={ref} className={cn("space-y-2", containerClassName)}>
      {/* Label */}
      {label && (
        <motion.label
          className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground font-mono"
          initial={shouldAnimate ? { opacity: 0, y: -5 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Drop zone */}
      <motion.div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          dropZoneVariants({ variant: finalVariant, size }),
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        aria-label="File upload drop zone"
        aria-describedby={
          description || error
            ? `${description ? descriptionId : ""} ${error ? errorId : ""}`.trim()
            : undefined
        }
        aria-disabled={disabled || undefined}
        initial={shouldAnimate ? { opacity: 0, scale: 0.98 } : {}}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        {/* Upload icon */}
        <motion.div
          animate={
            shouldAnimate && isDragOver
              ? { y: -4, scale: 1.1 }
              : { y: 0, scale: 1 }
          }
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <ArrowUpIcon
            className={cn(
              "h-8 w-8 transition-colors duration-200",
              isDragOver ? "text-cyan-neon" : "text-muted-foreground/40"
            )}
          />
        </motion.div>

        {/* Primary text */}
        <span
          className={cn(
            "text-sm font-mono uppercase tracking-[0.12em] transition-colors duration-200",
            isDragOver ? "text-cyan-neon" : "text-muted-foreground/60"
          )}
        >
          Drop files here
        </span>

        {/* Secondary text */}
        <span className="text-xs text-muted-foreground/40 font-mono">
          or click to browse
        </span>
      </motion.div>

      {/* File list */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.ul
            className="space-y-1"
            initial={shouldAnimate ? { opacity: 0 } : {}}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            role="list"
            aria-label="Uploaded files"
          >
            {files.map((file, index) => (
              <motion.li
                key={`${file.name}-${file.size}-${index}`}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2",
                  "border-white/[0.06] bg-[rgba(2,4,10,0.85)] backdrop-blur-xl",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                )}
                initial={shouldAnimate ? { opacity: 0, x: -10 } : {}}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldAnimate ? { opacity: 0, x: 10 } : {}}
                transition={{ duration: 0.15 }}
                layout={shouldAnimate}
              >
                <FileIcon className="h-4 w-4 shrink-0 text-cyan-neon/60" />
                <span className="flex-1 truncate text-xs font-mono text-foreground/80">
                  {file.name}
                </span>
                <span className="shrink-0 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/40 tabular-nums">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={disabled}
                  className={cn(
                    "shrink-0 rounded p-0.5 transition-colors duration-150",
                    "text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive/30",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  aria-label={`Remove ${file.name}`}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

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
});

GlassFileUpload.displayName = "GlassFileUpload";
