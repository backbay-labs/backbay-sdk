/**
 * WorkspaceRenderer
 *
 * Renders a WorkspaceSpec into a React component tree.
 * This is the runtime that brings agent-composed UI to life.
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
  type ComponentType,
} from "react";
import type {
  WorkspaceSpec,
  LayoutNode,
  SplitLayout,
  StackLayout,
  TabsLayout,
  GridLayout,
  PanelNode,
  SlotNode,
  ThemeOverrides,
  RenderContext,
} from "./types";
import { getRegistry } from "./registry/index.js";

// ============================================================================
// Context
// ============================================================================

const WorkspaceContext = createContext<RenderContext | null>(null);

export function useWorkspace(): RenderContext {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceRenderer");
  }
  return ctx;
}

// ============================================================================
// Component Map (runtime binding)
// ============================================================================

// Import actual components for rendering
// These would be dynamically imported in production
const componentMap: Record<string, ComponentType<Record<string, unknown>>> = {};

/**
 * Register a component for runtime use
 */
export function registerComponent(
  id: string,
  component: ComponentType<Record<string, unknown>>
): void {
  componentMap[id] = component;
}

/**
 * Get a component by ID
 */
function getComponent(
  id: string
): ComponentType<Record<string, unknown>> | null {
  return componentMap[id] || null;
}

// ============================================================================
// Layout Renderers
// ============================================================================

interface LayoutRendererProps {
  node: LayoutNode;
}

/**
 * Render a split layout
 */
