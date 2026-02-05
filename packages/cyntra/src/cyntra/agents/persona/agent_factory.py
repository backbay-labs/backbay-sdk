"""Factory for creating Glyph persona agents.

Uses the OpenAI Agents SDK for tool-calling and conversation management.
"""

import json
from collections.abc import Callable, Coroutine
from dataclasses import dataclass
from typing import Any

from agents import Agent as SDKAgent
from agents import FunctionTool, ModelSettings, RunContextWrapper, Runner, SQLiteSession
from cyntra.commons import get_logger, new_id

from cyntra.agents.config import AgentSettings
from cyntra.agents.persona.message_types import Message
from cyntra.agents.persona.prompts import build_system_prompt

logger = get_logger(__name__)


@dataclass
class ToolDefinition:
    """Definition of a tool available to the agent."""

    name: str
    description: str
    parameters: dict[str, Any]
    handler: Callable[..., Coroutine[Any, Any, Any]]

    def to_function_tool(self) -> FunctionTool:
        """Convert this definition into an Agents SDK FunctionTool.

        The SDK handles tool calling, argument parsing, and response formatting.
        """
        # Capture handler in closure
        handler = self.handler

        async def on_invoke(ctx: RunContextWrapper[Any], args_json: str) -> str:
            """Invoke the tool with parsed arguments.

            The Agents SDK passes arguments as a JSON string for custom tools.
            """
            args = json.loads(args_json) if args_json else {}
            logger.debug("executing_tool tool_name=%s", self.name)
            try:
                result = await handler(**args)
                # Normalize to a string output (SDK expects plain text)
                if isinstance(result, dict | list):
                    return json.dumps(result, default=str)
                if result is None:
                    return "OK"
                return str(result)
            except Exception as e:
                logger.error(
                    "tool_execution_error tool_name=%s error=%s", self.name, str(e)
                )
                return f"Error: {e}"

        return FunctionTool(
            name=self.name,
            description=self.description,
            params_json_schema=self.parameters,
            on_invoke_tool=on_invoke,
        )


class ToolRegistry:
    """Registry of tools available to the agent."""

    def __init__(self) -> None:
        self._tools: dict[str, ToolDefinition] = {}

    def register(
        self,
        name: str,
        description: str,
        parameters: dict[str, Any],
        handler: Callable[..., Coroutine[Any, Any, Any]],
    ) -> None:
        """Register a tool."""
        self._tools[name] = ToolDefinition(
            name=name,
            description=description,
            parameters=parameters,
            handler=handler,
        )
        logger.debug("tool_registered tool_name=%s", name)

    def get(self, name: str) -> ToolDefinition | None:
        """Get a tool by name."""
        return self._tools.get(name)

    def list_tools(self) -> list[ToolDefinition]:
        """List all registered tools."""
        return list(self._tools.values())

    def to_openai_tools(self) -> list[dict[str, Any]]:
        """Convert tools to OpenAI function calling format (legacy)."""
        return [
            {
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.parameters,
                },
            }
            for tool in self._tools.values()
        ]

    def to_function_tools(self) -> list[FunctionTool]:
        """Convert all registered tools to Agents SDK FunctionTools."""
        return [tool_def.to_function_tool() for tool_def in self._tools.values()]


@dataclass
class AgentConfig:
    """Configuration for a Glyph agent instance using the Agents SDK."""

    agent: SDKAgent
    session: SQLiteSession


