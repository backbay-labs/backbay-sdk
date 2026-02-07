"""Workflow tools that invoke LangGraph workflows on behalf of Glyph.

These are thin wrappers around GraphRouter so the Agents SDK
can trigger the MVP graphs via function tools.
"""

from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from cyntra.agents.schemas import (
    EnergyLevel,
    MissionKind,
    PlanMissionRequest,
    PlanMissionResponse,
    ReflectPeriodKind,
    ReflectPeriodRequest,
    ReflectPeriodResponse,
    RunSessionRequest,
    RunSessionResponse,
)
from cyntra.commons import SurfaceType, get_logger

if TYPE_CHECKING:
    from cyntra.agents.graphs.router import GraphRouter

logger = get_logger(__name__)


class WorkflowTools:
    """Tools that invoke LangGraph workflows on behalf of Glyph.

    These are thin wrappers around GraphRouter so the Agents SDK
    can trigger the MVP graphs via function tools.
    """

    def __init__(self, router: GraphRouter, user_id: str) -> None:
        """Initialize workflow tools.

        Args:
            router: The GraphRouter instance for invoking graphs
            user_id: The user ID to bind all workflow calls to
        """
        self._router = router
        self._user_id = user_id

    async def plan_mission_via_graph(
        self,
        raw_input: str,
        kind: str | None = None,
        deadline: str | None = None,
        estimated_hours: float | None = None,
        surface: str | None = None,
    ) -> dict:
        """Plan a structured mission using the planner workflow.

        Use this when the user is describing exams, projects, or general
        overwhelm and needs a concrete plan.

        Args:
            raw_input: User's natural-language description of the mission or overwhelm.
            kind: Optional mission kind (exam, project, habit, life_admin, other).
            deadline: Optional deadline in ISO date format (YYYY-MM-DD).
            estimated_hours: Optional rough estimate of hours required.
            surface: Optional UI surface name.

        Returns:
            The mission planning response with mission and proposed blocks.
        """
        logger.debug(
            "plan_mission_via_graph user_id=%s raw_input_length=%d",
            self._user_id,
            len(raw_input),
        )

        mission_kind = MissionKind(kind) if kind is not None else None

        deadline_date: date | None = None
        if deadline:
            # Expect ISO date (YYYY-MM-DD) or full ISO; take first 10 chars
            deadline_date = date.fromisoformat(deadline[:10])

        request = PlanMissionRequest(
            raw_input=raw_input,
            kind=mission_kind,
            deadline=deadline_date,
            estimated_hours=estimated_hours,
            constraints=None,
            preferences=None,
            surface=SurfaceType(surface) if surface else SurfaceType.OTHER,
        )

        response: PlanMissionResponse = await self._router.plan_mission(self._user_id, request)
        return response.model_dump()

    async def run_session_via_graph(
        self,
        mission_id: str | None = None,
        block_id: str | None = None,
        available_minutes: int | None = None,
        energy_level: str | None = None,
        mood_note: str | None = None,
        is_continuation: bool | None = None,
        surface: str | None = None,
    ) -> dict:
        """Start or continue a focus session using the coach workflow.

        Use this when the user asks what to work on right now or how
        to use a block of time.

        Args:
            mission_id: Optional mission ID to focus on. If omitted, use the active mission.
            block_id: Optional specific block ID to continue.
            available_minutes: Approximate minutes the user has available for this session.
            energy_level: User's approximate energy level (very_low, low, medium, high, very_high).
            mood_note: Short note about how the user feels going into this session.
            is_continuation: True if the user is continuing a session already in progress.
            surface: Optional UI surface name.

        Returns:
            The session guidance response with block and actions.
        """
        logger.debug(
            "run_session_via_graph user_id=%s mission_id=%s block_id=%s",
            self._user_id,
            mission_id,
            block_id,
        )

        energy_enum = EnergyLevel(energy_level) if energy_level is not None else None

        request = RunSessionRequest(
            mission_id=mission_id,
            block_id=block_id,
            available_minutes=available_minutes,
            energy_level=energy_enum,
            mood_note=mood_note,
            is_continuation=is_continuation or False,
            surface=SurfaceType(surface) if surface else SurfaceType.OTHER,
        )

        response: RunSessionResponse = await self._router.run_session(self._user_id, request)
        return response.model_dump()

    async def reflect_period_via_graph(
        self,
        kind: str,
        mission_id: str | None = None,
        block_id: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        user_reflection: str | None = None,
        focus_score: int | None = None,
        energy_score: int | None = None,
        surface: str | None = None,
    ) -> dict:
        """Reflect on a session/day/week/mission using the archivist workflow.

        Use this when the user wants to look back on a period and see patterns.

        Args:
            kind: What period to reflect on (block, day, week, mission).
            mission_id: Optional mission ID to focus the reflection on.
            block_id: Optional block ID to reflect on a single session.
            start_date: Optional period start date (YYYY-MM-DD).
            end_date: Optional period end date (YYYY-MM-DD).
            user_reflection: User's free-text reflection, if they already wrote one.
            focus_score: Optional focus score (1–5).
            energy_score: Optional energy score (1–5).
            surface: Optional UI surface name.

        Returns:
            The reflection response with episode and patterns.
        """
        logger.debug(
            "reflect_period_via_graph user_id=%s kind=%s",
            self._user_id,
            kind,
        )

        kind_enum = ReflectPeriodKind(kind)

        start: date | None = date.fromisoformat(start_date) if start_date else None
        end: date | None = date.fromisoformat(end_date) if end_date else None

        request = ReflectPeriodRequest(
            kind=kind_enum,
            mission_id=mission_id,
            block_id=block_id,
            start_date=start,
            end_date=end,
            user_reflection=user_reflection,
            focus_score=focus_score,
            energy_score=energy_score,
            surface=SurfaceType(surface) if surface else SurfaceType.OTHER,
        )

        response: ReflectPeriodResponse = await self._router.reflect_period(self._user_id, request)
        return response.model_dump()
