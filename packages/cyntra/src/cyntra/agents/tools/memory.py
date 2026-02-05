"""Memory/episode tools for the Glyph agent."""

from datetime import date

from cyntra.commons import new_id, now_utc

from cyntra.agents.memory.interfaces import (
    EpisodesRepository,
    SemanticMemory,
    UserProfileRepository,
)
from cyntra.agents.schemas import (
    EmotionLabel,
    Episode,
    EpisodeKind,
    LeakEvent,
    UserProfile,
    UserStats,
)


class MemoryTools:
    """Tools for managing episodes, reflections, and user insights.

    Episodes are the memory units that Glyph uses to learn patterns.
    """

    def __init__(
        self,
        episodes_repo: EpisodesRepository,
        profiles_repo: UserProfileRepository,
        semantic_memory: SemanticMemory | None = None,
    ) -> None:
        self._episodes = episodes_repo
        self._profiles = profiles_repo
        self._semantic = semantic_memory

    async def save_episode(
        self,
        user_id: str,
        kind: EpisodeKind,
        summary: str,
        *,
        mission_id: str | None = None,
        block_id: str | None = None,
        title: str | None = None,
        reflection: str | None = None,
        mood_before: EmotionLabel | None = None,
        mood_after: EmotionLabel | None = None,
        focus_score: int | None = None,
        energy_score: int | None = None,
        time_focused_minutes: int | None = None,
        time_leaked_minutes: int | None = None,
        leaks: list[LeakEvent] | None = None,
        tags: list[str] | None = None,
    ) -> Episode:
        """Create and save an episode."""
        episode = Episode(
            id=new_id(),
            user_id=user_id,
            kind=kind,
            created_at=now_utc(),
            mission_id=mission_id,
            block_id=block_id,
            title=title,
            summary=summary,
            reflection=reflection,
            mood_before=mood_before,
            mood_after=mood_after,
            focus_score=focus_score,
            energy_score=energy_score,
            time_focused_minutes=time_focused_minutes,
            time_leaked_minutes=time_leaked_minutes,
            leaks=leaks or [],
            tags=tags or [],
        )

        episode = await self._episodes.create(episode)

        # Index in semantic memory
        if self._semantic:
            await self._semantic.add_episode(episode)

        return episode

    async def search_episodes(
        self,
        user_id: str,
        query: str,
        *,
        limit: int = 5,
    ) -> list[Episode]:
        """Search for episodes similar to a query.

        Uses semantic memory if available, otherwise returns empty.
        """
        if self._semantic:
            return await self._semantic.search_similar_episodes(
                user_id, query, limit=limit
            )
        return []

    async def get_recent_episodes(
        self,
        user_id: str,
        limit: int = 10,
    ) -> list[Episode]:
        """Get recent episodes for a user."""
        return await self._episodes.get_recent(user_id, limit=limit)

    async def get_episodes_for_period(
        self,
        user_id: str,
        start_date: date,
        end_date: date,
        *,
        kind: EpisodeKind | None = None,
    ) -> list[Episode]:
        """Get episodes within a date range."""
        return await self._episodes.list_for_user(
            user_id,
            kind=kind,
            start_date=start_date,
            end_date=end_date,
        )

    async def get_mission_episodes(
        self,
        user_id: str,
        mission_id: str,
    ) -> list[Episode]:
        """Get all episodes for a specific mission."""
        return await self._episodes.list_for_user(
            user_id,
            mission_id=mission_id,
        )

    async def get_user_insights(
        self,
        user_id: str,
        insight_type: str,
    ) -> str | None:
        """Get a specific insight/pattern for a user.

        Insight types: 'time_of_day', 'block_duration', 'leak_patterns', etc.
        """
        if self._semantic:
            return await self._semantic.get_pattern_summary(user_id, insight_type)
        return None

    async def update_user_insight(
        self,
        user_id: str,
        insight_type: str,
        summary: str,
    ) -> None:
        """Update a pattern/insight summary for a user."""
        if self._semantic:
            await self._semantic.update_pattern_summary(user_id, insight_type, summary)

    async def get_user_profile(self, user_id: str) -> UserProfile:
        """Get or create a user profile."""
        return await self._profiles.get_or_create(user_id)

    async def update_user_stats(
        self,
        user_id: str,
        *,
        blocks_completed_delta: int = 0,
        focused_minutes_delta: int = 0,
        missions_created_delta: int = 0,
    ) -> UserProfile:
        """Update user stats incrementally."""
        profile = await self._profiles.get_or_create(user_id)

        new_stats = UserStats(
            total_missions_created=profile.stats.total_missions_created
            + missions_created_delta,
            total_blocks_completed=profile.stats.total_blocks_completed
            + blocks_completed_delta,
            total_focused_minutes=profile.stats.total_focused_minutes
            + focused_minutes_delta,
            avg_block_length_successful=profile.stats.avg_block_length_successful,
            avg_start_hour_successful=profile.stats.avg_start_hour_successful,
            night_sessions_failure_rate=profile.stats.night_sessions_failure_rate,
            morning_sessions_success_rate=profile.stats.morning_sessions_success_rate,
        )

        updated = profile.model_copy(
            update={
                "stats": new_stats,
                "updated_at": now_utc(),
            }
        )
        return await self._profiles.update(updated)

    async def compute_period_stats(
        self,
        user_id: str,
        start_date: date,
        end_date: date,
    ) -> dict[str, int | float]:
        """Compute stats for a period based on episodes.

        Returns dict with keys like:
        - total_focused_minutes
        - total_leaked_minutes
        - blocks_completed
        - avg_focus_score
        - avg_energy_score
        """
        episodes = await self.get_episodes_for_period(user_id, start_date, end_date)

        total_focused = 0
        total_leaked = 0
        blocks_completed = 0
        focus_scores: list[int] = []
        energy_scores: list[int] = []

        for ep in episodes:
            if ep.time_focused_minutes:
                total_focused += ep.time_focused_minutes
            if ep.time_leaked_minutes:
                total_leaked += ep.time_leaked_minutes
            if ep.kind == EpisodeKind.SESSION:
                blocks_completed += 1
            if ep.focus_score:
                focus_scores.append(ep.focus_score)
            if ep.energy_score:
                energy_scores.append(ep.energy_score)

        return {
            "total_focused_minutes": total_focused,
            "total_leaked_minutes": total_leaked,
            "blocks_completed": blocks_completed,
            "avg_focus_score": (
                sum(focus_scores) / len(focus_scores) if focus_scores else 0.0
            ),
            "avg_energy_score": (
                sum(energy_scores) / len(energy_scores) if energy_scores else 0.0
            ),
        }
