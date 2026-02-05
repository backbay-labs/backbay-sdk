"""Kernel Orchestrator persona backed by the OpenAI Agents SDK."""

from __future__ import annotations

from agents import Agent as SDKAgent
from agents import ModelSettings, SQLiteSession
from cyntra.commons import get_logger, new_id

from cyntra.agents.config import AgentSettings
from cyntra.agents.persona.agent_factory import AgentConfig, GlyphPersona, ToolRegistry
from cyntra.agents.persona.kernel_prompts import build_kernel_system_prompt
from cyntra.agents.tools.kernel import KernelTools

logger = get_logger(__name__)


class KernelOrchestratorPersona(GlyphPersona):
    """Kernel Orchestrator persona using the Agents SDK."""


def create_kernel_tool_registry(kernel_tools: KernelTools) -> ToolRegistry:
    """Create tool registry for the Kernel Orchestrator."""
    registry = ToolRegistry()

    registry.register(
        name="kernel_skill_run",
        description="Run a Cyntra skill by skill_id via the kernel CLI.",
        parameters={
            "type": "object",
            "properties": {
                "skill_id": {"type": "string"},
                "inputs": {"type": "object"},
                "inputs_file": {"type": "string"},
                "trace_dir": {"type": "string"},
                "no_trace": {"type": "boolean"},
                "workcell_id": {"type": "string"},
                "issue_id": {"type": "string"},
                "timeout_seconds": {"type": "integer"},
            },
            "required": ["skill_id"],
        },
        handler=kernel_tools.kernel_skill_run,
    )

    registry.register(
        name="kernel_run_once",
        description="Run a single kernel cycle (optionally scoped).",
        parameters={
            "type": "object",
            "properties": {
                "issue_id": {"type": "string"},
                "universe": {"type": "string"},
                "max_concurrent": {"type": "integer"},
                "speculate": {"type": "boolean"},
                "dry_run": {"type": "boolean"},
                "timeout_seconds": {"type": "integer"},
            },
            "required": [],
        },
        handler=kernel_tools.kernel_run_once,
    )

    registry.register(
        name="kernel_status",
        description="Fetch current kernel status as JSON.",
        parameters={
            "type": "object",
            "properties": {
                "verbose": {"type": "boolean"},
            },
            "required": [],
        },
        handler=kernel_tools.kernel_status,
    )

    registry.register(
        name="kernel_stats",
        description="Fetch kernel stats summary.",
        parameters={
            "type": "object",
            "properties": {
                "cost": {"type": "boolean"},
                "success_rate": {"type": "boolean"},
                "timing": {"type": "boolean"},
            },
            "required": [],
        },
        handler=kernel_tools.kernel_stats,
    )

    registry.register(
        name="kernel_read_file",
        description="Read a file within the repo.",
        parameters={
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "max_bytes": {"type": "integer"},
            },
            "required": ["path"],
        },
        handler=kernel_tools.kernel_read_file,
    )

    registry.register(
        name="kernel_write_file",
        description="Write a file within the repo.",
        parameters={
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"},
                "mode": {
                    "type": "string",
                    "enum": ["overwrite", "append"],
                },
            },
            "required": ["path", "content"],
        },
        handler=kernel_tools.kernel_write_file,
    )

    return registry


def create_kernel_orchestrator_config(
    settings: AgentSettings,
    tool_registry: ToolRegistry,
    *,
    extra_context: str | None = None,
    session_id: str | None = None,
) -> AgentConfig:
    """Create a Kernel Orchestrator Agents-SDK configuration."""
    system_prompt = build_kernel_system_prompt(extra_context=extra_context)

    llm_deployment = settings.llm.default
    behavior = settings.behavior

    model_settings = ModelSettings(
        temperature=behavior.temperature,
        max_tokens=behavior.max_tokens,
    )

    tools = tool_registry.to_function_tools()

    agent = SDKAgent(
        name="KernelOrchestrator",
        instructions=system_prompt,
        model=llm_deployment.model,
        model_settings=model_settings,
        tools=tools,
    )

    session_id = session_id or new_id()
    session = SQLiteSession(db_path=":memory:", session_id=session_id)

    logger.debug(
        "kernel_orchestrator_created model=%s session_id=%s tools_count=%d",
        llm_deployment.model,
        session_id,
        len(tools),
    )

    return AgentConfig(agent=agent, session=session)


def create_kernel_orchestrator_persona(
    settings: AgentSettings,
    tool_registry: ToolRegistry,
    *,
    extra_context: str | None = None,
    session_id: str | None = None,
) -> KernelOrchestratorPersona:
    """Create the Kernel Orchestrator persona."""
    config = create_kernel_orchestrator_config(
        settings=settings,
        tool_registry=tool_registry,
        extra_context=extra_context,
        session_id=session_id,
    )
    return KernelOrchestratorPersona(config)
