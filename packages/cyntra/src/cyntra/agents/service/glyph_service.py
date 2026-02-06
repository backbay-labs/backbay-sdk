"""GlyphAgentService - the main facade for the agents package.

This is what apps/backend imports and uses.
"""

from typing import Any

from cyntra.agents.config import AgentSettings
from cyntra.agents.graphs import GraphRouter
from cyntra.agents.memory.interfaces import RepositoryBundle, SemanticMemory
from cyntra.agents.persona import (
    GlyphPersona,
    create_glyph_persona,
    create_tool_registry_from_tools,
)
from cyntra.agents.schemas import (
    AgentMessage,
    AgentMessageRole,
    AgentResponse,
    ChatRequest,
    ChatResponse,
    PlanMissionRequest,
    PlanMissionResponse,
    ReflectPeriodRequest,
    ReflectPeriodResponse,
    RunSessionRequest,
    RunSessionResponse,
)
from cyntra.agents.tools import (
    ExternalSignalTools,
    GraphTools,
    MemoryTools,
    MissionTools,
    TimelineTools,
    UITools,
    WorkflowTools,
)
from cyntra.commons import SurfaceType, get_logger, new_id

logger = get_logger(__name__)


class Telemetry:
    """Placeholder telemetry interface."""

    def log_event(self, event: str, data: dict[str, Any]) -> None:
        """Log a telemetry event."""
        logger.debug("telemetry_event event=%s data=%s", event, data)


