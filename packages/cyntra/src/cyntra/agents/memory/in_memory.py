"""In-memory repository implementations for testing and development."""

from datetime import date, datetime

from cyntra.agents.schemas import (
    Block,
    BlockStatus,
    Episode,
    EpisodeKind,
    GraphEdge,
    GraphNode,
    GraphQuery,
    GraphQueryResult,
    Mission,
    MissionStatus,
    NodeProgress,
    UserPreferences,
    UserProfile,
    UserStats,
)


class InMemoryMissionsRepository:
    """In-memory implementation of MissionsRepository."""

    def __init__(self) -> None:
        self._missions: dict[str, Mission] = {}

    async def create(self, mission: Mission) -> Mission:
        self._missions[mission.id] = mission
        return mission

    async def get(self, mission_id: str) -> Mission | None:
        return self._missions.get(mission_id)

    async def update(self, mission: Mission) -> Mission:
        if mission.id not in self._missions:
            raise ValueError(f"Mission {mission.id} not found")
        self._missions[mission.id] = mission
        return mission

    async def delete(self, mission_id: str) -> bool:
        if mission_id in self._missions:
            del self._missions[mission_id]
            return True
        return False

    async def list_for_user(
        self,
        user_id: str,
        *,
        status: MissionStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Mission]:
        missions = [
            m
            for m in self._missions.values()
            if m.user_id == user_id and (status is None or m.status == status)
        ]
        # Sort by created_at descending
        missions.sort(key=lambda m: m.created_at, reverse=True)
        return missions[offset : offset + limit]

    async def get_active_mission(self, user_id: str) -> Mission | None:
        active = [
            m
            for m in self._missions.values()
            if m.user_id == user_id and m.status == MissionStatus.ACTIVE
        ]
        if not active:
            return None
        # Return most recently updated active mission
        return max(active, key=lambda m: m.updated_at)


class InMemoryBlocksRepository:
    """In-memory implementation of BlocksRepository."""

    def __init__(self) -> None:
        self._blocks: dict[str, Block] = {}

    async def create(self, block: Block) -> Block:
        self._blocks[block.id] = block
        return block

    async def get(self, block_id: str) -> Block | None:
        return self._blocks.get(block_id)

    async def update(self, block: Block) -> Block:
        if block.id not in self._blocks:
            raise ValueError(f"Block {block.id} not found")
        self._blocks[block.id] = block
        return block

    async def delete(self, block_id: str) -> bool:
        if block_id in self._blocks:
            del self._blocks[block_id]
            return True
        return False

    async def list_for_mission(
        self,
        mission_id: str,
        *,
        status: BlockStatus | None = None,
        limit: int = 100,
    ) -> list[Block]:
        blocks = [
            b
            for b in self._blocks.values()
            if b.mission_id == mission_id and (status is None or b.status == status)
        ]
        # Sort by sequence_index, then scheduled_start
        blocks.sort(
            key=lambda b: (b.sequence_index or 0, b.scheduled_start or datetime.max)
        )
        return blocks[:limit]

    async def list_for_user_date(
        self,
        user_id: str,
        target_date: date,
    ) -> list[Block]:
        blocks = [
            b
            for b in self._blocks.values()
            if b.user_id == user_id
            and b.scheduled_start is not None
            and b.scheduled_start.date() == target_date
        ]
        blocks.sort(key=lambda b: b.scheduled_start or datetime.max)
        return blocks

    async def get_current_block(self, user_id: str) -> Block | None:
        in_progress = [
            b
            for b in self._blocks.values()
            if b.user_id == user_id and b.status == BlockStatus.IN_PROGRESS
        ]
        if not in_progress:
            return None
        # Return the one that started most recently
        return max(in_progress, key=lambda b: b.actual_start or datetime.min)


