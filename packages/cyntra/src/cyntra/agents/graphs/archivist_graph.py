"""Archivist graph - LangGraph workflow for reflection and pattern tracking.

Helps users reflect on sessions, days, and missions.
"""

from datetime import date, datetime, timedelta
from typing import Any

from langgraph.graph import END, StateGraph

from cyntra.agents.memory.interfaces import RepositoryBundle
from cyntra.agents.schemas import (
    Episode,
    EpisodeKind,
    PatternInsight,
    ReflectPeriodKind,
    ReflectPeriodRequest,
    ReflectPeriodResponse,
    UserProfile,
)
from cyntra.agents.tools import MemoryTools, MissionTools, TimelineTools

from .base import GlyphStateDict


class ArchivistGraph:
    """Graph for reflection and pattern tracking.

    Nodes:
    1. load_period_data - Load relevant data for the reflection period
    2. compute_stats - Calculate statistics for the period
    3. identify_patterns - Look for patterns and insights
    4. write_episode - Create the reflection episode
    5. update_profile - Update user profile stats
    """

    def __init__(
        self,
        repos: RepositoryBundle,
    ) -> None:
        self._repos = repos
        self._memory_tools = MemoryTools(repos.episodes, repos.profiles, repos.semantic_memory)
        self._mission_tools = MissionTools(repos.missions, repos.semantic_memory)
        self._timeline_tools = TimelineTools(repos.blocks, repos.missions)

    async def _load_period_data(self, state: GlyphStateDict) -> GlyphStateDict:
        """Load data for the reflection period."""
        context = state.get("context", {})
        user_id = context.get("user_id", "")
        request_data = state.get("outputs", {}).get("request", {})

        kind = ReflectPeriodKind(request_data.get("kind", "session"))

        # Determine date range based on kind
        end_date = date.today()
        if kind == ReflectPeriodKind.BLOCK:
            start_date = end_date
        elif kind == ReflectPeriodKind.DAY:
            start_date = end_date
        elif kind == ReflectPeriodKind.WEEK:
            start_date = end_date - timedelta(days=7)
        else:  # MISSION
            start_date = end_date - timedelta(days=30)  # Look back a month

        # Override with request dates if provided
        if request_data.get("start_date"):
            start_date = date.fromisoformat(request_data["start_date"])
        if request_data.get("end_date"):
            end_date = date.fromisoformat(request_data["end_date"])

        # Load block if reflecting on a specific block
        block_data = None
        if request_data.get("block_id"):
            block = await self._timeline_tools.get_block(request_data["block_id"])
            if block:
                block_data = block.model_dump()

        # Load mission if specified
        mission_data = None
        if request_data.get("mission_id"):
            mission = await self._mission_tools.get_mission(request_data["mission_id"])
            if mission:
                mission_data = mission.model_dump()

        # Load episodes for the period
        episodes = await self._memory_tools.get_episodes_for_period(user_id, start_date, end_date)

        # Load user profile
        profile = await self._memory_tools.get_user_profile(user_id)

        state["outputs"]["period"] = {
            "kind": kind.value,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        }
        state["outputs"]["block"] = block_data
        state["outputs"]["mission"] = mission_data
        state["outputs"]["period_episodes"] = [e.model_dump() for e in episodes]
        state["outputs"]["profile"] = profile.model_dump()

        return state

    async def _compute_stats(self, state: GlyphStateDict) -> GlyphStateDict:
        """Compute statistics for the period."""
        context = state.get("context", {})
        user_id = context.get("user_id", "")
        outputs = state.get("outputs", {})
        period = outputs.get("period", {})

        start_date = date.fromisoformat(period["start_date"])
        end_date = date.fromisoformat(period["end_date"])

        # Compute stats
        stats = await self._memory_tools.compute_period_stats(user_id, start_date, end_date)

        # Add completion rate
        if stats["blocks_completed"] > 0:
            # Rough estimate - would need more data for accurate calculation
            stats["completion_rate"] = min(1.0, stats["blocks_completed"] / 5)  # Assume 5 planned

        state["outputs"]["stats"] = stats
        return state

    def _identify_patterns(self, state: GlyphStateDict) -> GlyphStateDict:
        """Identify patterns from the data."""
        outputs = state.get("outputs", {})
        stats = outputs.get("stats", {})

        patterns: list[dict[str, Any]] = []
        highlights: list[str] = []
        challenges: list[str] = []

        # Analyze stats
        focused = stats.get("total_focused_minutes", 0)
        leaked = stats.get("total_leaked_minutes", 0)
        blocks = stats.get("blocks_completed", 0)

        if blocks > 0:
            highlights.append(f"Completed {blocks} focus blocks")

        if focused > 60:
            highlights.append(f"Total focus time: {focused} minutes")

        if leaked > 30:
            challenges.append(f"Leak time: {leaked} minutes")

        # Simple pattern detection
        avg_focus = stats.get("avg_focus_score", 0)
        if avg_focus >= 4:
            patterns.append(
                {
                    "description": "Your focus has been strong this period",
                    "confidence": 0.7,
                    "supporting_data": f"Average focus score: {avg_focus:.1f}/5",
                }
            )
        elif avg_focus > 0 and avg_focus < 3:
            patterns.append(
                {
                    "description": "Focus has been challenging - consider shorter blocks",
                    "confidence": 0.6,
                    "suggested_action": "Try 25-minute blocks instead of longer ones",
                }
            )

        # Energy patterns
        avg_energy = stats.get("avg_energy_score", 0)
        if avg_energy > 0 and avg_energy < 3:
            patterns.append(
                {
                    "description": "Energy levels have been lower than usual",
                    "confidence": 0.5,
                    "suggested_action": "Consider rest or lighter sessions",
                }
            )

        state["outputs"]["patterns"] = patterns
        state["outputs"]["highlights"] = highlights
        state["outputs"]["challenges"] = challenges

        return state

    async def _write_episode(self, state: GlyphStateDict) -> GlyphStateDict:
        """Create the reflection episode."""
        context = state.get("context", {})
        user_id = context.get("user_id", "")
        outputs = state.get("outputs", {})
        request_data = outputs.get("request", {})
        period = outputs.get("period", {})
        stats = outputs.get("stats", {})

        kind_str = period.get("kind", "session")
        kind = EpisodeKind(kind_str)

        # Build summary
        summary_parts = []
        if stats.get("blocks_completed", 0) > 0:
            summary_parts.append(f"Completed {stats['blocks_completed']} blocks")
        if stats.get("total_focused_minutes", 0) > 0:
            summary_parts.append(f"{stats['total_focused_minutes']} minutes focused")

        summary = ". ".join(summary_parts) if summary_parts else "Reflection recorded"

        # Get user-provided scores
        focus_score = request_data.get("focus_score")
        energy_score = request_data.get("energy_score")

        # Create episode
        episode = await self._memory_tools.save_episode(
            user_id=user_id,
            kind=kind,
            summary=summary,
            mission_id=request_data.get("mission_id"),
            block_id=request_data.get("block_id"),
            reflection=request_data.get("user_reflection"),
            focus_score=focus_score,
            energy_score=energy_score,
            time_focused_minutes=stats.get("total_focused_minutes"),
            time_leaked_minutes=stats.get("total_leaked_minutes"),
            tags=[kind_str] + (["has_reflection"] if request_data.get("user_reflection") else []),
        )

        state["outputs"]["episode"] = episode.model_dump()
        return state

    async def _update_profile(self, state: GlyphStateDict) -> GlyphStateDict:
        """Update user profile with new stats."""
        context = state.get("context", {})
        user_id = context.get("user_id", "")
        outputs = state.get("outputs", {})
        stats = outputs.get("stats", {})

        # Update incremental stats
        updated_profile = await self._memory_tools.update_user_stats(
            user_id,
            blocks_completed_delta=stats.get("blocks_completed", 0),
            focused_minutes_delta=stats.get("total_focused_minutes", 0),
        )

        state["outputs"]["updated_profile"] = updated_profile.model_dump()
        return state

    def _build_summary(self, state: GlyphStateDict) -> GlyphStateDict:
        """Build the final summary message."""
        outputs = state.get("outputs", {})
        highlights = outputs.get("highlights", [])
        challenges = outputs.get("challenges", [])
        patterns = outputs.get("patterns", [])

        # Build summary message
        summary_parts = []
        if highlights:
            summary_parts.append("Highlights: " + ", ".join(highlights))
        if challenges:
            summary_parts.append("Challenges: " + ", ".join(challenges))

        summary = ". ".join(summary_parts) if summary_parts else "Reflection complete."

        # Build suggestions from patterns
        suggestions = []
        for p in patterns:
            if p.get("suggested_action"):
                suggestions.append(p["suggested_action"])

        state["outputs"]["final_summary"] = summary
        state["outputs"]["suggestions"] = suggestions

        return state

    def build(self) -> StateGraph:
        """Build the LangGraph StateGraph."""
        graph = StateGraph(dict)

        # Add nodes
        graph.add_node("load_period_data", self._load_period_data)
        graph.add_node("compute_stats", self._compute_stats)
        graph.add_node("identify_patterns", self._identify_patterns)
        graph.add_node("write_episode", self._write_episode)
        graph.add_node("update_profile", self._update_profile)
        graph.add_node("build_summary", self._build_summary)

        # Define edges
        graph.set_entry_point("load_period_data")
        graph.add_edge("load_period_data", "compute_stats")
        graph.add_edge("compute_stats", "identify_patterns")
        graph.add_edge("identify_patterns", "write_episode")
        graph.add_edge("write_episode", "update_profile")
        graph.add_edge("update_profile", "build_summary")
        graph.add_edge("build_summary", END)

        return graph