function SplitLayoutRenderer({ node }: { node: SplitLayout }) {
  const { direction, sizes, children } = node;
  const isHorizontal = direction === "horizontal";

  return (
    <div
      className="workspace-split"
      style={{
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        width: "100%",
        height: "100%",
      }}
    >
      {children.map((child, i) => {
        const size = sizes?.[i];
        const style: React.CSSProperties = {
          flex: size === "fill" ? 1 : undefined,
          width: isHorizontal && typeof size === "number" ? size : undefined,
          height: !isHorizontal && typeof size === "number" ? size : undefined,
        };

        return (
          <div key={i} className="workspace-split-panel" style={style}>
            <LayoutRenderer node={child} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Render a stack layout
 */
function StackLayoutRenderer({ node }: { node: StackLayout }) {
  const { direction, gap = 8, align = "stretch", justify = "start", wrap, children } = node;

  const alignMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
  };

  const justifyMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "space-between",
    around: "space-around",
  };

  return (
    <div
      className="workspace-stack"
      style={{
        display: "flex",
        flexDirection: direction === "horizontal" ? "row" : "column",
        gap,
        alignItems: alignMap[align],
        justifyContent: justifyMap[justify],
        flexWrap: wrap ? "wrap" : "nowrap",
        width: "100%",
        height: "100%",
      }}
    >
      {children.map((child, i) => (
        <div key={i} className="workspace-stack-item">
          <LayoutRenderer node={child} />
        </div>
      ))}
    </div>
  );
}

/**
 * Render a tabs layout
 */
function TabsLayoutRenderer({ node }: { node: TabsLayout }) {
  const { orientation = "horizontal", defaultTab, children } = node;
  const [activeTab, setActiveTab] = useState(defaultTab || children[0]?.id);

  const activeContent = children.find((t) => t.id === activeTab)?.content;

  return (
    <div
      className="workspace-tabs"
      style={{
        display: "flex",
        flexDirection: orientation === "horizontal" ? "column" : "row",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        className="workspace-tabs-list"
        role="tablist"
        style={{
          display: "flex",
          flexDirection: orientation === "horizontal" ? "row" : "column",
          gap: 4,
          padding: 4,
          borderBottom:
            orientation === "horizontal"
              ? "1px solid var(--border, #333)"
              : undefined,
          borderRight:
            orientation === "vertical"
              ? "1px solid var(--border, #333)"
              : undefined,
        }}
      >
        {children.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            disabled={tab.disabled}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              background: activeTab === tab.id ? "var(--accent, #333)" : "transparent",
              border: "none",
              borderRadius: 4,
              color: "inherit",
              cursor: tab.disabled ? "not-allowed" : "pointer",
              opacity: tab.disabled ? 0.5 : 1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className="workspace-tabs-content"
        role="tabpanel"
        style={{ flex: 1, overflow: "auto" }}
      >
        {activeContent && <LayoutRenderer node={activeContent} />}
      </div>
    </div>
  );
}

/**
 * Render a grid layout
 */
function GridLayoutRenderer({ node }: { node: GridLayout }) {
  const { columns = 1, rows, gap = 16, children } = node;

  const gridTemplateColumns =
    typeof columns === "number" ? `repeat(${columns}, 1fr)` : columns;
  const gridTemplateRows =
    typeof rows === "number" ? `repeat(${rows}, 1fr)` : rows;
  const gridGap = Array.isArray(gap) ? `${gap[0]}px ${gap[1]}px` : gap;

  return (
    <div
      className="workspace-grid"
      style={{
        display: "grid",
        gridTemplateColumns,
        gridTemplateRows: gridTemplateRows || undefined,
        gap: gridGap,
        width: "100%",
        height: "100%",
      }}
    >
      {children.map((item, i) => (
        <div
          key={item.id || i}
          className="workspace-grid-item"
          style={{
            gridColumn: item.colSpan ? `span ${item.colSpan}` : item.column,
            gridRow: item.rowSpan ? `span ${item.rowSpan}` : item.row,
          }}
        >
          <LayoutRenderer node={item.content} />
        </div>
      ))}
    </div>
  );
}

/**
 * Render a panel (leaf node with component)
 */
function PanelRenderer({ node }: { node: PanelNode }) {
  const { component, props = {}, children } = node;
  const ctx = useWorkspace();

  // Get the component from the map
  const Component = getComponent(component);

  // Fallback for unregistered components
  if (!Component) {
    const manifest = ctx.registry
      ? (ctx.registry as ReturnType<typeof getRegistry>).get(component)
      : null;

    return (
      <div
        className="workspace-panel workspace-panel-placeholder"
        style={{
          padding: 16,
          background: "var(--muted, #1a1a1a)",
          borderRadius: 8,
          border: "1px dashed var(--border, #333)",
        }}
      >
        <div style={{ opacity: 0.7, fontSize: 12 }}>
          Component: <strong>{component}</strong>
        </div>
        {manifest && (
          <div style={{ opacity: 0.5, fontSize: 11, marginTop: 4 }}>
            {manifest.description}
          </div>
        )}
        {Object.keys(props).length > 0 && (
          <pre
            style={{
              marginTop: 8,
              fontSize: 10,
              opacity: 0.6,
              overflow: "auto",
            }}
          >
            {JSON.stringify(props, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  // Render children if component has slots
  const childNodes = children?.map((child, i) => (
    <PanelRenderer key={i} node={child} />
  ));

  return (
    <div className="workspace-panel">
      <Component {...props}>{childNodes}</Component>
    </div>
  );
}

/**
 * Render a slot placeholder
 */
function SlotRenderer({ node }: { node: SlotNode }) {
  const { slots } = useWorkspace();
  const content = slots?.[node.name];

  if (content) {
    return <>{content}</>;
  }

  if (node.fallback) {
    return <LayoutRenderer node={node.fallback} />;
  }

  return (
    <div
      className="workspace-slot workspace-slot-empty"
      style={{
        padding: 16,
        background: "var(--muted, #1a1a1a)",
        borderRadius: 8,
        border: "2px dashed var(--border, #333)",
        textAlign: "center",
        opacity: 0.5,
      }}
    >
      Slot: {node.name}
    </div>
  );
}

/**
 * Main layout node renderer
 */
function LayoutRenderer({ node }: LayoutRendererProps) {
  switch (node.type) {
    case "split":
      return <SplitLayoutRenderer node={node} />;
    case "stack":
      return <StackLayoutRenderer node={node} />;
    case "tabs":
      return <TabsLayoutRenderer node={node} />;
    case "grid":
      return <GridLayoutRenderer node={node} />;
    case "panel":
      return <PanelRenderer node={node} />;
    case "slot":
      return <SlotRenderer node={node} />;
    default:
      return (
        <div className="workspace-unknown">
          Unknown layout type: {(node as LayoutNode).type}
        </div>
      );
  }
}

// ============================================================================
// Main WorkspaceRenderer Component
// ============================================================================

export interface WorkspaceRendererProps {
  /** Workspace specification to render */
  spec: WorkspaceSpec;

  /** Slot content */
  slots?: Record<string, ReactNode>;

  /** Event handler */
  onEvent?: (event: string, payload?: unknown) => void;

  /** Custom theme overrides */
  theme?: ThemeOverrides;

  /** Target surface */
  surface?: string;

  /** Additional className */
  className?: string;

  /** Additional styles */
  style?: React.CSSProperties;
}

/**
 * Render a WorkspaceSpec into a React component tree
 */
export function WorkspaceRenderer({
  spec,
  slots,
  onEvent,
  theme: themeOverrides,
  surface = "desktop",
  className,
  style,
}: WorkspaceRendererProps) {
  // Merge themes
  const theme = useMemo(
    () => ({ ...spec.theme, ...themeOverrides }),
    [spec.theme, themeOverrides]
  );

  // Initialize state
  const [state, setStateObj] = useState<Record<string, unknown>>(
    spec.state?.initial || {}
  );

  // State updater
  const setState = useCallback((path: string, value: unknown) => {
    setStateObj((prev) => {
      const keys = path.split(".");
      const newState = { ...prev };
      let current: Record<string, unknown> = newState;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...(current[key] as Record<string, unknown>) };
        current = current[key] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      return newState;
    });
  }, []);

  // Event emitter
  const emit = useCallback(
    (event: string, payload?: unknown) => {
      onEvent?.(event, payload);
    },
    [onEvent]
  );

  // Build context
  const context: RenderContext = useMemo(
    () => ({
      registry: getRegistry(),
      theme,
      state,
      setState,
      emit,
      slots,
      surface,
    }),
    [theme, state, setState, emit, slots, surface]
  );

  // Convert theme to CSS variables
  const cssVariables = useMemo(() => {
    const vars: Record<string, string> = {};

    if (theme.background) vars["--workspace-bg"] = theme.background;
    if (theme.foreground) vars["--workspace-fg"] = theme.foreground;
    if (theme.accent) vars["--workspace-accent"] = theme.accent;
    if (theme.muted) vars["--workspace-muted"] = theme.muted;
    if (theme.borderColor) vars["--workspace-border"] = theme.borderColor;
    if (theme.glowColor) vars["--workspace-glow"] = theme.glowColor;
    if (theme.spacing) vars["--workspace-spacing"] = `${theme.spacing}px`;
    if (theme.borderRadius)
      vars["--workspace-radius"] = `${theme.borderRadius}px`;
    if (theme.fontFamily) vars["--workspace-font"] = theme.fontFamily;
    if (theme.fontSize) vars["--workspace-font-size"] = `${theme.fontSize}px`;

    // Custom variables
    if (theme.variables) {
      Object.entries(theme.variables).forEach(([key, value]) => {
        vars[key.startsWith("--") ? key : `--${key}`] = value;
      });
    }

    return vars;
  }, [theme]);

  return (
    <WorkspaceContext.Provider value={context}>
      <div
        className={`workspace-root ${className || ""}`}
        data-workspace-id={spec.id}
        data-workspace-surface={surface}
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "var(--workspace-bg, transparent)",
          color: "var(--workspace-fg, inherit)",
          fontFamily: "var(--workspace-font, inherit)",
          fontSize: "var(--workspace-font-size, inherit)",
          ...cssVariables,
          ...style,
        }}
      >
        <LayoutRenderer node={spec.layout} />
      </div>
    </WorkspaceContext.Provider>
  );
}

