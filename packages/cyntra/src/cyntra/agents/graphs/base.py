"""Base types and utilities for LangGraph workflows.

Defines GlyphState - the shared state type for all graphs.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Annotated, Any

from langgraph.graph import add_messages


class GlyphMode(str, Enum):
    """Which mode Glyph is operating in."""

    PLANNER = "planner"
    COACH = "coach"
    ARCHIVIST = "archivist"
    CHAT = "chat"


@dataclass
class GlyphContext:
    """Context information for the current operation."""

    user_id: str
    session_id: str | None = None
    mission_id: str | None = None
    block_id: str | None = None
    surface: str = "api"

    # User state
    user_name: str | None = None
    timezone: str = "UTC"

    # For graph context
    graph_id: str | None = None
    focus_node_ids: list[str] = field(default_factory=list)


@dataclass
class GlyphState:
    """Shared state for all LangGraph workflows.

    This is the TypedDict-like structure that flows through the graph.
    Using dataclass for cleaner typing.
    """

    # Core identifiers
    context: GlyphContext

    # Current mode
    mode: GlyphMode = GlyphMode.CHAT

    # Conversation messages (uses LangGraph's message accumulator)
    messages: Annotated[list[dict[str, Any]], add_messages] = field(default_factory=list)

    # Scratchpad for intermediate reasoning
    scratchpad: str = ""

    # Structured outputs from nodes
    outputs: dict[str, Any] = field(default_factory=dict)

    # Errors encountered
    errors: list[str] = field(default_factory=list)

    # Timestamps
    started_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def add_output(self, key: str, value: Any) -> None:
        """Add an output to the state."""
        self.outputs[key] = value
        self.updated_at = datetime.now()

    def add_error(self, error: str) -> None:
        """Add an error to the state."""
        self.errors.append(error)
        self.updated_at = datetime.now()

    def append_scratchpad(self, text: str) -> None:
        """Append to the scratchpad."""
        self.scratchpad = f"{self.scratchpad}\n{text}".strip()
        self.updated_at = datetime.now()


def create_initial_state(
    user_id: str,
    mode: GlyphMode = GlyphMode.CHAT,
    *,
    session_id: str | None = None,
    mission_id: str | None = None,
    block_id: str | None = None,
    surface: str = "api",
    user_name: str | None = None,
    initial_message: str | None = None,
) -> GlyphState:
    """Create initial state for a graph run."""
    context = GlyphContext(
        user_id=user_id,
        session_id=session_id,
        mission_id=mission_id,
        block_id=block_id,
        surface=surface,
        user_name=user_name,
    )

    messages: list[dict[str, Any]] = []
    if initial_message:
        messages.append({"role": "user", "content": initial_message})

    return GlyphState(
        context=context,
        mode=mode,
        messages=messages,
    )


# Type for graph state that LangGraph expects
# LangGraph works with dicts, so we provide conversion utilities


def state_to_dict(state: GlyphState) -> dict[str, Any]:
    """Convert GlyphState to dict for LangGraph."""
    return {
        "context": {
            "user_id": state.context.user_id,
            "session_id": state.context.session_id,
            "mission_id": state.context.mission_id,
            "block_id": state.context.block_id,
            "surface": state.context.surface,
            "user_name": state.context.user_name,
            "timezone": state.context.timezone,
            "graph_id": state.context.graph_id,
            "focus_node_ids": state.context.focus_node_ids,
        },
        "mode": state.mode.value,
        "messages": state.messages,
        "scratchpad": state.scratchpad,
        "outputs": state.outputs,
        "errors": state.errors,
        "started_at": state.started_at.isoformat(),
        "updated_at": state.updated_at.isoformat(),
    }


def dict_to_state(data: dict[str, Any]) -> GlyphState:
    """Convert dict back to GlyphState."""
    ctx_data = data.get("context", {})
    context = GlyphContext(
        user_id=ctx_data.get("user_id", ""),
        session_id=ctx_data.get("session_id"),
        mission_id=ctx_data.get("mission_id"),
        block_id=ctx_data.get("block_id"),
        surface=ctx_data.get("surface", "api"),
        user_name=ctx_data.get("user_name"),
        timezone=ctx_data.get("timezone", "UTC"),
        graph_id=ctx_data.get("graph_id"),
        focus_node_ids=ctx_data.get("focus_node_ids", []),
    )

    return GlyphState(
        context=context,
        mode=GlyphMode(data.get("mode", "chat")),
        messages=data.get("messages", []),
        scratchpad=data.get("scratchpad", ""),
        outputs=data.get("outputs", {}),
        errors=data.get("errors", []),
        started_at=datetime.fromisoformat(data["started_at"]) if "started_at" in data else datetime.now(),
        updated_at=datetime.fromisoformat(data["updated_at"]) if "updated_at" in data else datetime.now(),
    )


# Helper for creating LangGraph-compatible state schema
GlyphStateDict = dict[str, Any]


def get_state_schema() -> dict[str, Any]:
    """Get the state schema for LangGraph StateGraph."""
    return {
        "context": dict,
        "mode": str,
        "messages": list,
        "scratchpad": str,
        "outputs": dict,
        "errors": list,
        "started_at": str,
        "updated_at": str,
    }