async def run_archivist(
    repos: RepositoryBundle,
    user_id: str,
    request: ReflectPeriodRequest,
) -> ReflectPeriodResponse:
    """Run the archivist graph and return a response."""
    archivist = ArchivistGraph(repos)
    graph = archivist.build().compile()

    # Build initial state
    initial_state: GlyphStateDict = {
        "context": {
            "user_id": user_id,
            "surface": request.surface.value,
            "mission_id": request.mission_id,
            "block_id": request.block_id,
        },
        "mode": "archivist",
        "messages": [],
        "scratchpad": "",
        "outputs": {
            "request": {
                "kind": request.kind.value,
                "mission_id": request.mission_id,
                "block_id": request.block_id,
                "start_date": request.start_date.isoformat() if request.start_date else None,
                "end_date": request.end_date.isoformat() if request.end_date else None,
                "user_reflection": request.user_reflection,
                "focus_score": request.focus_score,
                "energy_score": request.energy_score,
            }
        },
        "errors": [],
    }

    # Run the graph
    final_state = await graph.ainvoke(initial_state)

    # Build response
    outputs = final_state.get("outputs", {})
    episode_data = outputs.get("episode", {})
    patterns_data = outputs.get("patterns", [])
    stats = outputs.get("stats", {})
    profile_data = outputs.get("updated_profile")

    episode = (
        Episode(**episode_data)
        if episode_data
        else Episode(
            id="",
            user_id=user_id,
            kind=request.kind,
            created_at=datetime.now(),
            summary="Reflection recorded",
        )
    )

    patterns = [PatternInsight(**p) for p in patterns_data]
    updated_profile = UserProfile(**profile_data) if profile_data else None

    return ReflectPeriodResponse(
        episode=episode,
        summary=outputs.get("final_summary", ""),
        highlights=outputs.get("highlights", []),
        challenges=outputs.get("challenges", []),
        patterns=patterns,
        total_focused_minutes=stats.get("total_focused_minutes", 0),
        total_leaked_minutes=stats.get("total_leaked_minutes", 0),
        blocks_completed=stats.get("blocks_completed", 0),
        completion_rate=stats.get("completion_rate"),
        updated_profile=updated_profile,
        suggestions=outputs.get("suggestions", []),
    )
