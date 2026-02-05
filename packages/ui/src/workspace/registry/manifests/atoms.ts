/**
 * Atom Component Manifests
 * Basic building blocks of the UI system
 */

import type { ComponentManifest } from "../types";

export const glowButtonManifest: ComponentManifest = {
  id: "glow-button",
  name: "GlowButton",
  version: "1.0.0",
  category: "atoms",

  purpose: ["call-to-action", "confirmation"],
  description:
    "Animated button with glowing border effect. Creates visual emphasis for primary actions.",
  bestFor: [
    "Primary form submissions",
    "Key call-to-action buttons",
    "Hero section CTAs",
    "Confirmation dialogs",
  ],
  avoid: [
    "Secondary or tertiary actions",
    "Destructive actions (use red variant)",
    "Dense button groups (too much visual noise)",
    "Navigation links",
  ],

  props: {
    children: {
      type: "ReactNode",
      description: "Button content (text, icons, or both)",
      required: true,
    },
    variant: {
      type: "enum",
      description: "Visual style variant",
      enum: ["primary", "secondary", "ghost", "destructive"],
      default: "primary",
    },
    size: {
      type: "enum",
      description: "Button size",
      enum: ["sm", "md", "lg"],
      default: "md",
    },
    disabled: {
      type: "boolean",
      description: "Disable interactions",
      default: false,
    },
    glowColor: {
      type: "string",
      description: "Custom glow color (CSS color value)",
    },
    glowIntensity: {
      type: "number",
      description: "Glow intensity multiplier (0-2)",
      default: 1,
    },
    onClick: {
      type: "function",
      description: "Click handler",
    },
  },

  slots: [],
  validParents: ["glass-panel", "bento-grid", "command-palette"],
  validChildren: [],

  styles: ["neon", "animated", "gradient"],
  supportsTheme: true,
  cssVariables: ["--glow-color", "--glow-intensity"],

  interactions: ["click", "hover", "focus", "keyboard"],
  a11y: ["aria-labels", "keyboard-nav", "focus-visible"],

  examples: [
    {
      name: "Primary CTA",
      description: "Standard primary action button",
      props: { variant: "primary", children: "Get Started" },
      context: "Hero sections, form submissions",
    },
    {
      name: "Custom Glow",
      description: "Button with custom glow color",
      props: {
        variant: "secondary",
        glowColor: "#00ff88",
        children: "Connect",
      },
      context: "Themed interfaces, brand-specific CTAs",
    },
  ],

  source: "components/atoms/GlowButton/GlowButton.tsx",
  storybook: "atoms-glowbutton",
  tags: ["button", "cta", "glow", "animated", "interactive"],
};

export const hudProgressRingManifest: ComponentManifest = {
  id: "hud-progress-ring",
  name: "HUDProgressRing",
  version: "1.0.0",
  category: "atoms",

  purpose: ["progress-feedback", "status-indicator", "data-display"],
  description:
    "Circular progress indicator with HUD-style aesthetics. SVG-based with smooth animations.",
  bestFor: [
    "Task completion percentage",
    "Loading states with known progress",
    "Skill/stat displays",
    "Timer countdowns",
    "Dashboard KPIs",
  ],
  avoid: [
    "Indeterminate loading (use spinner instead)",
    "Very small sizes (illegible)",
    "Dense data tables (too much visual weight)",
  ],

  props: {
    value: {
      type: "number",
      description: "Progress value (0-100)",
      required: true,
    },
    size: {
      type: "number",
      description: "Ring diameter in pixels",
      default: 120,
    },
    strokeWidth: {
      type: "number",
      description: "Ring stroke width",
      default: 8,
    },
    color: {
      type: "string",
      description: "Progress color",
      default: "#00ff88",
    },
    trackColor: {
      type: "string",
      description: "Background track color",
      default: "rgba(255,255,255,0.1)",
    },
    showValue: {
      type: "boolean",
      description: "Display percentage in center",
      default: true,
    },
    label: {
      type: "string",
      description: "Label text below value",
    },
    animated: {
      type: "boolean",
      description: "Animate progress changes",
      default: true,
    },
  },

  slots: [
    {
      name: "center",
      description: "Custom content for ring center",
      accepts: ["*"],
      required: false,
    },
  ],
  validParents: ["glass-panel", "bento-grid", "kpi-stat"],
  validChildren: [],

  styles: ["cyberpunk", "animated", "minimal"],
  supportsTheme: true,
  cssVariables: ["--ring-color", "--ring-track-color"],

  interactions: ["hover"],
  a11y: ["aria-labels", "screen-reader"],

  examples: [
    {
      name: "Task Progress",
      description: "Show task completion",
      props: { value: 75, label: "Complete", color: "#00ff88" },
      context: "Dashboard widgets, task trackers",
    },
    {
      name: "Skill Level",
      description: "Display skill or stat level",
      props: { value: 42, label: "TypeScript", size: 80 },
      context: "Profile pages, skill trees",
    },
  ],

  source: "components/atoms/HUDProgressRing/HUDProgressRing.tsx",
  storybook: "atoms-hudprogressring",
  tags: ["progress", "ring", "circular", "hud", "stats", "animated"],
};