class InMemoryEpisodesRepository:
    """In-memory implementation of EpisodesRepository."""

    def __init__(self) -> None:
        self._episodes: dict[str, Episode] = {}

    async def create(self, episode: Episode) -> Episode:
        self._episodes[episode.id] = episode
        return episode

    async def get(self, episode_id: str) -> Episode | None:
        return self._episodes.get(episode_id)

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
        episodes = [e for e in self._episodes.values() if e.user_id == user_id]

        if kind is not None:
            episodes = [e for e in episodes if e.kind == kind]
        if mission_id is not None:
            episodes = [e for e in episodes if e.mission_id == mission_id]
        if start_date is not None:
            episodes = [e for e in episodes if e.created_at.date() >= start_date]
        if end_date is not None:
            episodes = [e for e in episodes if e.created_at.date() <= end_date]

        episodes.sort(key=lambda e: e.created_at, reverse=True)
        return episodes[:limit]

    async def get_recent(
        self,
        user_id: str,
        limit: int = 10,
    ) -> list[Episode]:
        episodes = [e for e in self._episodes.values() if e.user_id == user_id]
        episodes.sort(key=lambda e: e.created_at, reverse=True)
        return episodes[:limit]


class InMemoryUserProfileRepository:
    """In-memory implementation of UserProfileRepository."""

    def __init__(self) -> None:
        self._profiles: dict[str, UserProfile] = {}

    async def get(self, user_id: str) -> UserProfile | None:
        return self._profiles.get(user_id)

    async def create(self, profile: UserProfile) -> UserProfile:
        self._profiles[profile.user_id] = profile
        return profile

    async def update(self, profile: UserProfile) -> UserProfile:
        self._profiles[profile.user_id] = profile
        return profile

    async def get_or_create(self, user_id: str) -> UserProfile:
        if user_id in self._profiles:
            return self._profiles[user_id]

        now = datetime.now()
        profile = UserProfile(
            user_id=user_id,
            created_at=now,
            updated_at=now,
            preferences=UserPreferences(),
            stats=UserStats(),
        )
        self._profiles[user_id] = profile
        return profile


class InMemorySemanticMemory:
    """In-memory stub for SemanticMemory.

    For MVP, this just stores episodes and does simple text matching.
    Real implementation would use Cognee or similar vector store.
    """

    def __init__(self) -> None:
        self._episodes: dict[str, Episode] = {}
        self._missions: dict[str, Mission] = {}
        self._patterns: dict[str, dict[str, str]] = (
            {}
        )  # user_id -> {pattern_type: summary}

    async def add_episode(self, episode: Episode) -> None:
        self._episodes[episode.id] = episode

    async def add_mission(self, mission: Mission) -> None:
        """Helper to index missions for similarity search."""
        self._missions[mission.id] = mission

    async def search_similar_episodes(
        self,
        user_id: str,
        query: str,
        *,
        limit: int = 5,
        min_similarity: float = 0.5,
    ) -> list[Episode]:
        # Simple keyword matching for MVP
        query_lower = query.lower()
        user_episodes = [e for e in self._episodes.values() if e.user_id == user_id]

        scored = []
        for ep in user_episodes:
            text = f"{ep.title or ''} {ep.summary} {ep.reflection or ''}".lower()
            # Very simple scoring: count matching words
            query_words = set(query_lower.split())
            text_words = set(text.split())
            overlap = len(query_words & text_words)
            if overlap > 0:
                score = overlap / max(len(query_words), 1)
                if score >= min_similarity:
                    scored.append((score, ep))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [ep for _, ep in scored[:limit]]

    async def search_similar_missions(
        self,
        user_id: str,
        query: str,
        *,
        limit: int = 5,
    ) -> list[Mission]:
        query_lower = query.lower()
        user_missions = [m for m in self._missions.values() if m.user_id == user_id]

        scored = []
        for mission in user_missions:
            text = f"{mission.title} {mission.description or ''}".lower()
            query_words = set(query_lower.split())
            text_words = set(text.split())
            overlap = len(query_words & text_words)
            if overlap > 0:
                scored.append((overlap, mission))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [m for _, m in scored[:limit]]

    async def get_pattern_summary(
        self,
        user_id: str,
        pattern_type: str,
    ) -> str | None:
        user_patterns = self._patterns.get(user_id, {})
        return user_patterns.get(pattern_type)

    async def update_pattern_summary(
        self,
        user_id: str,
        pattern_type: str,
        summary: str,
    ) -> None:
        if user_id not in self._patterns:
            self._patterns[user_id] = {}
        self._patterns[user_id][pattern_type] = summary


