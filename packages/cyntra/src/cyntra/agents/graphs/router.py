"""Graph router - dispatches to the appropriate LangGraph workflow."""

from enum import Enum
from typing import Any

from cyntra.agents.memory.interfaces import RepositoryBundle
from cyntra.agents.schemas import (
    PlanMissionRequest,
    PlanMissionResponse,
    ReflectPeriodRequest,
    ReflectPeriodResponse,
    RunSessionRequest,
    RunSessionResponse,
)
from cyntra.commons import ErrorCode, ServiceError, get_logger

from .archivist_graph import run_archivist
from .base import GlyphMode
from .coach_graph import run_coach
from .planner_graph import run_planner

logger = get_logger(__name__)


class GlyphEntrypoint(str, Enum):
    """Entry points into the Glyph graph system."""

    PLAN_MISSION = "plan_mission"
    RUN_SESSION = "run_session"
    REFLECT_PERIOD = "reflect_period"
    CHAT = "chat"


class GraphRouter:
    """Routes requests to the appropriate LangGraph workflow.

    This is the main entry point for graph execution.
    """

    def __init__(self, repos: RepositoryBundle) -> None:
        self._repos = repos

    async def plan_mission(
        self,
        user_id: str,
        request: PlanMissionRequest,
    ) -> PlanMissionResponse:
        """Route to the planner graph."""
        logger.debug("routing_to_planner user_id=%s", user_id)
        return await run_planner(self._repos, user_id, request)

    async def run_session(
        self,
        user_id: str,
        request: RunSessionRequest,
    ) -> RunSessionResponse:
        """Route to the coach graph."""
        logger.debug("routing_to_coach user_id=%s", user_id)
        return await run_coach(self._repos, user_id, request)

    async def reflect_period(
        self,
        user_id: str,
        request: ReflectPeriodRequest,
    ) -> ReflectPeriodResponse:
        """Route to the archivist graph."""
        logger.debug("routing_to_archivist user_id=%s", user_id)
        return await run_archivist(self._repos, user_id, request)

    async def call_graph(
        self,
        entrypoint: GlyphEntrypoint,
        user_id: str,
        request: Any,
    ) -> Any:
        """Generic dispatcher for graph calls.

        Args:
            entrypoint: Which graph/flow to invoke
            user_id: The user making the request
            request: The typed request object

        Returns:
            The response from the appropriate graph

        Raises:
            ServiceError: If request type is invalid or entrypoint is unknown
        """
        logger.debug(
            "call_graph",
            entrypoint=entrypoint.value,
            user_id=user_id,
            request_type=type(request).__name__,
        )

        if entrypoint == GlyphEntrypoint.PLAN_MISSION:
            if not isinstance(request, PlanMissionRequest):
                raise ServiceError(
                    code=ErrorCode.VALIDATION_ERROR,
                    message=f"Expected PlanMissionRequest, got {type(request).__name__}",
                    details={"entrypoint": entrypoint.value},
                )
            return await self.plan_mission(user_id, request)

        elif entrypoint == GlyphEntrypoint.RUN_SESSION:
            if not isinstance(request, RunSessionRequest):
                raise ServiceError(
                    code=ErrorCode.VALIDATION_ERROR,
                    message=f"Expected RunSessionRequest, got {type(request).__name__}",
                    details={"entrypoint": entrypoint.value},
                )
            return await self.run_session(user_id, request)

        elif entrypoint == GlyphEntrypoint.REFLECT_PERIOD:
            if not isinstance(request, ReflectPeriodRequest):
                raise ServiceError(
                    code=ErrorCode.VALIDATION_ERROR,
                    message=f"Expected ReflectPeriodRequest, got {type(request).__name__}",
                    details={"entrypoint": entrypoint.value},
                )
            return await self.reflect_period(user_id, request)

        elif entrypoint == GlyphEntrypoint.CHAT:
            # Chat is handled by the persona layer, not a graph
            raise ServiceError(
                code=ErrorCode.VALIDATION_ERROR,
                message="Chat should be handled by GlyphAgentService, not the router",
                details={"entrypoint": entrypoint.value},
            )

        else:
            raise ServiceError(
                code=ErrorCode.VALIDATION_ERROR,
                message=f"Unknown entrypoint: {entrypoint}",
                details={"entrypoint": str(entrypoint)},
            )

    def get_mode_for_entrypoint(self, entrypoint: GlyphEntrypoint) -> GlyphMode:
        """Get the GlyphMode for an entrypoint."""
        mapping = {
            GlyphEntrypoint.PLAN_MISSION: GlyphMode.PLANNER,
            GlyphEntrypoint.RUN_SESSION: GlyphMode.COACH,
            GlyphEntrypoint.REFLECT_PERIOD: GlyphMode.ARCHIVIST,
            GlyphEntrypoint.CHAT: GlyphMode.CHAT,
        }
        return mapping.get(entrypoint, GlyphMode.CHAT)
