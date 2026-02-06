"""Mission management tools for the Glyph agent."""

from datetime import datetime

from cyntra.agents.memory.interfaces import MissionsRepository, SemanticMemory
from cyntra.agents.schemas import (
    Mission,
    MissionConstraints,
    MissionKind,
    MissionPreferences,
    MissionPriority,
    MissionStatus,
)
from cyntra.commons import new_id, now_utc


class MissionTools:
    """Tools for creating and managing missions.

    These are designed to be called by the agent/graphs.
    """

    def __init__(
        self,
        missions_repo: MissionsRepository,
        semantic_memory: SemanticMemory | None = None,
    ) -> None:
        self._missions = missions_repo
        self._semantic = semantic_memory

    async def create_mission(
        self,
        user_id: str,
        title: str,
        *,
        description: str | None = None,
        kind: MissionKind = MissionKind.OTHER,
        priority: MissionPriority = MissionPriority.MEDIUM,
        deadline_date: datetime | None = None,
        planned_start_date: datetime | None = None,
        estimated_total_minutes: int | None = None,
        constraints: MissionConstraints | None = None,
        preferences: MissionPreferences | None = None,
        tags: list[str] | None = None,
    ) -> Mission:
        """Create a new mission."""
        now = now_utc()

        mission = Mission(
            id=new_id(),
            user_id=user_id,
            title=title,
            description=description,
            kind=kind,
            status=MissionStatus.ACTIVE,
            priority=priority,
            created_at=now,
            updated_at=now,
            planned_start_date=planned_start_date.date() if planned_start_date else None,
            deadline_date=deadline_date.date() if deadline_date else None,
            estimated_total_minutes=estimated_total_minutes,
            constraints=constraints or MissionConstraints(),
            preferences=preferences or MissionPreferences(),
            tags=tags or [],
        )

        mission = await self._missions.create(mission)

        # Index in semantic memory for future similarity search
        if self._semantic:
            await self._semantic.add_mission(mission)  # type: ignore[attr-defined]

        return mission

    async def get_mission(self, mission_id: str) -> Mission | None:
        """Get a mission by ID."""
        return await self._missions.get(mission_id)

    async def update_mission(
        self,
        mission_id: str,
        *,
        title: str | None = None,
        description: str | None = None,
        status: MissionStatus | None = None,
        priority: MissionPriority | None = None,
        deadline_date: datetime | None = None,
        estimated_total_minutes: int | None = None,
        constraints: MissionConstraints | None = None,
        preferences: MissionPreferences | None = None,
        tags: list[str] | None = None,
    ) -> Mission | None:
        """Update an existing mission."""
        mission = await self._missions.get(mission_id)
        if not mission:
            return None

        # Build updated mission with changed fields
        updates: dict[str, object] = {"updated_at": now_utc()}
        if title is not None:
            updates["title"] = title
        if description is not None:
            updates["description"] = description
        if status is not None:
            updates["status"] = status
        if priority is not None:
            updates["priority"] = priority
        if deadline_date is not None:
            updates["deadline_date"] = deadline_date.date()
        if estimated_total_minutes is not None:
            updates["estimated_total_minutes"] = estimated_total_minutes
        if constraints is not None:
            updates["constraints"] = constraints
        if preferences is not None:
            updates["preferences"] = preferences
        if tags is not None:
            updates["tags"] = tags

        updated = mission.model_copy(update=updates)
        return await self._missions.update(updated)

    async def complete_mission(self, mission_id: str) -> Mission | None:
        """Mark a mission as completed."""
        return await self.update_mission(mission_id, status=MissionStatus.COMPLETED)

    async def pause_mission(self, mission_id: str) -> Mission | None:
        """Pause a mission."""
        return await self.update_mission(mission_id, status=MissionStatus.PAUSED)

    async def resume_mission(self, mission_id: str) -> Mission | None:
        """Resume a paused mission."""
        return await self.update_mission(mission_id, status=MissionStatus.ACTIVE)

    async def abandon_mission(self, mission_id: str) -> Mission | None:
        """Mark a mission as abandoned."""
        return await self.update_mission(mission_id, status=MissionStatus.ABANDONED)

    async def list_missions_for_user(
        self,
        user_id: str,
        *,
        status: MissionStatus | None = None,
        limit: int = 50,
    ) -> list[Mission]:
        """List missions for a user."""
        return await self._missions.list_for_user(user_id, status=status, limit=limit)

    async def get_active_mission(self, user_id: str) -> Mission | None:
        """Get the user's current active mission."""
        return await self._missions.get_active_mission(user_id)

    async def find_similar_missions(
        self,
        user_id: str,
        query: str,
        limit: int = 5,
    ) -> list[Mission]:
        """Find past missions similar to a query/description.

        Uses semantic memory if available.
        """
        if self._semantic:
            return await self._semantic.search_similar_missions(user_id, query, limit=limit)
        return []
