/**
 * AmbientField Module Exports
 */

export { AmbientField, useFieldBus, useFieldState } from "./AmbientField";
export type { AmbientFieldProps } from "./AmbientField";

export { FieldProvider } from "./FieldProvider";
export type { FieldProviderProps } from "./FieldProvider";

export { createBackbayFieldBus, getGlobalFieldBus } from "./BackbayFieldBus";

export {
  createFieldUniforms,
  createPlaneMaterial,
  createPointsMaterial,
  createPointsGeometry,
  VERTEX_SHADER,
  FRAGMENT_SHADER,
  POINTS_VERTEX_SHADER,
  POINTS_FRAGMENT_SHADER,
} from "./shaders/constellation";

export type {
  Anchor,
  BackbayFieldBus,
  FieldBusListener,
  FieldConfig,
  FieldRuntimeState,
  FieldUniforms,
  HoverState,
  Impulse,
  PendingEvent,
  UVPosition,
} from "./types";

export { DEFAULT_FIELD_CONFIG } from "./types";