class GlyphPersona:
    """Glyph persona backed by the OpenAI Agents SDK.

    - Uses Agents `Agent` + `Runner` instead of raw chat.completions
    - Uses `Session` for conversation memory instead of our own Conversation class
    - Tools are executed automatically by the SDK
    """

    def __init__(self, config: AgentConfig) -> None:
        self._config = config

    @property
    def session(self) -> SQLiteSession:
        """Get the current session."""
        return self._config.session

    async def send_message(
        self,
        content: str,
        *,
        name: str | None = None,  # kept for API symmetry; not used by Agents directly
        include_tools: bool = True,  # tools always available via Agent.tools
    ) -> Message:
        """Send a message and get a response using the Agents SDK.

        Tools are executed automatically by the SDK.
        """
        logger.debug(
            "sending_message_to_agent model=%s content_length=%d",
            self._config.agent.model,
            len(content),
        )

        # Run the agent with the user message
        result = await Runner.run(
            self._config.agent,
            content,
            session=self._config.session,
        )

        # The default output_type is `str`, exposed as `final_output`
        reply_text = str(result.final_output) if result.final_output else ""

        logger.debug(
            "agent_response_received response_length=%d",
            len(reply_text),
        )

        response_msg = Message.assistant(reply_text)
        return response_msg

    def reset_conversation(self) -> None:
        """Start a fresh conversation by creating a new Session.

        We create a new in-memory session with a fresh ID.
        """
        new_session_id = new_id()
        # Create a new in-memory SQLite session
        self._config.session = SQLiteSession(
            db_path=":memory:", session_id=new_session_id
        )
        logger.debug("conversation_reset session_id=%s", new_session_id)

    async def inject_context(self, context: str) -> None:
        """Inject context into the conversation as a system message.

        Note: With the Agents SDK, the best way to inject context is typically
        through the agent's instructions or by modifying the input. For now,
        we log this but the SDK doesn't have a direct session.add_items method
        that works the same way. Consider using dynamic instructions instead.
        """
        # The Agents SDK handles system prompts through the agent's instructions
        # For dynamic context, consider using handoffs or dynamic_instructions
        logger.debug("inject_context_called context_length=%d", len(context))
        # For MVP, we'll note this is a no-op; real implementation would use
        # dynamic_instructions or modify the agent config


def create_glyph_agent_config(
    settings: AgentSettings,
    tool_registry: ToolRegistry,
    *,
    mode: str | None = None,
    user_name: str | None = None,
    user_context: str | None = None,
    session_id: str | None = None,
) -> AgentConfig:
    """Create an Agents-SDK-backed Glyph agent + session.

    Args:
        settings: Agent settings with LLM configuration
        tool_registry: Registry of available tools
        mode: Optional mode for specialized prompts
        user_name: Optional user name for personalization
        user_context: Optional additional user context
        session_id: Optional session ID for conversation continuity
    """
    system_prompt = build_system_prompt(
        mode=mode,
        user_name=user_name,
        user_context=user_context,
    )

    llm_deployment = settings.llm.default
    behavior = settings.behavior

    model_settings = ModelSettings(
        temperature=behavior.temperature,
        max_tokens=behavior.max_tokens,
    )

    tools = tool_registry.to_function_tools()

    agent = SDKAgent(
        name="Glyph",
        instructions=system_prompt,
        model=llm_deployment.model,
        model_settings=model_settings,
        tools=tools,
    )

    # Create in-memory SQLite session for conversation persistence
    session_id = session_id or new_id()
    session = SQLiteSession(db_path=":memory:", session_id=session_id)

    logger.debug(
        "glyph_agent_created model=%s mode=%s user_name=%s session_id=%s tools_count=%d",
        llm_deployment.model,
        mode,
        user_name,
        session_id,
        len(tools),
    )

    return AgentConfig(agent=agent, session=session)


def create_glyph_persona(
    settings: AgentSettings,
    tool_registry: ToolRegistry,
    openai_client: Any = None,  # No longer needed with SDK, kept for API compatibility
    *,
    mode: str | None = None,
    user_name: str | None = None,
    user_context: str | None = None,
    session_id: str | None = None,
) -> GlyphPersona:
    """Create a configured Glyph persona agent.

    This is the main factory function for creating Glyph agents.
    The openai_client parameter is deprecated - the Agents SDK manages
    its own client internally.

    Args:
        settings: Agent settings
        tool_registry: Registry of available tools
        openai_client: Deprecated, no longer used (SDK manages client)
        mode: Optional mode for specialized prompts
        user_name: Optional user name for personalization
        user_context: Optional additional user context
        session_id: Optional session ID for conversation continuity
    """
    if openai_client is not None:
        logger.debug(
            "openai_client parameter is deprecated; SDK manages its own client"
        )

    config = create_glyph_agent_config(
        settings=settings,
        tool_registry=tool_registry,
        mode=mode,
        user_name=user_name,
        user_context=user_context,
        session_id=session_id,
    )

    return GlyphPersona(config)


