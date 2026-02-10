/**
 * Component Bindings
 *
 * Wires up real React components to the WorkspaceRenderer.
 * This is the bridge between component IDs in WorkspaceSpecs
 * and actual React components.
 */

import type { ComponentType } from "react";
import { registerComponent } from "./WorkspaceRenderer";

// Type helper for registration - components with various prop requirements
// get cast to unknown first, then to the generic type
type AnyComponent = ComponentType<Record<string, unknown>>;

/**
 * Register all components with the WorkspaceRenderer.
 * Call this once at app initialization.
 */
export function initializeComponentBindings(): void {
  // We use dynamic imports to avoid circular dependencies and allow
  // tree-shaking when components aren't used

  // =========================================================================
  // Atoms - Import and register
  // =========================================================================
  Promise.all([
    import("../primitives/atoms/GlowButton").then(({ GlowButton }) => {
      registerComponent("glow-button", GlowButton as unknown as AnyComponent);
    }),
    import("../primitives/atoms/HUDProgressRing").then(({ HUDProgressRing }) => {
      registerComponent("hud-progress-ring", HUDProgressRing as unknown as AnyComponent);
    }),
    import("../primitives/atoms/TypingAnimation").then(({ TypingAnimation }) => {
      registerComponent("typing-animation", TypingAnimation as unknown as AnyComponent);
    }),
    import("../primitives/atoms/TextGenerateEffect").then(({ TextGenerateEffect }) => {
      registerComponent("text-generate-effect", TextGenerateEffect as unknown as AnyComponent);
    }),
    import("../primitives/atoms/GlitchText").then(({ GlitchText }) => {
      registerComponent("glitch-text", GlitchText as unknown as AnyComponent);
    }),
    import("../primitives/atoms/AuroraBackground").then(({ AuroraBackground }) => {
      registerComponent("aurora-background", AuroraBackground as unknown as AnyComponent);
    }),

    // =========================================================================
    // Molecules
    // =========================================================================
    import("../primitives/molecules/KPIStat").then(({ KPIStat }) => {
      registerComponent("kpi-stat", KPIStat as unknown as AnyComponent);
    }),
    import("../primitives/molecules/NeonToast").then(({ NeonToast }) => {
      registerComponent("neon-toast", NeonToast as unknown as AnyComponent);
    }),
    import("../primitives/molecules/ThreeDCard").then(({ CardContainer, CardBody, CardItem }) => {
      registerComponent("card-container", CardContainer as unknown as AnyComponent);
      registerComponent("card-body", CardBody as unknown as AnyComponent);
      registerComponent("card-item", CardItem as unknown as AnyComponent);
    }),

    // =========================================================================
    // Organisms
    // =========================================================================
    import("../primitives/organisms/CommandPalette").then(({ CommandPalette }) => {
      registerComponent("command-palette", CommandPalette as unknown as AnyComponent);
    }),
    import("../primitives/organisms/Glass").then(({ GlassPanel }) => {
      registerComponent("glass-panel", GlassPanel as unknown as AnyComponent);
    }),
    import("../primitives/organisms/BentoGrid").then(({ BentoGrid, BentoGridItem }) => {
      registerComponent("bento-grid", BentoGrid as unknown as AnyComponent);
      registerComponent("bento-grid-item", BentoGridItem as unknown as AnyComponent);
    }),

    // =========================================================================
    // UI Primitives
    // =========================================================================
    import("../primitives/ui/button").then(({ Button }) => {
      registerComponent("button", Button as unknown as AnyComponent);
    }),
    import("../primitives/ui/badge").then(({ Badge }) => {
      registerComponent("badge", Badge as unknown as AnyComponent);
    }),
    import("../primitives/ui/input").then(({ Input }) => {
      registerComponent("input", Input as unknown as AnyComponent);
    }),
    import("../primitives/ui/textarea").then(({ Textarea }) => {
      registerComponent("textarea", Textarea as unknown as AnyComponent);
    }),
    import("../primitives/ui/label").then(({ Label }) => {
      registerComponent("label", Label as unknown as AnyComponent);
    }),
    import("../primitives/ui/separator").then(({ Separator }) => {
      registerComponent("separator", Separator as unknown as AnyComponent);
    }),
    import("../primitives/ui/skeleton").then(({ Skeleton }) => {
      registerComponent("skeleton", Skeleton as unknown as AnyComponent);
    }),
    import("../primitives/ui/switch").then(({ Switch }) => {
      registerComponent("switch", Switch as unknown as AnyComponent);
    }),
    import("../primitives/ui/scroll-area").then(({ ScrollArea }) => {
      registerComponent("scroll-area", ScrollArea as unknown as AnyComponent);
    }),
    import("../primitives/ui/toggle").then(({ Toggle }) => {
      registerComponent("toggle", Toggle as unknown as AnyComponent);
    }),

    // Tabs
    import("../primitives/ui/tabs").then(({ Tabs, TabsList, TabsTrigger, TabsContent }) => {
      registerComponent("tabs", Tabs as unknown as AnyComponent);
      registerComponent("tabs-list", TabsList as unknown as AnyComponent);
      registerComponent("tabs-trigger", TabsTrigger as unknown as AnyComponent);
      registerComponent("tabs-content", TabsContent as unknown as AnyComponent);
    }),

    // Dialog
    import("../primitives/ui/dialog").then(({
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
    }) => {
      registerComponent("dialog", Dialog as unknown as AnyComponent);
      registerComponent("dialog-content", DialogContent as unknown as AnyComponent);
      registerComponent("dialog-header", DialogHeader as unknown as AnyComponent);
      registerComponent("dialog-title", DialogTitle as unknown as AnyComponent);
      registerComponent("dialog-description", DialogDescription as unknown as AnyComponent);
      registerComponent("dialog-footer", DialogFooter as unknown as AnyComponent);
    }),

    // Tooltip
    import("../primitives/ui/tooltip").then(({
      Tooltip,
      TooltipTrigger,
      TooltipContent,
      TooltipProvider,
    }) => {
      registerComponent("tooltip-provider", TooltipProvider as unknown as AnyComponent);
      registerComponent("tooltip", Tooltip as unknown as AnyComponent);
      registerComponent("tooltip-trigger", TooltipTrigger as unknown as AnyComponent);
      registerComponent("tooltip-content", TooltipContent as unknown as AnyComponent);
    }),

    // Select
    import("../primitives/ui/select").then(({
      Select,
      SelectTrigger,
      SelectValue,
      SelectContent,
      SelectItem,
    }) => {
      registerComponent("select", Select as unknown as AnyComponent);
      registerComponent("select-trigger", SelectTrigger as unknown as AnyComponent);
      registerComponent("select-value", SelectValue as unknown as AnyComponent);
      registerComponent("select-content", SelectContent as unknown as AnyComponent);
      registerComponent("select-item", SelectItem as unknown as AnyComponent);
    }),

    // Dropdown Menu
    import("../primitives/ui/dropdown-menu").then(({
      DropdownMenu,
      DropdownMenuTrigger,
      DropdownMenuContent,
      DropdownMenuItem,
    }) => {
      registerComponent("dropdown-menu", DropdownMenu as unknown as AnyComponent);
      registerComponent("dropdown-menu-trigger", DropdownMenuTrigger as unknown as AnyComponent);
      registerComponent("dropdown-menu-content", DropdownMenuContent as unknown as AnyComponent);
      registerComponent("dropdown-menu-item", DropdownMenuItem as unknown as AnyComponent);
    }),

    // Avatar
    import("../primitives/ui/avatar").then(({ Avatar, AvatarImage, AvatarFallback }) => {
      registerComponent("avatar", Avatar as unknown as AnyComponent);
      registerComponent("avatar-image", AvatarImage as unknown as AnyComponent);
      registerComponent("avatar-fallback", AvatarFallback as unknown as AnyComponent);
    }),

    // Alert Dialog
    import("../primitives/ui/alert-dialog").then(({
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
    }) => {
      registerComponent("alert-dialog", AlertDialog as unknown as AnyComponent);
      registerComponent("alert-dialog-trigger", AlertDialogTrigger as unknown as AnyComponent);
      registerComponent("alert-dialog-content", AlertDialogContent as unknown as AnyComponent);
      registerComponent("alert-dialog-header", AlertDialogHeader as unknown as AnyComponent);
      registerComponent("alert-dialog-title", AlertDialogTitle as unknown as AnyComponent);
      registerComponent("alert-dialog-description", AlertDialogDescription as unknown as AnyComponent);
      registerComponent("alert-dialog-footer", AlertDialogFooter as unknown as AnyComponent);
      registerComponent("alert-dialog-action", AlertDialogAction as unknown as AnyComponent);
      registerComponent("alert-dialog-cancel", AlertDialogCancel as unknown as AnyComponent);
    }),

    // Popover
    import("../primitives/ui/popover").then(({
      Popover,
      PopoverTrigger,
      PopoverContent,
    }) => {
      registerComponent("popover", Popover as unknown as AnyComponent);
      registerComponent("popover-trigger", PopoverTrigger as unknown as AnyComponent);
      registerComponent("popover-content", PopoverContent as unknown as AnyComponent);
    }),
  ]).then(() => {
    console.info("[AG-UI] Component bindings initialized");
  });
}

