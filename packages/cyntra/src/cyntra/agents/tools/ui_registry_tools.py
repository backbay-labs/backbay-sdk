"""
UI Registry Tools - Bridge to Kernel MCP UI Tools

Exposes the kernel's UI component registry and workspace composition
capabilities to the agent tool registry.

This allows agents to:
1. Discover available UI components
2. Get detailed component information
3. Compose validated workspace specifications
4. Request workspace previews

The tools proxy to the kernel's MCP interface but are exposed
as native agent tools for the LangGraph/Agents SDK.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Coroutine

logger = logging.getLogger(__name__)

# Try to import kernel UI tools
_HAS_KERNEL = False
try:
    from cyntra.mcp.ui_tools import (
        ui_registry_list,
        ui_registry_get,
        ui_workspace_compose,
        ui_workspace_preview,
        ui_can_compose,
    )
    _HAS_KERNEL = True
except ImportError:
    logger.debug("Kernel UI tools not available - using stub implementations")


@dataclass
class ComponentInfo:
    """Summary information about a UI component."""
    id: str
    name: str
    category: str
    purpose: str
    best_for: list[str]
    avoid: list[str]


@dataclass
class ComponentManifest:
    """Full component manifest with props schema."""
    id: str
    name: str
    category: str
    purpose: str
    best_for: list[str]
    avoid: list[str]
    props: dict[str, Any]
    examples: list[dict[str, Any]]


class UIRegistryTools:
    """
    Tools for discovering and using UI components.

    These tools enable agents to compose sophisticated UIs by:
    1. Searching the component registry for suitable components
    2. Getting detailed props and usage information
    3. Composing validated workspace specifications
    4. Previewing rendered workspaces
    """

    def __init__(self):
        self._preview_callback: Callable[[dict[str, Any]], Coroutine[Any, Any, str]] | None = None

    def set_preview_callback(
        self,
        callback: Callable[[dict[str, Any]], Coroutine[Any, Any, str]],
    ) -> None:
        """Set callback for workspace preview generation."""
        self._preview_callback = callback

    async def list_components(
        self,
        category: str | None = None,
        purpose: str | None = None,
        search: str | None = None,
        limit: int = 20,
    ) -> list[ComponentInfo]:
        """
        List available UI components with optional filtering.

        Use this to discover components for building workspaces.

        Args:
            category: Filter by category (atom, molecule, organism, layout, three)
            purpose: Filter by purpose keyword (e.g., "navigation", "display")
            search: Full-text search across component metadata
            limit: Maximum components to return

        Returns:
            List of component summaries with id, name, purpose

        Example:
            # Find all button-like components
            buttons = await list_components(search="button", limit=5)

            # Get all organisms
            organisms = await list_components(category="organism")
        """
        if _HAS_KERNEL:
            result = await ui_registry_list(
                category=category,
                purpose=purpose,
                search=search,
                limit=limit,
            )
            return [
                ComponentInfo(
                    id=c["id"],
                    name=c["name"],
                    category=c["category"],
                    purpose=c["purpose"],
                    best_for=c.get("bestFor", []),
                    avoid=c.get("avoid", []),
                )
                for c in result.get("components", [])
            ]

        # Stub implementation with common components
        stub_components = [
            ComponentInfo("glass-panel", "Glass Panel", "organism", "Container with glassmorphism effect", ["cards", "modals", "sections"], ["tiny elements"]),
            ComponentInfo("glow-button", "Glow Button", "atom", "CTA button with glowing border", ["primary actions", "CTAs"], ["secondary actions"]),
            ComponentInfo("bento-grid", "Bento Grid", "organism", "Responsive grid layout", ["dashboards", "galleries"], ["linear content"]),
            ComponentInfo("typing-animation", "Typing Animation", "atom", "Typewriter text effect", ["loading states", "reveals"], ["static content"]),
            ComponentInfo("command-palette", "Command Palette", "organism", "Cmd+K style navigation", ["app navigation", "search"], ["simple UIs"]),
            ComponentInfo("kpi-stat", "KPI Stat", "molecule", "Metric display with label", ["dashboards", "stats"], ["actions"]),
        ]

        filtered = stub_components
        if category:
            filtered = [c for c in filtered if c.category == category]
        if search:
            search_lower = search.lower()
            filtered = [c for c in filtered if search_lower in c.name.lower() or search_lower in c.purpose.lower()]

        return filtered[:limit]

    async def get_component(self, component_id: str) -> ComponentManifest | None:
        """
        Get detailed information about a specific component.

        Use this to understand the props schema and see usage examples
        before including a component in a workspace.

        Args:
            component_id: The component identifier (e.g., "glass-panel")

        Returns:
            Full component manifest with props, examples, and guidelines

        Example:
            # Get details for glass panel
            manifest = await get_component("glass-panel")
            print(manifest.props)  # See available props
            print(manifest.examples)  # See usage examples
        """
        if _HAS_KERNEL:
            result = await ui_registry_get(component_id)
            if result.get("found"):
                m = result["manifest"]
                return ComponentManifest(
                    id=m["id"],
                    name=m["name"],
                    category=m["category"],
                    purpose=m["purpose"],
                    best_for=m.get("bestFor", []),
                    avoid=m.get("avoid", []),
                    props=m.get("props", {}),
                    examples=m.get("examples", []),
                )
            return None

        # Stub implementation
        stubs = {
            "glass-panel": ComponentManifest(
                id="glass-panel",
                name="Glass Panel",
                category="organism",
                purpose="Container with glassmorphism effect for content sections",
                best_for=["cards", "modals", "floating sections"],
                avoid=["tiny inline elements", "dense lists"],
                props={
                    "variant": {"type": "enum", "values": ["dark", "light", "colored"]},
                    "padding": {"type": "enum", "values": ["none", "sm", "md", "lg"]},
                    "blur": {"type": "number", "default": 8, "min": 0, "max": 20},
                },
                examples=[
                    {"variant": "dark", "padding": "md", "children": ["Content here"]},
                ],
            ),
            "glow-button": ComponentManifest(
                id="glow-button",
                name="Glow Button",
                category="atom",
                purpose="Call-to-action button with animated glow effect",
                best_for=["primary actions", "CTAs", "focus points"],
                avoid=["secondary actions", "repeated in lists"],
                props={
                    "variant": {"type": "enum", "values": ["default", "outline", "ghost"]},
                    "size": {"type": "enum", "values": ["sm", "md", "lg"]},
                    "glowColor": {"type": "string", "description": "CSS color for glow"},
                },
                examples=[
                    {"children": "Get Started", "variant": "default", "size": "lg"},
                ],
            ),
        }
        return stubs.get(component_id)

    async def compose_workspace(
        self,
        name: str,
        layout: dict[str, Any],
        theme: dict[str, Any] | None = None,
        bindings: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """
        Compose a validated workspace specification.

        This creates a complete workspace spec that can be rendered
        by the WorkspaceRenderer. The layout is validated to ensure
        all components exist and are used correctly.

        Args:
            name: Human-readable workspace name
            layout: Root layout node (split, stack, tabs, grid, or panel)
            theme: Optional theme overrides (colors, fonts, spacing)
            bindings: Optional event bindings for interactivity

        Returns:
            Validated workspace specification ready for rendering

        Layout Types:
            - split: Resizable horizontal/vertical split
            - stack: Flexbox-style vertical/horizontal stack
            - tabs: Tabbed content switching
            - grid: CSS grid layout
            - panel: Leaf node with actual component

        Example:
            workspace = await compose_workspace(
                name="Mission HUD",
                layout={
                    "type": "split",
                    "direction": "horizontal",
                    "sizes": [70, 30],
                    "children": [
                        {
                            "type": "panel",
                            "component": "glass-panel",
                            "props": {"variant": "dark", "padding": "md"},
                            "children": [
                                {
                                    "type": "panel",
                                    "component": "kpi-stat",
                                    "props": {"label": "Focus Time", "value": "25:00"}
                                }
                            ]
                        },
                        {
                            "type": "panel",
                            "component": "glass-panel",
                            "props": {"variant": "light"}
                        }
                    ]
                },
                theme={"accent": "#00ff88"}
            )
        """
        import uuid

        workspace_spec = {
            "id": f"workspace-{uuid.uuid4().hex[:8]}",
            "name": name,
            "layout": layout,
        }

        if theme:
            workspace_spec["theme"] = theme
        if bindings:
            workspace_spec["bindings"] = bindings

        if _HAS_KERNEL:
            result = await ui_workspace_compose(workspace_spec)
            return result

        # Stub: return as-is with validation flag
        workspace_spec["_validated"] = True
        workspace_spec["_stub_mode"] = True
        return workspace_spec

    async def preview_workspace(
        self,
        workspace_spec: dict[str, Any],
        viewport: str = "desktop",
    ) -> dict[str, Any]:
        """
        Request a preview render of a workspace.

        This queues the workspace for screenshot capture via Playwright.
        The preview can be used to visually validate the composition
        before presenting to users.

        Args:
            workspace_spec: The workspace specification to preview
            viewport: Target viewport (mobile, tablet, desktop, ultrawide)

        Returns:
            Preview status with render URL when complete

        Example:
            result = await preview_workspace(workspace, viewport="desktop")
            if result["status"] == "completed":
                print(f"Preview at: {result['url']}")
        """
        if _HAS_KERNEL:
            result = await ui_workspace_preview(workspace_spec, viewport)
            return result

        if self._preview_callback:
            url = await self._preview_callback(workspace_spec)
            return {"status": "completed", "url": url}

        return {
            "status": "queued",
            "message": "Preview generation queued (stub mode)",
            "_stub_mode": True,
        }

    async def can_compose(
        self,
        parent_component: str,
        child_component: str,
    ) -> dict[str, Any]:
        """
        Check if two components can be composed together.

        Some components have restrictions on what can be nested inside them.
        Use this to validate component relationships before building layouts.

        Args:
            parent_component: Parent component ID
            child_component: Child component ID

        Returns:
            Compatibility info with allowed flag and any warnings

        Example:
            result = await can_compose("tabs", "glass-panel")
            if result["allowed"]:
                print("Safe to nest glass-panel in tabs")
        """
        if _HAS_KERNEL:
            result = await ui_can_compose(parent_component, child_component)
            return result

        # Stub: most things are allowed
        return {
            "allowed": True,
            "parent": parent_component,
            "child": child_component,
            "warnings": [],
            "_stub_mode": True,
        }


def create_ui_registry_tool_definitions() -> list[dict[str, Any]]:
    """
    Create tool definitions for the Agents SDK ToolRegistry.

    Returns list of tool definitions that can be registered
    with the agent's tool registry.
    """
    return [
        {
            "name": "ui.registry.list",
            "description": "List available UI components with optional filtering by category, purpose, or search query. Use to discover components for workspace composition.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "enum": ["atom", "molecule", "organism", "layout", "three"],
                        "description": "Filter by component category",
                    },
                    "purpose": {
                        "type": "string",
                        "description": "Filter by purpose keyword",
                    },
                    "search": {
                        "type": "string",
                        "description": "Full-text search across component metadata",
                    },
                    "limit": {
                        "type": "integer",
                        "default": 20,
                        "description": "Maximum components to return",
                    },
                },
            },
        },
        {
            "name": "ui.registry.get",
            "description": "Get detailed information about a specific component including props schema, examples, and usage guidelines.",
            "parameters": {
                "type": "object",
                "properties": {
                    "component_id": {
                        "type": "string",
                        "description": "The component identifier (e.g., 'glass-panel')",
                    },
                },
                "required": ["component_id"],
            },
        },
        {
            "name": "ui.workspace.compose",
            "description": "Compose a validated workspace specification from layout tree. Creates declarative UI specs that can be rendered.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Human-readable workspace name",
                    },
                    "layout": {
                        "type": "object",
                        "description": "Root layout node (split, stack, tabs, grid, or panel)",
                    },
                    "theme": {
                        "type": "object",
                        "description": "Optional theme overrides",
                    },
                    "bindings": {
                        "type": "array",
                        "description": "Optional event bindings for interactivity",
                    },
                },
                "required": ["name", "layout"],
            },
        },
        {
            "name": "ui.workspace.preview",
            "description": "Request a screenshot preview of a workspace specification.",
            "parameters": {
                "type": "object",
                "properties": {
                    "workspace_spec": {
                        "type": "object",
                        "description": "The workspace specification to preview",
                    },
                    "viewport": {
                        "type": "string",
                        "enum": ["mobile", "tablet", "desktop", "ultrawide"],
                        "default": "desktop",
                    },
                },
                "required": ["workspace_spec"],
            },
        },
        {
            "name": "ui.can_compose",
            "description": "Check if two components can be composed together (parent/child nesting).",
            "parameters": {
                "type": "object",
                "properties": {
                    "parent_component": {
                        "type": "string",
                        "description": "Parent component ID",
                    },
                    "child_component": {
                        "type": "string",
                        "description": "Child component ID",
                    },
                },
                "required": ["parent_component", "child_component"],
            },
        },
    ]