class InMemoryGraphRepository:
    """In-memory implementation of GraphRepository."""

    def __init__(self) -> None:
        self._nodes: dict[str, GraphNode] = {}  # keyed by f"{graph_id}:{node_id}"
        self._edges: dict[str, GraphEdge] = {}
        self._progress: dict[str, NodeProgress] = (
            {}
        )  # keyed by f"{user_id}:{graph_id}:{node_id}"

    def _node_key(self, graph_id: str, node_id: str) -> str:
        return f"{graph_id}:{node_id}"

    def _progress_key(self, user_id: str, graph_id: str, node_id: str) -> str:
        return f"{user_id}:{graph_id}:{node_id}"

    async def add_node(self, node: GraphNode) -> GraphNode:
        """Helper to add nodes for testing."""
        key = self._node_key(node.graph_id, node.id)
        self._nodes[key] = node
        return node

    async def add_edge(self, edge: GraphEdge) -> GraphEdge:
        """Helper to add edges for testing."""
        self._edges[edge.id] = edge
        return edge

    async def get_node(self, graph_id: str, node_id: str) -> GraphNode | None:
        key = self._node_key(graph_id, node_id)
        return self._nodes.get(key)

    async def get_neighbors(
        self,
        graph_id: str,
        node_id: str,
        *,
        edge_types: list[str] | None = None,
        direction: str = "outgoing",
    ) -> list[GraphNode]:
        neighbors: list[GraphNode] = []

        for edge in self._edges.values():
            if edge.graph_id != graph_id:
                continue
            if edge_types and edge.edge_type.value not in edge_types:
                continue

            neighbor_id: str | None = None
            if direction in ("outgoing", "both") and edge.source_id == node_id:
                neighbor_id = edge.target_id
            elif direction in ("incoming", "both") and edge.target_id == node_id:
                neighbor_id = edge.source_id

            if neighbor_id:
                node = await self.get_node(graph_id, neighbor_id)
                if node and node not in neighbors:
                    neighbors.append(node)

        return neighbors

    async def query(self, query: GraphQuery) -> GraphQueryResult:
        nodes: list[GraphNode] = []

        for node in self._nodes.values():
            if node.graph_id != query.graph_id:
                continue
            if query.node_types and node.type not in query.node_types:
                continue
            if query.parent_id and node.parent_id != query.parent_id:
                continue
            if (
                query.title_contains
                and query.title_contains.lower() not in node.title.lower()
            ):
                continue

            nodes.append(node)

        total = len(nodes)
        nodes = nodes[query.offset : query.offset + query.limit]

        return GraphQueryResult(
            nodes=nodes,
            edges=[],  # Simplified for MVP
            total_count=total,
            has_more=total > query.offset + query.limit,
        )

    async def get_user_progress(
        self,
        user_id: str,
        graph_id: str,
        node_id: str,
    ) -> NodeProgress | None:
        key = self._progress_key(user_id, graph_id, node_id)
        return self._progress.get(key)

    async def update_user_progress(
        self,
        progress: NodeProgress,
    ) -> NodeProgress:
        key = self._progress_key(progress.user_id, progress.graph_id, progress.node_id)
        self._progress[key] = progress
        return progress


def create_in_memory_repos() -> tuple[
    InMemoryMissionsRepository,
    InMemoryBlocksRepository,
    InMemoryEpisodesRepository,
    InMemoryUserProfileRepository,
    InMemorySemanticMemory,
    InMemoryGraphRepository,
]:
    """Create a fresh set of in-memory repositories.

    Useful for testing.
    """
    return (
        InMemoryMissionsRepository(),
        InMemoryBlocksRepository(),
        InMemoryEpisodesRepository(),
        InMemoryUserProfileRepository(),
        InMemorySemanticMemory(),
        InMemoryGraphRepository(),
    )