def create_tool_registry_from_tools(
    mission_tools: Any,
    timeline_tools: Any,
    memory_tools: Any,
    graph_tools: Any | None = None,
    ui_tools: Any | None = None,
    workflow_tools: Any | None = None,
) -> ToolRegistry:
    """Create a tool registry from tool instances.

    This registers the commonly needed tools for Glyph.

    Args:
        mission_tools: MissionTools instance
        timeline_tools: TimelineTools instance
        memory_tools: MemoryTools instance
        graph_tools: Optional GraphTools instance
        ui_tools: Optional UITools instance
        workflow_tools: Optional WorkflowTools instance for LangGraph workflow invocation
    """
    registry = ToolRegistry()

    # Mission tools
    registry.register(
        name="create_mission",
        description="Create a new mission for the user",
        parameters={
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Mission title"},
                "description": {"type": "string", "description": "Mission description"},
                "kind": {
                    "type": "string",
                    "enum": ["exam", "project", "habit", "life_admin", "other"],
                },
                "deadline_date": {
                    "type": "string",
                    "description": "Deadline in ISO format",
                },
            },
            "required": ["title"],
        },
        handler=mission_tools.create_mission,
    )

    registry.register(
        name="get_active_mission",
        description="Get the user's current active mission",
        parameters={"type": "object", "properties": {}},
        handler=mission_tools.get_active_mission,
    )

    # Timeline tools
    registry.register(
        name="create_block",
        description="Create a focus block for a mission",
        parameters={
            "type": "object",
            "properties": {
                "mission_id": {"type": "string"},
                "title": {"type": "string"},
                "plan_note": {"type": "string"},
                "planned_duration_minutes": {"type": "integer"},
            },
            "required": ["mission_id"],
        },
        handler=timeline_tools.create_block,
    )

    registry.register(
        name="start_block",
        description="Start a focus block",
        parameters={
            "type": "object",
            "properties": {
                "block_id": {"type": "string"},
            },
            "required": ["block_id"],
        },
        handler=timeline_tools.start_block,
    )

    registry.register(
        name="complete_block",
        description="Complete a focus block",
        parameters={
            "type": "object",
            "properties": {
                "block_id": {"type": "string"},
                "outcome_note": {"type": "string"},
                "completion_ratio": {"type": "number"},
            },
            "required": ["block_id"],
        },
        handler=timeline_tools.complete_block,
    )

    registry.register(
        name="get_today_blocks",
        description="Get blocks scheduled for today",
        parameters={"type": "object", "properties": {}},
        handler=timeline_tools.get_today_blocks,
    )

    # Memory tools
    registry.register(
        name="save_episode",
        description="Save a reflection/episode about a session or period",
        parameters={
            "type": "object",
            "properties": {
                "kind": {
                    "type": "string",
                    "enum": ["session", "day", "mission", "meta"],
                },
                "summary": {"type": "string"},
                "mission_id": {"type": "string"},
                "block_id": {"type": "string"},
            },
            "required": ["kind", "summary"],
        },
        handler=memory_tools.save_episode,
    )

    registry.register(
        name="search_episodes",
        description="Search past episodes for similar experiences",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "limit": {"type": "integer"},
            },
            "required": ["query"],
        },
        handler=memory_tools.search_episodes,
    )

    # Workflow tools - LangGraph graph invocation
    if workflow_tools is not None:
        # Planner tool schema
        planner_tool_schema = {
            "type": "object",
            "properties": {
                "raw_input": {
                    "type": "string",
                    "description": "User's natural-language description of the mission or overwhelm.",
                },
                "kind": {
                    "type": "string",
                    "enum": ["exam", "project", "habit", "life_admin", "other"],
                    "description": "Optional mission kind. If unsure, omit.",
                },
                "deadline": {
                    "type": "string",
                    "description": "Optional deadline in ISO date format (YYYY-MM-DD).",
                },
                "estimated_hours": {
                    "type": "number",
                    "description": "Optional rough estimate of hours required.",
                },
                "surface": {
                    "type": "string",
                    "description": "Optional UI surface name (e.g. 'FOCUS_DOCK', 'OUTORA_LIBRARY').",
                },
            },
            "required": ["raw_input"],
        }

        registry.register(
            name="plan_mission_via_graph",
            description=(
                "Plan a structured mission and proposed focus blocks using the "
                "planner workflow. Use this when the user is describing exams, "
                "projects, or general overwhelm and needs a concrete plan."
            ),
            parameters=planner_tool_schema,
            handler=workflow_tools.plan_mission_via_graph,
        )

        # Coach tool schema
        coach_tool_schema = {
            "type": "object",
            "properties": {
                "mission_id": {
                    "type": "string",
                    "description": "Optional mission ID to focus on. If omitted, use the active mission.",
                },
                "block_id": {
                    "type": "string",
                    "description": "Optional specific block ID to continue.",
                },
                "available_minutes": {
                    "type": "integer",
                    "description": "Approximate minutes the user has available for this session.",
                },
                "energy_level": {
                    "type": "string",
                    "enum": ["very_low", "low", "medium", "high", "very_high"],
                    "description": "User's approximate energy level, if known.",
                },
                "mood_note": {
                    "type": "string",
                    "description": "Short note about how the user feels going into this session.",
                },
                "is_continuation": {
                    "type": "boolean",
                    "description": "True if the user is continuing a session already in progress.",
                },
                "surface": {
                    "type": "string",
                    "description": "Optional UI surface name.",
                },
            },
            "required": [],
        }

        registry.register(
            name="run_session_via_graph",
            description=(
                "Start or continue a focus session using the coach workflow. "
                "Use this when the user asks what to work on right now or how "
                "to use a block of time."
            ),
            parameters=coach_tool_schema,
            handler=workflow_tools.run_session_via_graph,
        )

        # Archivist tool schema
        archivist_tool_schema = {
            "type": "object",
            "properties": {
                "kind": {
                    "type": "string",
                    "enum": ["block", "day", "week", "mission"],
                    "description": "What period to reflect on. Use 'day' for today, 'week' for a week view, etc.",
                },
                "mission_id": {
                    "type": "string",
                    "description": "Optional mission ID to focus the reflection on.",
                },
                "block_id": {
                    "type": "string",
                    "description": "Optional block ID to reflect on a single session.",
                },
                "start_date": {
                    "type": "string",
                    "description": "Optional period start date (YYYY-MM-DD).",
                },
                "end_date": {
                    "type": "string",
                    "description": "Optional period end date (YYYY-MM-DD).",
                },
                "user_reflection": {
                    "type": "string",
                    "description": "User's free-text reflection, if they already wrote one.",
                },
                "focus_score": {
                    "type": "integer",
                    "description": "Optional focus score (1–5).",
                },
                "energy_score": {
                    "type": "integer",
                    "description": "Optional energy score (1–5).",
                },
                "surface": {
                    "type": "string",
                    "description": "Optional UI surface name.",
                },
            },
            "required": ["kind"],
        }

        registry.register(
            name="reflect_period_via_graph",
            description=(
                "Reflect on a session/day/week/mission using the archivist workflow. "
                "Use this when the user wants to look back on a period and see patterns."
            ),
            parameters=archivist_tool_schema,
            handler=workflow_tools.reflect_period_via_graph,
        )

    logger.info("tool_registry_created tool_count=%d", len(registry.list_tools()))

    return registry
