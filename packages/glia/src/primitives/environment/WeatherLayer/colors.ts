import { AUTUMN_LEAF_COLOR_PRESETS } from "./leafPresets";
import type { AutumnLeafColorPreset } from "./leafPresets";
import type { WeatherType } from "./types";

export function resolveWeatherColors({
  type,
  configColors,
  colors,
  leafColorPreset,
}: {
  type: WeatherType;
  configColors: readonly string[];
  colors?: readonly string[];
  leafColorPreset?: AutumnLeafColorPreset;
}): readonly string[] {
  if (colors && colors.length > 0) return colors;
  if (type === "leaves" && leafColorPreset) {
    return AUTUMN_LEAF_COLOR_PRESETS[leafColorPreset] ?? configColors;
  }
  return configColors;
}

export function colorsKey(colors: readonly string[] | undefined) {
  if (!colors || colors.length === 0) return "";
  return colors.join("|");
}