/**
 * Synchronously initialize core components for SSR/testing.
 * This is a fallback that imports a minimal set synchronously.
 */
export function initializeComponentBindingsSync(): void {
  // This would require static imports - use only if async init isn't possible
  console.info("[AG-UI] Sync component bindings not yet implemented");
}

/**
 * Lazy-load Three.js components (heavy dependencies)
 */
export async function loadThreeComponents(): Promise<void> {
  const [{ Graph3D }, { ParticleField }] = await Promise.all([
    import("../primitives/three/Graph3D/Graph3D"),
    import("../primitives/three/ParticleField/ParticleField"),
  ]);

  registerComponent("graph-3d", Graph3D as unknown as AnyComponent);
  registerComponent("particle-field", ParticleField as unknown as AnyComponent);

  console.info("[AG-UI] Three.js components loaded");
}

/**
 * Get list of all registered component IDs
 */
export function getRegisteredComponents(): string[] {
  return [
    // Atoms
    "glow-button",
    "hud-progress-ring",
    "typing-animation",
    "text-generate-effect",
    "glitch-text",
    "aurora-background",
    // Molecules
    "kpi-stat",
    "neon-toast",
    "card-container",
    "card-body",
    "card-item",
    // Organisms
    "command-palette",
    "glass-panel",
    "bento-grid",
    "bento-grid-item",
    // UI Primitives
    "button",
    "badge",
    "input",
    "textarea",
    "label",
    "separator",
    "skeleton",
    "switch",
    "scroll-area",
    "toggle",
    "tabs",
    "tabs-list",
    "tabs-trigger",
    "tabs-content",
    "dialog",
    "dialog-content",
    "dialog-header",
    "dialog-title",
    "dialog-description",
    "dialog-footer",
    "tooltip-provider",
    "tooltip",
    "tooltip-trigger",
    "tooltip-content",
    "select",
    "select-trigger",
    "select-value",
    "select-content",
    "select-item",
    "dropdown-menu",
    "dropdown-menu-trigger",
    "dropdown-menu-content",
    "dropdown-menu-item",
    "avatar",
    "avatar-image",
    "avatar-fallback",
    "alert-dialog",
    "alert-dialog-trigger",
    "alert-dialog-content",
    "alert-dialog-header",
    "alert-dialog-title",
    "alert-dialog-description",
    "alert-dialog-footer",
    "alert-dialog-action",
    "alert-dialog-cancel",
    "popover",
    "popover-trigger",
    "popover-content",
    // Three.js (lazy loaded)
    "graph-3d",
    "particle-field",
  ];
}