class GlyphAgentService:
    """Main service facade for the Glyph agent system.

    This is the public API that apps/backend consumes.
    All agent functionality flows through this class.

    Uses the OpenAI Agents SDK for LLM interactions, which manages
    its own client internally. The SDK handles:
    - Tool calling and argument parsing
    - Conversation memory via Sessions
    - Model configuration via ModelSettings
    """

    def __init__(
        self,
        config: AgentSettings,
        repos: RepositoryBundle,
        semantic_memory: SemanticMemory | None = None,
        telemetry: Telemetry | None = None,
        openai_client: Any | None = None,  # Deprecated: SDK manages its own client
    ) -> None:
        """Initialize the Glyph agent service.

        Args:
            config: Agent settings
            repos: Bundle of repository implementations
            semantic_memory: Optional semantic memory store (falls back to repos.semantic_memory)
            telemetry: Optional telemetry handler
            openai_client: Deprecated - the Agents SDK manages its own client.
                          Kept for backward compatibility but ignored.
        """
        self._config = config
        self._repos = repos
        # Use provided semantic_memory or fall back to the one in the repository bundle
        self._semantic_memory = semantic_memory or repos.semantic_memory
        self._telemetry = telemetry or Telemetry()

        if openai_client is not None:
            logger.warning("openai_client parameter is deprecated; the Agents SDK manages its own client")

        # Initialize graph router
        self._router = GraphRouter(repos)

        # Initialize tools with semantic memory
        self._mission_tools = MissionTools(repos.missions, self._semantic_memory)
        self._timeline_tools = TimelineTools(repos.blocks, repos.missions)
        self._memory_tools = MemoryTools(repos.episodes, repos.profiles, self._semantic_memory)
        self._graph_tools = GraphTools(repos.graph)
        self._ui_tools = UITools()
        self._external_tools = ExternalSignalTools()

        # Create tool registry for persona
        self._tool_registry = create_tool_registry_from_tools(
            self._mission_tools,
            self._timeline_tools,
            self._memory_tools,
            self._graph_tools,
            self._ui_tools,
        )

        # Conversation tracking (session_id -> GlyphPersona)
        self._sessions: dict[str, GlyphPersona] = {}

        logger.info(
            "glyph_service_initialized model=%s features=%s",
            config.llm.default.model,
            config.features.to_dict(),
        )

    async def chat(
        self,
        user_id: str,
        message: str,
        surface: SurfaceType = SurfaceType.OTHER,
        session_id: str | None = None,
    ) -> AgentResponse:
        """Handle a free-form chat message.

        This is for general conversation with Glyph that doesn't fit
        the structured plan/session/reflect flows.

        Uses the OpenAI Agents SDK which handles:
        - Tool calling and execution
        - Conversation memory
        - Model interactions

        Each new session creates a WorkflowTools instance bound to the user_id,
        allowing the persona to invoke LangGraph workflows via tools.
        """
        # Get or create session
        if not session_id:
            session_id = new_id()

        if session_id not in self._sessions:
            # Get user profile for context
            profile = await self._repos.profiles.get_or_create(user_id)
            user_context = None
            if profile.persona_notes:
                user_context = f"Notes about this user: {profile.persona_notes}"

            # Create per-session WorkflowTools bound to user_id
            workflow_tools = WorkflowTools(self._router, user_id=user_id)

            # Create per-session tool registry including workflow tools
            tool_registry = create_tool_registry_from_tools(
                self._mission_tools,
                self._timeline_tools,
                self._memory_tools,
                self._graph_tools,
                self._ui_tools,
                workflow_tools=workflow_tools,
            )

            persona = create_glyph_persona(
                settings=self._config,
                tool_registry=tool_registry,
                user_name=profile.display_name,
                user_context=user_context,
                session_id=session_id,
            )
            self._sessions[session_id] = persona

            logger.debug(
                "session_created session_id=%s user_id=%s surface=%s",
                session_id,
                user_id,
                surface.value,
            )
        else:
            persona = self._sessions[session_id]

        # Send message and get response
        try:
            response_msg = await persona.send_message(message)
            response_content = response_msg.content
        except Exception as e:
            # Handle API errors gracefully (e.g., no API key, rate limits)
            # This allows the service to work in test mode without a valid API key
            logger.warning("chat_error error=%s", str(e))
            response_content = "I'm here to help! (Note: LLM service temporarily unavailable)"

        logger.debug(
            "chat_response session_id=%s user_id=%s message_length=%d response_length=%d",
            session_id,
            user_id,
            len(message),
            len(response_content),
        )

        return AgentResponse(
            message=AgentMessage(
                role=AgentMessageRole.ASSISTANT,
                content=response_content,
            ),
            conversation_id=session_id,
            session_id=session_id,
        )

    async def plan_mission(
        self,
        user_id: str,
        request: PlanMissionRequest,
    ) -> PlanMissionResponse:
        """Plan a new mission.

        Takes vague user input and produces a structured mission
        with proposed blocks.
        """
        logger.info("plan_mission_start user_id=%s", user_id)
        self._telemetry.log_event("plan_mission_start", {"user_id": user_id})

        response = await self._router.plan_mission(user_id, request)

        logger.info(
            "plan_mission_complete user_id=%s mission_id=%s blocks_proposed=%d",
            user_id,
            response.mission.id,
            len(response.proposed_blocks),
        )
        self._telemetry.log_event(
            "plan_mission_complete",
            {
                "user_id": user_id,
                "mission_id": response.mission.id,
                "blocks_proposed": len(response.proposed_blocks),
            },
        )

        return response

    async def run_session(
        self,
        user_id: str,
        request: RunSessionRequest,
    ) -> RunSessionResponse:
        """Start or continue a focus session.

        Provides guidance for what to work on and manages focus state.
        """
        logger.info("run_session_start user_id=%s", user_id)
        self._telemetry.log_event("run_session_start", {"user_id": user_id})

        response = await self._router.run_session(user_id, request)

        logger.info(
            "run_session_complete user_id=%s block_id=%s duration=%d",
            user_id,
            response.block.id,
            response.recommended_duration_minutes,
        )
        self._telemetry.log_event(
            "run_session_complete",
            {
                "user_id": user_id,
                "block_id": response.block.id,
                "duration": response.recommended_duration_minutes,
            },
        )

        return response

    async def reflect_period(
        self,
        user_id: str,
        request: ReflectPeriodRequest,
    ) -> ReflectPeriodResponse:
        """Reflect on a period of work.

        Analyzes completed sessions and identifies patterns.
        """
        logger.info(
            "reflect_period_start user_id=%s kind=%s",
            user_id,
            request.kind.value,
        )
        self._telemetry.log_event(
            "reflect_period_start",
            {
                "user_id": user_id,
                "kind": request.kind.value,
            },
        )

        response = await self._router.reflect_period(user_id, request)

        logger.info(
            "reflect_period_complete user_id=%s episode_id=%s patterns_found=%d",
            user_id,
            response.episode.id,
            len(response.patterns),
        )
        self._telemetry.log_event(
            "reflect_period_complete",
            {
                "user_id": user_id,
                "episode_id": response.episode.id,
                "patterns_found": len(response.patterns),
            },
        )

        return response

    async def handle_chat_request(
        self,
        user_id: str,
        request: ChatRequest,
    ) -> ChatResponse:
        """Handle a structured chat request.

        This is a higher-level wrapper around chat() that handles
        conversation tracking and structured outputs.
        """
        response = await self.chat(
            user_id=user_id,
            message=request.message,
            surface=request.surface,
            session_id=request.conversation_id,
        )

        return ChatResponse(
            response=response,
            conversation_id=response.conversation_id,
        )

    # Convenience methods for direct tool access

    async def get_active_mission(self, user_id: str) -> Any:
        """Get the user's current active mission."""
        return await self._mission_tools.get_active_mission(user_id)

    async def get_today_blocks(self, user_id: str) -> list[Any]:
        """Get blocks scheduled for today."""
        return await self._timeline_tools.get_today_blocks(user_id)

    async def get_current_block(self, user_id: str) -> Any:
        """Get the user's current in-progress block."""
        return await self._timeline_tools.get_current_block(user_id)

    async def get_user_profile(self, user_id: str) -> Any:
        """Get user profile."""
        return await self._memory_tools.get_user_profile(user_id)

    async def complete_block(
        self,
        block_id: str,
        outcome_note: str | None = None,
        completion_ratio: float | None = None,
    ) -> Any:
        """Mark a block as completed."""
        return await self._timeline_tools.complete_block(
            block_id,
            outcome_note=outcome_note,
            completion_ratio=completion_ratio,
        )

    async def complete_mission(self, mission_id: str) -> Any:
        """Mark a mission as completed."""
        return await self._mission_tools.complete_mission(mission_id)

    # Session management

    def clear_session(self, session_id: str) -> None:
        """Clear a chat session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            logger.debug("session_cleared session_id=%s", session_id)

    def clear_all_sessions(self) -> None:
        """Clear all chat sessions."""
        count = len(self._sessions)
        self._sessions.clear()
        logger.debug("all_sessions_cleared count=%d", count)
