/**
 * WorkspaceSpec Validation
 *
 * Validates workspace specifications and provides helpful error messages.
 */

import type {
  WorkspaceSpec,
  LayoutNode,
  PanelNode,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "./types";
import { getRegistry } from "./registry/index.js";

/**
 * Validate a WorkspaceSpec
 */
export function validateWorkspace(spec: WorkspaceSpec): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const registry = getRegistry();

  // Validate required fields
  if (!spec.id) {
    errors.push({
      path: "id",
      message: "Workspace ID is required",
      code: "MISSING_ID",
    });
  }

  if (!spec.name) {
    errors.push({
      path: "name",
      message: "Workspace name is required",
      code: "MISSING_NAME",
    });
  }

  if (!spec.layout) {
    errors.push({
      path: "layout",
      message: "Workspace layout is required",
      code: "MISSING_LAYOUT",
    });
  } else {
    // Validate layout recursively
    validateLayoutNode(spec.layout, "layout", errors, warnings, registry);
  }

  // Validate bindings
  if (spec.bindings) {
    spec.bindings.forEach((binding, i) => {
      if (!binding.source) {
        errors.push({
          path: `bindings[${i}].source`,
          message: "Binding source is required",
          code: "MISSING_BINDING_SOURCE",
        });
      }
      if (!binding.event) {
        errors.push({
          path: `bindings[${i}].event`,
          message: "Binding event is required",
          code: "MISSING_BINDING_EVENT",
        });
      }
      if (!binding.action) {
        errors.push({
          path: `bindings[${i}].action`,
          message: "Binding action is required",
          code: "MISSING_BINDING_ACTION",
        });
      }
    });
  }

  // Validate state
  if (spec.state?.persist && !spec.state.persist.key) {
    errors.push({
      path: "state.persist.key",
      message: "Persistence key is required when persist is enabled",
      code: "MISSING_PERSIST_KEY",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a layout node recursively
 */
function validateLayoutNode(
  node: LayoutNode,
  path: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  registry: ReturnType<typeof getRegistry>
): void {
  if (!node.type) {
    errors.push({
      path,
      message: "Layout node type is required",
      code: "MISSING_NODE_TYPE",
    });
    return;
  }

  switch (node.type) {
    case "split":
      if (!node.children || node.children.length < 2) {
        errors.push({
          path: `${path}.children`,
          message: "Split layout requires at least 2 children",
          code: "SPLIT_MIN_CHILDREN",
        });
      } else {
        node.children.forEach((child, i) => {
          validateLayoutNode(
            child,
            `${path}.children[${i}]`,
            errors,
            warnings,
            registry
          );
        });
      }
      break;

    case "stack":
      if (!node.children || node.children.length === 0) {
        warnings.push({
          path: `${path}.children`,
          message: "Stack layout has no children",
          suggestion: "Add child nodes or use a placeholder",
        });
      } else {
        node.children.forEach((child, i) => {
          validateLayoutNode(
            child,
            `${path}.children[${i}]`,
            errors,
            warnings,
            registry
          );
        });
      }
      break;

    case "tabs":
      if (!node.children || node.children.length === 0) {
        errors.push({
          path: `${path}.children`,
          message: "Tabs layout requires at least one tab",
          code: "TABS_MIN_CHILDREN",
        });
      } else {
        const tabIds = new Set<string>();
        node.children.forEach((tab, i) => {
          if (!tab.id) {
            errors.push({
              path: `${path}.children[${i}].id`,
              message: "Tab ID is required",
              code: "MISSING_TAB_ID",
            });
          } else if (tabIds.has(tab.id)) {
            errors.push({
              path: `${path}.children[${i}].id`,
              message: `Duplicate tab ID: ${tab.id}`,
              code: "DUPLICATE_TAB_ID",
            });
          } else {
            tabIds.add(tab.id);
          }

          if (!tab.label) {
            warnings.push({
              path: `${path}.children[${i}].label`,
              message: "Tab label is missing",
              suggestion: "Add a label for accessibility",
            });
          }

          if (tab.content) {
            validateLayoutNode(
              tab.content,
              `${path}.children[${i}].content`,
              errors,
              warnings,
              registry
            );
          } else {
            errors.push({
              path: `${path}.children[${i}].content`,
              message: "Tab content is required",
              code: "MISSING_TAB_CONTENT",
            });
          }
        });

        // Validate defaultTab
        if (node.defaultTab && !tabIds.has(node.defaultTab)) {
          errors.push({
            path: `${path}.defaultTab`,
            message: `Default tab "${node.defaultTab}" not found`,
            code: "INVALID_DEFAULT_TAB",
          });
        }
      }
      break;

    case "grid":
      if (!node.children || node.children.length === 0) {
        warnings.push({
          path: `${path}.children`,
          message: "Grid layout has no items",
          suggestion: "Add grid items",
        });
      } else {
        node.children.forEach((item, i) => {
          if (item.content) {
            validateLayoutNode(
              item.content,
              `${path}.children[${i}].content`,
              errors,
              warnings,
              registry
            );
          } else {
            errors.push({
              path: `${path}.children[${i}].content`,
              message: "Grid item content is required",
              code: "MISSING_GRID_CONTENT",
            });
          }
        });
      }
      break;

    case "panel":
      validatePanelNode(node, path, errors, warnings, registry);
      break;

    case "slot":
      if (!node.name) {
        errors.push({
          path: `${path}.name`,
          message: "Slot name is required",
          code: "MISSING_SLOT_NAME",
        });
      }
      if (node.fallback) {
        validateLayoutNode(
          node.fallback,
          `${path}.fallback`,
          errors,
          warnings,
          registry
        );
      }
      break;

    default:
      errors.push({
        path: `${path}.type`,
        message: `Unknown layout type: ${(node as LayoutNode).type}`,
        code: "UNKNOWN_NODE_TYPE",
      });
  }
}

/**
 * Validate a panel node
 */
function validatePanelNode(
  node: PanelNode,
  path: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  registry: ReturnType<typeof getRegistry>
): void {
  if (!node.component) {
    errors.push({
      path: `${path}.component`,
      message: "Panel component ID is required",
      code: "MISSING_COMPONENT",
    });
    return;
  }

  // Check if component exists in registry
  const manifest = registry.get(node.component);
  if (!manifest) {
    warnings.push({
      path: `${path}.component`,
      message: `Component "${node.component}" not found in registry`,
      suggestion: "Check component ID or register the component",
    });
    return;
  }

  // Validate required props
  if (manifest.props) {
    Object.entries(manifest.props).forEach(([propName, propSchema]) => {
      if (propSchema.required && !(node.props && propName in node.props)) {
        errors.push({
          path: `${path}.props.${propName}`,
          message: `Required prop "${propName}" is missing for ${node.component}`,
          code: "MISSING_REQUIRED_PROP",
        });
      }
    });
  }

  // Validate prop types (basic)
  if (node.props && manifest.props) {
    Object.entries(node.props).forEach(([propName, propValue]) => {
      const propSchema = manifest.props[propName];
      if (!propSchema) {
        warnings.push({
          path: `${path}.props.${propName}`,
          message: `Unknown prop "${propName}" for ${node.component}`,
          suggestion: "Check prop name or remove it",
        });
      } else if (propSchema.enum && !propSchema.enum.includes(String(propValue))) {
        errors.push({
          path: `${path}.props.${propName}`,
          message: `Invalid value "${propValue}" for ${propName}. Expected one of: ${propSchema.enum.join(", ")}`,
          code: "INVALID_ENUM_VALUE",
        });
      }
    });
  }

  // Validate children composition
  if (node.children && node.children.length > 0) {
    if (!manifest.slots || manifest.slots.length === 0) {
      warnings.push({
        path: `${path}.children`,
        message: `Component "${node.component}" does not define slots but has children`,
        suggestion: "Check if this component supports children",
      });
    }

    node.children.forEach((child, i) => {
      validatePanelNode(child, `${path}.children[${i}]`, errors, warnings, registry);

      // Check composition validity
      const childManifest = registry.get(child.component);
      if (childManifest && !registry.canCompose(node.component, child.component)) {
        warnings.push({
          path: `${path}.children[${i}]`,
          message: `"${child.component}" may not be valid inside "${node.component}"`,
          suggestion: "Check component composition rules",
        });
      }
    });
  }
}

/**
 * Quick validation check (returns boolean only)
 */
export function isValidWorkspace(spec: WorkspaceSpec): boolean {
  return validateWorkspace(spec).valid;
}

/**
 * Extract all component IDs used in a workspace
 */
export function extractComponentIds(spec: WorkspaceSpec): string[] {
  const ids = new Set<string>();

  function extractFromNode(node: LayoutNode): void {
    if (node.type === "panel") {
      ids.add(node.component);
      node.children?.forEach(extractFromNode);
    } else if (node.type === "split" || node.type === "stack") {
      node.children.forEach(extractFromNode);
    } else if (node.type === "tabs") {
      node.children.forEach((tab) => extractFromNode(tab.content));
    } else if (node.type === "grid") {
      node.children.forEach((item) => extractFromNode(item.content));
    } else if (node.type === "slot" && node.fallback) {
      extractFromNode(node.fallback);
    }
  }

  extractFromNode(spec.layout);
  return Array.from(ids);
}
