export const AUTUMN_LEAF_COLOR_PRESETS = {
  "early-autumn": ["#6b8f3f", "#a9b84a", "#d8c35a", "#e5b04a", "#c97a2c"],
  "peak-autumn": ["#b63a2b", "#d86b2c", "#e5a93a", "#c56b2b", "#7a3e1b"],
  "late-autumn": ["#5a3d2b", "#7a563e", "#9a6f4b", "#b68a5e", "#8a6b4f"],
  golden: ["#f2d27a", "#e9c15c", "#d8a93b", "#b9872a", "#e8b04a"],
  rust: ["#a34a1f", "#c2602d", "#d6782f", "#e07b39", "#bc6c25"],
  "maple-red": ["#7a1f1f", "#a02b2b", "#c0302b", "#d44a2c", "#e36a3a"],
  muted: ["#d4a373", "#c08a5a", "#a66a3f", "#8c5a36", "#e3b07a"],
} as const;

export type AutumnLeafColorPreset = keyof typeof AUTUMN_LEAF_COLOR_PRESETS;