export const typingAnimationManifest: ComponentManifest = {
  id: "typing-animation",
  name: "TypingAnimation",
  version: "1.0.0",
  category: "atoms",

  purpose: ["animation", "data-display"],
  description:
    "Typewriter effect that reveals text character by character. Creates dynamic, engaging text displays.",
  bestFor: [
    "Hero headlines",
    "AI/bot responses",
    "Onboarding sequences",
    "Loading messages",
    "Code demonstrations",
  ],
  avoid: [
    "Long paragraphs (use TextGenerateEffect instead)",
    "Critical information users need immediately",
    "Accessibility-focused contexts (can be disorienting)",
  ],

  props: {
    text: {
      type: "string",
      description: "Text to type out",
      required: true,
    },
    speed: {
      type: "number",
      description: "Milliseconds per character",
      default: 50,
    },
    delay: {
      type: "number",
      description: "Initial delay before typing starts",
      default: 0,
    },
    cursor: {
      type: "boolean",
      description: "Show blinking cursor",
      default: true,
    },
    cursorChar: {
      type: "string",
      description: "Cursor character",
      default: "|",
    },
    onComplete: {
      type: "function",
      description: "Callback when typing completes",
    },
    loop: {
      type: "boolean",
      description: "Loop the animation",
      default: false,
    },
  },

  slots: [],
  validParents: ["glass-panel", "bento-grid"],
  validChildren: [],

  styles: ["animated", "retro"],
  supportsTheme: true,

  interactions: [],
  a11y: ["screen-reader", "reduced-motion"],

  examples: [
    {
      name: "Hero Title",
      description: "Animated hero headline",
      props: { text: "Welcome to the future", speed: 80, cursor: true },
      context: "Landing pages, hero sections",
    },
    {
      name: "AI Response",
      description: "Simulated AI typing",
      props: { text: "Processing your request...", speed: 30 },
      context: "Chatbots, AI interfaces",
    },
  ],

  source: "components/atoms/TypingAnimation/TypingAnimation.tsx",
  storybook: "atoms-typinganimation",
  tags: ["text", "typewriter", "animation", "typing", "reveal"],
};

export const textGenerateEffectManifest: ComponentManifest = {
  id: "text-generate-effect",
  name: "TextGenerateEffect",
  version: "1.0.0",
  category: "atoms",

  purpose: ["animation", "data-display"],
  description:
    "Word-by-word text reveal animation. More suitable for longer text than character-by-character typing.",
  bestFor: [
    "AI-generated content reveal",
    "Quote displays",
    "Paragraph introductions",
    "Story/narrative text",
  ],
  avoid: [
    "Short single words (use TypingAnimation)",
    "Time-critical information",
    "Forms and inputs",
  ],

  props: {
    words: {
      type: "string",
      description: "Text to animate (split by spaces)",
      required: true,
    },
    className: {
      type: "string",
      description: "Additional CSS classes",
    },
    filter: {
      type: "boolean",
      description: "Apply blur filter during reveal",
      default: true,
    },
    duration: {
      type: "number",
      description: "Animation duration per word (seconds)",
      default: 0.5,
    },
  },

  slots: [],
  validParents: ["glass-panel", "bento-grid"],
  validChildren: [],

  styles: ["animated", "gradient"],
  supportsTheme: true,

  interactions: [],
  a11y: ["screen-reader", "reduced-motion"],

  examples: [
    {
      name: "AI Response",
      description: "Reveal AI-generated text",
      props: {
        words: "The quick brown fox jumps over the lazy dog",
        filter: true,
      },
      context: "AI chat interfaces, content generation",
    },
  ],

  source: "components/atoms/TextGenerateEffect/TextGenerateEffect.tsx",
  storybook: "atoms-textgenerateeffect",
  tags: ["text", "animation", "reveal", "words", "ai"],
};

