"""Abstract repository interfaces for the agents package.

These protocols define the contract between tools/graphs and storage.
Implementations can be in-memory (for testing), Postgres, or other backends.
"""

from abc import abstractmethod
from datetime import date
from typing import Protocol, runtime_checkable

from cyntra.agents.schemas import (
    Block,
    BlockStatus,
    Episode,
    EpisodeKind,
    GraphNode,
    GraphQuery,
    GraphQueryResult,
    Mission,
    MissionStatus,
    NodeProgress,
    UserProfile,
)


@runtime_checkable
class MissionsRepository(Protocol):
    """Repository for Mission CRUD operations."""

    @abstractmethod
    async def create(self, mission: Mission) -> Mission:
        """Create a new mission."""
        ...

    @abstractmethod
    async def get(self, mission_id: str) -> Mission | None:
        """Get a mission by ID."""
        ...

    @abstractmethod
    async def update(self, mission: Mission) -> Mission:
        """Update an existing mission."""
        ...

    @abstractmethod
    async def delete(self, mission_id: str) -> bool:
        """Delete a mission. Returns True if deleted."""
        ...

    @abstractmethod
    async def list_for_user(
        self,
        user_id: str,
        *,
        status: MissionStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Mission]:
        """List missions for a user, optionally filtered by status."""
        ...

    @abstractmethod
    async def get_active_mission(self, user_id: str) -> Mission | None:
        """Get the user's current active mission (if any)."""
        ...


@runtime_checkable
class BlocksRepository(Protocol):
    """Repository for Block CRUD operations."""

    @abstractmethod
    async def create(self, block: Block) -> Block:
        """Create a new block."""
        ...

    @abstractmethod
    async def get(self, block_id: str) -> Block | None:
        """Get a block by ID."""
        ...

    @abstractmethod
    async def update(self, block: Block) -> Block:
        """Update an existing block."""
        ...

    @abstractmethod
    async def delete(self, block_id: str) -> bool:
        """Delete a block. Returns True if deleted."""
        ...

    @abstractmethod
    async def list_for_mission(
        self,
        mission_id: str,
        *,
        status: BlockStatus | None = None,
        limit: int = 100,
    ) -> list[Block]:
        """List blocks for a mission, optionally filtered by status."""
        ...

    @abstractmethod
    async def list_for_user_date(
        self,
        user_id: str,
        target_date: date,
    ) -> list[Block]:
        """List blocks scheduled for a user on a specific date."""
        ...

    @abstractmethod
    async def get_current_block(self, user_id: str) -> Block | None:
        """Get the user's currently in-progress block (if any)."""
        ...


@runtime_checkable
class EpisodesRepository(Protocol):
    """Repository for Episode CRUD operations."""

    @abstractmethod
    async def create(self, episode: Episode) -> Episode:
        """Create a new episode."""
        ...

    @abstractmethod
    async def get(self, episode_id: str) -> Episode | None:
        """Get an episode by ID."""
        ...

    @abstractmethod
    async def list_for_user(
        self,
        user_id: str,
        *,
        kind: EpisodeKind | None = None,
        mission_id: str | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = 50,
    ) -> list[Episode]:
        """List episodes with various filters."""
        ...

    @abstractmethod
    async def get_recent(
        self,
        user_id: str,
        limit: int = 10,
    ) -> list[Episode]:
        """Get recent episodes for a user."""
        ...


@runtime_checkable
class UserProfileRepository(Protocol):
    """Repository for UserProfile operations."""

    @abstractmethod
    async def get(self, user_id: str) -> UserProfile | None:
        """Get a user profile by user ID."""
        ...

    @abstractmethod
    async def create(self, profile: UserProfile) -> UserProfile:
        """Create a new user profile."""
        ...

    @abstractmethod
    async def update(self, profile: UserProfile) -> UserProfile:
        """Update an existing user profile."""
        ...

    @abstractmethod
    async def get_or_create(self, user_id: str) -> UserProfile:
        """Get existing profile or create a default one."""
        ...


@runtime_checkable
class SemanticMemory(Protocol):
    """Interface for semantic/vector memory operations.

    Used for storing and retrieving episode summaries, pattern insights,
    and other semantic content that benefits from similarity search.
    """

    @abstractmethod
    async def add_episode(self, episode: Episode) -> None:
        """Index an episode for semantic search."""
        ...

    @abstractmethod
    async def search_similar_episodes(
        self,
        user_id: str,
        query: str,
        *,
        limit: int = 5,
        min_similarity: float = 0.5,
    ) -> list[Episode]:
        """Search for episodes similar to a query."""
        ...

    @abstractmethod
    async def search_similar_missions(
        self,
        user_id: str,
        query: str,
        *,
        limit: int = 5,
    ) -> list[Mission]:
        """Search for past missions similar to a query/description."""
        ...

    @abstractmethod
    async def get_pattern_summary(
        self,
        user_id: str,
        pattern_type: str,
    ) -> str | None:
        """Get a stored pattern summary for a user.

        Pattern types might include: 'time_of_day', 'block_duration',
        'leak_patterns', 'success_factors', etc.
        """
        ...

    @abstractmethod
    async def update_pattern_summary(
        self,
        user_id: str,
        pattern_type: str,
        summary: str,
    ) -> None:
        """Update a pattern summary for a user."""
        ...


@runtime_checkable
class GraphRepository(Protocol):
    """Repository for concept graph operations."""

    @abstractmethod
    async def get_node(self, graph_id: str, node_id: str) -> GraphNode | None:
        """Get a node by ID."""
        ...

    @abstractmethod
    async def get_neighbors(
        self,
        graph_id: str,
        node_id: str,
        *,
        edge_types: list[str] | None = None,
        direction: str = "outgoing",  # "outgoing", "incoming", "both"
    ) -> list[GraphNode]:
        """Get neighboring nodes."""
        ...

    @abstractmethod
    async def query(self, query: GraphQuery) -> GraphQueryResult:
        """Execute a graph query."""
        ...

    @abstractmethod
    async def get_user_progress(
        self,
        user_id: str,
        graph_id: str,
        node_id: str,
    ) -> NodeProgress | None:
        """Get user's progress on a specific node."""
        ...

    @abstractmethod
    async def update_user_progress(
        self,
        progress: NodeProgress,
    ) -> NodeProgress:
        """Update user's progress on a node."""
        ...


class RepositoryBundle:
    """Bundle of all repositories for dependency injection.

    This is the concrete class that gets passed to GlyphAgentService.
    """

    def __init__(
        self,
        *,
        missions: MissionsRepository,
        blocks: BlocksRepository,
        episodes: EpisodesRepository,
        profiles: UserProfileRepository,
        semantic_memory: SemanticMemory | None = None,
        graph: GraphRepository | None = None,
    ) -> None:
        self.missions = missions
        self.blocks = blocks
        self.episodes = episodes
        self.profiles = profiles
        self.semantic_memory = semantic_memory
        self.graph = graph
