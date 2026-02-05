"""Graph/concept tools for the Glyph agent.

These tools help Glyph understand and navigate the Outora concept graph.
"""

from cyntra.agents.memory.interfaces import GraphRepository
from cyntra.agents.schemas import (
    EdgeType,
    GraphContext,
    GraphNode,
    GraphQuery,
    GraphQueryResult,
    MasteryLevel,
    NodeProgress,
    NodeType,
)


class GraphTools:
    """Tools for interacting with the Outora concept graph.

    Used by Glyph to:
    - Find relevant concepts for a mission
    - Track what the user is learning
    - Suggest next topics based on prerequisites
    """

    def __init__(self, graph_repo: GraphRepository | None = None) -> None:
        self._graph = graph_repo

    async def get_node(self, graph_id: str, node_id: str) -> GraphNode | None:
        """Get a specific node from the graph."""
        if not self._graph:
            return None
        return await self._graph.get_node(graph_id, node_id)

    async def get_neighbors(
        self,
        graph_id: str,
        node_id: str,
        *,
        edge_types: list[EdgeType] | None = None,
        direction: str = "outgoing",
    ) -> list[GraphNode]:
        """Get neighboring nodes."""
        if not self._graph:
            return []

        edge_type_strs = [e.value for e in edge_types] if edge_types else None
        return await self._graph.get_neighbors(
            graph_id, node_id, edge_types=edge_type_strs, direction=direction
        )

    async def get_prerequisites(
        self,
        graph_id: str,
        node_id: str,
    ) -> list[GraphNode]:
        """Get prerequisite nodes for a concept."""
        return await self.get_neighbors(
            graph_id, node_id, edge_types=[EdgeType.PREREQUISITE], direction="incoming"
        )

    async def get_children(
        self,
        graph_id: str,
        node_id: str,
    ) -> list[GraphNode]:
        """Get child nodes (contained within this node)."""
        return await self.get_neighbors(
            graph_id, node_id, edge_types=[EdgeType.CONTAINS], direction="outgoing"
        )

    async def query_graph(self, query: GraphQuery) -> GraphQueryResult:
        """Execute a graph query."""
        if not self._graph:
            return GraphQueryResult()
        return await self._graph.query(query)

    async def search_concepts(
        self,
        graph_id: str,
        title_contains: str,
        *,
        node_types: list[NodeType] | None = None,
        limit: int = 20,
    ) -> list[GraphNode]:
        """Search for concepts by title."""
        query = GraphQuery(
            graph_id=graph_id,
            title_contains=title_contains,
            node_types=node_types,
            limit=limit,
        )
        result = await self.query_graph(query)
        return result.nodes

    async def get_user_progress(
        self,
        user_id: str,
        graph_id: str,
        node_id: str,
    ) -> NodeProgress | None:
        """Get user's progress on a specific node."""
        if not self._graph:
            return None
        return await self._graph.get_user_progress(user_id, graph_id, node_id)

    async def update_progress(
        self,
        user_id: str,
        graph_id: str,
        node_id: str,
        *,
        mastery_level: MasteryLevel | None = None,
        add_practice_count: int = 0,
        add_time_minutes: int = 0,
    ) -> NodeProgress | None:
        """Update user's progress on a node."""
        if not self._graph:
            return None

        existing = await self._graph.get_user_progress(user_id, graph_id, node_id)

        if existing:
            progress = NodeProgress(
                user_id=user_id,
                node_id=node_id,
                graph_id=graph_id,
                mastery_level=mastery_level or existing.mastery_level,
                practice_count=existing.practice_count + add_practice_count,
                total_time_minutes=existing.total_time_minutes + add_time_minutes,
                last_practiced=existing.last_practiced,
                first_practiced=existing.first_practiced,
                ease_factor=existing.ease_factor,
                interval_days=existing.interval_days,
                next_review_date=existing.next_review_date,
                success_rate=existing.success_rate,
                streak=existing.streak,
            )
        else:
            from datetime import datetime

            now = datetime.now()
            progress = NodeProgress(
                user_id=user_id,
                node_id=node_id,
                graph_id=graph_id,
                mastery_level=mastery_level or MasteryLevel.LEARNING,
                practice_count=add_practice_count,
                total_time_minutes=add_time_minutes,
                first_practiced=now if add_practice_count > 0 else None,
                last_practiced=now if add_practice_count > 0 else None,
            )

        return await self._graph.update_user_progress(progress)

    async def rank_next_nodes(
        self,
        user_id: str,
        graph_id: str,
        from_node_ids: list[str],
        *,
        limit: int = 5,
    ) -> list[GraphNode]:
        """Rank suggested next nodes to study based on prerequisites and progress.

        This is a simplified implementation. A real version would:
        - Check which prerequisites are mastered
        - Consider spaced repetition schedules
        - Account for user preferences
        """
        candidates: list[GraphNode] = []

        for node_id in from_node_ids:
            # Get children and related nodes
            children = await self.get_children(graph_id, node_id)
            related = await self.get_neighbors(
                graph_id, node_id, edge_types=[EdgeType.RELATED]
            )
            candidates.extend(children)
            candidates.extend(related)

        # Deduplicate
        seen: set[str] = set()
        unique: list[GraphNode] = []
        for node in candidates:
            if node.id not in seen:
                seen.add(node.id)
                unique.append(node)

        # For now, just return by importance
        unique.sort(key=lambda n: n.importance, reverse=True)
        return unique[:limit]

    async def build_graph_context(
        self,
        user_id: str,
        graph_id: str,
        focus_node_ids: list[str],
    ) -> GraphContext:
        """Build a context object for the agent.

        Gathers relevant nodes, prerequisites, and suggestions.
        """
        focus_nodes: list[GraphNode] = []
        prerequisite_nodes: list[GraphNode] = []
        related_nodes: list[GraphNode] = []

        for node_id in focus_node_ids:
            node = await self.get_node(graph_id, node_id)
            if node:
                focus_nodes.append(node)

            prereqs = await self.get_prerequisites(graph_id, node_id)
            prerequisite_nodes.extend(prereqs)

            related = await self.get_neighbors(
                graph_id, node_id, edge_types=[EdgeType.RELATED]
            )
            related_nodes.extend(related)

        suggested_next = await self.rank_next_nodes(
            user_id, graph_id, focus_node_ids, limit=5
        )

        # Build summary
        focus_titles = [n.title for n in focus_nodes]
        summary = (
            f"Focus: {', '.join(focus_titles)}" if focus_titles else "No specific focus"
        )

        if prerequisite_nodes:
            prereq_titles = [n.title for n in prerequisite_nodes[:3]]
            summary += f". Prerequisites to review: {', '.join(prereq_titles)}"

        return GraphContext(
            focus_nodes=focus_nodes,
            prerequisite_nodes=prerequisite_nodes,
            related_nodes=related_nodes,
            suggested_next=suggested_next,
            context_summary=summary,
        )