export const glitchTextManifest: ComponentManifest = {
  id: "glitch-text",
  name: "GlitchText",
  version: "1.0.0",
  category: "atoms",

  purpose: ["decoration", "animation"],
  description:
    "Cyberpunk-style glitch effect on text. Creates visual distortion and RGB splitting.",
  bestFor: [
    "Error states with style",
    "Cyberpunk/tech aesthetics",
    "Game UI elements",
    "Attention-grabbing headlines",
  ],
  avoid: [
    "Readable body text",
    "Accessibility-critical content",
    "Professional/corporate contexts",
    "Frequent use (loses impact)",
  ],

  props: {
    text: {
      type: "string",
      description: "Text to display with glitch effect",
      required: true,
    },
    intensity: {
      type: "enum",
      description: "Glitch intensity level",
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    color: {
      type: "string",
      description: "Base text color",
    },
    speed: {
      type: "number",
      description: "Animation speed multiplier",
      default: 1,
    },
    continuous: {
      type: "boolean",
      description: "Continuously animate vs on-hover only",
      default: false,
    },
  },

  slots: [],
  validParents: ["glass-panel", "bento-grid"],
  validChildren: [],

  styles: ["cyberpunk", "animated", "neon"],
  supportsTheme: false,

  interactions: ["hover"],
  a11y: ["reduced-motion"],

  examples: [
    {
      name: "Error Display",
      description: "Stylized error message",
      props: { text: "SYSTEM ERROR", intensity: "high", continuous: true },
      context: "Error states, warnings",
    },
    {
      name: "Hover Effect",
      description: "Glitch on hover only",
      props: { text: "ENTER", intensity: "low", continuous: false },
      context: "Interactive elements, buttons",
    },
  ],

  source: "components/atoms/GlitchText/GlitchText.tsx",
  storybook: "atoms-glitchtext",
  tags: ["text", "glitch", "cyberpunk", "animation", "effect"],
};

export const auroraBackgroundManifest: ComponentManifest = {
  id: "aurora-background",
  name: "AuroraBackground",
  version: "1.0.0",
  category: "atoms",

  purpose: ["background", "decoration"],
  description:
    "Animated aurora borealis gradient background. Creates atmospheric, dynamic backgrounds.",
  bestFor: [
    "Hero sections",
    "Landing pages",
    "Modal backgrounds",
    "Full-page backgrounds",
  ],
  avoid: [
    "Content-heavy areas (distracting)",
    "Small containers",
    "Performance-critical contexts",
  ],

  props: {
    children: {
      type: "ReactNode",
      description: "Content to display over the aurora",
    },
    showRadialGradient: {
      type: "boolean",
      description: "Add radial gradient overlay",
      default: true,
    },
    className: {
      type: "string",
      description: "Additional CSS classes",
    },
  },

  slots: [
    {
      name: "default",
      description: "Content overlaid on aurora",
      accepts: ["*"],
      multiple: true,
    },
  ],
  validParents: [],
  validChildren: ["*"],

  styles: ["gradient", "animated"],
  supportsTheme: true,

  interactions: [],
  a11y: ["reduced-motion"],

  examples: [
    {
      name: "Hero Background",
      description: "Full-page hero with aurora",
      props: { showRadialGradient: true },
      context: "Landing pages, hero sections",
    },
  ],

  source: "components/atoms/AuroraBackground/AuroraBackground.tsx",
  storybook: "atoms-aurorabackground",
  tags: ["background", "aurora", "gradient", "animated", "atmospheric"],
};

export const atomManifests: ComponentManifest[] = [
  glowButtonManifest,
  hudProgressRingManifest,
  typingAnimationManifest,
  textGenerateEffectManifest,
  glitchTextManifest,
  auroraBackgroundManifest,
];
