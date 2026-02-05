"""Graph schemas for Outora concept graph integration."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import Field
from cyntra.commons import BaseSchema


class NodeType(str, Enum):
    """Type of node in the Outora concept graph."""

    CONCEPT = "concept"
    SKILL = "skill"
    TOPIC = "topic"
    RESOURCE = "resource"
    PROJECT = "project"
    COURSE = "course"
    CHAPTER = "chapter"
    PRACTICE = "practice"


class EdgeType(str, Enum):
    """Type of edge connecting nodes."""

    PREREQUISITE = "prerequisite"  # A is prerequisite for B
    CONTAINS = "contains"  # A contains B (hierarchy)
    RELATED = "related"  # A is related to B
    SUPPORTS = "supports"  # A supports learning B
    PRACTICED_IN = "practiced_in"  # Concept A is practiced in resource B


class MasteryLevel(str, Enum):
    """User's mastery level of a concept."""

    NOT_STARTED = "not_started"
    LEARNING = "learning"
    PRACTICING = "practicing"
    COMFORTABLE = "comfortable"
    MASTERED = "mastered"


class GraphNode(BaseSchema):
    """A node in the Outora concept graph."""

    id: str
    graph_id: str = Field(..., description="Which graph this node belongs to.")

    type: NodeType
    title: str
    description: str | None = None

    # Hierarchy
    parent_id: str | None = None
    depth: int = 0

    # Metadata
    created_at: datetime | None = None
    updated_at: datetime | None = None

    # User-specific state (if loaded with user context)
    mastery_level: MasteryLevel | None = None
    last_practiced: datetime | None = None
    practice_count: int = 0

    # For ordering/weighting in recommendations
    importance: float = Field(
        1.0,
        ge=0.0,
        le=1.0,
        description="How important this node is (for prioritization).",
    )

    # Flexible metadata
    meta: dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseSchema):
    """An edge connecting two nodes in the graph."""

    id: str
    graph_id: str

    source_id: str
    target_id: str
    edge_type: EdgeType

    # Edge properties
    weight: float = Field(
        1.0,
        ge=0.0,
        description="Strength of the relationship.",
    )

    # Metadata
    created_at: datetime | None = None
    meta: dict[str, Any] = Field(default_factory=dict)


class ConceptLink(BaseSchema):
    """A link between a mission/block and a concept in the graph.

    Used to track what concepts a user is working on.
    """

    node_id: str
    graph_id: str
    relevance: float = Field(
        1.0,
        ge=0.0,
        le=1.0,
        description="How relevant this concept is to the mission/block.",
    )
    is_primary: bool = Field(
        False,
        description="Whether this is the primary concept being worked on.",
    )


class GraphContext(BaseSchema):
    """Context from the graph for agent planning.

    Provides relevant nodes and their relationships to help
    Glyph make informed recommendations.
    """

    # Primary nodes the user is focused on
    focus_nodes: list[GraphNode] = Field(default_factory=list)

    # Prerequisites that might need review
    prerequisite_nodes: list[GraphNode] = Field(default_factory=list)

    # Related nodes for potential exploration
    related_nodes: list[GraphNode] = Field(default_factory=list)

    # Suggested next nodes based on graph traversal
    suggested_next: list[GraphNode] = Field(default_factory=list)

    # Summary for the agent
    context_summary: str | None = Field(
        None,
        description="Human-readable summary of the graph context.",
    )


class NodeProgress(BaseSchema):
    """Progress on a specific node for a user."""

    user_id: str
    node_id: str
    graph_id: str

    mastery_level: MasteryLevel = MasteryLevel.NOT_STARTED
    practice_count: int = 0
    total_time_minutes: int = 0

    last_practiced: datetime | None = None
    first_practiced: datetime | None = None

    # Spaced repetition fields
    ease_factor: float = 2.5
    interval_days: int = 1
    next_review_date: datetime | None = None

    # Performance tracking
    success_rate: float | None = None
    streak: int = 0


class GraphQuery(BaseSchema):
    """Query parameters for searching/traversing the graph."""

    graph_id: str

    # Search by properties
    node_types: list[NodeType] | None = None
    parent_id: str | None = None
    title_contains: str | None = None

    # Filter by user state
    user_id: str | None = None
    mastery_levels: list[MasteryLevel] | None = None
    needs_review: bool | None = None

    # Traversal options
    from_node_id: str | None = None
    edge_types: list[EdgeType] | None = None
    max_depth: int = 3

    # Pagination
    limit: int = 50
    offset: int = 0


class GraphQueryResult(BaseSchema):
    """Result of a graph query."""

    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)

    total_count: int = 0
    has_more: bool = False
